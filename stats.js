// =============================================
// ARENA FANTASY - Estatísticas Reais + Fechamento de Rodada
// Fonte: API do Cartola FC via proxy /api/cartola
//
// IMPORTANTE: a pontuação usa SEMPRE o scoring configurado
// pelo comissário na liga (league_config.scoring), calculado
// a partir dos scouts crus. A pontuação oficial do Cartola é
// gravada apenas como referência (cartola_points).
//
// Fluxo do comissário:
//   1. Stats.syncMapping()  — 1x por temporada
//   2. Stats.syncRound()    — após cada rodada do Brasileirão
//   3. Stats.closeWeek()    — fecha a rodada da LIGA: placares + W/L
// =============================================

const Stats = {

    // Scout do Cartola → chave do scoring da liga
    SCOUT_MAP: {
        G:  'gol',
        A:  'assistencia',
        GC: 'gol_contra',
        CA: 'cartao_amarelo',
        CV: 'cartao_vermelho',
        DE: 'defesa_dificil',
        DP: 'penalti_defendido',
        PP: 'penalti_perdido',
        SG: 'jogo_sem_sofrer_gol',
        GS: 'gol_sofrido',
        FC: 'falta_cometida',
        DS: 'desarme',
        FD: 'finalizacao_gol',
        FF: 'finalizacao_fora',
        FT: 'finalizacao_fora',   // na trave conta como finalização
    },

    state: { map: {}, reverseMap: {}, unmatched: [], lastSyncedRound: null },

    normalize(str) {
        return (str || '')
            .toLowerCase()
            .normalize('NFD').replace(/[\u0300-\u036f]/g, '')
            .replace(/[^a-z0-9 ]/g, '')
            .trim();
    },

    async fetchCartola(endpoint) {
        const res = await fetch(`/api/cartola?endpoint=${endpoint}`);
        if (!res.ok) throw new Error(`Proxy Cartola falhou: ${res.status}`);
        return res.json();
    },

    isCommissioner() {
        const uid = window._currentUser?.id;
        return uid && (
            window._currentLeague?.commissioner_id === uid
            || window._leagueConfig?.commissioner_id === uid
            || (typeof Draft !== 'undefined' && Draft.isCommissioner?.())
        );
    },

    // =========================================
    // 1. MAPEAMENTO (1x por temporada)
    // =========================================
    async syncMapping() {
        if (!Stats.isCommissioner()) { Stats.toast('Apenas o comissário pode executar.', 'error'); return; }
        Stats.toast('Buscando jogadores no Cartola...');

        let mercado;
        try { mercado = await Stats.fetchCartola('mercado'); }
        catch(e) { Stats.toast('Falha ao acessar a API do Cartola. Tente mais tarde.', 'error'); return; }

        const atletas = mercado.atletas || [];
        const clubes = mercado.clubes || {};
        const clubAbrev = {};
        Object.entries(clubes).forEach(([id, c]) => {
            clubAbrev[id] = (c.abreviacao || '').toUpperCase();
        });

        const byClub = {};
        atletas.forEach(a => {
            const abrev = clubAbrev[a.clube_id] || '?';
            if (!byClub[abrev]) byClub[abrev] = [];
            byClub[abrev].push(a);
        });

        const rows = [];
        const unmatched = [];
        const usedCartolaIds = new Set();

        PLAYERS_DATABASE.forEach(p => {
            const candidates = (byClub[p.club] || []).filter(a => !usedCartolaIds.has(a.atleta_id));
            const target = Stats.normalize(p.name);

            let found = candidates.find(a =>
                Stats.normalize(a.apelido) === target || Stats.normalize(a.nome) === target
            );
            if (!found) {
                found = candidates.find(a => {
                    const ap = Stats.normalize(a.apelido);
                    return ap && ap.length > 3 && (ap.includes(target) || target.includes(ap));
                });
            }

            if (found) {
                usedCartolaIds.add(found.atleta_id);
                rows.push({
                    player_id: p.id, cartola_id: found.atleta_id,
                    player_name: p.name, matched_name: found.apelido,
                    match_type: 'auto', updated_at: new Date().toISOString(),
                });
            } else {
                unmatched.push(p);
                rows.push({
                    player_id: p.id, cartola_id: null,
                    player_name: p.name, matched_name: null,
                    match_type: 'unmatched', updated_at: new Date().toISOString(),
                });
            }
        });

        for (let i = 0; i < rows.length; i += 100) {
            const { error } = await window.supabaseClient
                .from('player_map').upsert(rows.slice(i, i + 100), { onConflict: 'player_id' });
            if (error) console.error('player_map upsert:', error);
        }

        Stats.state.unmatched = unmatched;
        await Stats.loadMapping();

        const msg = `Mapeamento: ${rows.length - unmatched.length}/${rows.length} casados.`;
        console.log(msg, 'Não encontrados:', unmatched.map(p => `${p.name} (${p.club})`));
        Stats.toast(msg + (unmatched.length ? ' Veja o console (F12) para a lista.' : ''));
        Stats.renderCommissionerPanel();
        return { matched: rows.length - unmatched.length, unmatched };
    },

    async loadMapping() {
        const { data } = await window.supabaseClient
            .from('player_map').select('player_id, cartola_id')
            .not('cartola_id', 'is', null);
        Stats.state.map = {};
        Stats.state.reverseMap = {};
        (data || []).forEach(r => {
            Stats.state.map[r.player_id] = r.cartola_id;
            Stats.state.reverseMap[r.cartola_id] = r.player_id;
        });
    },

    // =========================================
    // 2. SINCRONIZAR RODADA DO BRASILEIRÃO
    // Scouts crus → pontos com o SCORING DA LIGA
    // =========================================
    async syncRound() {
        if (!Stats.isCommissioner()) { Stats.toast('Apenas o comissário pode executar.', 'error'); return; }

        await Stats.loadMapping();
        if (Object.keys(Stats.state.reverseMap).length === 0) {
            Stats.toast('Rode o mapeamento primeiro (botão 1).', 'error'); return;
        }

        let status, pontuados;
        try {
            status = await Stats.fetchCartola('status');
            pontuados = await Stats.fetchCartola('pontuados');
        } catch(e) {
            Stats.toast('Falha ao acessar a API do Cartola.', 'error'); return;
        }

        const round = pontuados.rodada || status.rodada_atual;
        const atletas = pontuados.atletas || {};

        if (!Object.keys(atletas).length) {
            Stats.toast('Nenhum jogador pontuado ainda nesta rodada.', 'error'); return;
        }

        // Scoring da liga — SEMPRE prioridade sobre a pontuação do Cartola
        const { data: cfg } = await window.supabaseClient
            .from('league_config').select('scoring').eq('id', 1).single();
        let scoring = cfg?.scoring;
        if (typeof scoring === 'string') { try { scoring = JSON.parse(scoring); } catch(e) { scoring = null; } }
        const hasCustomScoring = scoring && Object.keys(scoring).length > 0;

        const rows = [];
        Object.entries(atletas).forEach(([cartolaId, a]) => {
            const playerId = Stats.state.reverseMap[parseInt(cartolaId)];
            if (!playerId) return;

            const scouts = a.scout || {};
            let points;

            if (hasCustomScoring) {
                points = 0;
                Object.entries(scouts).forEach(([scout, count]) => {
                    const key = Stats.SCOUT_MAP[scout];
                    if (key && scoring[key] !== undefined) points += scoring[key] * count;
                });
                points = Math.round(points * 100) / 100;
            } else {
                points = a.pontuacao || 0; // só se a liga NÃO configurou scoring
            }

            rows.push({
                player_id: playerId,
                round,
                points,
                cartola_points: a.pontuacao || 0,
                scouts,
                updated_at: new Date().toISOString(),
            });
        });

        for (let i = 0; i < rows.length; i += 100) {
            const { error } = await window.supabaseClient
                .from('player_scores').upsert(rows.slice(i, i + 100), { onConflict: 'player_id,round' });
            if (error) console.error('player_scores upsert:', error);
        }

        Stats.state.lastSyncedRound = round;
        Stats.toast(`Rodada ${round} do Brasileirão: ${rows.length} jogadores pontuados (scoring da liga).`);

        if (window._currentUser) {
            await window.supabaseClient.from('chat_messages').insert({
                league_id: window.currentLeagueId?.() || window._currentLeague?.id || null,
                manager_id: window._currentUser.id,
                team_name: '📊 Sistema',
                avatar_color: '#00f2fe',
                message: `Pontuações da rodada ${round} do Brasileirão sincronizadas! ${rows.length} jogadores atualizados com o scoring da liga.`
            });
        }

        await Stats.loadIntoGame();
        return { round, count: rows.length };
    },

    // =========================================
    // 3. FECHAR RODADA DA LIGA
    // Soma titulares → placar → W/L → classificação
    // =========================================
    async closeWeek() {
        if (!Stats.isCommissioner()) { Stats.toast('Apenas o comissário pode executar.', 'error'); return; }
        const lid = window.currentLeagueId?.() || window._currentLeague?.id || null;

        // 1. Semana da liga a fechar: a menor não finalizada
        let mq = window.supabaseClient.from('matchups').select('*')
            .eq('is_finished', false).order('week', { ascending: true });
        if (lid) mq = mq.eq('league_id', lid);
        const { data: openMatches } = await mq;

        if (!openMatches?.length) { Stats.toast('Não há rodadas em aberto na liga.', 'error'); return; }
        const week = openMatches[0].week;
        const weekMatches = openMatches.filter(m => m.week === week);

        // 2. Rodada do Brasileirão a usar (última sincronizada por padrão)
        const { data: lastScore } = await window.supabaseClient
            .from('player_scores').select('round')
            .order('round', { ascending: false }).limit(1);
        const defaultRound = lastScore?.[0]?.round;
        if (!defaultRound) { Stats.toast('Sincronize uma rodada do Brasileirão primeiro (botão 2).', 'error'); return; }

        const input = prompt(
            `Fechar a RODADA ${week} da liga usando os pontos de qual rodada do Brasileirão?`,
            String(defaultRound)
        );
        if (input === null) return;
        const brRound = parseInt(input) || defaultRound;

        if (!confirm(`Confirmar: fechar rodada ${week} da liga com os pontos da rodada ${brRound} do Brasileirão?\n${weekMatches.length} confrontos serão pontuados.`)) return;

        // 3. Pontos da rodada
        const { data: scores } = await window.supabaseClient
            .from('player_scores').select('player_id, points').eq('round', brRound);
        if (!scores?.length) { Stats.toast(`Sem pontuações para a rodada ${brRound}. Sincronize primeiro.`, 'error'); return; }
        const pointsMap = {};
        scores.forEach(s => { pointsMap[s.player_id] = parseFloat(s.points); });

        // 4. Calcula placar de cada manager da semana
        const managerIds = new Set();
        weekMatches.forEach(m => { managerIds.add(m.home_manager_id); managerIds.add(m.away_manager_id); });

        const teamScore = {};
        for (const mid of managerIds) {
            const starters = await Stats.getStartersForScoring(mid, week, lid);
            let total = 0;
            starters.forEach(pid => { total += pointsMap[pid] || 0; });
            teamScore[mid] = Math.round(total * 100) / 100;
        }

        // 5. Grava placares e resultados
        const summary = [];
        for (const m of weekMatches) {
            const hs = teamScore[m.home_manager_id] ?? 0;
            const as = teamScore[m.away_manager_id] ?? 0;

            await window.supabaseClient.from('matchups').update({
                home_score: hs, away_score: as,
                is_finished: true, scored_round: brRound,
            }).eq('id', m.id);

            // W/L + total_points
            const winnerId = hs >= as ? m.home_manager_id : m.away_manager_id;
            const loserId  = hs >= as ? m.away_manager_id : m.home_manager_id;

            await Stats.bumpManager(winnerId, { winsDelta: 1, pointsDelta: hs >= as ? hs : as });
            await Stats.bumpManager(loserId,  { lossesDelta: 1, pointsDelta: hs >= as ? as : hs });

            summary.push({ m, hs, as });
        }

        // 6. Resumo no chat
        const { data: mgrs } = await window.supabaseClient.from('managers').select('id, team_name');
        const nameOf = id => mgrs?.find(x => x.id === id)?.team_name || '?';
        const lines = summary.map(({m, hs, as}) =>
            `• ${nameOf(m.home_manager_id)} ${hs.toFixed(1)} × ${as.toFixed(1)} ${nameOf(m.away_manager_id)}`
        ).join('\n');

        if (window._currentUser) {
            await window.supabaseClient.from('chat_messages').insert({
                league_id: lid,
                manager_id: window._currentUser.id,
                team_name: '🏁 Rodada Encerrada',
                avatar_color: '#ffd700',
                message: `RODADA ${week} DA LIGA FECHADA! (pontos da rodada ${brRound} do Brasileirão)\n${lines}`
            });
        }

        window._currentWeek = null; // invalida cache da semana atual
        Stats.toast(`Rodada ${week} fechada! ${weekMatches.length} confrontos pontuados.`);
        if (typeof Dashboard !== 'undefined' && window._currentUser) Dashboard.init(window._currentUser);
    },

    // Titulares para pontuação: lineup salvo da semana; fallback top-11 do roster
    async getStartersForScoring(managerId, week, lid) {
        let lq = window.supabaseClient.from('lineups').select('starters')
            .eq('manager_id', managerId).eq('round', week);
        if (lid) lq = lq.eq('league_id', lid);
        const { data: lrows } = await lq.limit(1);
        const starters = lrows?.[0]?.starters;

        if (starters) {
            const ids = Object.values(starters).flat().filter(Boolean);
            if (ids.length) return ids;
        }

        // Fallback: top-11 (4-3-3) do roster por projeção
        let pq = window.supabaseClient.from('draft_picks').select('player_id')
            .eq('manager_id', managerId);
        if (lid) pq = pq.eq('league_id', lid);
        const { data: picks } = await pq;
        const roster = (picks || [])
            .map(pk => PLAYERS_DATABASE.find(p => p.id === pk.player_id))
            .filter(Boolean);

        const need = { GOL: 1, ZAG: 2, LAT: 2, MEI: 3, ATA: 3 };
        const ids = [];
        Object.entries(need).forEach(([pos, n]) => {
            roster.filter(p => p.position === pos)
                .sort((a,b) => b.projPoints - a.projPoints)
                .slice(0, n).forEach(p => ids.push(p.id));
        });
        return ids;
    },

    async bumpManager(managerId, { winsDelta = 0, lossesDelta = 0, pointsDelta = 0 }) {
        const { data: m } = await window.supabaseClient
            .from('managers').select('wins, losses, total_points').eq('id', managerId).single();
        if (!m) return;
        await window.supabaseClient.from('managers').update({
            wins: (m.wins || 0) + winsDelta,
            losses: (m.losses || 0) + lossesDelta,
            total_points: Math.round(((parseFloat(m.total_points) || 0) + pointsDelta) * 100) / 100,
        }).eq('id', managerId);
    },

    // =========================================
    // 4. APLICAR NO JOGO (todos, automático)
    // =========================================
    async loadIntoGame() {
        const { data } = await window.supabaseClient
            .from('player_scores').select('player_id, round, points');
        if (!data?.length) return;

        const totals = {};
        const lastRound = Math.max(...data.map(r => r.round));
        const lastPoints = {};
        data.forEach(r => {
            totals[r.player_id] = (totals[r.player_id] || 0) + parseFloat(r.points);
            if (r.round === lastRound) lastPoints[r.player_id] = parseFloat(r.points);
        });

        const apply = p => {
            p.totalPoints = Math.round((totals[p.id] || 0) * 100) / 100;
            p.realPoints = lastPoints[p.id] ?? 0;
        };
        PLAYERS_DATABASE.forEach(apply);
        if (typeof players !== 'undefined') players.forEach(apply);

        console.log(`Stats: pontuações aplicadas (última rodada BR sincronizada: ${lastRound}).`);
        return lastRound;
    },

    // =========================================
    // Painel do comissário
    // =========================================
    renderCommissionerPanel() {
        const host = document.getElementById('cfg-stats-panel');
        if (!host) return;
        host.innerHTML = `
            <div style="display:flex; gap:8px; flex-wrap:wrap;">
                <button class="action-btn" onclick="Stats.syncMapping()">
                    <i class="fa-solid fa-link"></i> 1. Mapear jogadores
                </button>
                <button class="action-btn primary" onclick="Stats.syncRound()">
                    <i class="fa-solid fa-cloud-arrow-down"></i> 2. Sincronizar rodada BR
                </button>
                <button class="action-btn" style="border-color:rgba(255,215,0,0.4); color:#ffd700;" onclick="Stats.closeWeek()">
                    <i class="fa-solid fa-flag-checkered"></i> 3. Fechar rodada da liga
                </button>
            </div>
            <p style="font-size:11px; color:var(--text-muted); margin-top:8px;">
                Fonte: scouts da API do Cartola FC. Os pontos são calculados com o <strong>scoring desta liga</strong>
                (edite acima na seção Pontuação). Ordem: 1 uma vez por temporada → 2 e 3 após cada rodada do Brasileirão.
            </p>`;
    },

    toast(msg, type = 'success') {
        let t = document.getElementById('league-toast');
        if (!t) { t = document.createElement('div'); t.id = 'league-toast'; document.body.appendChild(t); }
        t.textContent = msg;
        t.className = `league-toast league-toast-${type}`;
        t.style.display = 'block';
        setTimeout(() => { t.style.display = 'none'; }, 4000);
    }
};

// Aplica pontuações reais quando o app carrega
document.addEventListener('DOMContentLoaded', () => {
    setTimeout(() => { if (window.supabaseClient) Stats.loadIntoGame(); }, 1500);
});

window.Stats = Stats;
