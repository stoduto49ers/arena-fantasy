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

    // Posição do Cartola (posicao_id) → nossa sigla
    POS_FROM_ID: { 1: 'GOL', 2: 'LAT', 3: 'ZAG', 4: 'MEI', 5: 'ATA', 6: 'TEC' },
    // Posições compatíveis (tolera divergência de classificação entre bases)
    POS_COMPAT: { GOL: ['GOL'], LAT: ['LAT','ZAG'], ZAG: ['ZAG','LAT'], MEI: ['MEI','ATA'], ATA: ['ATA','MEI'] },

    posCompatible(ourPos, cartolaPosId) {
        const cpos = Stats.POS_FROM_ID[cartolaPosId];
        if (!cpos) return false;
        return (Stats.POS_COMPAT[ourPos] || []).includes(cpos);
    },

    normalize(str) {
        return (str || '')
            .toLowerCase()
            .normalize('NFD').replace(/[\u0300-\u036f]/g, '')
            .replace(/[^a-z0-9 ]/g, '')
            .trim();
    },

    // Alguns nomes em players.js têm a sigla do clube colada no final
    // para diferenciar jogadores com nome repetido (ex: "Vitinho BAH").
    // Remove esse sufixo antes de comparar com o Cartola.
    CLUB_CODES: ['FLA','PAL','BOT','CRU','BAH','SPFC','CAM','COR','GRE','FLU','VAS','INT','BRA','MIR','ATH','COT','CHE','REM','VIT','SAN'],
    stripClubSuffix(name) {
        const parts = (name || '').trim().split(' ');
        const last = parts[parts.length - 1];
        if (parts.length > 1 && Stats.CLUB_CODES.includes(last)) {
            return parts.slice(0, -1).join(' ');
        }
        return name;
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

        // Preserva correções MANUAIS: nunca são sobrescritas pelo automático
        const { data: manualRows } = await window.supabaseClient
            .from('player_map').select('player_id, cartola_id')
            .eq('match_type', 'manual');
        const manualIds = new Set((manualRows || []).map(r => r.player_id));

        const rows = [];
        const unmatched = [];
        const usedCartolaIds = new Set((manualRows || []).map(r => r.cartola_id).filter(Boolean));

        PLAYERS_DATABASE.forEach(p => {
            if (manualIds.has(p.id)) return; // já corrigido manualmente — não mexe

            const cleanName = Stats.stripClubSuffix(p.name);
            const candidates = (byClub[p.club] || []).filter(a => !usedCartolaIds.has(a.atleta_id));
            const target = Stats.normalize(cleanName);

            // 1º: match EXATO dentro do mesmo clube (evidência forte — aceita
            //     mesmo com posição divergente, é a mesma pessoa)
            let found = candidates.find(a =>
                Stats.normalize(a.apelido) === target || Stats.normalize(a.nome) === target
            );

            // 2º: match parcial dentro do mesmo clube — SÓ com posição compatível
            //     e cobertura mínima de nome (evita "iago" ⊂ "santiago")
            if (!found) {
                found = candidates.find(a => {
                    if (!Stats.posCompatible(p.position, a.posicao_id)) return false;
                    const ap = Stats.normalize(a.apelido);
                    if (!ap || ap.length < 4) return false;
                    const contains = ap.includes(target) || target.includes(ap);
                    if (!contains) return false;
                    const coverage = Math.min(ap.length, target.length) / Math.max(ap.length, target.length);
                    return coverage >= 0.5;
                });
            }

            // 3º: match exato GLOBAL (jogador transferido) — só nomes compostos
            //     (2+ palavras) e posição compatível, para evitar homônimos
            if (!found && target.includes(' ')) {
                found = atletas.find(a =>
                    !usedCartolaIds.has(a.atleta_id) &&
                    Stats.posCompatible(p.position, a.posicao_id) &&
                    (Stats.normalize(a.apelido) === target || Stats.normalize(a.nome) === target)
                );
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
        console.log(msg);
        console.log('Não encontrados (copie esta linha):');
        console.log(unmatched.map(p => `${p.name} (${p.club})`).join(', '));
        Stats.toast(msg + (unmatched.length ? ` ${unmatched.length} não encontrados — veja console.` : ''));
        Stats.renderCommissionerPanel();
        return { matched: rows.length - unmatched.length, unmatched };
    },


    // =========================================
    // GERADOR DE BASE DE JOGADORES
    // Reconstrói o players.js DIRETO da API do Cartola:
    // nomes, clubes, posições e IDs 100% idênticos à base oficial.
    // O download do arquivo novo começa automaticamente.
    // Uso: Stats.generatePlayersJs()
    // ⚠ Rodar ANTES do draft da liga real (troca os IDs dos jogadores).
    // =========================================
    async generatePlayersJs() {
        const mercado = await Stats.fetchCartola('mercado');
        const clubAbrev = {};
        Object.entries(mercado.clubes || {}).forEach(([id, c]) => {
            clubAbrev[id] = (c.abreviacao || '').toUpperCase();
        });

        const players = (mercado.atletas || [])
            .filter(a => a.posicao_id >= 1 && a.posicao_id <= 5) // sem técnicos
            .map(a => ({
                id: a.atleta_id,                                  // ID oficial do Cartola
                name: a.apelido,
                position: Stats.POS_FROM_ID[a.posicao_id],
                club: clubAbrev[a.clube_id] || '???',
                projPoints: Math.round((a.media_num || 0) * 10) / 10, // média por jogo
                gols: (a.scout && a.scout.G) || 0,
                assistencias: (a.scout && a.scout.A) || 0,
                cleanSheets: (a.scout && a.scout.SG) || 0,
                jogos: a.jogos_num || 0,
                status: 'disponivel',
                realPoints: 0,
                totalPoints: 0,
            }))
            .sort((x, y) => x.club.localeCompare(y.club) || y.projPoints - x.projPoints);

        const clubs = [...new Set(players.map(p => p.club))].sort();
        const header = '// PRANCHETA FF - Base de jogadores\n'
            + '// GERADA AUTOMATICAMENTE da API do Cartola em ' + new Date().toLocaleString('pt-BR') + '\n'
            + '// ' + players.length + ' jogadores · Clubes: ' + clubs.join(', ') + '\n'
            + '// NÃO EDITAR À MÃO — para atualizar, rode Stats.generatePlayersJs() de novo\n\n'
            + 'const PLAYERS_DATABASE = ';
        const content = header + JSON.stringify(players, null, 2) + ';\n';

        const blob = new Blob([content], { type: 'text/javascript' });
        const link = document.createElement('a');
        link.href = URL.createObjectURL(blob);
        link.download = 'players.js';
        link.click();

        console.log(`✓ players.js gerado: ${players.length} jogadores, ${clubs.length} clubes (${clubs.join(', ')}).`);
        console.log('1. Substitua o players.js do projeto pelo arquivo baixado e faça o push.');
        console.log('2. Depois rode o SQL de limpeza (te passei) e Stats.syncMapping() — vai casar 100%.');
        return { total: players.length, clubs };
    },

    // Marca um match automático como revisado/OK (vira 'manual')
    async confirmMatch(playerName) {
        const p = PLAYERS_DATABASE.find(x => Stats.normalize(Stats.stripClubSuffix(x.name)) === Stats.normalize(Stats.stripClubSuffix(playerName)));
        if (!p) { console.warn('Jogador não encontrado:', playerName); return; }
        const { error } = await window.supabaseClient.from('player_map')
            .update({ match_type: 'manual', updated_at: new Date().toISOString() })
            .eq('player_id', p.id);
        if (error) { console.error(error); return; }
        console.log(`✓ ${p.name} confirmado.`);
    },

    // Remove um match errado (jogador volta para "sem match")
    async clearMatch(playerName) {
        const p = PLAYERS_DATABASE.find(x => Stats.normalize(Stats.stripClubSuffix(x.name)) === Stats.normalize(Stats.stripClubSuffix(playerName)));
        if (!p) { console.warn('Jogador não encontrado:', playerName); return; }
        const { error } = await window.supabaseClient.from('player_map')
            .update({ cartola_id: null, matched_name: null, match_type: 'unmatched', updated_at: new Date().toISOString() })
            .eq('player_id', p.id);
        if (error) { console.error(error); return; }
        await Stats.loadMapping();
        console.log(`✓ Match de ${p.name} removido.`);
    },

    // =========================================
    // ASSISTENTE PARA OS SEM MATCH
    // Sugere os candidatos mais prováveis do Cartola para cada
    // jogador sem match e gera um bulkFix pré-preenchido para revisar.
    // Uso: Stats.assistUnmatched()
    // =========================================
    async assistUnmatched() {
        const mercado = await Stats.fetchCartola('mercado');
        const atletas = mercado.atletas || [];
        const clubAbrev = {};
        Object.entries(mercado.clubes || {}).forEach(([id, c]) => {
            clubAbrev[id] = (c.abreviacao || '').toUpperCase();
        });

        const { data: unmatchedRows } = await window.supabaseClient
            .from('player_map').select('player_id, player_name')
            .eq('match_type', 'unmatched');

        const table = [];
        const template = {};

        (unmatchedRows || []).forEach(r => {
            const p = PLAYERS_DATABASE.find(x => x.id === r.player_id);
            if (!p) return;
            const target = Stats.normalize(Stats.stripClubSuffix(p.name));
            const targetWords = target.split(' ').filter(w => w.length > 2);

            const scored = [];
            atletas.forEach(a => {
                const sameClub = clubAbrev[a.clube_id] === p.club;
                const nameStr = Stats.normalize(a.apelido) + ' ' + Stats.normalize(a.nome || '');
                const words = new Set(nameStr.split(' ').filter(Boolean));
                let score = 0;
                targetWords.forEach(w => { if (words.has(w)) score += w.length; });
                if (Stats.normalize(a.apelido) === target) score += 10;
                if (sameClub) score += 3;
                if (Stats.posCompatible(p.position, a.posicao_id)) score += 2; else score -= 4;
                if (score >= 5) scored.push({ score, a, clube: clubAbrev[a.clube_id] });
            });
            scored.sort((x, y) => y.score - x.score);
            const fmt = s => s ? `${s.a.apelido} · ${s.clube} · ${Stats.POS_FROM_ID[s.a.posicao_id]} · id ${s.a.atleta_id}` : '';

            table.push({
                nosso: p.name, pos: p.position, clube: p.club,
                sugestao_1: fmt(scored[0]) || '— (provavelmente fora do Cartola)',
                sugestao_2: fmt(scored[1]),
                sugestao_3: fmt(scored[2]),
            });
            if (scored[0]) template[Stats.stripClubSuffix(p.name)] = scored[0].a.atleta_id;
        });

        console.log(`%c=== ASSISTENTE DOS SEM MATCH (${table.length}) ===`, 'font-weight:bold;color:#00f2fe;');
        console.table(table);
        console.log('%cTemplate com a MELHOR sugestão de cada um. REVISE (apague as linhas erradas!) e rode:', 'color:#ff9f43;font-weight:bold;');
        console.log('Stats.bulkFix(' + JSON.stringify(template, null, 2) + ')');
        console.log('Quem ficou sem sugestão provavelmente saiu do Brasileirão — pode deixar sem match.');
        return { table, template };
    },

    // =========================================
    // AUDITORIA DO MAPEAMENTO
    // Confere: quantos casados, quantos manuais, quantos sem match,
    // e detecta possíveis matches ERRADOS (posição divergente entre
    // nossa base e o Cartola — sinal de homônimo trocado).
    // Uso no console: Stats.auditMapping()
    // =========================================
    async auditMapping() {
        const mercado = await Stats.fetchCartola('mercado');
        const atletaById = {};
        (mercado.atletas || []).forEach(a => { atletaById[a.atleta_id] = a; });
        const POS = { 1: 'GOL', 2: 'LAT', 3: 'ZAG', 4: 'MEI', 5: 'ATA', 6: 'TEC' };

        // Mapa de clubes para conferir clube do match
        const clubAbrev = {};
        Object.entries(mercado.clubes || {}).forEach(([id, c]) => {
            clubAbrev[id] = (c.abreviacao || '').toUpperCase();
        });

        const { data: map } = await window.supabaseClient.from('player_map').select('*');
        const counts = { auto: 0, manual: 0, unmatched: 0 };
        const suspicious = [];
        const samePerson = [];
        const staleIds = [];

        (map || []).forEach(r => {
            counts[r.match_type] = (counts[r.match_type] || 0) + 1;
            if (!r.cartola_id) return;
            if (r.match_type === 'manual') return; // revisado por você — não acusa
            const a = atletaById[r.cartola_id];
            if (!a) { staleIds.push(r.player_name); return; }
            const p = PLAYERS_DATABASE.find(x => x.id === r.player_id);
            if (!p) return;
            const cpos = POS[a.posicao_id];
            if (!cpos || cpos === 'TEC' || p.position === cpos) return;

            // Mesmo clube + mesmo nome (após remover sufixo) = mesma pessoa,
            // só a classificação de posição diverge entre as bases
            const sameClub = clubAbrev[a.clube_id] === p.club;
            const sameName = Stats.normalize(a.apelido) === Stats.normalize(Stats.stripClubSuffix(p.name));
            const compatible = (Stats.POS_COMPAT[p.position] || []).includes(cpos);

            const row = {
                nosso_jogador: p.name, nossa_pos: p.position,
                cartola_apelido: a.apelido, pos_cartola: cpos,
                cartola_id: r.cartola_id
            };
            if (sameClub && sameName) samePerson.push(row);
            else if (compatible && sameClub) samePerson.push(row);
            else suspicious.push(row);
        });

        const total = (map || []).length;
        console.log(`%c=== AUDITORIA DO MAPEAMENTO ===`, 'font-weight:bold;color:#00f2fe;');
        console.log(`Total: ${total} | Automáticos: ${counts.auto||0} | Manuais: ${counts.manual||0} | SEM match: ${counts.unmatched||0}`);

        if (suspicious.length) {
            console.log(`%c⚠ ${suspicious.length} PROVÁVEIS MATCHES ERRADOS — corrija com Stats.fixMapping('Nome', id) ou limpe com Stats.clearMatch('Nome'):`, 'color:#ff4757;font-weight:bold;');
            console.table(suspicious);
        } else {
            console.log('%c✓ Nenhum match suspeito.', 'color:#00ff87;');
        }

        if (samePerson.length) {
            console.log(`%cℹ ${samePerson.length} com posição divergente mas MESMO clube/nome (provavelmente a mesma pessoa — ok manter). Para a auditoria parar de listar: Stats.confirmMatch('Nome')`, 'color:#00f2fe;');
            console.table(samePerson);
        }

        if (staleIds.length) {
            console.log(`%c⚠ ${staleIds.length} matches apontam para IDs que saíram do Cartola (jogador transferido/removido):`, 'color:#ff9f43;');
            console.log(staleIds.join(', '));
        }

        const unmatchedList = (map || []).filter(r => r.match_type === 'unmatched').map(r => r.player_name);
        if (unmatchedList.length) {
            console.log('%cSem match (não pontuam até serem corrigidos ou removidos do jogo):', 'color:#888;');
            console.log(unmatchedList.join(', '));
        }

        return { counts, suspicious, staleIds, unmatched: unmatchedList };
    },

    // Mostra o elenco INTEIRO de um clube no Cartola, lado a lado com
    // quem está sem match no nosso banco naquele clube. Use para corrigir
    // vários jogadores de uma vez com Stats.bulkFix(...).
    async showClubRoster(clubAbrev) {
        const mercado = await Stats.fetchCartola('mercado');
        const atletas = mercado.atletas || [];
        const clubes = mercado.clubes || {};
        const clubId = Object.entries(clubes).find(([id, c]) =>
            (c.abreviacao || '').toUpperCase() === clubAbrev.toUpperCase()
        )?.[0];

        if (!clubId) { console.warn('Clube não encontrado:', clubAbrev); return; }

        const roster = atletas.filter(a => String(a.clube_id) === String(clubId));
        const { data: unmatched } = await window.supabaseClient
            .from('player_map').select('player_id, player_name')
            .eq('match_type', 'unmatched');

        const ourMissing = (unmatched || [])
            .map(u => PLAYERS_DATABASE.find(p => p.id === u.player_id))
            .filter(p => p && p.club === clubAbrev.toUpperCase());

        console.log(`%c--- SEM MATCH no nosso banco (${clubAbrev}) ---`, 'font-weight:bold;color:#ff9f43;');
        console.table(ourMissing.map(p => ({ nosso_nome: p.name, posicao: p.position })));

        console.log(`%c--- ELENCO COMPLETO no Cartola (${clubAbrev}) ---`, 'font-weight:bold;color:#00f2fe;');
        console.table(roster.map(a => ({ atleta_id: a.atleta_id, apelido: a.apelido, nome: a.nome, posicao_id: a.posicao_id })));

        console.log(`%cDepois de comparar, corrija com:`, 'color:#888;');
        console.log(`Stats.bulkFix({ "Nome Exato Nosso": 12345, "Outro Nome": 67890 })`);

        return { ourMissing, roster };
    },

    // Corrige vários jogadores de uma vez.
    // Exemplo: Stats.bulkFix({ "Aranha": 12345, "Raphael Veiga": 67890 })
    async bulkFix(map) {
        const rows = [];
        const notFound = [];
        Object.entries(map).forEach(([name, cartolaId]) => {
            const p = PLAYERS_DATABASE.find(x => Stats.normalize(Stats.stripClubSuffix(x.name)) === Stats.normalize(name));
            if (!p) { notFound.push(name); return; }
            rows.push({
                player_id: p.id, cartola_id: cartolaId,
                player_name: p.name, matched_name: '(manual/lote)',
                match_type: 'manual', updated_at: new Date().toISOString(),
            });
        });

        if (notFound.length) console.warn('Não encontrados no NOSSO banco (confira a grafia):', notFound);
        if (!rows.length) { console.warn('Nada para corrigir.'); return; }

        const { error } = await window.supabaseClient
            .from('player_map').upsert(rows, { onConflict: 'player_id' });
        if (error) { console.error('Erro no bulkFix:', error); return; }

        await Stats.loadMapping();
        console.log(`✓ ${rows.length} jogadores corrigidos.`);
    },

    // Correção manual individual: cole o nome exato do nosso banco e o cartola_id correto.
    async searchCartola(query) {
        const mercado = await Stats.fetchCartola('mercado');
        const atletas = mercado.atletas || [];
        const q = Stats.normalize(query);
        const results = atletas.filter(a =>
            Stats.normalize(a.apelido).includes(q) || Stats.normalize(a.nome).includes(q)
        );
        console.table(results.map(a => ({ atleta_id: a.atleta_id, apelido: a.apelido, nome: a.nome, clube_id: a.clube_id })));
        return results;
    },

    async fixMapping(playerName, cartolaId) {
        const p = PLAYERS_DATABASE.find(x => Stats.normalize(x.name) === Stats.normalize(playerName));
        if (!p) { console.warn('Jogador não encontrado no nosso banco:', playerName); return; }

        const { error } = await window.supabaseClient.from('player_map').upsert({
            player_id: p.id, cartola_id: cartolaId,
            player_name: p.name, matched_name: '(manual)',
            match_type: 'manual', updated_at: new Date().toISOString(),
        }, { onConflict: 'player_id' });

        if (error) { console.error('Erro ao corrigir:', error); return; }
        await Stats.loadMapping();
        console.log(`✓ ${p.name} → cartola_id ${cartolaId}`);
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
        // Carrega o mapeamento também: draft/waiver usam para esconder
        // jogadores que saíram do Brasileirão
        await Stats.loadMapping();

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
