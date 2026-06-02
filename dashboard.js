// =============================================
// ARENA FANTASY - Dashboard Real
// Classificação, próximo confronto, status do time
// =============================================

const Dashboard = {

    state: {
        currentUser: null,
        managers: [],
        myManager: null,
        myPicks: [],
        nextMatchup: null,
        standings: [],
    },

    async init(user) {
        Dashboard.state.currentUser = user;
        try {
            await Dashboard.loadAll();
        } catch(e) {
            console.warn('Dashboard loadAll error:', e);
        }
        Dashboard.render();
        Dashboard.subscribeRealtime();
    },

    async loadAll() {
        await Promise.allSettled([
            Dashboard.loadManagers(),
            Dashboard.loadMyPicks(),
            Dashboard.loadNextMatchup(),
        ]);
        Dashboard.buildStandings();
    },

    async loadManagers() {
        try {
            const { data, error } = await window.supabaseClient
                .from('managers')
                .select('*')
                .order('total_points', { ascending: false });
            if (error) throw error;
            // Filtra bots localmente
            const BOT_PREFIX = '00000000-0000-0000-0000-';
            const real = (data || []).filter(m => !m.id.startsWith(BOT_PREFIX));
            Dashboard.state.managers = real;
            Dashboard.state.myManager = real.find(m => m.id === Dashboard.state.currentUser?.id);
        } catch(e) {
            console.warn('loadManagers error:', e);
        }
    },

    async loadMyPicks() {
        if (!Dashboard.state.currentUser) return;
        const { data } = await window.supabaseClient
            .from('draft_picks')
            .select('*')
            .eq('manager_id', Dashboard.state.currentUser.id);
        Dashboard.state.myPicks = data || [];
    },

    async loadNextMatchup() {
        if (!Dashboard.state.currentUser) return;
        const { data } = await window.supabaseClient
            .from('matchups')
            .select('*, home:home_manager_id(team_name), away:away_manager_id(team_name)')
            .or(`home_manager_id.eq.${Dashboard.state.currentUser.id},away_manager_id.eq.${Dashboard.state.currentUser.id}`)
            .eq('is_finished', false)
            .order('week', { ascending: true })
            .limit(1);
        Dashboard.state.nextMatchup = data?.[0] || null;
    },

    // Monta standings com base nos dados dos managers
    buildStandings() {
        Dashboard.state.standings = [...Dashboard.state.managers].sort((a, b) => {
            if (b.wins !== a.wins) return b.wins - a.wins;
            return b.total_points - a.total_points;
        });
    },

    render() {
        Dashboard.renderBanner();
        Dashboard.renderMyTeamCard();
        Dashboard.renderNextMatchup();
        Dashboard.renderStandings();
        Dashboard.renderBudgetBadge();
    },

    // Banner do topo
    renderBanner() {
        // Prioriza o nome da liga ativa, depois league_config, depois fallback
        const leagueName = window._currentLeague?.name
            || window._leagueConfig?.league_name
            || 'Minha Liga';
        const draftState = Draft.state.draftState;
        const isFinished = draftState?.is_finished;
        const isActive = draftState?.draft_status === 'active';

        const bannerTitle = document.getElementById('dashboard-league-name');
        const bannerDesc = document.getElementById('dashboard-league-desc');
        const bannerBtn = document.getElementById('dashboard-banner-btn');

        if (bannerTitle) bannerTitle.textContent = leagueName;
        if (bannerDesc) {
            if (isFinished) bannerDesc.textContent = 'Temporada em andamento. Escale seu time e vença os confrontos!';
            else if (isActive) bannerDesc.textContent = 'Draft em andamento! Faça suas picks e monte o melhor time.';
            else bannerDesc.textContent = 'Aguardando o início do draft. Explore os jogadores disponíveis.';
        }
        if (bannerBtn) {
            bannerBtn.textContent = isFinished ? 'Ir para Escalação' : 'Entrar no Draft';
            bannerBtn.onclick = () => switchTab(isFinished ? 'team-tab' : 'draft-tab');
        }
    },

    // Card do meu time
    renderMyTeamCard() {
        const me = Dashboard.state.myManager;
        const picks = Dashboard.state.myPicks;

        const nameEl = document.getElementById('dash-my-team-name');
        const recordEl = document.getElementById('dash-my-record');
        const pointsEl = document.getElementById('dash-my-points');
        const picksEl = document.getElementById('dash-my-picks');
        const posBreakEl = document.getElementById('dash-pos-breakdown');

        if (nameEl) nameEl.textContent = me?.team_name || window.currentManagerName || 'Meu Time';
        if (recordEl) recordEl.textContent = `${me?.wins||0}V - ${me?.losses||0}D`;
        if (pointsEl) pointsEl.textContent = `${(me?.total_points||0).toFixed(2)} pts`;
        if (picksEl) picksEl.textContent = `${picks.length} jogadores`;

        if (posBreakEl) {
            const byPos = { GOL: 0, ZAG: 0, LAT: 0, MEI: 0, ATA: 0 };
            picks.forEach(p => { if (byPos[p.player_position] !== undefined) byPos[p.player_position]++; });
            posBreakEl.innerHTML = Object.entries(byPos).map(([pos, count]) =>
                `<span class="pos-pill pos-${pos.toLowerCase()}">${pos} ${count}</span>`
            ).join('');
        }
    },

    // Próximo confronto
    renderNextMatchup() {
        const container = document.getElementById('dash-next-matchup');
        if (!container) return;

        const m = Dashboard.state.nextMatchup;
        const uid = Dashboard.state.currentUser?.id;

        if (!m) {
            container.innerHTML = `<p style="color:var(--text-muted); font-size:13px; text-align:center; padding:16px;">
                Nenhum confronto agendado ainda.
            </p>`;
            return;
        }

        const isHome = m.home_manager_id === uid;
        const myName = isHome ? m.home?.team_name : m.away?.team_name;
        const oppName = isHome ? m.away?.team_name : m.home?.team_name;
        const myScore = isHome ? m.home_score : m.away_score;
        const oppScore = isHome ? m.away_score : m.home_score;
        const phase = m.phase === 'regular' ? `Rodada ${m.week}` : m.phase === 'semifinal' ? 'Semifinal' : 'Final';
        const group = m.group_name ? ` · Grupo ${m.group_name}` : '';

        container.innerHTML = `
            <div style="font-size:11px; color:var(--text-muted); text-align:center; margin-bottom:12px; font-weight:600; text-transform:uppercase; letter-spacing:0.5px;">
                ${phase}${group}
            </div>
            <div style="display:flex; align-items:center; justify-content:space-between; gap:8px;">
                <div style="text-align:center; flex:1;">
                    <div style="font-size:13px; font-weight:700; color:var(--neon-blue);">${myName || 'Meu Time'}</div>
                    <div style="font-size:28px; font-weight:800; margin-top:4px;">${(myScore||0).toFixed(1)}</div>
                </div>
                <div style="font-size:12px; font-weight:800; color:var(--text-muted);">VS</div>
                <div style="text-align:center; flex:1;">
                    <div style="font-size:13px; font-weight:700; color:var(--text-secondary);">${oppName || 'Adversário'}</div>
                    <div style="font-size:28px; font-weight:800; margin-top:4px;">${(oppScore||0).toFixed(1)}</div>
                </div>
            </div>`;
    },

    // Classificação real
    renderStandings() {
        const tbody = document.getElementById('standings-tbody');
        if (!tbody) return;
        const uid = Dashboard.state.currentUser?.id;
        const list = Dashboard.state.standings;

        if (list.length === 0) {
            tbody.innerHTML = `<tr><td colspan="3" style="text-align:center; color:var(--text-muted); padding:16px; font-size:13px;">
                Nenhum manager cadastrado ainda.
            </td></tr>`;
            return;
        }

        tbody.innerHTML = list.map((m, i) => {
            const isMe = m.id === uid;
            const letter = (m.team_name || '?').charAt(0).toUpperCase();
            return `<tr style="${isMe ? 'background:rgba(0,242,254,0.06);' : ''}">
                <td>
                    <div class="standing-team">
                        <span style="font-weight:700; width:18px; color:var(--text-muted); font-size:12px;">${i + 1}</span>
                        <div class="team-avatar" style="background:var(--grad-${isMe ? 'primary' : 'dark'}); color:${isMe ? 'var(--bg-darkest)' : 'var(--text-secondary)'};">${letter}</div>
                        <span style="${isMe ? 'color:var(--neon-blue); font-weight:700;' : ''}">${m.team_name}${isMe ? ' (você)' : ''}</span>
                    </div>
                </td>
                <td class="standing-record">${m.wins || 0} - ${m.losses || 0}</td>
                <td class="standing-points">${(m.total_points || 0).toFixed(2)}</td>
            </tr>`;
        }).join('');
    },

    // Saldo de D$ discreto no header
    renderBudgetBadge() {
        const me = Dashboard.state.myManager;
        const el = document.getElementById('header-budget-badge');
        if (el && me) el.textContent = `D$${me.budget ?? 1000}`;
    },

    subscribeRealtime() {
        window.supabaseClient
            .channel('dashboard-live')
            .on('postgres_changes', { event: '*', schema: 'public', table: 'managers' }, async () => {
                await Dashboard.loadManagers();
                Dashboard.buildStandings();
                Dashboard.renderStandings();
                Dashboard.renderMyTeamCard();
                Dashboard.renderBudgetBadge();
            })
            .on('postgres_changes', { event: '*', schema: 'public', table: 'matchups' }, async () => {
                await Dashboard.loadNextMatchup();
                Dashboard.renderNextMatchup();
            })
            .subscribe();
    },
};
