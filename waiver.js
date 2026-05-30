// =============================================
// ARENA FANTASY - Waiver por Leilão
// Processamento diário às 08:00
// Maior lance leva, desconta do saldo do time
// =============================================

const Waiver = {

    state: {
        bids: [],          // todos os lances pendentes
        myBids: [],        // lances do usuário logado
        currentUser: null,
        managerBudget: 1000,
        timerInterval: null,
    },

    async init(user) {
        Waiver.state.currentUser = user;
        await Waiver.loadBudget();
        await Waiver.loadBids();
        Waiver.applyMarketMode();
        Waiver.renderMyBids();
        Waiver.renderWaiverPlayers();
        Waiver.startCountdown();
        Waiver.subscribeRealtime();
    },

    // Carrega o saldo atual do manager
    async loadBudget() {
        const { data } = await window.supabaseClient
            .from('managers')
            .select('budget')
            .eq('id', Waiver.state.currentUser.id)
            .single();
        Waiver.state.managerBudget = data?.budget ?? 1000;
    },

    // Carrega lances do banco
    async loadBids() {
        const { data } = await window.supabaseClient
            .from('waiver_bids')
            .select('*, managers(team_name)')
            .eq('status', 'pending')
            .order('bid_amount', { ascending: false });
        Waiver.state.bids = data || [];
        Waiver.state.myBids = Waiver.state.bids.filter(
            b => b.manager_id === Waiver.state.currentUser.id
        );
    },

    // Verifica se jogador já foi draftado/está em algum time
    isPlayerOwned(playerId) {
        return Draft.state.picks.some(p => p.player_id === playerId);
    },

    // Retorna jogadores disponíveis para waiver (não draftados)
    getAvailablePlayers() {
        const search = document.getElementById('waiver-search')?.value?.toLowerCase() || '';
        let players = PLAYERS_DATABASE.filter(p => !Waiver.isPlayerOwned(p.id));
        if (search) players = players.filter(p => p.name.toLowerCase().includes(search));
        return players.sort((a, b) => b.projPoints - a.projPoints);
    },

    // Faz um lance no waiver
    async placeBid(player, dropPlayerId = null) {
        const bidAmountEl = document.getElementById(`bid-input-${player.id}`);
        const bidAmount = parseInt(bidAmountEl?.value || 0);

        if (bidAmount < 1) {
            Waiver.showToast('Lance mínimo: D$1', 'error'); return;
        }
        if (bidAmount > Waiver.state.managerBudget) {
            Waiver.showToast('Saldo insuficiente!', 'error'); return;
        }

        // Cancela lance anterior do mesmo jogador se existir
        await window.supabaseClient
            .from('waiver_bids')
            .delete()
            .eq('manager_id', Waiver.state.currentUser.id)
            .eq('player_id', player.id)
            .eq('status', 'pending');

        const { error } = await window.supabaseClient
            .from('waiver_bids')
            .insert({
                manager_id: Waiver.state.currentUser.id,
                player_id: player.id,
                player_name: player.name,
                player_position: player.position,
                player_club: player.club,
                drop_player_id: dropPlayerId,
                bid_amount: bidAmount,
                status: 'pending',
                process_at: Waiver.nextProcessingTime().toISOString()
            });

        if (error) { Waiver.showToast('Erro ao registrar lance.', 'error'); return; }

        await Waiver.loadBids();
        Waiver.renderMyBids();
        Waiver.renderWaiverPlayers();
        Waiver.showToast(`Lance de D$${bidAmount} registrado para ${player.name}!`, 'success');
    },

    // Cancela um lance
    async cancelBid(bidId) {
        await window.supabaseClient
            .from('waiver_bids')
            .delete()
            .eq('id', bidId)
            .eq('manager_id', Waiver.state.currentUser.id);
        await Waiver.loadBids();
        Waiver.renderMyBids();
        Waiver.renderWaiverPlayers();
        Waiver.showToast('Lance cancelado.', 'success');
    },

    // Processa o waiver (roda às 8h — chamado manualmente pelo comissário ou por timer)
    async processWaiver() {
        const pendingBids = await window.supabaseClient
            .from('waiver_bids')
            .select('*')
            .eq('status', 'pending')
            .order('bid_amount', { ascending: false });

        const bids = pendingBids.data || [];
        const processed = new Set(); // player_ids já processados

        for (const bid of bids) {
            if (processed.has(bid.player_id)) {
                // Jogador já foi para outro time — marca como perdido
                await window.supabaseClient
                    .from('waiver_bids')
                    .update({ status: 'lost' })
                    .eq('id', bid.id);
                continue;
            }

            // Verifica se manager ainda tem saldo
            const { data: mgr } = await window.supabaseClient
                .from('managers')
                .select('budget')
                .eq('id', bid.manager_id)
                .single();

            if (!mgr || mgr.budget < bid.bid_amount) {
                await window.supabaseClient
                    .from('waiver_bids')
                    .update({ status: 'lost', result_note: 'Saldo insuficiente' })
                    .eq('id', bid.id);
                continue;
            }

            // Lance vencedor — adiciona ao roster e desconta saldo
            await window.supabaseClient.from('draft_picks').insert({
                round: 0, // waiver = rodada 0
                pick_number: 9999,
                manager_id: bid.manager_id,
                player_id: bid.player_id,
                player_name: bid.player_name,
                player_position: bid.player_position,
                player_club: bid.player_club,
            });

            await window.supabaseClient
                .from('managers')
                .update({ budget: mgr.budget - bid.bid_amount })
                .eq('id', bid.manager_id);

            await window.supabaseClient
                .from('waiver_bids')
                .update({ status: 'won' })
                .eq('id', bid.id);

            processed.add(bid.player_id);
        }

        Waiver.showToast('Waiver processado!', 'success');
        await Waiver.loadBids();
        Waiver.renderMyBids();
        Waiver.renderWaiverPlayers();
    },

    // Calcula próximo processamento (8h do próximo dia)
    nextProcessingTime() {
        const now = new Date();
        const next = new Date();
        next.setHours(8, 0, 0, 0);
        if (now >= next) next.setDate(next.getDate() + 1);
        return next;
    },

    // Countdown até o próximo processamento
    startCountdown() {
        clearInterval(Waiver.state.timerInterval);
        const el = document.getElementById('waiver-timer-display');
        const badge = document.getElementById('waiver-countdown-badge');
        if (!el) return;

        Waiver.state.timerInterval = setInterval(() => {
            const diff = Waiver.nextProcessingTime() - new Date();
            const h = Math.floor(diff / 3600000);
            const m = Math.floor((diff % 3600000) / 60000);
            const s = Math.floor((diff % 60000) / 1000);
            const str = `${String(h).padStart(2,'0')}:${String(m).padStart(2,'0')}:${String(s).padStart(2,'0')}`;
            if (el) el.textContent = str;
            if (badge) badge.textContent = str;

            // Quando chegar às 8h, processa
            if (h === 0 && m === 0 && s === 0) {
                Waiver.processWaiver();
            }
        }, 1000);
    },

    // Render: meus lances pendentes
    renderMyBids() {
        const container = document.getElementById('my-waiver-bids');
        if (!container) return;
        const myBids = Waiver.state.myBids;

        if (myBids.length === 0) {
            container.innerHTML = '<p style="color:var(--text-muted); font-size:13px;">Nenhum lance realizado ainda.</p>';
            return;
        }

        container.innerHTML = myBids.map(bid => `
            <div class="waiver-bid-row">
                <div class="waiver-bid-info">
                    <span class="player-pos-badge pos-${bid.player_position.toLowerCase()}">${bid.player_position}</span>
                    <div>
                        <div style="font-size:13px; font-weight:600;">${bid.player_name}</div>
                        <div style="font-size:11px; color:var(--text-muted);">${bid.player_club}</div>
                    </div>
                </div>
                <div style="display:flex; align-items:center; gap:12px;">
                    <span style="font-size:14px; font-weight:800; color:var(--neon-green);">D$${bid.bid_amount}</span>
                    <button class="action-btn" style="padding:5px 10px; font-size:11px; border-color:rgba(255,71,87,0.3); color:var(--neon-red);"
                        onclick="Waiver.cancelBid(${bid.id})">
                        <i class="fa-solid fa-xmark"></i> Cancelar
                    </button>
                </div>
            </div>
        `).join('');
    },

    // Render: jogadores disponíveis para dar lance
    renderWaiverPlayers() {
        const container = document.getElementById('waiver-players-list');
        if (!container) return;
        const players = Waiver.getAvailablePlayers();
        const myBidMap = {};
        Waiver.state.myBids.forEach(b => { myBidMap[b.player_id] = b; });

        if (players.length === 0) {
            container.innerHTML = '<p style="color:var(--text-muted); padding:16px; text-align:center;">Nenhum jogador disponível.</p>';
            return;
        }

        container.innerHTML = players.map(p => {
            const myBid = myBidMap[p.id];
            // Maior lance atual (de qualquer manager, anônimo)
            const topBid = Waiver.state.bids.find(b => b.player_id === p.id);
            const topBidDisplay = topBid ? `<span style="font-size:11px; color:var(--text-muted);">Maior lance: D$${topBid.bid_amount}</span>` : '';

            return `<div class="waiver-player-row">
                <div class="draft-player-info">
                    <span class="player-pos-badge pos-${p.position.toLowerCase()}">${p.position}</span>
                    <div>
                        <div class="player-name-row">${p.name}</div>
                        <div class="player-meta">${p.club} · Proj: ${p.projPoints} pts</div>
                    </div>
                </div>
                <div style="display:flex; align-items:center; gap:8px; flex-wrap:wrap; justify-content:flex-end;">
                    ${topBidDisplay}
                    ${myBid
                        ? `<span style="font-size:12px; color:var(--neon-green); font-weight:700;">Seu lance: D$${myBid.bid_amount}</span>
                           <button class="action-btn" style="padding:5px 10px; font-size:11px; border-color:rgba(255,71,87,0.3); color:var(--neon-red);"
                               onclick="Waiver.cancelBid(${myBid.id})"><i class="fa-solid fa-xmark"></i></button>`
                        : `<input type="number" id="bid-input-${p.id}" min="1" max="${Waiver.state.managerBudget}"
                               placeholder="D$" style="width:64px; background:rgba(255,255,255,0.05); border:1px solid var(--border-color); border-radius:6px; color:var(--text-primary); font-family:var(--font-primary); font-size:13px; padding:5px 8px; text-align:center;">
                           <button class="action-btn primary" style="padding:6px 12px; font-size:12px;"
                               onclick="Waiver.placeBid({id:${p.id}, name:'${p.name.replace(/'/g,"\\'")}', position:'${p.position}', club:'${p.club}', projPoints:${p.projPoints}})">
                               <i class="fa-solid fa-gavel"></i> Dar Lance
                           </button>`
                    }
                </div>
            </div>`;
        }).join('');
    },

    // Mostra o painel correto conforme status do draft
    applyMarketMode() {
        const status = Draft.state.draftState?.draft_status || 'pending';
        const isFinished = Draft.state.draftState?.is_finished;
        const banner = document.getElementById('market-status-banner');
        const icon = document.getElementById('market-status-icon');
        const title = document.getElementById('market-status-title');
        const desc = document.getElementById('market-status-desc');
        const goBtn = document.getElementById('market-go-draft-btn');
        const waiverPanel = document.getElementById('waiver-panel');

        // Lista sempre visível
        document.getElementById('free-market-panel').style.display = '';

        if (isFinished) {
            // Pós-draft: mostra waiver + esconde banner
            waiverPanel.style.display = '';
            banner.style.display = 'none';
        } else if (status === 'active') {
            // Durante draft: banner amarelo + botão de ir ao draft
            waiverPanel.style.display = 'none';
            banner.style.display = 'flex';
            banner.style.background = 'rgba(0,255,135,0.06)';
            banner.style.borderColor = 'rgba(0,255,135,0.3)';
            icon.className = 'fa-solid fa-circle-dot fa-beat';
            icon.style.color = 'var(--neon-green)';
            title.textContent = 'Draft em Andamento';
            title.style.color = 'var(--neon-green)';
            desc.textContent = 'Jogadores só podem ser adquiridos pelo draft, na ordem das picks.';
            goBtn.style.display = '';
        } else {
            // Pré-draft: banner cinza, sem botão
            waiverPanel.style.display = 'none';
            banner.style.display = 'flex';
            banner.style.background = 'rgba(255,255,255,0.03)';
            banner.style.borderColor = 'rgba(255,255,255,0.08)';
            icon.className = 'fa-solid fa-lock';
            icon.style.color = 'var(--text-muted)';
            title.textContent = 'Draft não iniciado';
            title.style.color = 'var(--text-secondary)';
            desc.textContent = 'Jogadores serão adquiridos via draft. Explore o elenco disponível.';
            goBtn.style.display = 'none';
        }
    },

    subscribeRealtime() {
        window.supabaseClient
            .channel('waiver-room')
            .on('postgres_changes', { event: '*', schema: 'public', table: 'waiver_bids' }, async () => {
                await Waiver.loadBids();
                Waiver.renderMyBids();
                Waiver.renderWaiverPlayers();
            })
            .subscribe();
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

// Evento de busca no waiver
document.addEventListener('DOMContentLoaded', () => {
    document.getElementById('waiver-search')?.addEventListener('input', () => Waiver.renderWaiverPlayers());
});
