// =============================================
// ARENA FANTASY - League Config
// =============================================

const LeagueConfig = {

    state: {
        config: null,
        managers: [],
        groups: [],
        currentUser: null,
        isCommissioner: false,
    },

    async init(user) {
        LeagueConfig.state.currentUser = user;
        await LeagueConfig.loadConfig();
        await LeagueConfig.loadManagers();
        await LeagueConfig.loadGroups();
        LeagueConfig.checkCommissioner();
        LeagueConfig.render();
        if (LeagueConfig.state.isCommissioner) {
            LeagueConfig.loadPendingRequests();
        }
    },

    async loadConfig() {
        const { data } = await window.supabaseClient
            .from('league_config')
            .select('*')
            .eq('id', 1)
            .single();
        LeagueConfig.state.config = data;
    },

    leagueId() { return window.currentLeagueId?.() || window._currentLeague?.id || null; },

    async loadManagers() {
        const lid = LeagueConfig.leagueId();
        if (lid) {
            const { data: members } = await window.supabaseClient
                .from('league_members').select('manager_id')
                .eq('league_id', lid).eq('status', 'approved');
            const ids = (members || []).map(m => m.manager_id);
            if (ids.length) {
                const { data } = await window.supabaseClient
                    .from('managers').select('*').in('id', ids)
                    .order('created_at', { ascending: true });
                LeagueConfig.state.managers = data || [];
                return;
            }
        }
        const { data } = await window.supabaseClient
            .from('managers').select('*')
            .order('created_at', { ascending: true });
        LeagueConfig.state.managers = data || [];
    },

    async loadGroups() {
        const { data } = await window.supabaseClient
            .from('league_groups')
            .select('*')
            .order('group_name', { ascending: true });
        LeagueConfig.state.groups = data || [];
    },

    checkCommissioner() {
        const cfg = LeagueConfig.state.config;
        const uid = LeagueConfig.state.currentUser?.id;
        // Comissário = primeiro manager cadastrado OU commissioner_id definido
        const firstManager = LeagueConfig.state.managers[0];
        LeagueConfig.state.isCommissioner =
            cfg?.commissioner_id === uid || firstManager?.id === uid;
    },

    // --- Salva uma seção da config ---
    // Copia o link de convite da liga para a área de transferência
    async copyInviteLink() {
        const lid = LeagueConfig.leagueId();
        if (!lid) { LeagueConfig.showToast('Entre em uma liga primeiro.', 'error'); return; }
        const link = `${window.location.origin}/?join=${lid}`;
        try {
            await navigator.clipboard.writeText(link);
            LeagueConfig.showToast('Link de convite copiado! Cole no grupo do WhatsApp. 📋', 'success');
        } catch (e) {
            prompt('Copie o link de convite:', link);
        }
    },

    renderInviteButton() {
        const anchor = document.getElementById('cfg-pending-requests');
        if (!anchor || document.getElementById('cfg-invite-btn')) return;
        const btn = document.createElement('button');
        btn.id = 'cfg-invite-btn';
        btn.className = 'action-btn primary commissioner-only';
        btn.style.cssText = 'margin-bottom:12px; width:100%; justify-content:center;';
        btn.innerHTML = '<i class="fa-solid fa-link"></i> Copiar Link de Convite da Liga';
        btn.addEventListener('click', () => LeagueConfig.copyInviteLink());
        anchor.parentElement.insertBefore(btn, anchor);
    },

    async loadPendingRequests() {
        LeagueConfig.renderInviteButton();
        const container = document.getElementById('cfg-pending-requests');
        if (!container) return;

        const { data } = await window.supabaseClient
            .from('league_members')
            .select('id, manager_id, requested_at, manager:manager_id(team_name, email)')
            .eq('status', 'pending');

        if (!data?.length) {
            container.innerHTML = '<p style="color:var(--text-muted); font-size:13px;">Nenhuma solicitação pendente.</p>';
            return;
        }

        // Busca bots disponíveis para substituição
        const BOT_IDS = [
            '00000000-0000-0000-0000-000000000001',
            '00000000-0000-0000-0000-000000000002',
            '00000000-0000-0000-0000-000000000003',
            '00000000-0000-0000-0000-000000000004',
            '00000000-0000-0000-0000-000000000005',
            '00000000-0000-0000-0000-000000000006',
        ];
        const { data: bots } = await window.supabaseClient
            .from('managers')
            .select('id, team_name')
            .in('id', BOT_IDS);
        const availableBots = bots || [];

        container.innerHTML = data.map(req => {
            const botOptions = availableBots.map(b =>
                `<option value="${b.id}">${b.team_name}</option>`
            ).join('');

            return `<div style="padding:12px; border:1px solid var(--border-color);
                border-radius:var(--border-radius-sm); background:rgba(255,255,255,0.02); margin-bottom:8px;">
                <div style="display:flex; justify-content:space-between; align-items:center; flex-wrap:wrap; gap:8px;">
                    <div>
                        <div style="font-weight:700; font-size:13px;">${req.manager?.team_name || '—'}</div>
                        <div style="font-size:11px; color:var(--text-muted);">${req.manager?.email || ''}</div>
                    </div>
                    <div style="display:flex; gap:8px; flex-wrap:wrap; align-items:center;">
                        ${availableBots.length > 0 ? `
                        <select id="bot-replace-${req.id}" style="background:rgba(255,255,255,0.06); border:1px solid var(--border-color);
                            color:var(--text-primary); border-radius:6px; padding:5px 8px; font-size:11px; font-family:var(--font-primary);">
                            <option value="">Aprovar sem substituir bot</option>
                            ${botOptions}
                        </select>` : ''}
                        <button class="action-btn primary" style="padding:6px 12px; font-size:12px;"
                            onclick="LeagueConfig.approveWithBotReplace(${req.id}, '${req.manager_id}')">
                            <i class="fa-solid fa-check"></i> Aprovar
                        </button>
                        <button class="action-btn" style="padding:6px 12px; font-size:12px; border-color:rgba(255,71,87,0.3); color:var(--neon-red);"
                            onclick="LeagueSystem.approveRequest(${req.id}, false)">
                            <i class="fa-solid fa-xmark"></i> Recusar
                        </button>
                    </div>
                </div>
            </div>`;
        }).join('');
    },

    async approveWithBotReplace(memberId, managerId) {
        const selectEl = document.getElementById(`bot-replace-${memberId}`);
        const botIdToReplace = selectEl?.value || '';

        // Aprova o manager
        await window.supabaseClient
            .from('league_members')
            .update({ status: 'approved', approved_at: new Date().toISOString() })
            .eq('id', memberId);

        // Remove o bot da liga se selecionado
        if (botIdToReplace) {
            await window.supabaseClient
                .from('league_members')
                .delete()
                .eq('manager_id', botIdToReplace)
                .eq('league_id', window._currentLeague?.id);

            LeagueConfig.showToast('Manager aprovado e bot removido!', 'success');
        } else {
            LeagueConfig.showToast('Manager aprovado!', 'success');
        }

        LeagueConfig.loadPendingRequests();
        if (typeof Dashboard !== 'undefined') Dashboard.init(window._currentUser);
    },

    // --- Salva uma seção da config ---
    async saveConfig(fields) {
        await window.supabaseClient
            .from('league_config')
            .update({ ...fields, updated_at: new Date().toISOString() })
            .eq('id', 1);
        await LeagueConfig.loadConfig();
    },

    // --- Sorteia ordem do draft ---
    async shuffleDraftOrder() {
        const managers = [...LeagueConfig.state.managers];
        // Fisher-Yates shuffle
        for (let i = managers.length - 1; i > 0; i--) {
            const j = Math.floor(Math.random() * (i + 1));
            [managers[i], managers[j]] = [managers[j], managers[i]];
        }
        const order = managers.map(m => ({ id: m.id, team_name: m.team_name }));
        await LeagueConfig.saveConfig({ draft_order: order });
        LeagueConfig.renderDraftOrder();
        LeagueConfig.showToast('Ordem do draft sorteada!', 'success');
    },

    // --- Sorteia grupos ---
    async shuffleGroups() {
        const managers = [...LeagueConfig.state.managers];
        const cfg = LeagueConfig.state.config;
        const groupCount = cfg?.group_count || 4;

        // Embaralha managers
        for (let i = managers.length - 1; i > 0; i--) {
            const j = Math.floor(Math.random() * (i + 1));
            [managers[i], managers[j]] = [managers[j], managers[i]];
        }

        // Deleta grupos antigos
        await window.supabaseClient.from('league_groups').delete().neq('id', 0);

        // Cria novos grupos — distribuição round-robin (justa mesmo com número ímpar)
        const groupNames = ['A','B','C','D','E','F','G','H'];
        const buckets = Array.from({ length: groupCount }, () => []);
        managers.forEach((m, i) => buckets[i % groupCount].push(m.id));
        const groups = buckets.map((ids, g) => ({
            group_name: groupNames[g],
            manager_ids: ids
        })).filter(g => g.manager_ids.length > 0);

        await window.supabaseClient.from('league_groups').insert(groups);
        await LeagueConfig.loadGroups();
        LeagueConfig.renderGroups();
        LeagueConfig.showToast('Grupos sorteados!', 'success');
    },

    // --- Gera confrontos da fase regular ---
    // Round-robin pelo método do círculo: cada time joga
    // exatamente UMA vez por semana (bye automático se ímpar)
    buildRoundRobin(ids) {
        const list = [...ids];
        if (list.length % 2 !== 0) list.push(null); // bye
        const n = list.length;
        const weeks = [];
        for (let r = 0; r < n - 1; r++) {
            const pairs = [];
            for (let i = 0; i < n / 2; i++) {
                const a = list[i], b = list[n - 1 - i];
                if (a && b) pairs.push(r % 2 === 0 ? { home: a, away: b } : { home: b, away: a });
            }
            weeks.push(pairs);
            list.splice(1, 0, list.pop()); // rotaciona mantendo o primeiro fixo
        }
        return weeks;
    },

    async generateMatchups() {
        const cfg = LeagueConfig.state.config;
        const lid = LeagueConfig.leagueId();
        const isSingleTable = cfg?.format === 'single_table';

        // Pontos corridos: todos numa tabela só (não precisa de grupos)
        let groups = LeagueConfig.state.groups;
        if (isSingleTable) {
            const allIds = LeagueConfig.state.managers.map(m => m.id);
            if (allIds.length < 2) { LeagueConfig.showToast('A liga precisa de pelo menos 2 managers.', 'error'); return; }
            groups = [{ group_name: null, manager_ids: allIds }];
        } else if (!groups.length) {
            LeagueConfig.showToast('Sorteie os grupos primeiro.', 'error');
            return;
        }

        // Limpa TODA a temporada anterior (regular + mata-mata)
        let delQ = window.supabaseClient.from('matchups').delete()
            .in('phase', ['regular', 'quartas', 'semifinal', 'final']);
        if (lid) delQ = delQ.eq('league_id', lid);
        await delQ;

        const totalWeeks = Math.max(1, (cfg?.total_rounds || 38) - (cfg?.playoff_weeks || 3));
        const allMatchups = [];

        groups.forEach(group => {
            const weeks = LeagueConfig.buildRoundRobin(group.manager_ids);
            weeks.forEach((pairs, wIdx) => {
                if (wIdx >= totalWeeks) return; // não passa do limite da temporada
                pairs.forEach(p => {
                    allMatchups.push({
                        league_id: lid,
                        week: wIdx + 1,
                        home_manager_id: p.home,
                        away_manager_id: p.away,
                        phase: 'regular',
                        group_name: group.group_name,
                        home_score: 0,
                        away_score: 0,
                        is_finished: false
                    });
                });
            });
        });

        await window.supabaseClient.from('matchups').insert(allMatchups);
        const weeksUsed = Math.min(totalWeeks, Math.max(...groups.map(g => LeagueConfig.buildRoundRobin(g.manager_ids).length)));
        LeagueConfig.showToast(`${allMatchups.length} confrontos gerados em ${weeksUsed} semanas!`, 'success');
        window._currentWeek = null;
    },

    // =========================================
    // MATA-MATA (playoffs)
    // Classifica pelos resultados da fase regular e gera a
    // primeira fase do chaveamento. As fases seguintes são
    // criadas automaticamente pelo fechamento de rodada.
    // =========================================
    async generatePlayoffs() {
        if (!LeagueConfig.isCommissioner?.() && !confirm('Gerar mata-mata?')) return;
        const lid = LeagueConfig.leagueId();

        let q = window.supabaseClient.from('matchups').select('*').eq('phase', 'regular');
        if (lid) q = q.eq('league_id', lid);
        const { data: regs } = await q;
        if (!regs?.length) { LeagueConfig.showToast('Gere a fase regular primeiro.', 'error'); return; }

        const open = regs.filter(m => !m.is_finished);
        if (open.length && !confirm(`Ainda há ${open.length} confrontos da fase regular em aberto.\nGerar o mata-mata mesmo assim? (só jogos finalizados contam na classificação)`)) return;

        const nTeams = parseInt(prompt('Quantos times classificam para o mata-mata? (2, 4 ou 8)', '4'));
        if (![2, 4, 8].includes(nTeams)) { LeagueConfig.showToast('Valor inválido. Use 2, 4 ou 8.', 'error'); return; }

        // Classificação a partir dos jogos finalizados DESTA liga
        const table = {};
        const touch = (id, group) => { if (!table[id]) table[id] = { id, wins: 0, points: 0, group }; };
        regs.filter(m => m.is_finished).forEach(m => {
            touch(m.home_manager_id, m.group_name);
            touch(m.away_manager_id, m.group_name);
            table[m.home_manager_id].points += parseFloat(m.home_score) || 0;
            table[m.away_manager_id].points += parseFloat(m.away_score) || 0;
            const hs = parseFloat(m.home_score) || 0, as = parseFloat(m.away_score) || 0;
            if (hs >= as) table[m.home_manager_id].wins++;
            else table[m.away_manager_id].wins++;
        });
        const sortFn = (a, b) => (b.wins - a.wins) || (b.points - a.points);

        const cfg = LeagueConfig.state.config;
        const groups = LeagueConfig.state.groups;
        let seeds = [];

        if (cfg?.format !== 'single_table' && groups.length > 1 && Number.isInteger(nTeams / groups.length)) {
            // Top N de cada grupo, com cruzamento entre grupos (A1×B2, B1×A2)
            const per = nTeams / groups.length;
            const byGroup = groups.map(g => {
                const rows = Object.values(table).filter(t =>
                    g.manager_ids.includes(t.id)).sort(sortFn);
                return rows.slice(0, per);
            });
            for (let g = 0; g < byGroup.length; g += 2) {
                const A = byGroup[g], B = byGroup[g + 1] || byGroup[g];
                for (let i = 0; i < per; i++) {
                    seeds.push(A[i]);              // A1, A2...
                    seeds.push(B[per - 1 - i]);    // B2, B1... (cruzamento)
                }
            }
            seeds = seeds.filter(Boolean);
        } else {
            // Classificação geral: 1×último, 2×penúltimo...
            const overall = Object.values(table).sort(sortFn).slice(0, nTeams);
            if (overall.length < nTeams) { LeagueConfig.showToast(`Só ${overall.length} times têm jogos finalizados.`, 'error'); return; }
            for (let i = 0; i < nTeams / 2; i++) {
                seeds.push(overall[i]);
                seeds.push(overall[nTeams - 1 - i]);
            }
        }

        if (seeds.length < nTeams) { LeagueConfig.showToast('Classificados insuficientes.', 'error'); return; }

        // Remove mata-mata antigo
        let delQ = window.supabaseClient.from('matchups').delete()
            .in('phase', ['quartas', 'semifinal', 'final']);
        if (lid) delQ = delQ.eq('league_id', lid);
        await delQ;

        const startWeek = Math.max(...regs.map(m => m.week)) + 1;
        const phase = nTeams === 8 ? 'quartas' : nTeams === 4 ? 'semifinal' : 'final';

        const rows = [];
        for (let i = 0; i < seeds.length; i += 2) {
            rows.push({
                league_id: lid,
                week: startWeek,
                home_manager_id: seeds[i].id,
                away_manager_id: seeds[i + 1].id,
                phase,
                home_score: 0, away_score: 0, is_finished: false
            });
        }
        await window.supabaseClient.from('matchups').insert(rows);

        const nameOf = id => LeagueConfig.state.managers.find(m => m.id === id)?.team_name || '?';
        const lines = rows.map(r => `• ${nameOf(r.home_manager_id)} × ${nameOf(r.away_manager_id)}`).join('\n');
        const phaseLbl = phase === 'quartas' ? 'QUARTAS DE FINAL' : phase === 'semifinal' ? 'SEMIFINAIS' : 'GRANDE FINAL';
        await LeagueConfig.postSystemMessage(`🏟️ MATA-MATA GERADO! ${phaseLbl} (semana ${startWeek}):\n${lines}`);

        LeagueConfig.showToast(`Mata-mata gerado: ${rows.length} confrontos!`, 'success');
        window._currentWeek = null;
    },

    // --- Render principal ---
    // --- Render principal ---
    render() {
        LeagueConfig.renderLeagueInfo();
        LeagueConfig.renderScoring();
        LeagueConfig.renderDraftOrder();
        LeagueConfig.renderFormat();
        LeagueConfig.renderGroups();
        LeagueConfig.toggleCommissionerControls();
        if (typeof Stats !== 'undefined') Stats.renderCommissionerPanel();
    },

    toggleCommissionerControls() {
        const isComm = LeagueConfig.state.isCommissioner;
        document.querySelectorAll('.commissioner-only').forEach(el => {
            el.style.display = isComm ? '' : 'none';
        });
        document.querySelectorAll('.commissioner-only input, .commissioner-only select, .commissioner-only button:not(.view-btn)')
            .forEach(el => { el.disabled = !isComm; });
    },

    renderLeagueInfo() {
        const cfg = LeagueConfig.state.config;
        if (!cfg) return;
        const nameEl = document.getElementById('cfg-league-name');
        const yearEl = document.getElementById('cfg-season-year');
        if (nameEl) nameEl.value = cfg.league_name || '';
        if (yearEl) yearEl.value = cfg.season_year || 2025;
    },

    renderScoring() {
        const cfg = LeagueConfig.state.config;
        if (!cfg?.scoring) return;
        const s = typeof cfg.scoring === 'string' ? JSON.parse(cfg.scoring) : cfg.scoring;
        Object.entries(s).forEach(([key, val]) => {
            const el = document.getElementById(`score-${key}`);
            if (el) el.value = val;
        });
    },

    renderDraftOrder() {
        const cfg = LeagueConfig.state.config;
        const container = document.getElementById('cfg-draft-order-list');
        if (!container) return;

        const order = cfg?.draft_order || [];
        if (order.length === 0) {
            container.innerHTML = '<p style="color:var(--text-muted);font-size:13px;">Ordem ainda não sorteada.</p>';
            return;
        }
        container.innerHTML = order.map((m, i) =>
            `<div class="draft-order-row">
                <span class="draft-order-num">${i + 1}</span>
                <span class="draft-order-name">${m.team_name}</span>
            </div>`
        ).join('');
    },

    renderFormat() {
        const cfg = LeagueConfig.state.config;
        if (!cfg) return;
        const fmtEl = document.getElementById('cfg-format');
        const playoffEl = document.getElementById('cfg-playoff-weeks');
        const groupEl = document.getElementById('cfg-group-count');
        if (fmtEl) fmtEl.value = cfg.format || 'groups';
        if (playoffEl) playoffEl.value = cfg.playoff_weeks || 3;
        if (groupEl) groupEl.value = cfg.group_count || 4;

        // Aplica bloqueio se pontos corridos
        const isPontCorridos = (cfg.format === 'single_table');
        if (groupEl) { groupEl.disabled = isPontCorridos; groupEl.closest('.cfg-field').style.opacity = isPontCorridos ? '0.4' : '1'; }
        if (playoffEl) { playoffEl.disabled = isPontCorridos; playoffEl.closest('.cfg-field').style.opacity = isPontCorridos ? '0.4' : '1'; }
        const shuffleBtn = document.getElementById('cfg-shuffle-groups-btn');
        if (shuffleBtn) shuffleBtn.disabled = isPontCorridos;
    },

    renderGroups() {
        const container = document.getElementById('cfg-groups-display');
        if (!container) return;
        const groups = LeagueConfig.state.groups;
        const managers = LeagueConfig.state.managers;

        if (groups.length === 0) {
            container.innerHTML = '<p style="color:var(--text-muted);font-size:13px;">Grupos ainda não sorteados.</p>';
            return;
        }

        container.innerHTML = groups.map(g => {
            const memberIds = g.manager_ids || [];
            const members = memberIds.map(id => managers.find(m => m.id === id)).filter(Boolean);
            return `<div class="group-card">
                <div class="group-label">Grupo ${g.group_name}</div>
                ${members.map(m => `<div class="group-member">${m.team_name}</div>`).join('')}
            </div>`;
        }).join('');
    },

    // --- Salva pontuação ---
    async saveScoring() {
        const keys = ['gol','assistencia','gol_contra','cartao_amarelo','cartao_vermelho',
            'defesa_dificil','penalti_defendido','penalti_perdido','penalti_convertido',
            'jogo_sem_sofrer_gol','gol_sofrido','vitoria_time','falta_cometida',
            'desarme','finalizacao_gol','finalizacao_fora'];
        const scoring = {};
        keys.forEach(k => {
            const el = document.getElementById(`score-${k}`);
            if (el) scoring[k] = parseFloat(el.value) || 0;
        });
        await LeagueConfig.saveConfig({ scoring });

        // Alerta no chat
        await LeagueConfig.postSystemMessage(
            `⚙️ O comissário atualizou o sistema de pontuação da liga. As projeções foram recalculadas.`
        );

        LeagueConfig.showToast('Pontuação salva!', 'success');
    },

    // Posta mensagem do sistema no chat
    async postSystemMessage(msg) {
        const user = window._currentUser;
        if (!user || !window.supabaseClient) return;
        await window.supabaseClient.from('chat_messages').insert({
            league_id: LeagueConfig.leagueId(),
            manager_id: user.id,
            team_name: '⚙️ Sistema',
            avatar_color: '#a855f7',
            message: msg
        });
    },

    // --- Salva info da liga ---
    async saveLeagueInfo() {
        const name = document.getElementById('cfg-league-name')?.value?.trim();
        const year = parseInt(document.getElementById('cfg-season-year')?.value);
        if (!name) { LeagueConfig.showToast('Digite o nome da liga.', 'error'); return; }

        // Salva na league_config
        await LeagueConfig.saveConfig({ league_name: name, season_year: year });

        // Sincroniza também na tabela leagues (usada na busca pelos amigos)
        const uid = LeagueConfig.state.currentUser?.id;
        if (uid) {
            const { error } = await window.supabaseClient
                .from('leagues')
                .update({ name })
                .eq('commissioner_id', uid);
            if (!error && window._currentLeague) {
                window._currentLeague.name = name;
            }
        }

        // Atualiza o banner do dashboard
        const bannerEl = document.getElementById('dashboard-league-name');
        if (bannerEl) bannerEl.textContent = name;

        LeagueConfig.showToast('Liga atualizada!', 'success');
    },

    // --- Salva formato ---
    async saveFormat() {
        const format = document.getElementById('cfg-format')?.value;
        const playoffWeeks = parseInt(document.getElementById('cfg-playoff-weeks')?.value);
        const groupCount = parseInt(document.getElementById('cfg-group-count')?.value);
        await LeagueConfig.saveConfig({ format, playoff_weeks: playoffWeeks, group_count: groupCount });

        const formatNames = {
            'pontos_corridos': 'Pontos Corridos (liga única)',
            'grupos_playoffs': 'Grupos + Playoffs',
            '2grupos': '2 Grupos de 8',
            '4grupos': '4 Grupos de 4',
        };
        const desc = formatNames[format] || format || 'novo formato';
        await LeagueConfig.postSystemMessage(
            `🏆 O comissário alterou o formato da liga para: ${desc}. Confrontos atualizados.`
        );

        LeagueConfig.showToast('Formato salvo!', 'success');
    },

    showToast(msg, type = 'success') {
        let toast = document.getElementById('league-toast');
        if (!toast) {
            toast = document.createElement('div');
            toast.id = 'league-toast';
            document.body.appendChild(toast);
        }
        toast.textContent = msg;
        toast.className = `league-toast league-toast-${type}`;
        toast.style.display = 'block';
        setTimeout(() => { toast.style.display = 'none'; }, 3000);
    }
};

