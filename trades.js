// =============================================
// ARENA FANTASY - Trocas
// Pós-draft: managers propõem trocas entre si
// Suporta envio de D$ junto com jogadores
// =============================================

const Trades = {
    state: {
        currentUser: null,
        managers: [],
        myPicks: [],
        theirPicks: [],
        offerIds: [],
        requestIds: [],
        offerMoney: 0,
        requestMoney: 0,
        myBudget: 0,
    },

    async init(user) {
        Trades.state.currentUser = user;
        const draftFinished = Draft.state.draftState?.is_finished;
        document.getElementById('trades-blocked').style.display = draftFinished ? 'none' : '';
        document.getElementById('trades-active').style.display = draftFinished ? '' : 'none';
        if (!draftFinished) return;

        await Trades.loadManagers();
        await Trades.loadMyPicks();
        await Trades.loadBudget();
        Trades.renderManagerSelect();
        Trades.renderMyPlayers();
        Trades.loadTradesReceived();
        Trades.loadTradesSent();
        Trades.subscribeRealtime();
    },

    leagueId() { return window.currentLeagueId?.() || window._currentLeague?.id || null; },

    async loadManagers() {
        const lid = Trades.leagueId();
        let ids = null;
        if (lid) {
            const { data: members } = await window.supabaseClient
                .from('league_members').select('manager_id')
                .eq('league_id', lid).eq('status', 'approved');
            ids = (members || []).map(m => m.manager_id);
        }
        let q = window.supabaseClient
            .from('managers').select('id, team_name')
            .neq('id', Trades.state.currentUser.id).order('team_name');
        if (ids?.length) q = q.in('id', ids);
        const { data } = await q;
        // Bots não negociam trocas
        const BOT_PREFIX = '00000000-0000-0000-0000-';
        Trades.state.managers = (data || []).filter(m => !m.id.startsWith(BOT_PREFIX));
    },

    async loadMyPicks() {
        let q = window.supabaseClient
            .from('draft_picks').select('*').eq('manager_id', Trades.state.currentUser.id);
        const lid = Trades.leagueId();
        if (lid) q = q.eq('league_id', lid);
        const { data } = await q;
        Trades.state.myPicks = data || [];
    },

    async loadBudget() {
        const { data } = await window.supabaseClient
            .from('managers').select('budget').eq('id', Trades.state.currentUser.id).single();
        Trades.state.myBudget = data?.budget ?? 0;
        const el = document.getElementById('trade-my-budget');
        if (el) el.textContent = `D$${Trades.state.myBudget}`;
    },

    async loadTheirPicks(managerId) {
        let q = window.supabaseClient
            .from('draft_picks').select('*').eq('manager_id', managerId);
        const lid = Trades.leagueId();
        if (lid) q = q.eq('league_id', lid);
        const { data } = await q;
        Trades.state.theirPicks = data || [];
    },

    renderManagerSelect() {
        const sel = document.getElementById('trade-target-manager');
        if (!sel) return;
        sel.innerHTML = '<option value="">Selecione um manager...</option>' +
            Trades.state.managers.map(m => `<option value="${m.id}">${m.team_name}</option>`).join('');
        sel.onchange = async () => {
            Trades.state.requestIds = [];
            Trades.state.requestMoney = 0;
            if (!sel.value) { document.getElementById('trade-their-players-section').style.display = 'none'; return; }
            await Trades.loadTheirPicks(sel.value);
            Trades.renderTheirPlayers();
            document.getElementById('trade-their-players-section').style.display = '';
            Trades.renderOfferSummary();
        };
    },

    renderMyPlayers() {
        const container = document.getElementById('trade-my-players');
        if (!container) return;
        container.innerHTML = Trades.state.myPicks.length
            ? Trades.state.myPicks.map(p => {
                const sel = Trades.state.offerIds.includes(p.player_id);
                return `<div class="trade-player-row ${sel ? 'selected' : ''}" onclick="Trades.toggleOffer(${p.player_id})">
                    <span class="player-pos-badge pos-${p.player_position.toLowerCase()}">${p.player_position}</span>
                    <span style="font-size:13px;flex:1;">${p.player_name}</span>
                    <span style="font-size:11px;color:var(--text-muted);">${p.player_club}</span>
                    ${sel ? '<i class="fa-solid fa-check" style="color:var(--neon-green);margin-left:6px;"></i>' : ''}
                </div>`;
            }).join('')
            : '<p style="color:var(--text-muted);font-size:13px;">Nenhum jogador no elenco.</p>';
    },

    renderTheirPlayers() {
        const container = document.getElementById('trade-their-players');
        if (!container) return;
        container.innerHTML = Trades.state.theirPicks.length
            ? Trades.state.theirPicks.map(p => {
                const sel = Trades.state.requestIds.includes(p.player_id);
                return `<div class="trade-player-row ${sel ? 'selected-blue' : ''}" onclick="Trades.toggleRequest(${p.player_id})">
                    <span class="player-pos-badge pos-${p.player_position.toLowerCase()}">${p.player_position}</span>
                    <span style="font-size:13px;flex:1;">${p.player_name}</span>
                    <span style="font-size:11px;color:var(--text-muted);">${p.player_club}</span>
                    ${sel ? '<i class="fa-solid fa-check" style="color:var(--neon-blue);margin-left:6px;"></i>' : ''}
                </div>`;
            }).join('')
            : '<p style="color:var(--text-muted);font-size:13px;">Elenco vazio.</p>';
    },

    toggleOffer(id) {
        const i = Trades.state.offerIds.indexOf(id);
        if (i === -1) Trades.state.offerIds.push(id); else Trades.state.offerIds.splice(i, 1);
        Trades.renderMyPlayers(); Trades.renderOfferSummary();
    },

    toggleRequest(id) {
        const i = Trades.state.requestIds.indexOf(id);
        if (i === -1) Trades.state.requestIds.push(id); else Trades.state.requestIds.splice(i, 1);
        Trades.renderTheirPlayers(); Trades.renderOfferSummary();
    },

    renderOfferSummary() {
        const offerEl = document.getElementById('trade-offer-list');
        const receiveEl = document.getElementById('trade-receive-list');
        const offering = Trades.state.myPicks.filter(p => Trades.state.offerIds.includes(p.player_id));
        const requesting = Trades.state.theirPicks.filter(p => Trades.state.requestIds.includes(p.player_id));
        const offerMoney = parseInt(document.getElementById('trade-offer-money')?.value || 0);
        const requestMoney = parseInt(document.getElementById('trade-request-money')?.value || 0);

        const moneyBadge = (val, color) => val > 0
            ? `<div style="padding:4px 0;font-size:12px;color:${color};font-weight:700;"><i class="fa-solid fa-coins"></i> D$${val}</div>` : '';

        offerEl.innerHTML = offering.length || offerMoney > 0
            ? offering.map(p => `<div style="padding:3px 0;border-bottom:1px solid rgba(255,255,255,0.06);font-size:12px;">
                <span class="player-pos-badge pos-${p.player_position.toLowerCase()}" style="font-size:9px;">${p.player_position}</span> ${p.player_name}</div>`).join('')
              + moneyBadge(offerMoney, 'var(--neon-green)')
            : '<span style="color:var(--text-muted);font-size:12px;">Selecione jogadores ou adicione D$</span>';

        receiveEl.innerHTML = requesting.length || requestMoney > 0
            ? requesting.map(p => `<div style="padding:3px 0;border-bottom:1px solid rgba(255,255,255,0.06);font-size:12px;">
                <span class="player-pos-badge pos-${p.player_position.toLowerCase()}" style="font-size:9px;">${p.player_position}</span> ${p.player_name}</div>`).join('')
              + moneyBadge(requestMoney, 'var(--neon-blue)')
            : '<span style="color:var(--text-muted);font-size:12px;">Selecione jogadores ou peça D$</span>';
    },

    async sendTrade() {
        const targetId = document.getElementById('trade-target-manager')?.value;
        if (!targetId) { Trades.showToast('Selecione um manager.', 'error'); return; }
        const offerMoney = parseInt(document.getElementById('trade-offer-money')?.value || 0);
        const requestMoney = parseInt(document.getElementById('trade-request-money')?.value || 0);
        if (!Trades.state.offerIds.length && offerMoney === 0) {
            Trades.showToast('Adicione ao menos 1 jogador ou D$ para oferecer.', 'error'); return;
        }
        if (!Trades.state.requestIds.length && requestMoney === 0) {
            Trades.showToast('Adicione ao menos 1 jogador ou peça D$.', 'error'); return;
        }
        if (offerMoney > Trades.state.myBudget) {
            Trades.showToast('D$ insuficiente para essa oferta.', 'error'); return;
        }

        const offerPlayers = Trades.state.myPicks.filter(p => Trades.state.offerIds.includes(p.player_id))
            .map(p => ({ id: p.player_id, name: p.player_name, pos: p.player_position, club: p.player_club }));
        const requestPlayers = Trades.state.theirPicks.filter(p => Trades.state.requestIds.includes(p.player_id))
            .map(p => ({ id: p.player_id, name: p.player_name, pos: p.player_position, club: p.player_club }));

        const { error } = await window.supabaseClient.from('trades').insert({
            league_id: Trades.leagueId(),
            proposer_id: Trades.state.currentUser.id,
            receiver_id: targetId,
            offer_players: offerPlayers,
            request_players: requestPlayers,
            offer_money: offerMoney,
            request_money: requestMoney,
            status: 'pending'
        });

        if (error) { Trades.showToast('Erro ao enviar proposta.', 'error'); return; }

        // Limpa estado
        Trades.state.offerIds = []; Trades.state.requestIds = [];
        document.getElementById('trade-offer-money').value = 0;
        document.getElementById('trade-request-money').value = 0;
        Trades.renderMyPlayers(); Trades.renderOfferSummary();
        Trades.loadTradesSent();
        Trades.showToast('Proposta enviada!', 'success');
    },

    async acceptTrade(tradeId) {
        const { data: trade } = await window.supabaseClient.from('trades').select('*').eq('id', tradeId).single();
        if (!trade) return;

        // Transfere jogadores
        for (const p of (trade.offer_players || [])) {
            await window.supabaseClient.from('draft_picks')
                .update({ manager_id: trade.receiver_id })
                .eq('player_id', p.id).eq('manager_id', trade.proposer_id);
        }
        for (const p of (trade.request_players || [])) {
            await window.supabaseClient.from('draft_picks')
                .update({ manager_id: trade.proposer_id })
                .eq('player_id', p.id).eq('manager_id', trade.receiver_id);
        }

        // Transfere D$ — busca saldos uma única vez e aplica tudo
        const offerMoney = trade.offer_money || 0;   // proposer paga, receiver recebe
        const requestMoney = trade.request_money || 0; // receiver paga, proposer recebe

        if (offerMoney > 0 || requestMoney > 0) {
            const { data: proposer } = await window.supabaseClient.from('managers').select('budget').eq('id', trade.proposer_id).single();
            const { data: receiver } = await window.supabaseClient.from('managers').select('budget').eq('id', trade.receiver_id).single();

            const proposerBudget = proposer?.budget || 0;
            const receiverBudget = receiver?.budget || 0;

            // proposer: paga offerMoney, recebe requestMoney
            const newProposerBudget = proposerBudget - offerMoney + requestMoney;
            // receiver: recebe offerMoney, paga requestMoney
            const newReceiverBudget = receiverBudget + offerMoney - requestMoney;

            await window.supabaseClient.from('managers').update({ budget: newProposerBudget }).eq('id', trade.proposer_id);
            await window.supabaseClient.from('managers').update({ budget: newReceiverBudget }).eq('id', trade.receiver_id);

            // Atualiza saldo local se sou o proposer ou receiver
            const myId = window._currentUser?.id;
            if (myId === trade.proposer_id) { userBudget = newProposerBudget; }
            if (myId === trade.receiver_id) { userBudget = newReceiverBudget; }
            const el = document.getElementById('header-budget-badge');
            if (el) el.textContent = `D$${userBudget}`;
        }

        await window.supabaseClient.from('trades').update({ status: 'accepted' }).eq('id', tradeId);

        // Mensagem no chat
        const offerNames = (trade.offer_players || []).map(p => p.name).join(', ');
        const requestNames = (trade.request_players || []).map(p => p.name).join(', ');
        const moneyPart = offerMoney > 0 ? ` + D$${offerMoney}` : requestMoney > 0 ? ` (+ D$${requestMoney})` : '';
        if (window._currentUser) {
            await window.supabaseClient.from('chat_messages').insert({
                league_id: Trades.leagueId(),
                manager_id: window._currentUser.id,
                team_name: '🔄 Troca',
                avatar_color: '#00ff87',
                message: `Troca concluída! ${offerNames || 'D$'}${moneyPart} ↔ ${requestNames || 'D$'}`
            });
        }

        Trades.loadTradesReceived();
        Trades.loadMyPicks();
        if (typeof loadMyDraftedPlayers === 'function') loadMyDraftedPlayers();
        Trades.showToast('Troca aceita!', 'success');
    },

    async rejectTrade(tradeId) {
        await window.supabaseClient.from('trades').update({ status: 'rejected' }).eq('id', tradeId);
        Trades.loadTradesReceived();
        Trades.showToast('Proposta recusada.', 'success');
    },

    async cancelTrade(tradeId) {
        await window.supabaseClient.from('trades').update({ status: 'cancelled' }).eq('id', tradeId);
        Trades.loadTradesSent();
        Trades.showToast('Proposta cancelada.', 'success');
    },

    async loadTradesReceived() {
        const { data } = await window.supabaseClient.from('trades')
            .select('*, proposer:proposer_id(team_name)').eq('receiver_id', Trades.state.currentUser.id)
            .eq('status', 'pending').order('created_at', { ascending: false });
        const container = document.getElementById('trades-received');
        if (!container) return;
        if (!data?.length) { container.innerHTML = '<p style="color:var(--text-muted);font-size:13px;">Nenhuma proposta recebida.</p>'; return; }
        container.innerHTML = data.map(t => `
            <div class="trade-card">
                <div style="font-size:12px;color:var(--text-muted);margin-bottom:8px;">
                    De: <strong style="color:var(--neon-blue);">${t.proposer?.team_name || '—'}</strong>
                </div>
                <div style="display:grid;grid-template-columns:1fr 1fr;gap:8px;margin-bottom:10px;font-size:12px;">
                    <div>
                        <div style="font-size:10px;color:var(--neon-green);font-weight:700;margin-bottom:4px;">VOCÊ RECEBE</div>
                        ${t.offer_players.map(p => `<div style="padding:2px 0;"><span class="player-pos-badge pos-${p.pos.toLowerCase()}" style="font-size:9px;">${p.pos}</span> ${p.name}</div>`).join('')}
                        ${t.offer_money > 0 ? `<div style="color:var(--neon-green);font-weight:700;margin-top:4px;"><i class="fa-solid fa-coins"></i> D$${t.offer_money}</div>` : ''}
                    </div>
                    <div>
                        <div style="font-size:10px;color:var(--neon-red);font-weight:700;margin-bottom:4px;">VOCÊ ENTREGA</div>
                        ${t.request_players.map(p => `<div style="padding:2px 0;"><span class="player-pos-badge pos-${p.pos.toLowerCase()}" style="font-size:9px;">${p.pos}</span> ${p.name}</div>`).join('')}
                        ${t.request_money > 0 ? `<div style="color:var(--neon-red);font-weight:700;margin-top:4px;"><i class="fa-solid fa-coins"></i> D$${t.request_money}</div>` : ''}
                    </div>
                </div>
                <div style="display:flex;gap:8px;">
                    <button class="action-btn primary" style="padding:6px 14px;font-size:12px;" onclick="Trades.acceptTrade(${t.id})">
                        <i class="fa-solid fa-check"></i> Aceitar
                    </button>
                    <button class="action-btn" style="padding:6px 14px;font-size:12px;border-color:rgba(255,71,87,0.3);color:var(--neon-red);" onclick="Trades.rejectTrade(${t.id})">
                        <i class="fa-solid fa-xmark"></i> Recusar
                    </button>
                </div>
            </div>`).join('');
    },

    async loadTradesSent() {
        const { data } = await window.supabaseClient.from('trades')
            .select('*, receiver:receiver_id(team_name)').eq('proposer_id', Trades.state.currentUser.id)
            .order('created_at', { ascending: false }).limit(10);
        const container = document.getElementById('trades-sent');
        if (!container) return;
        if (!data?.length) { container.innerHTML = '<p style="color:var(--text-muted);font-size:13px;">Nenhuma proposta enviada.</p>'; return; }
        const label = { pending: '⏳ Aguardando', accepted: '✅ Aceita', rejected: '❌ Recusada', cancelled: '🚫 Cancelada' };
        container.innerHTML = data.map(t => `
            <div class="trade-card">
                <div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:6px;">
                    <span style="font-size:12px;color:var(--text-muted);">Para: <strong style="color:var(--neon-blue);">${t.receiver?.team_name || '—'}</strong></span>
                    <span style="font-size:11px;font-weight:600;">${label[t.status] || t.status}</span>
                </div>
                <div style="font-size:11px;color:var(--text-muted);">
                    Ofereceu: ${[...t.offer_players.map(p=>p.name), ...(t.offer_money > 0 ? [`D$${t.offer_money}`] : [])].join(', ')}
                    → Pediu: ${[...t.request_players.map(p=>p.name), ...(t.request_money > 0 ? [`D$${t.request_money}`] : [])].join(', ')}
                </div>
                ${t.status === 'pending' ? `<button class="action-btn" style="margin-top:8px;padding:5px 12px;font-size:11px;border-color:rgba(255,71,87,0.3);color:var(--neon-red);" onclick="Trades.cancelTrade(${t.id})">Cancelar</button>` : ''}
            </div>`).join('');
    },

    subscribeRealtime() {
        window.supabaseClient.channel('trades-room')
            .on('postgres_changes', { event: '*', schema: 'public', table: 'trades' }, () => {
                Trades.loadTradesReceived(); Trades.loadTradesSent();
            }).subscribe();
    },

    showToast(msg, type='success') {
        let t = document.getElementById('league-toast');
        if (!t) { t = document.createElement('div'); t.id = 'league-toast'; document.body.appendChild(t); }
        t.textContent = msg; t.className = `league-toast league-toast-${type}`; t.style.display = 'block';
        setTimeout(() => { t.style.display = 'none'; }, 3000);
    }
};

document.addEventListener('DOMContentLoaded', () => {
    document.getElementById('send-trade-btn')?.addEventListener('click', Trades.sendTrade);
    document.getElementById('trade-offer-money')?.addEventListener('input', Trades.renderOfferSummary);
    document.getElementById('trade-request-money')?.addEventListener('input', Trades.renderOfferSummary);
});
