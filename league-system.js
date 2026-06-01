// =============================================
// ARENA FANTASY - Sistema de Ligas
// Tela inicial pública → seleciona liga → app da liga
// =============================================

const LeagueSystem = {

    state: {
        user: null,
        myMemberships: [],
        activeMembership: null,
    },

    async init(user) {
        LeagueSystem.state.user = user;
        window._currentUser = user;
        await LeagueSystem.loadMemberships();
        LeagueSystem.showHome();
    },

    async loadMemberships() {
        // Busca memberships sem join (FK foi removida)
        const { data: members } = await window.supabaseClient
            .from('league_members')
            .select('*')
            .eq('manager_id', LeagueSystem.state.user.id);

        if (!members?.length) {
            LeagueSystem.state.myMemberships = [];
            return;
        }

        // Busca dados das ligas separadamente
        const leagueIds = [...new Set(members.map(m => m.league_id))];
        const { data: leagues } = await window.supabaseClient
            .from('leagues')
            .select('id, name, commissioner_id, max_teams')
            .in('id', leagueIds);

        // Combina manualmente
        LeagueSystem.state.myMemberships = members.map(m => ({
            ...m,
            league: leagues?.find(l => l.id === m.league_id) || null
        }));
    },

    // Mostra a tela home pública (fora de qualquer liga)
    showHome() {
        document.getElementById('league-home').style.display = 'flex';
        document.getElementById('app-container-wrapper').style.display = 'none';
        LeagueSystem.renderHome();
        // Jogos e notícias ficam disponíveis na home
        if (typeof Jogos !== 'undefined') Jogos.load();
    },

    // Entra em uma liga — mostra o app completo
    enterLeague(membership) {
        LeagueSystem.state.activeMembership = membership;
        window._currentLeague = membership.league;

        document.getElementById('league-home').style.display = 'none';
        document.getElementById('app-container-wrapper').style.display = 'grid';

        // Inicializa todos os módulos da liga
        const user = LeagueSystem.state.user;
        if (typeof initApp === 'function') initApp(user);
        if (typeof Dashboard !== 'undefined') Dashboard.init(user);
        if (typeof Draft !== 'undefined') Draft.init(user);
        if (typeof Waiver !== 'undefined') Waiver.init(user);
    },

    // Volta para a tela home
    leaveLeague() {
        LeagueSystem.state.activeMembership = null;
        window._currentLeague = null;
        document.getElementById('app-container-wrapper').style.display = 'none';
        LeagueSystem.showHome();
    },

    renderHome() {
        const approved = LeagueSystem.state.myMemberships.filter(m => m.status === 'approved');
        const pending  = LeagueSystem.state.myMemberships.filter(m => m.status === 'pending');
        // Carrega ligas disponíveis automaticamente
        setTimeout(() => LeagueSystem.searchLeagues(), 100);

        // Minhas ligas aprovadas
        const leaguesEl = document.getElementById('home-my-leagues');
        if (leaguesEl) {
            if (approved.length === 0) {
                leaguesEl.innerHTML = `<p style="color:var(--text-muted); font-size:13px;">
                    Você ainda não participa de nenhuma liga. Busque uma abaixo.
                </p>`;
            } else {
                leaguesEl.innerHTML = approved.map(m => `
                    <div class="league-card" onclick="LeagueSystem.enterLeague(${JSON.stringify(m).replace(/"/g, '&quot;')})">
                        <div class="league-card-icon">
                            <i class="fa-solid fa-trophy"></i>
                        </div>
                        <div class="league-card-info">
                            <div class="league-card-name">${m.league?.name}</div>
                            <div class="league-card-meta">Até ${m.league?.max_teams || 16} times</div>
                        </div>
                        <div class="league-card-enter">
                            Entrar <i class="fa-solid fa-arrow-right"></i>
                        </div>
                    </div>`).join('');
            }
        }

        // Pendentes
        const pendingEl = document.getElementById('home-pending');
        if (pendingEl) {
            pendingEl.style.display = pending.length ? '' : 'none';
            if (pending.length) {
                pendingEl.innerHTML = `<div style="margin-bottom:8px; font-size:11px; font-weight:700; color:var(--text-muted); text-transform:uppercase; letter-spacing:0.5px;">Aguardando aprovação</div>` +
                    pending.map(m => `
                    <div style="display:flex; align-items:center; gap:10px; padding:8px 12px;
                        background:rgba(255,159,67,0.06); border:1px solid rgba(255,159,67,0.2);
                        border-radius:8px; margin-bottom:6px; font-size:13px;">
                        <i class="fa-solid fa-clock" style="color:var(--neon-orange);"></i>
                        <span>Solicitação para <strong>${m.league?.name}</strong> em análise pelo comissário.</span>
                    </div>`).join('');
            }
        }
    },

    async searchLeagues(forceShowAll = false) {
        const q = document.getElementById('home-search-input')?.value?.trim();
        const resultEl = document.getElementById('home-search-results');
        if (!resultEl) return;

        // Busca todas as ligas se campo vazio OU busca pelo termo
        let query = window.supabaseClient.from('leagues').select('id, name, max_teams');
        if (q) {
            query = query.ilike('name', `%${q}%`);
        }
        const { data, error } = await query.limit(20);

        if (error || !data?.length) {
            resultEl.innerHTML = `<p style="color:var(--text-muted); font-size:13px; padding:8px 0;">Nenhuma liga encontrada.</p>`;
            return;
        }

        const myIds = LeagueSystem.state.myMemberships.map(m => m.league_id || m.league?.id);
        resultEl.innerHTML = data.map(l => {
            const membership = LeagueSystem.state.myMemberships.find(m => (m.league_id || m.league?.id) === l.id);
            const status = membership?.status;
            let action = '';
            if (status === 'approved') {
                action = `<span style="font-size:12px; color:var(--neon-green); padding:6px 10px;">✓ Membro</span>`;
            } else if (status === 'pending') {
                action = `<span style="font-size:12px; color:var(--neon-orange); padding:6px 10px;">⏳ Aguardando</span>`;
            } else {
                action = `<button class="action-btn primary" style="padding:6px 14px; font-size:12px;"
                    onclick="LeagueSystem.requestJoin('${l.id}', '${l.name}')">
                    <i class="fa-solid fa-paper-plane"></i> Solicitar Entrada
                   </button>`;
            }
            return `<div class="lobby-league-row">
                <div>
                    <div style="font-weight:700; font-size:14px;">${l.name}</div>
                    <div style="font-size:11px; color:var(--text-muted);">Até ${l.max_teams} times</div>
                </div>
                ${action}
            </div>`;
        }).join('');
    },

    async requestJoin(leagueId, leagueName) {
        const { error } = await window.supabaseClient
            .from('league_members')
            .insert({ league_id: leagueId, manager_id: LeagueSystem.state.user.id, status: 'pending' });

        if (error) { LeagueSystem.toast('Erro ao solicitar. Tente novamente.', 'error'); return; }

        LeagueSystem.toast(`Solicitação enviada para "${leagueName}"!`, 'success');
        await LeagueSystem.loadMemberships();
        LeagueSystem.renderHome();
        document.getElementById('home-search-results').innerHTML = '';
        document.getElementById('home-search-input').value = '';
    },

    async approveRequest(memberId, approved) {
        const { error } = await window.supabaseClient
            .from('league_members')
            .update({ status: approved ? 'approved' : 'rejected', approved_at: approved ? new Date().toISOString() : null })
            .eq('id', memberId);
        if (!error) {
            LeagueSystem.toast(approved ? 'Manager aprovado!' : 'Solicitação recusada.', approved ? 'success' : 'error');
            if (typeof LeagueConfig !== 'undefined') LeagueConfig.loadPendingRequests?.();
        }
    },

    toast(msg, type = 'success') {
        let t = document.getElementById('ls-toast');
        if (!t) { t = document.createElement('div'); t.id = 'ls-toast'; document.body.appendChild(t); }
        t.textContent = msg;
        t.style.cssText = `position:fixed;bottom:24px;right:24px;z-index:99999;padding:12px 20px;
            border-radius:10px;font-size:13px;font-weight:700;
            background:${type==='success'?'rgba(0,255,135,0.15)':'rgba(255,71,87,0.15)'};
            color:${type==='success'?'var(--neon-green)':'var(--neon-red)'};
            border:1px solid ${type==='success'?'rgba(0,255,135,0.3)':'rgba(255,71,87,0.3)'};`;
        t.style.display = 'block';
        setTimeout(() => { if (t) t.style.display = 'none'; }, 3000);
    }
};

// Funções de tabs da home
LeagueSystem.showHomeTab = function(tab) {
    ['ligas', 'jogos', 'noticias'].forEach(t => {
        document.getElementById(`home-content-${t}`).style.display = t === tab ? '' : 'none';
        const btn = document.getElementById(`home-tab-${t}`);
        if (btn) btn.classList.toggle('active', t === tab);
    });
    if (tab === 'jogos' && typeof Jogos !== 'undefined') Jogos.load();
    if (tab === 'noticias' && typeof News !== 'undefined') News.load();

    // Exibe email do usuário
    const emailEl = document.getElementById('home-user-email');
    if (emailEl && LeagueSystem.state.user) {
        emailEl.textContent = LeagueSystem.state.user.email;
    }
};
