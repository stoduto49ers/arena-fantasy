// =============================================
// ARENA FANTASY - Slow Draft Engine
// Formato: Snake Draft, 16 times, 18 rodadas
// =============================================

const Draft = {

    // --- Estado local ---
    state: {
        picks: [],           // todas as picks já feitas
        draftState: null,    // linha da tabela draft_state
        managers: [],        // lista de managers na ordem do draft
        currentUser: null,   // manager logado
        timerInterval: null, // intervalo do countdown
        subscription: null,  // canal realtime
        timerHours: 8,       // padrão
    },

    TOTAL_ROUNDS: 18,
    TOTAL_TEAMS: 16,

    // --- Inicializa o draft quando a aba é aberta ---
    async init(user) {
        Draft.state.currentUser = user;
        Draft.showLoading(true);

        await Draft.loadManagers();
        await Draft.loadPicks();
        await Draft.loadDraftState();
        Draft.render();
        Draft.subscribeRealtime();

        Draft.showLoading(false);
    },

    // --- Carrega managers na ordem do draft ---
    async loadManagers() {
        const { data } = await window.supabaseClient
            .from('managers')
            .select('*')
            .order('created_at', { ascending: true });
        Draft.state.managers = data || [];
    },

    // --- Carrega todas as picks já feitas ---
    async loadPicks() {
        const { data } = await window.supabaseClient
            .from('draft_picks')
            .select('*')
            .order('pick_number', { ascending: true });
        Draft.state.picks = data || [];
    },

    // --- Carrega o estado atual do draft ---
    async loadDraftState() {
        const { data } = await window.supabaseClient
            .from('draft_state')
            .select('*')
            .eq('id', 1)
            .single();
        Draft.state.draftState = data;
    },

    // --- Calcula de quem é a vez (snake draft) ---
    getPickOrder() {
        const order = [];
        const n = Draft.state.managers.length || Draft.TOTAL_TEAMS;
        for (let round = 0; round < Draft.TOTAL_ROUNDS; round++) {
            const roundManagers = round % 2 === 0
                ? [...Draft.state.managers]
                : [...Draft.state.managers].reverse();
            roundManagers.forEach((m, i) => {
                order.push({
                    pickNumber: order.length + 1,
                    round: round + 1,
                    manager: m,
                    managerId: m?.id
                });
            });
        }
        return order;
    },

    // --- Retorna o slot atual da pick ---
    getCurrentSlot() {
        // Se draft não foi iniciado pelo comissário, retorna null
        if (!Draft.isDraftActive()) return null;
        const idx = Draft.state.draftState?.current_pick_index || 0;
        const order = Draft.getPickOrder();
        return order[idx] || null;
    },

    // --- Verifica se o draft foi oficialmente iniciado ---
    isDraftActive() {
        const ds = Draft.state.draftState;
        if (!ds) return false;
        return ds.draft_status === 'active' && !ds.is_finished;
    },

    // --- Verifica se é a vez do usuário logado ---
    isMyTurn() {
        if (!Draft.isDraftActive()) return false;
        const slot = Draft.getCurrentSlot();
        return slot?.managerId === Draft.state.currentUser?.id;
    },

    // --- Faz uma pick ---
    async makePick(player) {
        if (!Draft.isMyTurn()) return;
        if (Draft.isPlayerDrafted(player.id)) return;

        const slot = Draft.getCurrentSlot();
        const idx = Draft.state.draftState.current_pick_index;

        // Insere a pick no banco
        const { error } = await window.supabaseClient
            .from('draft_picks')
            .insert({
                round: slot.round,
                pick_number: slot.pickNumber,
                manager_id: Draft.state.currentUser.id,
                player_id: player.id,
                player_name: player.name,
                player_position: player.position,
                player_club: player.club,
            });

        if (error) { console.error(error); return; }

        // Avança o índice
        const nextIdx = idx + 1;
        const isFinished = nextIdx >= Draft.TOTAL_ROUNDS * Draft.state.managers.length;
        const timerHours = Draft.state.timerHours;
        const expiresAt = new Date(Date.now() + timerHours * 3600 * 1000).toISOString();

        await window.supabaseClient
            .from('draft_state')
            .update({
                current_pick_index: nextIdx,
                is_finished: isFinished,
                timer_expires_at: isFinished ? null : expiresAt,
                updated_at: new Date().toISOString()
            })
            .eq('id', 1);

        Draft.playPickSound();
    },

    // --- Auto-pick por ADP quando timer expira ---
    async autoPickByAdp() {
        if (!Draft.isMyTurn()) return;
        const available = Draft.getAvailablePlayers();
        if (available.length === 0) return;
        // Ordena por projPoints (ADP proxy)
        const best = available.sort((a, b) => b.projPoints - a.projPoints)[0];
        await Draft.makePick(best);
    },

    // --- Verifica se jogador já foi draftado ---
    isPlayerDrafted(playerId) {
        return Draft.state.picks.some(p => p.player_id === playerId);
    },

    // --- Retorna jogadores ainda disponíveis ---
    getAvailablePlayers() {
        const draftedIds = new Set(Draft.state.picks.map(p => p.player_id));
        return PLAYERS_DATABASE.filter(p => !draftedIds.has(p.id));
    },

    // --- Retorna picks de um manager específico ---
    getMyPicks(managerId) {
        return Draft.state.picks.filter(p => p.manager_id === managerId);
    },

    // --- Inicia o timer do countdown local ---
    startTimer() {
        clearInterval(Draft.state.timerInterval);
        const timerEl = document.getElementById('draft-timer-clock');
        if (!timerEl) return;

        const expiresAt = Draft.state.draftState?.timer_expires_at;
        if (!expiresAt) { timerEl.textContent = '--:--:--'; return; }

        Draft.state.timerInterval = setInterval(() => {
            const diff = new Date(expiresAt) - new Date();
            if (diff <= 0) {
                clearInterval(Draft.state.timerInterval);
                timerEl.textContent = '00:00:00';
                if (Draft.isMyTurn()) Draft.autoPickByAdp();
                return;
            }
            const h = Math.floor(diff / 3600000);
            const m = Math.floor((diff % 3600000) / 60000);
            const s = Math.floor((diff % 60000) / 1000);
            timerEl.textContent =
                `${String(h).padStart(2,'0')}:${String(m).padStart(2,'0')}:${String(s).padStart(2,'0')}`;

            // Pisca vermelho nos últimos 5 min
            timerEl.style.color = diff < 300000 ? 'var(--neon-red)' : '';
        }, 1000);
    },

    // --- Inscreve no canal realtime para atualizar todos quando alguém pickar ---
    subscribeRealtime() {
        if (Draft.state.subscription) {
            Draft.state.subscription.unsubscribe();
        }

        Draft.state.subscription = window.supabaseClient
            .channel('draft-room')
            .on('postgres_changes', {
                event: '*',
                schema: 'public',
                table: 'draft_state'
            }, async () => {
                await Draft.loadDraftState();
                await Draft.loadPicks();
                Draft.render();
                // Notifica se for a vez do usuário
                if (Draft.isMyTurn()) Draft.notifyMyTurn();
            })
            .on('postgres_changes', {
                event: 'INSERT',
                schema: 'public',
                table: 'draft_picks'
            }, async (payload) => {
                await Draft.loadPicks();
                Draft.renderBoard();
                Draft.renderPool();
                Draft.renderMyTeam();
            })
            .subscribe();
    },

    // --- Notificação visual + sonora quando é a vez ---
    notifyMyTurn() {
        Draft.playPickSound();
        // Banner de notificação
        const banner = document.getElementById('draft-my-turn-banner');
        if (banner) {
            banner.style.display = 'flex';
            setTimeout(() => { banner.style.display = 'none'; }, 8000);
        }
        // Título da página pisca
        let blink = true;
        const original = document.title;
        const blinkInterval = setInterval(() => {
            document.title = blink ? '⚡ SUA VEZ! - Arena Fantasy' : original;
            blink = !blink;
        }, 800);
        setTimeout(() => {
            clearInterval(blinkInterval);
            document.title = original;
        }, 15000);
    },

    // --- Som de notificação ---
    playPickSound() {
        try {
            const ctx = new (window.AudioContext || window.webkitAudioContext)();
            const osc = ctx.createOscillator();
            const gain = ctx.createGain();
            osc.connect(gain);
            gain.connect(ctx.destination);
            osc.frequency.setValueAtTime(880, ctx.currentTime);
            osc.frequency.setValueAtTime(1100, ctx.currentTime + 0.1);
            gain.gain.setValueAtTime(0.3, ctx.currentTime);
            gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.4);
            osc.start(ctx.currentTime);
            osc.stop(ctx.currentTime + 0.4);
        } catch(e) {}
    },

    // --- Render principal ---
    render() {
        Draft.renderHeader();
        Draft.renderBoard();
        Draft.renderPool();
        Draft.renderMyTeam();
        Draft.startTimer();
    },

    // --- Header do draft ---
    renderHeader() {
        const ticker = document.getElementById('draft-ticker-msg');
        const title = document.getElementById('current-pick-announcement');
        const roundBadge = document.getElementById('draft-round-badge');
        const pickBadge = document.getElementById('draft-pick-badge');

        // Draft encerrado
        if (Draft.state.draftState?.is_finished) {
            if (ticker) ticker.textContent = 'DRAFT ENCERRADO';
            if (title) title.textContent = 'Todos os jogadores foram escolhidos!';
            if (roundBadge) roundBadge.textContent = '—';
            if (pickBadge) pickBadge.textContent = '—';
            return;
        }

        // Draft ainda não iniciado
        if (!Draft.isDraftActive()) {
            if (ticker) ticker.textContent = 'AGUARDANDO INÍCIO';
            if (title) title.innerHTML = '<span style="color:var(--text-muted)">O comissário ainda não iniciou o draft</span>';
            if (roundBadge) roundBadge.textContent = '—';
            if (pickBadge) pickBadge.textContent = '—';
            return;
        }

        // Draft ativo
        const slot = Draft.getCurrentSlot();
        if (!slot) return;
        const isMe = Draft.isMyTurn();
        const managerName = slot.manager?.team_name || `Time ${slot.managerId?.slice(0,6)}`;

        if (ticker) ticker.textContent = `RODADA ${slot.round} • PICK ${slot.pickNumber} de ${Draft.TOTAL_ROUNDS * Draft.state.managers.length}`;
        if (title) title.innerHTML = isMe
            ? `<span style="color:var(--neon-green)">⚡ É A SUA VEZ!</span>`
            : `Vez de: <span style="color:var(--neon-blue)">${managerName}</span>`;
        if (roundBadge) roundBadge.textContent = `Rodada ${slot.round}`;
        if (pickBadge) pickBadge.textContent = `Pick ${slot.pickNumber}`;
    },

    // --- Grade do draft board ---
    renderBoard() {
        const grid = document.getElementById('draft-board-grid');
        if (!grid) return;

        const totalManagers = Draft.state.managers.length;
        if (totalManagers === 0) {
            grid.innerHTML = '<p style="color:var(--text-muted); padding:16px;">Aguardando managers entrarem na liga...</p>';
            return;
        }

        const managers = Draft.state.managers;
        const currentIdx = Draft.state.draftState?.current_pick_index || 0;

        // Cabeçalho — colunas fixas na ordem original
        let html = '<div class="draft-board-row draft-board-header">';
        html += '<div class="draft-board-cell draft-board-round-label">Rd</div>';
        managers.forEach(m => {
            const isMe = m.id === Draft.state.currentUser?.id;
            html += `<div class="draft-board-cell draft-board-manager ${isMe ? 'is-me' : ''}">${m.team_name}</div>`;
        });
        html += '</div>';

        // Linhas por rodada — snake: rodadas pares de trás para frente
        for (let round = 0; round < Draft.TOTAL_ROUNDS; round++) {
            html += '<div class="draft-board-row">';
            html += `<div class="draft-board-cell draft-board-round-label">${round + 1}</div>`;

            const isSnakeReverse = round % 2 !== 0;

            // Para cada coluna (manager), descobre qual pick number corresponde
            managers.forEach((m, colIdx) => {
                // Na rodada snake inversa, a posição na rodada é invertida
                const posInRound = isSnakeReverse ? (totalManagers - 1 - colIdx) : colIdx;
                const pickNum = round * totalManagers + posInRound + 1;
                const globalIdx = pickNum - 1;

                const pick = Draft.state.picks.find(p => p.pick_number === pickNum);
                const isCurrentPick = currentIdx === globalIdx;

                // Slot pertence a este manager? Na rodada normal: colIdx. Na inversa: totalManagers-1-colIdx
                const managerForSlot = isSnakeReverse
                    ? managers[totalManagers - 1 - colIdx]
                    : managers[colIdx];
                const isMySlot = managerForSlot?.id === Draft.state.currentUser?.id;

                let cellClass = 'draft-board-cell draft-board-pick';
                if (isCurrentPick && Draft.isDraftActive()) cellClass += ' current-pick';
                if (isMySlot) cellClass += ' my-pick-slot';

                if (pick) {
                    const posClass = `pos-${pick.player_position.toLowerCase()}`;
                    html += `<div class="${cellClass} picked ${posClass}">
                        <span class="pick-position">${pick.player_position}</span>
                        <span class="pick-name">${pick.player_name}</span>
                        <span class="pick-club">${pick.player_club}</span>
                    </div>`;
                } else {
                    html += `<div class="${cellClass} empty">
                        <span class="pick-number">#${pickNum}</span>
                    </div>`;
                }
            });
            html += '</div>';
        }

        grid.innerHTML = html;
        const current = grid.querySelector('.current-pick');
        if (current) current.scrollIntoView({ behavior: 'smooth', block: 'center' });
    },

    // --- Lista de jogadores disponíveis ---
    renderPool() {
        const list = document.getElementById('draft-pool-list');
        if (!list) return;

        const search = document.getElementById('draft-player-search')?.value?.toLowerCase() || '';
        const posFilter = document.getElementById('draft-pos-filter')?.value || 'TODOS';
        const clubFilter = document.getElementById('draft-club-filter')?.value || 'TODOS';

        let players = Draft.getAvailablePlayers();
        if (search) players = players.filter(p => p.name.toLowerCase().includes(search));
        if (posFilter !== 'TODOS') players = players.filter(p => p.position === posFilter);
        if (clubFilter !== 'TODOS') players = players.filter(p => p.club === clubFilter);
        players.sort((a, b) => b.projPoints - a.projPoints);

        const isMyTurn = Draft.isMyTurn();
        const isFinished = Draft.state.draftState?.is_finished;

        if (players.length === 0) {
            list.innerHTML = '<p style="color:var(--text-muted); padding:16px; text-align:center;">Nenhum jogador encontrado.</p>';
            return;
        }

        list.innerHTML = players.map(p => {
            const posClass = `pos-${p.position.toLowerCase()}`;
            return `<div class="draft-player-row ${posClass}" data-player-id="${p.id}">
                <div class="draft-player-info">
                    <span class="player-pos-badge ${posClass}">${p.position}</span>
                    <div>
                        <div class="player-name-row">${p.name}</div>
                        <div class="player-meta">${p.club} · Proj: ${p.projPoints} pts</div>
                    </div>
                </div>
                ${isMyTurn && !isFinished
                    ? `<button class="action-btn primary pick-btn" onclick="Draft.makePick({id:${p.id}, name:'${p.name}', position:'${p.position}', club:'${p.club}', projPoints:${p.projPoints}})">
                        <i class="fa-solid fa-plus"></i> Pick
                       </button>`
                    : `<span class="player-cost-badge">D$${p.cost}</span>`
                }
            </div>`;
        }).join('');
    },

    // --- Mini lista do meu time no painel lateral ---
    renderMyTeam() {
        const container = document.getElementById('draft-my-team-list');
        if (!container) return;

        const myPicks = Draft.getMyPicks(Draft.state.currentUser?.id);
        const remaining = Draft.TOTAL_ROUNDS - myPicks.length;

        document.getElementById('draft-my-picks-count').textContent = `${myPicks.length}/${Draft.TOTAL_ROUNDS}`;

        if (myPicks.length === 0) {
            container.innerHTML = '<p style="color:var(--text-muted); font-size:13px;">Nenhum jogador ainda.</p>';
            return;
        }

        const byPos = {};
        myPicks.forEach(p => {
            if (!byPos[p.player_position]) byPos[p.player_position] = [];
            byPos[p.player_position].push(p);
        });

        container.innerHTML = Object.entries(byPos).map(([pos, players]) =>
            `<div class="my-team-pos-group">
                <div class="my-team-pos-label pos-${pos.toLowerCase()}">${pos}</div>
                ${players.map(p => `<div class="my-team-player-row">
                    <span>${p.player_name}</span>
                    <span style="color:var(--text-muted); font-size:11px;">${p.player_club}</span>
                </div>`).join('')}
            </div>`
        ).join('');
    },

    showLoading(show) {
        const el = document.getElementById('draft-loading');
        if (el) el.style.display = show ? 'flex' : 'none';
    },

    // --- Painel do comissário para configurar e iniciar o draft ---
    async commissionerStart(timerHours) {
        Draft.state.timerHours = timerHours;
        const expiresAt = new Date(Date.now() + timerHours * 3600 * 1000).toISOString();
        await window.supabaseClient
            .from('draft_state')
            .update({
                current_pick_index: 0,
                is_finished: false,
                draft_status: 'active',
                timer_expires_at: expiresAt,
                updated_at: new Date().toISOString()
            })
            .eq('id', 1);
        await Draft.loadDraftState();
        Draft.render();
    }
};

// --- Eventos da aba de draft ---
document.addEventListener('DOMContentLoaded', () => {
    // Busca de jogadores
    document.getElementById('draft-player-search')?.addEventListener('input', () => Draft.renderPool());

    // Filtro de posição
    document.getElementById('draft-pos-filter')?.addEventListener('change', () => Draft.renderPool());

    // Filtro de clube
    document.getElementById('draft-club-filter')?.addEventListener('change', () => Draft.renderPool());

    // Botão comissário iniciar draft
    document.getElementById('commissioner-start-btn')?.addEventListener('click', () => {
        const hours = parseInt(document.getElementById('commissioner-timer-select')?.value || '8');
        if (confirm(`Iniciar o draft com ${hours}h por pick?`)) {
            Draft.commissionerStart(hours);
        }
    });
});
