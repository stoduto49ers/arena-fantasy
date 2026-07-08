// =============================================
// ARENA FANTASY - Waiver por Leilão (v2)
// - Processamento OFICIAL: Vercel Cron às 08:00 (api/process-waiver.js)
// - O cliente NUNCA processa automaticamente (só exibe countdown)
// - Comissário tem botão de processamento manual como fallback
// - Lances gravados com league_id
// =============================================

const Waiver = {

    state: {
        bids: [],
        myBids: [],
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

    leagueId() { return window.currentLeagueId?.() || window._currentLeague?.id || null; },

    isCommissioner() {
        const uid = Waiver.state.currentUser?.id;
        return uid && (
            window._currentLeague?.commissioner_id === uid
            || (typeof Draft !== 'undefined' && Draft.isCommissioner?.())
        );
    },

    async loadBudget() {
        const { data } = await window.supabaseClient
            .from('managers').select('budget')
            .eq('id', Waiver.state.currentUser.id).single();
        Waiver.state.managerBudget = data?.budget ?? 1000;
    },

    async loadBids() {
        let q = window.supabaseClient
            .from('waiver_bids')
            .select('*, managers(team_name)')
            .eq('status', 'pending')
            .order('bid_amount', { ascending: false });
        const lid = Waiver.leagueId();
        if (lid) q = q.eq('league_id', lid);
        const { data } = await q;
        Waiver.state.bids = data || [];
        Waiver.state.myBids = Waiver.state.bids.filter(
            b => b.manager_id === Waiver.state.currentUser.id
        );
    },

    isPlayerOwned(playerId) {
        return (Draft.state.picks || []).some(p => p.player_id === playerId);
    },

    getAvailablePlayers() {
        const search = document.getElementById('waiver-search')?.value?.toLowerCase() || '';
        let list = PLAYERS_DATABASE.filter(p => !Waiver.isPlayerOwned(p.id));
        if (search) list = list.filter(p => p.name.toLowerCase().includes(search));
        return list.sort((a, b) => ((b.totalPoints||0) || b.projPoints) - ((a.totalPoints||0) || a.projPoints));
    },

    // Abre modal para escolher jogador a dropar
    async openDropModal(player) {
        const bidEl = document.getElementById(`bid-input-${player.id}`);
        const bidAmount = parseInt(bidEl?.value || 0);
        if (bidAmount < 1) { Waiver.showToast('Digite o valor do lance primeiro.', 'error'); return; }
        if (bidAmount > Waiver.state.managerBudget) { Waiver.showToast('Saldo insuficiente!', 'error'); return; }

        let q = window.supabaseClient
            .from('draft_picks').select('*').eq('manager_id', Waiver.state.currentUser.id);
        const lid = Waiver.leagueId();
        if (lid) q = q.eq('league_id', lid);
        const { data: myPicks } = await q;

        const playerList = (myPicks || []).map(pk => {
            const p = PLAYERS_DATABASE.find(x => x.id === pk.player_id);
            return p ? { ...p, pickId: pk.id } : null;
        }).filter(Boolean).sort((a,b) => a.position.localeCompare(b.position));

        if (!playerList.length) { Waiver.showToast('Você não tem jogadores no elenco para soltar.', 'error'); return; }

        let modal = document.getElementById('waiver-drop-modal');
        if (!modal) {
            modal = document.createElement('div');
            modal.id = 'waiver-drop-modal';
            modal.style.cssText = 'position:fixed;inset:0;background:rgba(0,0,0,0.7);z-index:99999;display:flex;align-items:center;justify-content:center;padding:20px;';
            document.body.appendChild(modal);
        }

        modal.innerHTML = `
            <div style="background:var(--bg-card);border:1px solid var(--border-color);border-radius:var(--border-radius-md);padding:24px;max-width:480px;width:100%;max-height:80vh;overflow-y:auto;">
                <h3 style="margin-bottom:4px;"><i class="fa-solid fa-gavel" style="color:var(--neon-orange);"></i> Confirmar Lance</h3>
                <p style="font-size:13px;color:var(--text-muted);margin-bottom:16px;">
                    Você vai dar <strong style="color:var(--neon-green);">D$${bidAmount}</strong> por
                    <strong>${player.name}</strong> (${player.position}).
                    Escolha qual jogador soltar do seu elenco:
                </p>
                <div style="display:flex;flex-direction:column;gap:6px;margin-bottom:16px;">
                    ${playerList.map(p => `
                        <label style="display:flex;align-items:center;gap:10px;padding:8px 12px;border:1px solid var(--border-color);border-radius:8px;cursor:pointer;background:rgba(255,255,255,0.02);"
                               onmouseover="this.style.borderColor='var(--neon-blue)'" onmouseout="this.style.borderColor='var(--border-color)'">
                            <input type="radio" name="drop-player" value="${p.id}" style="accent-color:var(--neon-blue);">
                            <span class="player-pos-badge pos-${p.position.toLowerCase()}">${p.position}</span>
                            <span style="font-size:13px;font-weight:600;">${p.name}</span>
                            <span style="font-size:11px;color:var(--text-muted);margin-left:auto;">${p.club}</span>
                        </label>`).join('')}
                </div>
                <div style="display:flex;gap:8px;">
                    <button class="action-btn primary" style="flex:1;" onclick="Waiver.confirmBidWithDrop(${JSON.stringify(player).replace(/"/g,'&quot;')}, ${bidAmount})">
                        <i class="fa-solid fa-check"></i> Confirmar Lance
                    </button>
                    <button class="action-btn" onclick="document.getElementById('waiver-drop-modal').style.display='none'">
                        Cancelar
                    </button>
                </div>
            </div>`;
        modal.style.display = 'flex';
    },

    async confirmBidWithDrop(player, bidAmount) {
        const selected = document.querySelector('input[name="drop-player"]:checked');
        if (!selected) { Waiver.showToast('Selecione um jogador para soltar.', 'error'); return; }

        const dropPlayerId = parseInt(selected.value);
        document.getElementById('waiver-drop-modal').style.display = 'none';

        // Remove lance anterior do mesmo jogador
        await window.supabaseClient.from('waiver_bids').delete()
            .eq('manager_id', Waiver.state.currentUser.id)
            .eq('player_id', player.id).eq('status', 'pending');

        const { error } = await window.supabaseClient.from('waiver_bids').insert({
            league_id: Waiver.leagueId(),
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

    async cancelBid(bidId) {
        await window.supabaseClient
            .from('waiver_bids').delete()
            .eq('id', bidId)
            .eq('manager_id', Waiver.state.currentUser.id);
        await Waiver.loadBids();
        Waiver.renderMyBids();
        Waiver.renderWaiverPlayers();
        Waiver.showToast('Lance cancelado.', 'success');
    },

    // =========================================
    // PROCESSAMENTO MANUAL (fallback do comissário)
    // O processamento oficial roda no Vercel Cron às 08:00.
    // Este botão existe só para emergências.
    // =========================================
    async processWaiverManual() {
        if (!Waiver.isCommissioner()) {
            Waiver.showToast('Apenas o comissário pode processar manualmente.', 'error');
            return;
        }
        if (!confirm('Processar o waiver AGORA?\nNormalmente isso acontece automaticamente às 08:00. Use apenas se o processamento automático falhou.')) return;

        let q = window.supabaseClient
            .from('waiver_bids').select('*')
            .eq('status', 'pending')
            .order('bid_amount', { ascending: false });
        const lid = Waiver.leagueId();
        if (lid) q = q.eq('league_id', lid);
        const { data: bids } = await q;

        const processed = new Set();
        const transactions = [];

        for (const bid of (bids || [])) {
            if (processed.has(bid.player_id)) {
                await window.supabaseClient.from('waiver_bids').update({ status: 'lost' }).eq('id', bid.id);
                continue;
            }

            const { data: mgr } = await window.supabaseClient
                .from('managers').select('budget, team_name').eq('id', bid.manager_id).single();

            if (!mgr || mgr.budget < bid.bid_amount) {
                await window.supabaseClient.from('waiver_bids')
                    .update({ status: 'lost', result_note: 'Saldo insuficiente' }).eq('id', bid.id);
                continue;
            }

            await window.supabaseClient.from('draft_picks').insert({
                league_id: bid.league_id || lid,
                round: 0, pick_number: 9999,
                manager_id: bid.manager_id,
                player_id: bid.player_id,
                player_name: bid.player_name,
                player_position: bid.player_position,
                player_club: bid.player_club,
            });

            if (bid.drop_player_id) {
                await window.supabaseClient.from('draft_picks').delete()
                    .eq('manager_id', bid.manager_id)
                    .eq('player_id', bid.drop_player_id);
            }

            await window.supabaseClient.from('managers')
                .update({ budget: mgr.budget - bid.bid_amount }).eq('id', bid.manager_id);
            await window.supabaseClient.from('waiver_bids')
                .update({ status: 'won' }).eq('id', bid.id);

            processed.add(bid.player_id);
            transactions.push({
                team: mgr.team_name || bid.manager_id,
                player: bid.player_name, pos: bid.player_position,
                value: bid.bid_amount,
                dropped: bid.drop_player_id
                    ? PLAYERS_DATABASE.find(p => p.id === bid.drop_player_id)?.name || `#${bid.drop_player_id}`
                    : null
            });
        }

        const lines = transactions.length
            ? transactions.map(t => `• ${t.team}: +${t.player} (${t.pos}) D$${t.value}${t.dropped ? ` | -${t.dropped}` : ''}`).join('\n')
            : null;

        await window.supabaseClient.from('chat_messages').insert({
            league_id: lid,
            manager_id: Waiver.state.currentUser.id,
            team_name: '🔨 Resumo do Mercado',
            avatar_color: '#ff9f43',
            message: lines
                ? `Waiver processado (manual)!\n${lines}`
                : 'Waiver processado (manual): nenhuma transação realizada.'
        });

        Waiver.showToast('Waiver processado!', 'success');
        await Waiver.loadBids();
        Waiver.renderMyBids();
        Waiver.renderWaiverPlayers();
        if (typeof loadMyDraftedPlayers === 'function') loadMyDraftedPlayers();
    },

    nextProcessingTime() {
        const now = new Date();
        const next = new Date();
        next.setHours(8, 0, 0, 0);
        if (now >= next) next.setDate(next.getDate() + 1);
        return next;
    },

    // Countdown APENAS VISUAL — quem processa é o cron do Vercel
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
        }, 1000);
    },

    renderMyBids() {
        const container = document.getElementById('my-waiver-bids');
        if (!container) return;
        const myBids = Waiver.state.myBids;

        // Botão de processamento manual (só comissário)
        const commBtn = Waiver.isCommissioner()
            ? `<button class="action-btn" style="margin-bottom:10px; padding:5px 12px; font-size:11px; border-color:rgba(255,159,67,0.4); color:var(--neon-orange);"
                 onclick="Waiver.processWaiverManual()">
                 <i class="fa-solid fa-bolt"></i> Processar manualmente (emergência)
               </button>` : '';

        if (myBids.length === 0) {
            container.innerHTML = commBtn + '<p style="color:var(--text-muted); font-size:13px;">Nenhum lance realizado ainda.</p>';
            return;
        }

        container.innerHTML = commBtn + myBids.map(bid => `
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

    renderWaiverPlayers() {
        const container = document.getElementById('waiver-players-list');
        if (!container) return;
        const list = Waiver.getAvailablePlayers();
        const myBidMap = {};
        Waiver.state.myBids.forEach(b => { myBidMap[b.player_id] = b; });

        if (list.length === 0) {
            container.innerHTML = '<p style="color:var(--text-muted); padding:16px; text-align:center;">Nenhum jogador disponível.</p>';
            return;
        }

        container.innerHTML = list.map(p => {
            const myBid = myBidMap[p.id];
            const hasReal = (p.totalPoints || 0) > 0;
            const statLbl = hasReal ? `${p.totalPoints} pts temporada` : `Proj: ${p.projPoints} pts`;

            return `<div class="waiver-player-row">
                <div class="draft-player-info">
                    <span class="player-pos-badge pos-${p.position.toLowerCase()}">${p.position}</span>
                    <div>
                        <div class="player-name-row">${p.name}</div>
                        <div class="player-meta">${p.club} · ${statLbl}</div>
                    </div>
                </div>
                <div style="display:flex; align-items:center; gap:8px; flex-wrap:wrap; justify-content:flex-end;">
                    ${myBid
                        ? `<span style="font-size:12px; color:var(--neon-green); font-weight:700;">Seu lance: D$${myBid.bid_amount}</span>
                           <button class="action-btn" style="padding:5px 10px; font-size:11px; border-color:rgba(255,71,87,0.3); color:var(--neon-red);"
                               onclick="Waiver.cancelBid(${myBid.id})"><i class="fa-solid fa-xmark"></i></button>`
                        : `<input type="number" id="bid-input-${p.id}" min="1" max="${Waiver.state.managerBudget}"
                               placeholder="D$" style="width:64px; background:rgba(255,255,255,0.05); border:1px solid var(--border-color); border-radius:6px; color:var(--text-primary); font-family:var(--font-primary); font-size:13px; padding:5px 8px; text-align:center;">
                           <button class="action-btn primary" style="padding:6px 12px; font-size:12px;"
                               onclick="Waiver.openDropModal({id:${p.id}, name:'${p.name.replace(/'/g,"\\'")}', position:'${p.position}', club:'${p.club}', projPoints:${p.projPoints}})">
                               <i class="fa-solid fa-gavel"></i> Dar Lance
                           </button>`
                    }
                </div>
            </div>`;
        }).join('');
    },

    applyMarketMode() {
        const status = Draft.state.draftState?.draft_status || 'pending';
        const isFinished = Draft.state.draftState?.is_finished;
        const banner = document.getElementById('market-status-banner');
        const icon = document.getElementById('market-status-icon');
        const title = document.getElementById('market-status-title');
        const desc = document.getElementById('market-status-desc');
        const goBtn = document.getElementById('market-go-draft-btn');
        const waiverPanel = document.getElementById('waiver-panel');

        document.getElementById('free-market-panel').style.display = '';

        if (isFinished) {
            waiverPanel.style.display = '';
            banner.style.display = 'none';
        } else if (status === 'active') {
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
        try {
            const existing = window.supabaseClient.getChannels().find(c => c.topic === 'realtime:waiver-room');
            if (existing) window.supabaseClient.removeChannel(existing);
        } catch(e) {}

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

document.addEventListener('DOMContentLoaded', () => {
    document.getElementById('waiver-search')?.addEventListener('input', () => Waiver.renderWaiverPlayers());
});
