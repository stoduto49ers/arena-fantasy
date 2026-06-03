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

    async loadManagers() {
        const { data } = await window.supabaseClient
            .from('managers')
            .select('*')
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
    async loadPendingRequests() {
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

        // Cria novos grupos
        const groupNames = ['A','B','C','D','E','F','G','H'];
        const groups = [];
        for (let g = 0; g < groupCount; g++) {
            const start = g * (managers.length / groupCount);
            const end = start + (managers.length / groupCount);
            const groupManagers = managers.slice(start, end);
            groups.push({
                group_name: groupNames[g],
                manager_ids: groupManagers.map(m => m.id)
            });
        }

        await window.supabaseClient.from('league_groups').insert(groups);
        await LeagueConfig.loadGroups();
        LeagueConfig.renderGroups();
        LeagueConfig.showToast('Grupos sorteados!', 'success');
    },

    // --- Gera confrontos da fase regular ---
    async generateMatchups() {
        const cfg = LeagueConfig.state.config;
        const groups = LeagueConfig.state.groups;
        if (groups.length === 0) {
            LeagueConfig.showToast('Sorteie os grupos primeiro.', 'error');
            return;
        }

        // Deleta confrontos antigos da fase regular
        await window.supabaseClient
            .from('matchups')
            .delete()
            .eq('phase', 'regular');

        const allMatchups = [];
        const totalWeeks = cfg.total_rounds - cfg.playoff_weeks;
        let week = 1;

        // Para cada grupo, gera round-robin
        groups.forEach(group => {
            const ids = group.manager_ids;
            const rounds = [];
            // Round robin simples
            for (let i = 0; i < ids.length; i++) {
                for (let j = i + 1; j < ids.length; j++) {
                    rounds.push({ home: ids[i], away: ids[j] });
                }
            }
            // Distribui nas semanas disponíveis (repete se necessário)
            rounds.forEach((matchup, idx) => {
                const w = (idx % totalWeeks) + 1;
                allMatchups.push({
                    week: w,
                    home_manager_id: matchup.home,
                    away_manager_id: matchup.away,
                    phase: 'regular',
                    group_name: group.group_name
                });
            });
        });

        await window.supabaseClient.from('matchups').insert(allMatchups);
        LeagueConfig.showToast(`${allMatchups.length} confrontos gerados!`, 'success');
    },

    // --- Render principal ---
    render() {
        LeagueConfig.renderLeagueInfo();
        LeagueConfig.renderScoring();
        LeagueConfig.renderDraftOrder();
        LeagueConfig.renderFormat();
        LeagueConfig.renderGroups();
        LeagueConfig.toggleCommissionerControls();
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
            league_id: window._currentLeague?.id || null,
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