// Eventos da aba de configuração
document.addEventListener('DOMContentLoaded', () => {
    // Salvar info da liga
    document.getElementById('cfg-save-info-btn')?.addEventListener('click', LeagueConfig.saveLeagueInfo);

    // Salvar pontuação
    document.getElementById('cfg-save-scoring-btn')?.addEventListener('click', LeagueConfig.saveScoring);

    // Sortear draft
    document.getElementById('cfg-shuffle-draft-btn')?.addEventListener('click', () => {
        if (confirm('Sortear nova ordem do draft? A ordem atual será substituída.')) {
            LeagueConfig.shuffleDraftOrder();
        }
    });

    // Salvar formato
    document.getElementById('cfg-save-format-btn')?.addEventListener('click', LeagueConfig.saveFormat);

    // Sortear grupos
    document.getElementById('cfg-shuffle-groups-btn')?.addEventListener('click', () => {
        if (confirm('Sortear grupos? Os grupos atuais serão substituídos.')) {
            LeagueConfig.shuffleGroups();
        }
    });

    // Gerar confrontos
    // Injeta o botão de mata-mata ao lado do gerador de confrontos
    const genBtn = document.getElementById('cfg-generate-matchups-btn');
    if (genBtn && !document.getElementById('cfg-generate-playoffs-btn')) {
        const pBtn = document.createElement('button');
        pBtn.id = 'cfg-generate-playoffs-btn';
        pBtn.className = 'action-btn commissioner-only';
        pBtn.style.cssText = 'margin-top:16px; margin-left:8px; border-color:rgba(255,215,0,0.4); color:#ffd700;';
        pBtn.innerHTML = '<i class="fa-solid fa-trophy"></i> Gerar Mata-Mata';
        pBtn.addEventListener('click', () => LeagueConfig.generatePlayoffs());
        genBtn.insertAdjacentElement('afterend', pBtn);
    }

    document.getElementById('cfg-generate-matchups-btn')?.addEventListener('click', () => {
        if (confirm('Gerar confrontos da temporada? Os confrontos anteriores serão apagados.')) {
            LeagueConfig.generateMatchups();
        }
    });

    // Timer do draft (sincroniza com Draft.js)
    document.getElementById('cfg-draft-timer')?.addEventListener('change', (e) => {
        if (typeof Draft !== 'undefined') Draft.state.timerHours = parseInt(e.target.value);
    });
});
