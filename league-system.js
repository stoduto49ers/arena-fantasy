// =============================================
// ARENA FANTASY - Sistema de Ligas
// Tela de lobby após login, antes do app
// =============================================

const LeagueSystem = {

    state: {
        currentUser: null,
        myLeagues: [],
        currentLeague: null,
    },

    async init(user) {
        LeagueSystem.state.currentUser = user;
        await LeagueSystem.loadMyLeagues();

        if (LeagueSystem.state.myLeagues.length > 0) {
            // Seleciona automaticamente a primeira liga aprovada
            const approved = LeagueSystem.state.myLeagues.filter(m => m.status === 'approved');
            if (approved.length > 0) {
                LeagueSystem.enterLeague(approved[0]);
                return;
            }
        }

        // Sem liga aprovada — mostra lobby
        LeagueSystem.showLobby();
    },

    async loadMyLeagues() {
        const { data } = await window.supabaseClient
            .from('league_members')
            .select('*, league:league_id(id, name, commissioner_id, max_teams, invite_code)')
            .eq('manager_id', LeagueSystem.state.currentUser.id);
        LeagueSystem.state.myLeagues = data || [];
    },

    enterLeague(membership) {
        window._currentLeague = membership.league;
        LeagueSystem.hideLobby();
        // Inicia o app
        if (typeof initApp === 'function') initApp(LeagueSystem.state.currentUser);
        if (typeof Dashboard !== 'undefined') Dashboard.init(LeagueSystem.state.currentUser);
        if (typeof Draft !== 'undefined') Draft.init(LeagueSystem.state.currentUser);
    },

    showLobby() {
        document.getElementById('league-lobby').style.display = 'flex';
        document.getElementById('app-container-wrapper').style.display = 'none';
        LeagueSystem.renderLobby();
    },

    hideLobby() {
        document.getElementById('league-lobby').style.display = 'none';
        document.getElementById('app-container-wrapper').style.display = 'grid';
    },

    renderLobby() {
        const pending = LeagueSystem.state.myLeagues.filter(m => m.status === 'pending');
        const pendingEl = document.getElementById('lobby-pending-list');
        if (pendingEl) {
            if (pending.length > 0) {
                pendingEl.innerHTML = pending.map(m => `
                    <div class="lobby-pending-item">
                        <i class="fa-solid fa-clock" style="color:var(--neon-orange);"></i>
                        <span>Aguardando aprovação em <strong>${m.league?.name}</strong></span>
                    </div>`).join('');
                document.getElementById('lobby-pending-section').style.display = '';
            } else {
                document.getElementById('lobby-pending-section').style.display = 'none';
            }
        }
    },

    async searchLeagues(query) {
        if (!query.trim()) return;
        const { data } = await window.supabaseClient
            .from('leagues')
            .select('id, name, max_teams')
            .ilike('name', `%${query}%`)
            .limit(10);

        const resultEl = document.getElementById('lobby-search-results');
        if (!resultEl) return;

        if (!data?.length) {
            resultEl.innerHTML = '<p style="color:var(--text-muted); font-size:13px; padding:8px 0;">Nenhuma liga encontrada.</p>';
            return;
        }

        // Verifica quais já tenho solicitação
        const myLeagueIds = LeagueSystem.state.myLeagues.map(m => m.league_id || m.league?.id);

        resultEl.innerHTML = data.map(league => {
            const alreadyRequested = myLeagueIds.includes(league.id);
            return `<div class="lobby-league-row">
                <div>
                    <div style="font-weight:700; font-size:14px;">${league.name}</div>
                    <div style="font-size:11px; color:var(--text-muted);">Até ${league.max_teams} times</div>
                </div>
                ${alreadyRequested
                    ? `<span style="font-size:12px; color:var(--text-muted);">Já solicitado</span>`
                    : `<button class="action-btn primary" style="padding:6px 14px; font-size:12px;"
                        onclick="LeagueSystem.requestJoin('${league.id}', '${league.name}')">
                        <i class="fa-solid fa-paper-plane"></i> Solicitar
                       </button>`
                }
            </div>`;
        }).join('');
    },

    async requestJoin(leagueId, leagueName) {
        const { error } = await window.supabaseClient
            .from('league_members')
            .insert({
                league_id: leagueId,
                manager_id: LeagueSystem.state.currentUser.id,
                status: 'pending'
            });

        if (error) {
            LeagueSystem.showToast('Erro ao solicitar. Tente novamente.', 'error');
            return;
        }

        LeagueSystem.showToast(`Solicitação enviada para ${leagueName}!`, 'success');
        await LeagueSystem.loadMyLeagues();
        LeagueSystem.renderLobby();
        document.getElementById('lobby-search-results').innerHTML = '';
        document.getElementById('lobby-search-input').value = '';
    },

    // Chamado pelo comissário para aprovar/rejeitar
    async approveRequest(memberId, approved) {
        await window.supabaseClient
            .from('league_members')
            .update({
                status: approved ? 'approved' : 'rejected',
                approved_at: approved ? new Date().toISOString() : null
            })
            .eq('id', memberId);

        // Recarrega solicitações na config
        if (typeof LeagueConfig !== 'undefined') {
            LeagueConfig.loadPendingRequests?.();
        }
        LeagueSystem.showToast(approved ? 'Manager aprovado!' : 'Solicitação recusada.', approved ? 'success' : 'error');
    },

    showToast(msg, type = 'success') {
        let t = document.getElementById('league-toast');
        if (!t) { t = document.createElement('div'); t.id = 'league-toast'; document.body.appendChild(t); }
        t.textContent = msg;
        t.className = `league-toast league-toast-${type}`;
        t.style.display = 'block';
        setTimeout(() => { t.style.display = 'none'; }, 3000);
    }
};
