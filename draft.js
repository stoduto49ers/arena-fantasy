// =============================================
// PRANCHETA FF - Slow Draft Engine
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

    // Helper: id da liga ativa
    leagueId() { return window.currentLeagueId?.() || window._currentLeague?.id || null; },

    // --- Carrega managers na ordem do draft (SÓ membros aprovados da liga) ---
    async loadManagers() {
        const lid = Draft.leagueId();

        if (lid) {
            const { data: members } = await window.supabaseClient
                .from('league_members')
                .select('manager_id')
                .eq('league_id', lid)
                .eq('status', 'approved');

            const ids = (members || []).map(m => m.manager_id);
            if (ids.length) {
                const { data } = await window.supabaseClient
                    .from('managers')
                    .select('*')
                    .in('id', ids)
                    .order('created_at', { ascending: true });
                Draft.state.managers = data || [];
                return;
            }
        }

        // Fallback: todos (compatibilidade)
        const { data } = await window.supabaseClient
            .from('managers')
            .select('*')
            .order('created_at', { ascending: true });
        Draft.state.managers = data || [];
    },

    // --- Carrega todas as picks já feitas (da liga) ---
    async loadPicks() {
        const lid = Draft.leagueId();
        let q = window.supabaseClient
            .from('draft_picks')
            .select('*')
            .order('pick_number', { ascending: true });
        if (lid) q = q.eq('league_id', lid);
        const { data } = await q;
        Draft.state.picks = data || [];
    },

    // --- Carrega o estado atual do draft (da liga; cria se não existir) ---
    async loadDraftState() {
        const lid = Draft.leagueId();
        if (lid) {
            const { data } = await window.supabaseClient
                .from('draft_state')
                .select('*')
                .eq('league_id', lid)
                .limit(1);
            if (data?.length) { Draft.state.draftState = data[0]; return; }

            // Liga nova sem estado de draft: cria um do zero
            const { data: created, error } = await window.supabaseClient
                .from('draft_state')
                .insert({ league_id: lid, current_pick_index: 0, is_finished: false })
                .select()
                .single();
            if (created) { Draft.state.draftState = created; return; }
            if (error) console.warn('Não foi possível criar draft_state da liga (rode a migration_v3.sql):', error.message);
        }
        // Fallback legado (liga única antiga)
        const { data } = await window.supabaseClient
            .from('draft_state')
            .select('*')
            .eq('id', 1)
            .single();
        Draft.state.draftState = data;
    },

    // ID da linha de draft_state carregada (para updates)
    stateRowId() { return Draft.state.draftState?.id ?? 1; },

    // --- Calcula de quem é a vez (snake draft) ---
    getPickOrder() {
        const managers = Draft.getOrderedManagers();
        const order = [];
        for (let round = 0; round < Draft.TOTAL_ROUNDS; round++) {
            const roundManagers = round % 2 === 0
                ? [...managers]
                : [...managers].reverse();
            roundManagers.forEach(m => {
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
                league_id: Draft.leagueId(),
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
        const timerHours = Draft.getTimerHours();
        const expiresAt = new Date(Date.now() + timerHours * 3600 * 1000).toISOString();

        await window.supabaseClient
            .from('draft_state')
            .update({
                current_pick_index: nextIdx,
                is_finished: isFinished,
                timer_expires_at: isFinished ? null : expiresAt,
                updated_at: new Date().toISOString()
            })
            .eq('id', Draft.stateRowId());

        // Aviso no chat quando draft encerra
        if (isFinished && window._currentUser) {
            await window.supabaseClient.from('chat_messages').insert({
                league_id: Draft.leagueId(),
                manager_id: window._currentUser.id,
                team_name: '🏆 Sistema',
                avatar_color: '#ffd700',
                message: '🎉 DRAFT ENCERRADO! Todos os times foram montados. Boa sorte na temporada!'
            });
        }

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

    // --- Auto-pick para manager AUSENTE (roda no navegador do comissário) ---
    // Sem isso, um amigo offline travaria o draft para sempre.
    async autoPickForAbsent() {
        // Grace de 20s: dá chance do próprio jogador agir primeiro
        await new Promise(r => setTimeout(r, 20000));

        // Recarrega o estado direto do banco para evitar corrida
        await Draft.loadDraftState();
        await Draft.loadPicks();
        const st = Draft.state.draftState;
        if (!st || st.is_finished) return;

        const exp = st.timer_expires_at;
        if (!exp || (new Date(exp) - new Date()) > 0) { Draft.startTimer(); return; } // alguém já pickou

        const slot = Draft.getCurrentSlot();
        if (!slot) return;
        if (slot.managerId === window._currentUser?.id) { Draft.autoPickByAdp(); return; }
        if (Draft.isBot(slot.managerId)) return; // bots têm fluxo próprio

        const available = Draft.getAvailablePlayers()
            .sort((a, b) => b.projPoints - a.projPoints);
        const player = available[0];
        if (!player) return;

        const idx = st.current_pick_index;
        const { error } = await window.supabaseClient.from('draft_picks').insert({
            league_id: Draft.leagueId(),
            round: slot.round,
            pick_number: slot.pickNumber,
            manager_id: slot.managerId,
            player_id: player.id,
            player_name: player.name,
            player_position: player.position,
            player_club: player.club,
        });
        if (error) {
            console.warn('Auto-pick do ausente bloqueado (rode a migration_v4.sql):', error.message);
            return;
        }

        const nextIdx = idx + 1;
        const isFinished = nextIdx >= Draft.TOTAL_ROUNDS * Draft.state.managers.length;
        const timerHours = Draft.getTimerHours();
        const expiresAt = new Date(Date.now() + timerHours * 3600 * 1000).toISOString();

        await window.supabaseClient.from('draft_state').update({
            current_pick_index: nextIdx,
            is_finished: isFinished,
            timer_expires_at: isFinished ? null : expiresAt,
            updated_at: new Date().toISOString()
        }).eq('id', Draft.stateRowId());

        const mgr = Draft.state.managers.find(m => m.id === slot.managerId);
        await window.supabaseClient.from('chat_messages').insert({
            league_id: Draft.leagueId(),
            manager_id: window._currentUser.id,
            team_name: '⏰ Auto-Pick',
            avatar_color: '#ff9f43',
            message: `Tempo esgotado! ${mgr?.team_name || 'Manager ausente'} recebeu ${player.name} (${player.position}) por auto-pick.`
        });

        await Draft.loadPicks();
        await Draft.loadDraftState();
        Draft.render();
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
                else if (Draft.isCommissioner()) Draft.autoPickForAbsent();
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
                Draft.renderMiniPitch();
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
            document.title = blink ? '⚡ SUA VEZ! - Prancheta FF' : original;
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
        const isFinished = Draft.state.draftState?.is_finished;

        // Mostra/esconde banner de draft encerrado
        Draft.renderFinishedBanner(isFinished);

        Draft.renderCommissionerPanel();
        Draft.renderHeader();
        Draft.renderBoard();
        Draft.renderPool();
        Draft.renderMyTeam();
        Draft.renderMiniPitch();

        if (!isFinished) {
            Draft.startTimer();
            Draft.checkBotTurn();
        }
    },

    // Banner de "Draft Encerrado" que cobre a aba
    renderFinishedBanner(isFinished) {
        let banner = document.getElementById('draft-finished-banner');
        if (!banner) {
            banner = document.createElement('div');
            banner.id = 'draft-finished-banner';
            banner.style.cssText = `
                position: sticky; top: 0; z-index: 100;
                background: linear-gradient(135deg, rgba(0,255,135,0.12), rgba(0,242,254,0.08));
                border: 1px solid rgba(0,255,135,0.3);
                border-radius: var(--border-radius-md);
                padding: 16px 20px;
                display: flex; align-items: center; gap: 16px;
                margin-bottom: 16px;
            `;
            const draftTab = document.getElementById('draft-tab');
            if (draftTab) draftTab.prepend(banner);
        }

        if (isFinished) {
            banner.style.display = 'flex';
            banner.innerHTML = `
                <i class="fa-solid fa-trophy" style="font-size:28px; color:var(--neon-green);"></i>
                <div>
                    <div style="font-size:16px; font-weight:800; color:var(--neon-green);">Draft Brasileirão 2026 — Encerrado!</div>
                    <div style="font-size:12px; color:var(--text-muted); margin-top:2px;">
                        Todos os times foram montados. Você pode visualizar todas as picks abaixo.
                    </div>
                </div>
            `;
        } else {
            banner.style.display = 'none';
        }
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
    // Retorna managers na ordem sorteada (ou padrão se não sorteado)
    getOrderedManagers() {
        let managers = [...Draft.state.managers];
        const savedOrder = Draft.state.draftState?.pick_order;
        if (savedOrder) {
            try {
                const ids = typeof savedOrder === 'string' ? JSON.parse(savedOrder) : savedOrder;
                const sorted = ids.map(id => managers.find(m => m.id === id)).filter(Boolean);
                const missing = managers.filter(m => !ids.includes(m.id));
                managers = [...sorted, ...missing];
            } catch(e) {}
        }
        return managers;
    },

    renderBoard() {
        const grid = document.getElementById('draft-board-grid');
        if (!grid) return;

        const totalManagers = Draft.state.managers.length;
        if (totalManagers === 0) {
            grid.innerHTML = '<p style="color:var(--text-muted); padding:16px;">Aguardando managers entrarem na liga...</p>';
            return;
        }

        const managers = Draft.getOrderedManagers(); // usa ordem sorteada
        const currentIdx = Draft.state.draftState?.current_pick_index || 0;
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
            const stats = [];
            if (p.gols > 0) stats.push(`⚽${p.gols}`);
            if (p.assistencias > 0) stats.push(`🅰️${p.assistencias}`);
            if ((p.cleanSheets||0) > 0 && (p.position==='GOL'||p.position==='ZAG'||p.position==='LAT')) stats.push(`🧤${p.cleanSheets}CS`);
            if (p.jogos > 0) stats.push(`${p.jogos}j`);
            const statsStr = stats.length ? stats.join(' · ') : 'Sem dados';

            return `<div class="draft-player-row ${posClass}" data-player-id="${p.id}">
                <div class="draft-player-info">
                    <span class="player-pos-badge ${posClass}">${p.position}</span>
                    <div>
                        <div class="player-name-row">${p.name}</div>
                        <div class="player-meta">${p.club} · ${statsStr}</div>
                    </div>
                </div>
                <div style="display:flex; flex-direction:column; align-items:flex-end; gap:2px;">
                    <span style="font-size:13px; font-weight:800; color:var(--neon-green);">${p.projPoints} pts</span>
                    <span style="font-size:9px; color:var(--text-muted);">projeção temporada</span>
                    ${isMyTurn && !isFinished
                        ? `<button class="action-btn primary pick-btn" style="margin-top:4px;" onclick="Draft.makePick({id:${p.id}, name:'${p.name.replace(/'/g,"\\'")}', position:'${p.position}', club:'${p.club}', projPoints:${p.projPoints}})">
                            <i class="fa-solid fa-plus"></i> Pick
                           </button>`
                        : ''
                    }
                </div>
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

    // --- Mini campo de posições draftadas ---
    renderMiniPitch() {
        const container = document.getElementById('draft-mini-pitch');
        if (!container) return;

        const myPicks = Draft.getMyPicks(Draft.state.currentUser?.id);
        const byPos = { GOL: [], ZAG: [], LAT: [], MEI: [], ATA: [] };
        myPicks.forEach(p => {
            if (byPos[p.player_position]) byPos[p.player_position].push(p.player_name);
        });

        // Configuração visual: ATA no topo, GOL embaixo (campo de cima pra baixo)
        const rows = [
            { pos: 'ATA', label: 'ATA', max: 4, color: 'var(--neon-red)' },
            { pos: 'MEI', label: 'MEI', max: 5, color: '#a855f7' },
            { pos: 'LAT', label: 'LAT', max: 2, color: 'var(--neon-green)' },
            { pos: 'ZAG', label: 'ZAG', max: 3, color: 'var(--neon-blue)' },
            { pos: 'GOL', label: 'GOL', max: 2, color: '#ffc800' },
        ];

        container.innerHTML = `
            <div style="background:rgba(10,25,15,0.6); border:1px solid rgba(255,255,255,0.1);
                border-radius:8px; padding:8px; display:flex; flex-direction:column; gap:4px;">
                ${rows.map(row => {
                    const players = byPos[row.pos] || [];
                    // Mostra slots: preenchidos ou vazios
                    const totalSlots = Math.max(players.length, row.max > 3 ? 3 : row.max);
                    const slots = Array.from({length: totalSlots}, (_, i) => {
                        const name = players[i];
                        return name
                            ? `<div style="background:${row.color}22; border:1px solid ${row.color}55;
                                border-radius:4px; padding:2px 4px; font-size:9px; font-weight:700;
                                color:${row.color}; white-space:nowrap; overflow:hidden; text-overflow:ellipsis;
                                max-width:60px;" title="${name}">${name.split(' ')[0]}</div>`
                            : `<div style="width:32px; height:22px; border:1px dashed rgba(255,255,255,0.15);
                                border-radius:4px; background:rgba(255,255,255,0.02);"></div>`;
                    });

                    return `<div style="display:flex; align-items:center; gap:4px; justify-content:center;">
                        ${slots.join('')}
                    </div>`;
                }).join('')}
                <div style="font-size:9px; color:var(--text-muted); text-align:center; margin-top:2px;">
                    ATA · MEI · LAT · ZAG · GOL
                </div>
            </div>`;
    },

    showLoading(show) {
        const el = document.getElementById('draft-loading');
        if (el) el.style.display = show ? 'flex' : 'none';
    },

    // --- Sorteia ordem dos managers e posta no chat ---
    async shuffleOrder() {
        if (!Draft.isCommissioner()) return;
        if (!Draft.state.managers.length) {
            alert('Nenhum manager na liga ainda.'); return;
        }

        const shuffled = [...Draft.state.managers].sort(() => Math.random() - 0.5);

        // Salva a ordem no banco
        await window.supabaseClient.from('draft_state')
            .update({ pick_order: JSON.stringify(shuffled.map(m => m.id)) })
            .eq('id', Draft.stateRowId());

        // Posta no chat
        const orderText = shuffled.map((m, i) => `${i+1}º ${m.team_name}`).join(' → ');
        const msg = `🎲 Ordem do Draft sorteada!\n${shuffled.map((m,i) => `${i+1}. ${m.team_name}`).join('\n')}`;
        if (typeof Chat !== 'undefined') {
            await window.supabaseClient.from('chat_messages').insert({
                league_id: Draft.leagueId(),
                manager_id: Draft.state.currentUser.id,
                team_name: '🏆 Sistema',
                avatar_color: '#ffd700',
                message: msg
            });
        }

        alert(`Ordem sorteada!\n${shuffled.map((m,i) => `${i+1}. ${m.team_name}`).join('\n')}`);
        await Draft.loadDraftState();
        Draft.render();
    },

    // IDs fixos dos bots
    BOT_IDS: [
        '00000000-0000-0000-0000-000000000001',
        '00000000-0000-0000-0000-000000000002',
        '00000000-0000-0000-0000-000000000003',
        '00000000-0000-0000-0000-000000000004',
        '00000000-0000-0000-0000-000000000005',
        '00000000-0000-0000-0000-000000000006',
    ],

    isBot(managerId) {
        return Draft.BOT_IDS.includes(managerId);
    },

    // Tempo por pick: SEMPRE do banco (draft_state.timer_hours),
    // para todos os navegadores usarem o mesmo valor configurado
    getTimerHours() {
        const fromDb = parseFloat(Draft.state.draftState?.timer_hours);
        if (fromDb && fromDb > 0) return fromDb;
        return Draft.state.timerHours || 8;
    },

    // Pick feita por um bot
    async makeBotPick(botId, player) {
        const slot = Draft.getCurrentSlot();
        if (!slot || slot.managerId !== botId) return false;

        const idx = Draft.state.draftState.current_pick_index;
        const timerHours = Draft.getTimerHours();

        const { error } = await window.supabaseClient.from('draft_picks').insert({
            league_id: Draft.leagueId(),
            round: slot.round,
            pick_number: slot.pickNumber,
            manager_id: botId,
            player_id: player.id,
            player_name: player.name,
            player_position: player.position,
            player_club: player.club,
        });

        if (error) { console.error('Bot pick error:', error); return false; }

        const nextIdx = idx + 1;
        const isFinished = nextIdx >= Draft.TOTAL_ROUNDS * Draft.state.managers.length;
        const expiresAt = new Date(Date.now() + timerHours * 3600 * 1000).toISOString();

        await window.supabaseClient.from('draft_state').update({
            current_pick_index: nextIdx,
            is_finished: isFinished,
            timer_expires_at: isFinished ? null : expiresAt,
            updated_at: new Date().toISOString()
        }).eq('id', Draft.stateRowId());

        return true;
    },

    // Escolhe o melhor jogador para o bot
    chooseBotPlayer(botId) {
        const available = PLAYERS_DATABASE
            .filter(p => !Draft.state.picks.find(pk => pk.player_id === p.id))
            .sort((a, b) => b.projPoints - a.projPoints);
        if (!available.length) return null;

        const botPicks = Draft.state.picks.filter(p => p.manager_id === botId);
        const byPos = { GOL:0, ZAG:0, LAT:0, MEI:0, ATA:0 };
        botPicks.forEach(p => { if (byPos[p.player_position] !== undefined) byPos[p.player_position]++; });

        if (byPos.GOL === 0) return available.find(p => p.position === 'GOL') || available[0];
        if (byPos.ATA < 3) return available.find(p => p.position === 'ATA') || available[0];
        if (byPos.MEI < 4) return available.find(p => p.position === 'MEI') || available[0];
        if (byPos.ZAG < 2) return available.find(p => p.position === 'ZAG') || available[0];
        if (byPos.LAT < 2) return available.find(p => p.position === 'LAT') || available[0];
        return available[0];
    },

    // Processa picks de bots em sequência
    async checkBotTurn() {
        if (!Draft.isDraftActive()) return;

        const slot = Draft.getCurrentSlot();
        if (!slot || !Draft.isBot(slot.managerId)) return;

        // Delay visual de 1.5s
        await new Promise(r => setTimeout(r, 1500));

        // Loop: continua enquanto for vez de bot
        let maxIterations = 20; // segurança contra loop infinito
        while (maxIterations-- > 0) {
            if (!Draft.isDraftActive()) break;

            await Draft.loadDraftState();
            await Draft.loadPicks();

            const current = Draft.getCurrentSlot();
            if (!current || !Draft.isBot(current.managerId)) break;

            const player = Draft.chooseBotPlayer(current.managerId);
            if (!player) break;

            const success = await Draft.makeBotPick(current.managerId, player);
            if (!success) break;

            // Atualiza o board visualmente
            await Draft.loadDraftState();
            await Draft.loadPicks();
            Draft.renderBoard();
            Draft.renderPool();
            Draft.renderMiniPitch();

            // Pequena pausa entre picks de bots consecutivos
            await new Promise(r => setTimeout(r, 800));
        }

        // Recarrega tudo ao terminar
        await Draft.loadDraftState();
        await Draft.loadPicks();
        Draft.render();
    },

    // Verifica se o usuário atual é o comissário (primeiro manager cadastrado)
    isCommissioner() {
        const uid = Draft.state.currentUser?.id;
        const first = Draft.state.managers[0];
        const cfg = window._leagueConfig;
        return uid && (first?.id === uid || cfg?.commissioner_id === uid);
    },

    // Mostra/esconde painel do comissário
    renderCommissionerPanel() {
        const panel = document.getElementById('commissioner-panel');
        if (panel) panel.style.display = Draft.isCommissioner() ? '' : 'none';
    },

    // Reset completo do draft
    async commissionerReset() {
        if (!Draft.isCommissioner()) return;
        if (!confirm('⚠️ HARD RESET: Todas as picks serão apagadas e o draft voltará ao estado inicial. Confirma?')) return;

        Draft.showLoading(true);

        try {
            // 1. Apaga as picks DA LIGA
            const lid = Draft.leagueId();
            let delQ = window.supabaseClient.from('draft_picks').delete();
            delQ = lid ? delQ.eq('league_id', lid) : delQ.gte('pick_number', 0);
            await delQ;

            // 2. Reseta o estado completamente
            await window.supabaseClient.from('draft_state').update({
                current_pick_index: 0,
                is_finished: false,
                draft_status: 'pending',
                timer_expires_at: null,
                updated_at: new Date().toISOString()
            }).eq('id', Draft.stateRowId());

            // 3. Recarrega tudo
            await Draft.loadDraftState();
            await Draft.loadPicks();
            await Draft.loadManagers();

            Draft.render();

            // Avisa no chat
            if (window._currentUser && window.supabaseClient) {
                await window.supabaseClient.from('chat_messages').insert({
                    league_id: Draft.leagueId(),
                    manager_id: window._currentUser.id,
                    team_name: '⚙️ Sistema',
                    avatar_color: '#ff4757',
                    message: '🔄 O draft foi resetado pelo comissário. Aguardando novo início.'
                });
            }
        } catch(e) {
            alert('Erro ao resetar: ' + e.message);
        } finally {
            Draft.showLoading(false);
        }
    },

    // --- Painel do comissário para configurar e iniciar o draft ---
    async commissionerStart(timerHours) {
        if (!Draft.isCommissioner()) return;
        Draft.state.timerHours = timerHours;
        const expiresAt = new Date(Date.now() + timerHours * 3600 * 1000).toISOString();
        await window.supabaseClient
            .from('draft_state')
            .update({
                current_pick_index: 0,
                is_finished: false,
                draft_status: 'active',
                timer_hours: timerHours,
                timer_expires_at: expiresAt,
                updated_at: new Date().toISOString()
            })
            .eq('id', Draft.stateRowId());
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
        const sel = document.getElementById('commissioner-timer-select');
        const hours = parseFloat(sel?.value || '8');
        const label = sel?.selectedOptions?.[0]?.text || `${hours}h`;
        if (confirm(`Iniciar o draft com ${label} por pick?`)) {
            Draft.commissionerStart(hours);
        }
    });

    // Botão sortear ordem
    document.getElementById('commissioner-shuffle-btn')?.addEventListener('click', () => {
        Draft.shuffleOrder();
    });

    // Botão reset do draft
    document.getElementById('commissioner-reset-btn')?.addEventListener('click', () => {
        Draft.commissionerReset();
    });
});
