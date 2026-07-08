// =============================================
// ARENA FANTASY - Sistema de Ligas
// =============================================

const LeagueSystem = {

    state: { user: null, myLeagues: [], allLeagues: [] },

    async init(user) {
        LeagueSystem.state.user = user;
        window._currentUser = user;
        await LeagueSystem.loadAll();
        LeagueSystem.showHome();
    },

    // Carrega tudo de uma vez — ligas primeiro, depois memberships
    async loadAll() {
        const uid = LeagueSystem.state.user.id;

        // 1. Busca TODAS as ligas existentes
        const { data: allLeagues } = await window.supabaseClient
            .from('leagues').select('id, name, commissioner_id, max_teams');
        LeagueSystem.state.allLeagues = allLeagues || [];

        // 2. Busca memberships do usuário
        const { data: members, error } = await window.supabaseClient
            .from('league_members').select('id, league_id, status')
            .eq('manager_id', uid);

        console.log('members:', members, 'error:', error);

        // 3. Combina: para cada membership, encontra a liga pelo ID
        LeagueSystem.state.myLeagues = (members || []).map(m => {
            const league = (allLeagues || []).find(l => l.id === m.league_id);
            return { ...m, league };
        }).filter(m => m.league); // só inclui memberships com liga válida
    },

    showHome() {
        document.getElementById('league-home').style.display = 'flex';
        document.getElementById('app-container-wrapper').style.display = 'none';
        LeagueSystem.renderHome();
    },

    enterLeague(league) {
        window._currentLeague = league;
        window._currentUser = LeagueSystem.state.user;

        document.getElementById('league-home').style.display = 'none';
        document.getElementById('app-container-wrapper').style.display = 'grid';

        const user = LeagueSystem.state.user;

        setTimeout(async () => {
            // Carrega estado do draft PRIMEIRO — outros módulos dependem dele
            if (typeof Draft !== 'undefined') {
                await Draft.init(user);
                window._draftState = Draft.state.draftState; // expõe globalmente
            }
            if (typeof initApp === 'function') initApp(user);
            if (typeof Dashboard !== 'undefined') Dashboard.init(user);
        }, 50);
    },

    leaveLeague() {
        window._currentLeague = null;
        document.getElementById('app-container-wrapper').style.display = 'none';
        LeagueSystem.showHome();
    },

    renderHome() {
        const emailEl = document.getElementById('home-user-email');
        if (emailEl) emailEl.textContent = LeagueSystem.state.user?.email || '';

        const approved = LeagueSystem.state.myLeagues.filter(m => m.status === 'approved');
        const pending  = LeagueSystem.state.myLeagues.filter(m => m.status === 'pending');

        // --- Minhas ligas ---
        const leaguesEl = document.getElementById('home-my-leagues');
        if (leaguesEl) {
            leaguesEl.innerHTML = approved.length === 0
                ? `<p style="color:var(--text-muted); font-size:13px;">Você ainda não participa de nenhuma liga. Busque uma abaixo.</p>`
                : approved.map(m => `
                    <div class="league-card" onclick='LeagueSystem.enterLeague(${JSON.stringify(m.league)})'>
                        <div class="league-card-icon"><i class="fa-solid fa-trophy"></i></div>
                        <div class="league-card-info">
                            <div class="league-card-name">${m.league.name}</div>
                            <div class="league-card-meta">Até ${m.league.max_teams || 16} times</div>
                        </div>
                        <div class="league-card-enter">Entrar <i class="fa-solid fa-arrow-right"></i></div>
                    </div>`).join('');
        }

        // --- Pendentes ---
        const pendingEl = document.getElementById('home-pending');
        if (pendingEl) {
            pendingEl.style.display = pending.length ? '' : 'none';
            pendingEl.innerHTML = pending.length ? `
                <div style="margin-bottom:8px;font-size:11px;font-weight:700;color:var(--text-muted);text-transform:uppercase;letter-spacing:0.5px;">Aguardando aprovação</div>
                ${pending.map(m => `
                <div style="display:flex;align-items:center;gap:10px;padding:8px 12px;
                    background:rgba(255,159,67,0.06);border:1px solid rgba(255,159,67,0.2);
                    border-radius:8px;margin-bottom:6px;font-size:13px;">
                    <i class="fa-solid fa-clock" style="color:var(--neon-orange);"></i>
                    <span>Solicitação para <strong>${m.league.name}</strong> em análise.</span>
                </div>`).join('')}` : '';
        }

        // --- Botão de criar liga ---
        const createEl = document.getElementById('home-create-league');
        if (!createEl && leaguesEl) {
            const btn = document.createElement('button');
            btn.id = 'home-create-league';
            btn.className = 'action-btn';
            btn.style.cssText = 'margin-top:12px; width:100%; justify-content:center; border-style:dashed;';
            btn.innerHTML = '<i class="fa-solid fa-plus"></i> Criar Nova Liga';
            btn.onclick = () => LeagueSystem.createLeague();
            leaguesEl.parentElement.appendChild(btn);
        }

        // --- Busca (mostra ligas que não é membro aprovado) ---
        LeagueSystem.renderAvailableLeagues();
    },

    // Cria uma liga nova com o usuário atual como comissário
    async createLeague() {
        const name = prompt('Nome da nova liga:');
        if (!name || !name.trim()) return;
        let maxTeams = parseInt(prompt('Número máximo de times (2 a 16):', '12'));
        if (!maxTeams || maxTeams < 2) maxTeams = 12;
        if (maxTeams > 16) maxTeams = 16;

        const uid = LeagueSystem.state.user.id;

        const { data: league, error } = await window.supabaseClient
            .from('leagues')
            .insert({ name: name.trim(), commissioner_id: uid, max_teams: maxTeams })
            .select()
            .single();

        if (error || !league) {
            console.error('createLeague error:', error);
            LeagueSystem.toast('Erro ao criar a liga. Veja o console (F12).', 'error');
            return;
        }

        // Criador entra como membro aprovado automaticamente
        await window.supabaseClient.from('league_members').insert({
            league_id: league.id,
            manager_id: uid,
            status: 'approved',
            approved_at: new Date().toISOString()
        });

        LeagueSystem.toast(`Liga "${league.name}" criada! Você é o comissário.`, 'success');
        await LeagueSystem.loadAll();
        LeagueSystem.renderHome();
    },

    renderAvailableLeagues(filter = '') {
        const resultEl = document.getElementById('home-search-results');
        if (!resultEl) return;

        const approvedIds = LeagueSystem.state.myLeagues
            .filter(m => m.status === 'approved').map(m => m.league_id);
        const pendingIds = LeagueSystem.state.myLeagues
            .filter(m => m.status === 'pending').map(m => m.league_id);

        let available = LeagueSystem.state.allLeagues
            .filter(l => !approvedIds.includes(l.id));

        if (filter) available = available.filter(l =>
            l.name.toLowerCase().includes(filter.toLowerCase()));

        if (!available.length) {
            resultEl.innerHTML = `<p style="color:var(--text-muted);font-size:13px;padding:8px 0;">
                ${approvedIds.length ? 'Você já é membro de todas as ligas disponíveis.' : 'Nenhuma liga encontrada.'}</p>`;
            return;
        }

        resultEl.innerHTML = available.map(l => {
            const isPending = pendingIds.includes(l.id);
            return `<div class="lobby-league-row">
                <div>
                    <div style="font-weight:700;font-size:14px;">${l.name}</div>
                    <div style="font-size:11px;color:var(--text-muted);">Até ${l.max_teams || 16} times</div>
                </div>
                ${isPending
                    ? `<span style="font-size:12px;color:var(--neon-orange);padding:6px 10px;">⏳ Aguardando</span>`
                    : `<button class="action-btn primary" style="padding:6px 14px;font-size:12px;"
                        onclick="LeagueSystem.requestJoin('${l.id}','${l.name}')">
                        <i class="fa-solid fa-paper-plane"></i> Solicitar
                       </button>`}
            </div>`;
        }).join('');
    },

    searchLeagues() {
        const q = document.getElementById('home-search-input')?.value || '';
        LeagueSystem.renderAvailableLeagues(q);
    },

    async requestJoin(leagueId, leagueName) {
        const { error } = await window.supabaseClient
            .from('league_members')
            .insert({ league_id: leagueId, manager_id: LeagueSystem.state.user.id, status: 'pending' });

        if (error) { LeagueSystem.toast('Erro ao solicitar.', 'error'); return; }
        LeagueSystem.toast(`Solicitação enviada para "${leagueName}"!`, 'success');
        await LeagueSystem.loadAll();
        LeagueSystem.renderHome();
    },

    async approveRequest(memberId, approved) {
        await window.supabaseClient.from('league_members')
            .update({ status: approved ? 'approved' : 'rejected', approved_at: approved ? new Date().toISOString() : null })
            .eq('id', memberId);
        LeagueSystem.toast(approved ? 'Manager aprovado!' : 'Recusado.', approved ? 'success' : 'error');
        if (typeof LeagueConfig !== 'undefined') LeagueConfig.loadPendingRequests?.();
    },

    toast(msg, type = 'success') {
        let t = document.getElementById('ls-toast');
        if (!t) { t = document.createElement('div'); t.id = 'ls-toast'; document.body.appendChild(t); }
        t.textContent = msg;
        t.style.cssText = `position:fixed;bottom:24px;right:24px;z-index:99999;padding:12px 20px;
            border-radius:10px;font-size:13px;font-weight:700;display:block;
            background:${type==='success'?'rgba(0,255,135,0.15)':'rgba(255,71,87,0.15)'};
            color:${type==='success'?'var(--neon-green)':'var(--neon-red)'};
            border:1px solid ${type==='success'?'rgba(0,255,135,0.3)':'rgba(255,71,87,0.3)'};`;
        setTimeout(() => { if(t) t.style.display='none'; }, 3000);
    }
};

LeagueSystem.showHomeTab = function(tab) {
    ['ligas','jogos','noticias'].forEach(t => {
        const el = document.getElementById(`home-content-${t}`);
        const btn = document.getElementById(`home-tab-${t}`);
        if (el) el.style.display = t === tab ? '' : 'none';
        if (btn) btn.classList.toggle('active', t === tab);
    });
    if (tab === 'jogos' && typeof Jogos !== 'undefined') Jogos.load();
    if (tab === 'noticias' && typeof News !== 'undefined') News.load();
};
