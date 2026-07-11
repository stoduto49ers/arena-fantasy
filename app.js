// =============================================
// ARENA FANTASY - App Core (v2)
// - Confrontos lidos da tabela `matchups` (fonte única)
// - Escalação persistida na tabela `lineups`
// - Chat filtrado por liga
// - Código legado de simulação/draft local removido
// =============================================

// Cópia mutável da base de jogadores
let players = JSON.parse(JSON.stringify(PLAYERS_DATABASE));

let activeTab = "dashboard-tab";
let userBudget = ORCAMENTO_INICIAL;
let activeFormation = "4-3-3";
let currentManagerName = "Meu Time";
let currentManagerAvatar = "M";
let chatMessages = [];

// Helper: id da liga ativa
function currentLeagueId() { return window._currentLeague?.id || null; }

// --- FORMAÇÕES ---
const FORMATIONS = {
    "4-3-3": {
        rows: [
            { pos: "ATA", count: 3, names: ["Ponta Esquerda", "Centroavante", "Ponta Direita"] },
            { pos: "MEI", count: 3, names: ["Meia Esquerda", "Meio-Campo", "Meia Direita"] },
            { pos: "DEFENSE", count: 4, slots: [
                { pos: "LAT", idx: 0, name: "Lateral Esquerdo" },
                { pos: "ZAG", idx: 0, name: "Zagueiro 1" },
                { pos: "ZAG", idx: 1, name: "Zagueiro 2" },
                { pos: "LAT", idx: 1, name: "Lateral Direito" }
            ]},
            { pos: "GOL", count: 1, names: ["Goleiro"] }
        ],
        counts: { GOL: 1, ZAG: 2, LAT: 2, MEI: 3, ATA: 3 }
    },
    "4-4-2": {
        rows: [
            { pos: "ATA", count: 2, names: ["Atacante 1", "Atacante 2"] },
            { pos: "MEI", count: 4, names: ["Meia Esquerda", "Volante Esquerdo", "Volante Direito", "Meia Direita"] },
            { pos: "DEFENSE", count: 4, slots: [
                { pos: "LAT", idx: 0, name: "Lateral Esquerdo" },
                { pos: "ZAG", idx: 0, name: "Zagueiro 1" },
                { pos: "ZAG", idx: 1, name: "Zagueiro 2" },
                { pos: "LAT", idx: 1, name: "Lateral Direito" }
            ]},
            { pos: "GOL", count: 1, names: ["Goleiro"] }
        ],
        counts: { GOL: 1, ZAG: 2, LAT: 2, MEI: 4, ATA: 2 }
    },
    "3-5-2": {
        rows: [
            { pos: "ATA", count: 2, names: ["Atacante 1", "Atacante 2"] },
            { pos: "MEI", count: 5, names: ["Ala Esquerda", "Meia 1", "Meio-Campo", "Meia 2", "Ala Direita"] },
            { pos: "ZAG", count: 3, names: ["Zagueiro Esquerdo", "Zagueiro Central", "Zagueiro Direito"] },
            { pos: "GOL", count: 1, names: ["Goleiro"] }
        ],
        counts: { GOL: 1, ZAG: 3, LAT: 0, MEI: 5, ATA: 2 }
    },
    "3-4-3": {
        rows: [
            { pos: "ATA", count: 3, names: ["Ponta Esquerda", "Centroavante", "Ponta Direita"] },
            { pos: "MEI", count: 4, names: ["Meia Esquerda", "Volante 1", "Volante 2", "Meia Direita"] },
            { pos: "ZAG", count: 3, names: ["Zagueiro Esquerdo", "Zagueiro Central", "Zagueiro Direito"] },
            { pos: "GOL", count: 1, names: ["Goleiro"] }
        ],
        counts: { GOL: 1, ZAG: 3, LAT: 0, MEI: 4, ATA: 3 }
    },
    "5-3-2": {
        rows: [
            { pos: "ATA", count: 2, names: ["Atacante 1", "Atacante 2"] },
            { pos: "MEI", count: 3, names: ["Meia Esquerda", "Meio-Campo", "Meia Direita"] },
            { pos: "DEFENSE", count: 5, slots: [
                { pos: "LAT", idx: 0, name: "Lateral Esquerdo" },
                { pos: "ZAG", idx: 0, name: "Zagueiro Esquerdo" },
                { pos: "ZAG", idx: 1, name: "Zagueiro Central" },
                { pos: "ZAG", idx: 2, name: "Zagueiro Direito" },
                { pos: "LAT", idx: 1, name: "Lateral Direito" }
            ]},
            { pos: "GOL", count: 1, names: ["Goleiro"] }
        ],
        counts: { GOL: 1, ZAG: 3, LAT: 2, MEI: 3, ATA: 2 }
    }
};

let lineup = {
    GOL: [null],
    ZAG: [null, null],
    LAT: [null, null],
    MEI: [null, null, null],
    ATA: [null, null, null],
    RESERVAS: new Array(MAX_RESERVAS).fill(null),
    LESOES: new Array(MAX_VAGAS_LESIONADAS).fill(null)
};

// =============================================
// INIT
// =============================================
function initApp(user) {
    setupTabListeners();
    setupChat();
    setupMarket();
    setupLineup();
    populateClubFilters();

    if (user && window.supabaseClient) {
        window.supabaseClient
            .from('managers')
            .select('team_name, avatar_letter, budget')
            .eq('id', user.id)
            .single()
            .then(({ data }) => {
                if (data) {
                    currentManagerName = data.team_name || 'Meu Time';
                    currentManagerAvatar = (data.avatar_letter || currentManagerName.charAt(0)).toUpperCase();
                    userBudget = data.budget ?? ORCAMENTO_INICIAL;
                    const el = document.getElementById('team-name-display');
                    if (el) el.textContent = currentManagerName;
                    const budgetEl = document.getElementById('header-budget-badge');
                    if (budgetEl) budgetEl.textContent = 'D$' + userBudget;
                }
            });
    }

    renderMarket();
    renderPitch();

    // Carrega elenco + escalação salva
    if (user) setTimeout(() => loadMyRoster(), 200);
}

// =============================================
// ELENCO + ESCALAÇÃO PERSISTENTE
// =============================================

// IDs dos jogadores atualmente no meu roster (fonte: draft_picks)
let myRosterIds = new Set();

async function loadMyRoster() {
    const user = window._currentUser;
    if (!user) return;
    const lid = currentLeagueId();

    let q = window.supabaseClient.from('draft_picks').select('*').eq('manager_id', user.id);
    if (lid) q = q.eq('league_id', lid);
    const { data: picks } = await q;

    myRosterIds = new Set((picks || []).map(p => p.player_id));

    players.forEach(p => {
        if (myRosterIds.has(p.id)) { p.status = 'contratado'; p.draftedBy = user.id; }
    });

    // Tenta carregar escalação salva do banco
    const restored = await LineupStore.load();
    if (!restored) autoFillLineupFromRoster(picks || []);

    renderPitch();
    renderMarket();
}
window.loadMyDraftedPlayers = loadMyRoster; // compat com trades.js

function autoFillLineupFromRoster(picks) {
    picks.forEach(pick => {
        const player = players.find(p => p.id === pick.player_id);
        if (!player) return;
        if (isInLineup(player.id)) return;

        const slots = lineup[player.position];
        const emptyIdx = slots ? slots.indexOf(null) : -1;
        if (emptyIdx !== -1) { slots[emptyIdx] = player; return; }
        const ri = lineup.RESERVAS.indexOf(null);
        if (ri !== -1) lineup.RESERVAS[ri] = player;
    });
}

function isInLineup(playerId) {
    return Object.values(lineup).some(arr => arr.some(p => p && p.id === playerId));
}

// --- Persistência da escalação ---
const LineupStore = {
    _saveTimeout: null,
    _statusCache: null,
    _statusCacheTime: 0,
    _lockWarned: false,

    // Mercado do Cartola aberto = pode editar escalação.
    // Fechado (jogos da rodada em andamento) = escalação TRAVADA,
    // para ninguém trocar jogador depois de ver quem pontuou.
    async isMarketOpen() {
        try {
            if (LineupStore._statusCache && (Date.now() - LineupStore._statusCacheTime) < 60000) {
                return LineupStore._statusCache.status_mercado === 1;
            }
            const r = await fetch('/api/cartola?endpoint=status');
            const s = await r.json();
            LineupStore._statusCache = s;
            LineupStore._statusCacheTime = Date.now();
            return s.status_mercado === 1; // 1 = aberto
        } catch(e) {
            return true; // se a API falhar, não bloqueia (evita travar o app por indisponibilidade)
        }
    },

    // Semana atual da liga (menor week não finalizada); cacheada
    async currentWeek() {
        if (window._currentWeek) return window._currentWeek;
        const lid = currentLeagueId();
        if (!lid) return 1;
        const { data } = await window.supabaseClient
            .from('matchups').select('week')
            .eq('league_id', lid).eq('is_finished', false)
            .order('week', { ascending: true }).limit(1);
        window._currentWeek = data?.[0]?.week || 1;
        return window._currentWeek;
    },

    serialize() {
        const starters = {};
        ['GOL','ZAG','LAT','MEI','ATA'].forEach(pos => {
            starters[pos] = (lineup[pos] || []).map(p => p ? p.id : null);
        });
        const bench = {
            RESERVAS: lineup.RESERVAS.map(p => p ? p.id : null),
            LESOES: lineup.LESOES.map(p => p ? p.id : null),
        };
        return { starters, bench };
    },

    // Debounce: salva 1.2s após a última mudança
    scheduleSave() {
        clearTimeout(LineupStore._saveTimeout);
        LineupStore._saveTimeout = setTimeout(() => LineupStore.save(), 1200);
    },

    async save() {
        const user = window._currentUser;
        if (!user) return;

        // Trava anti-furo: rodada em andamento = sem mudanças
        if (!(await LineupStore.isMarketOpen())) {
            if (!LineupStore._lockWarned) {
                LineupStore._lockWarned = true;
                alert('⚠ Rodada do Brasileirão em andamento!\nAs escalações estão travadas até o mercado reabrir. Suas mudanças NÃO serão salvas.');
            }
            return;
        }

        const week = await LineupStore.currentWeek();
        const { starters, bench } = LineupStore.serialize();

        const { error } = await window.supabaseClient.from('lineups').upsert({
            manager_id: user.id,
            league_id: currentLeagueId(),
            round: week,
            formation: activeFormation,
            starters,
            bench,
            updated_at: new Date().toISOString(),
        }, { onConflict: 'manager_id,round' });

        if (error) console.warn('Lineup save error:', error);
    },

    // Reconstrói o lineup a partir do banco. Retorna true se restaurou.
    async load() {
        const user = window._currentUser;
        if (!user) return false;
        const week = await LineupStore.currentWeek();

        let q = window.supabaseClient.from('lineups').select('*')
            .eq('manager_id', user.id).eq('round', week);
        const lid = currentLeagueId();
        if (lid) q = q.eq('league_id', lid);
        const { data } = await q.limit(1);
        const row = data?.[0];
        if (!row) return false;

        if (row.formation && FORMATIONS[row.formation]) {
            activeFormation = row.formation;
            const sel = document.getElementById('formation-select');
            if (sel) sel.value = activeFormation;
        }

        const counts = FORMATIONS[activeFormation].counts;
        const byId = id => {
            if (!id || !myRosterIds.has(id)) return null; // jogador saiu do roster
            return players.find(p => p.id === id) || null;
        };

        const starters = row.starters || {};
        ['GOL','ZAG','LAT','MEI','ATA'].forEach(pos => {
            const ids = starters[pos] || [];
            const size = counts[pos] || 0;
            lineup[pos] = Array.from({ length: size }, (_, i) => byId(ids[i]));
        });
        const bench = row.bench || {};
        lineup.RESERVAS = Array.from({ length: Math.max(MAX_RESERVAS, (bench.RESERVAS||[]).length) }, (_, i) => byId((bench.RESERVAS || [])[i]));
        lineup.LESOES = Array.from({ length: MAX_VAGAS_LESIONADAS }, (_, i) => byId((bench.LESOES || [])[i]));

        // Jogadores do roster que não estão em lugar nenhum → tenta titular, senão reservas
        myRosterIds.forEach(id => {
            if (!isInLineup(id)) {
                const p = players.find(x => x.id === id);
                if (!p) return;
                const slots = lineup[p.position];
                const ei = slots ? slots.indexOf(null) : -1;
                if (ei !== -1) { slots[ei] = p; return; }
                const ri = lineup.RESERVAS.indexOf(null);
                if (ri !== -1) lineup.RESERVAS[ri] = p;
                else lineup.RESERVAS.push(p);
            }
        });

        return true;
    }
};
window.LineupStore = LineupStore;

// =============================================
// ABAS
// =============================================
function setupTabListeners() {
    document.querySelectorAll(".nav-item").forEach(item => {
        item.addEventListener("click", () => {
            const tabId = item.getAttribute("data-tab");
            if (tabId) switchTab(tabId);
        });
    });
    const ctaBtn = document.getElementById("header-cta-btn");
    if (ctaBtn) ctaBtn.addEventListener("click", () => {
        const tabId = ctaBtn.getAttribute("data-tab");
        if (tabId) switchTab(tabId);
    });
    const logoBtn = document.getElementById("logo-btn");
    if (logoBtn) logoBtn.addEventListener("click", () => switchTab("dashboard-tab"));
}

function switchTab(tabId) {
    activeTab = tabId;
    document.querySelectorAll(".nav-item").forEach(item => {
        item.classList.toggle("active", item.getAttribute("data-tab") === tabId);
    });
    document.querySelectorAll(".tab-content").forEach(content => {
        content.classList.toggle("active", content.getAttribute("id") === tabId);
    });

    const pageTitle = document.getElementById("page-title");
    const ctaBtn = document.getElementById("header-cta-btn");
    const titles = {
        "dashboard-tab": "Painel da Liga",
        "draft-tab": "Draft ao Vivo",
        "team-tab": "Minha Escalação",
        "matchup-tab": "Confronto Direto",
        "market-tab": "Mercado",
        "trades-tab": "Trocas",
        "config-tab": "Configurações da Liga"
    };
    if (pageTitle) pageTitle.innerText = titles[tabId] || "";
    if (ctaBtn) ctaBtn.style.display = (tabId === "matchup-tab") ? "none" : "flex";

    const user = window._currentUser;
    if (user) {
        if (tabId === "draft-tab" && typeof Draft !== "undefined") Draft.init(user);
        if (tabId === "dashboard-tab" && typeof Dashboard !== "undefined") Dashboard.init(user);
        if (tabId === "config-tab" && typeof LeagueConfig !== "undefined") LeagueConfig.init(user);
        if (tabId === "market-tab" && typeof Waiver !== "undefined") Waiver.init(user);
        if (tabId === "trades-tab" && typeof Trades !== "undefined") Trades.init(user);
    }
    if (tabId === "jogos-tab" && typeof Jogos !== "undefined") Jogos.load();
    if (tabId === "news-tab" && typeof News !== "undefined") News.load();
    if (tabId === "matchup-tab") Matchup.render();
    if (tabId === "team-tab") { loadMyRoster(); }
}

// =============================================
// CHAT (filtrado por liga)
// =============================================
function setupChat() {
    const chatForm = document.getElementById("chat-form");
    if (!chatForm) return;

    Chat.loadMessages();

    chatForm.addEventListener("submit", (e) => {
        e.preventDefault();
        const input = document.getElementById("chat-input-msg");
        const msgText = input?.value.trim();
        if (msgText) { Chat.sendMessage(msgText); input.value = ""; }
    });

    const trashBtn = document.getElementById("chat-trash-talk-btn");
    if (trashBtn) {
        trashBtn.addEventListener("click", () => {
            const taunts = [
                "Esquece, esse ano a taça é minha! Podem chorar no vestiário já 😂",
                "Acabei de fechar uma contratação cirúrgica no mercado, meu time tá voando baixo!",
                "Quem escalou o Yuri Alberto tá rezando pra ele não errar o gol sem goleiro kkkkk",
                "Cadê as estatísticas? Meu time tá com projeção de pontuação recorde!"
            ];
            Chat.sendMessage(taunts[Math.floor(Math.random() * taunts.length)]);
        });
    }
}

const Chat = {
    subscription: null,
    _reconnectDelay: 5000,
    _reconnectTimeout: null,
    _pollInterval: null,

    async clearHistory() {
        if (!confirm('Limpar todo o histórico do chat? Esta ação não pode ser desfeita.')) return;
        const lid = currentLeagueId();
        let q = window.supabaseClient.from('chat_messages').delete();
        q = lid ? q.eq('league_id', lid) : q.neq('id', 0);
        await q;
        chatMessages = [];
        renderChat();
    },

    async loadMessages() {
        const lid = currentLeagueId();
        let q = window.supabaseClient.from('chat_messages').select('*')
            .order('created_at', { ascending: true });
        if (lid) q = q.eq('league_id', lid);
        const { data } = await q;

        chatMessages = (data || []).map(m => {
            const msg = Chat.formatMessage(m);
            msg._id = m.id;
            return msg;
        });
        renderChat();
        Chat.subscribe();
    },

    formatMessage(m) {
        return {
            author: m.team_name || '?',
            text: m.message,
            avatar: (m.team_name || '?').charAt(0).toUpperCase(),
            color: m.avatar_color || 'var(--neon-blue)',
            isUser: m.manager_id === window._currentUser?.id,
            time: new Date(m.created_at).toLocaleTimeString('pt-BR', { hour:'2-digit', minute:'2-digit' })
        };
    },

    async sendMessage(text) {
        const user = window._currentUser;
        if (!user || !text.trim()) return;

        let teamName = currentManagerName;
        if (!teamName || teamName === 'Meu Time') {
            const { data } = await window.supabaseClient
                .from('managers').select('team_name').eq('id', user.id).single();
            teamName = data?.team_name || user.email?.split('@')[0] || 'Manager';
        }

        const { error } = await window.supabaseClient.from('chat_messages').insert({
            league_id: currentLeagueId(),
            manager_id: user.id,
            team_name: teamName,
            avatar_color: '#00f2fe',
            message: text.trim()
        });
        if (error) console.warn('Chat send error:', error);
    },

    subscribe() {
        if (Chat.subscription) {
            try { window.supabaseClient.removeChannel(Chat.subscription); } catch(e) {}
            Chat.subscription = null;
        }
        if (Chat._reconnectTimeout) { clearTimeout(Chat._reconnectTimeout); Chat._reconnectTimeout = null; }

        const lid = currentLeagueId();

        Chat.subscription = window.supabaseClient
            .channel('chat-live')
            .on('postgres_changes', {
                event: 'INSERT', schema: 'public', table: 'chat_messages'
            }, (payload) => {
                // Ignora mensagens de outras ligas
                if (lid && payload.new.league_id && payload.new.league_id !== lid) return;
                const exists = chatMessages.some(m => m._id === payload.new.id);
                if (!exists) {
                    const msg = Chat.formatMessage(payload.new);
                    msg._id = payload.new.id;
                    chatMessages.push(msg);
                    renderChat();
                }
            })
            .subscribe((status) => {
                if (status === 'CHANNEL_ERROR') {
                    const delay = Math.min(Chat._reconnectDelay * 2, 20000);
                    Chat._reconnectDelay = delay;
                    Chat._reconnectTimeout = setTimeout(() => Chat.subscribe(), delay);
                } else if (status === 'SUBSCRIBED') {
                    Chat._reconnectDelay = 5000;
                }
            });

        // Polling de fallback a cada 15s
        if (Chat._pollInterval) clearInterval(Chat._pollInterval);
        Chat._pollInterval = setInterval(async () => {
            const lastId = chatMessages.length ? (chatMessages[chatMessages.length-1]._id || 0) : 0;
            let q = window.supabaseClient.from('chat_messages').select('*')
                .gt('id', lastId).order('created_at', { ascending: true });
            if (lid) q = q.eq('league_id', lid);
            const { data } = await q;
            if (data?.length) {
                data.forEach(m => {
                    if (!chatMessages.some(cm => cm._id === m.id)) {
                        const msg = Chat.formatMessage(m);
                        msg._id = m.id;
                        chatMessages.push(msg);
                    }
                });
                renderChat();
            }
        }, 15000);
    }
};

function renderChat() {
    const container = document.getElementById("chat-messages-container");
    if (!container) return;
    container.innerHTML = "";
    chatMessages.forEach(msg => {
        const bubble = document.createElement("div");
        bubble.className = `message-bubble ${msg.isUser ? 'user-message' : ''}`;
        bubble.innerHTML = `
            <div class="message-avatar" style="background:${msg.color}; color:#000;">${msg.avatar}</div>
            <div class="message-content-wrapper">
                <div class="message-meta">
                    <span class="message-author">${msg.author}</span>
                    <span class="message-time">${msg.time}</span>
                </div>
                <div class="message-text">${msg.text}</div>
            </div>`;
        container.appendChild(bubble);
    });
    container.scrollTop = container.scrollHeight;
}

// =============================================
// MERCADO (vitrine + atalho para o waiver)
// =============================================
function setupMarket() {
    const searchInput = document.getElementById("market-player-search");
    if (searchInput) searchInput.addEventListener("input", () => renderMarket());
    const posFilter = document.getElementById("market-pos-filter");
    if (posFilter) posFilter.addEventListener("change", () => renderMarket());
    const clubFilter = document.getElementById("market-club-filter");
    if (clubFilter) clubFilter.addEventListener("change", () => renderMarket());
}

function renderMarket() {
    const container = document.getElementById("market-players-list");
    if (!container) return;

    const searchVal = document.getElementById("market-player-search")?.value || "";
    const pos = document.getElementById("market-pos-filter")?.value || "TODOS";
    const club = document.getElementById("market-club-filter")?.value || "TODOS";

    let filtered = players;
    if (searchVal) filtered = filtered.filter(p => p.name.toLowerCase().includes(searchVal.toLowerCase()));
    if (pos !== "TODOS") filtered = filtered.filter(p => p.position === pos);
    if (club !== "TODOS") filtered = filtered.filter(p => p.club === club);

    container.innerHTML = "";
    if (!filtered.length) {
        container.innerHTML = `<div style="padding:20px; text-align:center; color:var(--text-muted);">Nenhum jogador encontrado.</div>`;
        return;
    }

    // Donos: mapa player_id -> manager_id (do Draft carregado)
    const ownerMap = {};
    if (typeof Draft !== 'undefined') {
        (Draft.state.picks || []).forEach(pk => { ownerMap[pk.player_id] = pk.manager_id; });
    }
    const myId = window._currentUser?.id;
    const draftIsFinished = (typeof Draft !== 'undefined' && Draft.state.draftState?.is_finished);
    const draftIsActive = (typeof Draft !== 'undefined' && Draft.state.draftState?.draft_status === 'active' && !draftIsFinished);

    const sorted = [...filtered].sort((a,b) => ((b.totalPoints||0) || b.projPoints) - ((a.totalPoints||0) || a.projPoints));

    sorted.forEach(player => {
        const row = document.createElement("div");
        row.className = "player-market-row";
        const posClass = `pos-${player.position.toLowerCase()}`;
        const owner = ownerMap[player.id];

        let buttonHtml;
        if (owner === myId) {
            buttonHtml = `<button class="market-action-btn added" disabled>Seu elenco</button>`;
        } else if (owner) {
            buttonHtml = `<button class="market-action-btn" disabled style="opacity:0.4;">Contratado</button>`;
        } else if (draftIsFinished) {
            buttonHtml = `<button class="market-action-btn" onclick="goToWaiver('${player.name.replace(/'/g,"\\'")}')">
                <i class="fa-solid fa-gavel" style="font-size:10px;"></i> Dar Lance</button>`;
        } else if (draftIsActive) {
            buttonHtml = `<button class="market-action-btn" disabled style="opacity:0.4;cursor:not-allowed;">
                <i class="fa-solid fa-circle-dot" style="font-size:10px;color:var(--neon-green);"></i> Draft</button>`;
        } else {
            buttonHtml = `<button class="market-action-btn" disabled style="opacity:0.4;cursor:not-allowed;">
                <i class="fa-solid fa-lock" style="font-size:10px;"></i> Bloqueado</button>`;
        }

        const stats = [];
        if (player.gols > 0) stats.push(`⚽${player.gols}`);
        if (player.assistencias > 0) stats.push(`🅰️${player.assistencias}`);
        if ((player.cleanSheets||0) > 0 && ['GOL','ZAG','LAT'].includes(player.position)) stats.push(`🧤${player.cleanSheets} CS`);
        if (player.jogos > 0) stats.push(`${player.jogos}j`);
        const statsStr = stats.length ? stats.join(' · ') : 'Sem dados';

        // Mostra pontuação real acumulada se disponível, senão projeção
        const hasReal = (player.totalPoints || 0) > 0;
        const mainStat = hasReal ? player.totalPoints : player.projPoints;
        const mainLbl = hasReal ? 'pts temporada' : 'proj. temporada';

        row.innerHTML = `
            <div class="player-main-info">
                <div class="player-avatar-circle">${player.name.substring(0,2).toUpperCase()}</div>
                <div>
                    <span class="player-name-txt">${player.name}</span>
                    <div class="player-sub-txt">
                        <span class="player-pos-badge ${posClass}">${player.position}</span>
                        <span class="player-club-txt">${player.club}</span>
                        <span style="font-size:10px; color:var(--text-muted);">${statsStr}</span>
                    </div>
                </div>
            </div>
            <div class="player-stat-col">
                <span class="player-stat-val" style="color:var(--neon-green);">${mainStat}</span>
                <span class="player-stat-lbl">${mainLbl}</span>
            </div>
            ${buttonHtml}`;
        container.appendChild(row);
    });
}

// Preenche os filtros de clube dinamicamente a partir da base de jogadores
// (assim funcionam mesmo quando a base é regenerada com siglas do Cartola)
function populateClubFilters() {
    const clubs = [...new Set(PLAYERS_DATABASE.map(p => p.club))].sort();
    ['market-club-filter', 'draft-club-filter'].forEach(id => {
        const sel = document.getElementById(id);
        if (!sel) return;
        const current = sel.value;
        sel.innerHTML = '<option value="TODOS">Todos os Clubes</option>'
            + clubs.map(c => `<option value="${c}">${c}</option>`).join('');
        if ([...sel.options].some(o => o.value === current)) sel.value = current;
    });
}
window.populateClubFilters = populateClubFilters;

// Atalho: mercado → painel waiver com jogador pré-buscado
function goToWaiver(playerName) {
    const search = document.getElementById('waiver-search');
    if (search) {
        search.value = playerName;
        if (typeof Waiver !== 'undefined') Waiver.renderWaiverPlayers();
    }
    document.getElementById('waiver-panel')?.scrollIntoView({ behavior: 'smooth' });
}
window.goToWaiver = goToWaiver;

// =============================================
// ESCALAÇÃO (campinho)
// =============================================
function setupLineup() {
    const resetBtn = document.getElementById("reset-team-btn");
    if (resetBtn) resetBtn.addEventListener("click", () => {
        if (!confirm("Limpar o campinho? Seus jogadores voltam ao banco de reservas.")) return;
        ['GOL','ZAG','LAT','MEI','ATA'].forEach(pos => {
            (lineup[pos] || []).forEach((p, i) => {
                if (p) {
                    const ri = lineup.RESERVAS.indexOf(null);
                    if (ri !== -1) lineup.RESERVAS[ri] = p;
                    else lineup.RESERVAS.push(p);
                    lineup[pos][i] = null;
                }
            });
        });
        renderPitch();
        LineupStore.scheduleSave();
    });

    const formationSelect = document.getElementById("formation-select");
    if (formationSelect) formationSelect.addEventListener("change", (e) => changeFormation(e.target.value));
}

function changeFormation(newFormation) {
    if (!FORMATIONS[newFormation]) return;
    activeFormation = newFormation;
    const newCounts = FORMATIONS[newFormation].counts;

    const allPlayers = { GOL:[], ZAG:[], LAT:[], MEI:[], ATA:[] };
    ['GOL','ZAG','LAT','MEI','ATA'].forEach(pos => {
        (lineup[pos] || []).forEach(p => { if (p) allPlayers[pos].push(p); });
    });

    ['GOL','ZAG','LAT','MEI','ATA'].forEach(pos => {
        const slots = newCounts[pos] || 0;
        lineup[pos] = [];
        for (let i = 0; i < slots; i++) lineup[pos].push(allPlayers[pos][i] || null);
        for (let i = slots; i < allPlayers[pos].length; i++) {
            const player = allPlayers[pos][i];
            const ri = lineup.RESERVAS.indexOf(null);
            if (ri !== -1) lineup.RESERVAS[ri] = player;
            else lineup.RESERVAS.push(player);
        }
    });

    renderPitch();
    LineupStore.scheduleSave();
}

function updateLineupStats() {
    let startersCount = 0, benchCount = 0, injuredCount = 0, proj = 0.0;
    ['GOL','ZAG','LAT','MEI','ATA'].forEach(pos => {
        (lineup[pos] || []).forEach(p => {
            if (p) { startersCount++; proj += p.projPoints || 0; }
        });
    });
    (lineup.RESERVAS || []).forEach(p => { if (p) benchCount++; });
    (lineup.LESOES || []).forEach(p => { if (p) injuredCount++; });

    const set = (id, val) => { const el = document.getElementById(id); if (el) el.innerText = val; };
    set("lineup-count-val", `${startersCount} / 11`);
    set("bench-count-val", `${benchCount} / ${MAX_RESERVAS}`);
    set("injured-count-val", `${injuredCount} / ${MAX_VAGAS_LESIONADAS}`);
    set("lineup-cost-val", `${MOEDA_LABEL} ${Number(userBudget).toFixed(2)}`);
    set("lineup-projection-val", `${proj.toFixed(2)} pts`);
}

function renderPitch() {
    const pitchGrid = document.getElementById("pitch-grid-slots");
    if (!pitchGrid) return;
    pitchGrid.innerHTML = "";

    const formationConfig = FORMATIONS[activeFormation];
    if (!formationConfig) return;

    const counts = formationConfig.counts;
    Object.keys(counts).forEach(pos => {
        if (!lineup[pos]) lineup[pos] = [];
        while (lineup[pos].length < counts[pos]) lineup[pos].push(null);
    });

    formationConfig.rows.forEach(rowConfig => {
        const rowDiv = document.createElement("div");
        rowDiv.className = "pitch-row";
        if (rowConfig.pos === "DEFENSE") {
            rowConfig.slots.forEach(slot => {
                rowDiv.appendChild(generateSlotHtml(slot.pos, slot.idx, lineup[slot.pos][slot.idx], slot.name));
            });
        } else {
            for (let idx = 0; idx < rowConfig.count; idx++) {
                rowDiv.appendChild(generateSlotHtml(rowConfig.pos, idx, lineup[rowConfig.pos][idx], rowConfig.names[idx] || rowConfig.pos));
            }
        }
        pitchGrid.appendChild(rowDiv);
    });

    const benchSlots = document.getElementById("bench-slots");
    if (benchSlots) {
        benchSlots.innerHTML = "";
        lineup.RESERVAS.forEach((player, idx) => {
            benchSlots.appendChild(generateBenchSlotHtml("RESERVAS", idx, player, `Reserva ${idx + 1}`));
        });
    }
    const injuredSlots = document.getElementById("injured-slots");
    if (injuredSlots) {
        injuredSlots.innerHTML = "";
        lineup.LESOES.forEach((player, idx) => {
            injuredSlots.appendChild(generateBenchSlotHtml("LESOES", idx, player, `Lesão ${idx + 1}`));
        });
    }

    updateLineupStats();
}

function handleSlotDrop(srcPos, srcIdx, dstPos, dstIdx) {
    const srcArr = lineup[srcPos];
    const dstArr = lineup[dstPos];
    if (!srcArr || !dstArr) return;
    const dragPlayer = srcArr[srcIdx];
    const targetPlayer = dstArr[dstIdx];

    const starterPositions = ["GOL","ZAG","LAT","MEI","ATA"];
    if (starterPositions.includes(dstPos) && dragPlayer && dragPlayer.position !== dstPos) {
        alert(`Apenas jogadores da posição ${dstPos} podem ser colocados nesta vaga!`);
        return;
    }
    if (starterPositions.includes(srcPos) && targetPlayer && targetPlayer.position !== srcPos) {
        alert(`Apenas jogadores da posição ${srcPos} podem ser colocados nesta vaga!`);
        return;
    }
    srcArr[srcIdx] = targetPlayer;
    dstArr[dstIdx] = dragPlayer;
    renderPitch();
    LineupStore.scheduleSave();
}

function generateBenchSlotHtml(pos, idx, player, defaultName) {
    const slotEl = document.createElement("div");
    slotEl.className = "bench-player-slot";
    slotEl.draggable = true;
    slotEl.addEventListener('dragstart', (e) => e.dataTransfer.setData('text/plain', JSON.stringify({ pos, idx })));
    slotEl.addEventListener('dragover', (e) => e.preventDefault());
    slotEl.addEventListener('drop', (e) => {
        e.preventDefault();
        const data = JSON.parse(e.dataTransfer.getData('text/plain'));
        handleSlotDrop(data.pos, data.idx, pos, idx);
    });

    if (player) {
        slotEl.classList.add("filled");
        slotEl.innerHTML = `
            <div class="bench-slot-badge">${player.name.substring(0,2).toUpperCase()}</div>
            <div class="bench-slot-name">${player.name}</div>`;
    } else {
        slotEl.innerHTML = `
            <div class="bench-slot-badge"><i class="fa-solid fa-shirt" style="font-size:14px;"></i></div>
            <div class="bench-slot-name">${defaultName}</div>`;
    }
    return slotEl;
}

function generateSlotHtml(pos, idx, player, defaultName) {
    const slotEl = document.createElement("div");
    slotEl.className = "pitch-player-slot";
    slotEl.draggable = true;
    slotEl.addEventListener('dragstart', (e) => {
        e.dataTransfer.setData('text/plain', JSON.stringify({ pos, idx }));
        e.dataTransfer.effectAllowed = 'move';
    });
    slotEl.addEventListener('dragover', (e) => { e.preventDefault(); e.dataTransfer.dropEffect = 'move'; });
    slotEl.addEventListener('drop', (e) => {
        e.preventDefault();
        const data = JSON.parse(e.dataTransfer.getData('text/plain'));
        handleSlotDrop(data.pos, data.idx, pos, idx);
    });

    if (player) {
        slotEl.classList.add("filled");
        const pts = (player.totalPoints || 0) > 0 ? player.totalPoints.toFixed(1) : player.projPoints.toFixed(1);
        slotEl.innerHTML = `
            <div class="player-slot-badge">${player.name.substring(0,2).toUpperCase()}</div>
            <div class="player-slot-name">${player.name}</div>
            <div class="player-slot-club">${player.club} (${pts} pts)</div>`;
        // Clique: manda para a reserva (não remove do elenco!)
        slotEl.onclick = () => {
            const ri = lineup.RESERVAS.indexOf(null);
            if (ri === -1) { alert('Banco de reservas cheio. Arraste para trocar posições.'); return; }
            lineup.RESERVAS[ri] = player;
            lineup[pos][idx] = null;
            renderPitch();
            LineupStore.scheduleSave();
        };
    } else {
        slotEl.innerHTML = `
            <div class="player-slot-badge"><i class="fa-solid fa-shirt"></i></div>
            <div class="player-slot-name">${defaultName}</div>
            <div class="player-slot-club">Vago</div>`;
    }
    return slotEl;
}

// =============================================
// CONFRONTOS — FONTE ÚNICA: tabela `matchups`
// =============================================
const Matchup = {
    weeks: [],
    currentWeek: null,
    matches: [],

    async loadAll() {
        const lid = currentLeagueId();
        let q = window.supabaseClient
            .from('matchups')
            .select('*, home:home_manager_id(team_name), away:away_manager_id(team_name)')
            .order('week', { ascending: true });
        if (lid) q = q.eq('league_id', lid);
        const { data } = await q;
        Matchup.matches = data || [];
        Matchup.weeks = [...new Set(Matchup.matches.map(m => m.week))].sort((a,b) => a-b);

        if (Matchup.currentWeek === null && Matchup.weeks.length) {
            const open = Matchup.matches.find(m => !m.is_finished);
            Matchup.currentWeek = open ? open.week : Matchup.weeks[Matchup.weeks.length - 1];
        }
    },

    async render() {
        const user = window._currentUser;
        if (!user) return;

        await Matchup.loadAll();

        const label = document.getElementById('matchup-round-label');
        const q = id => document.getElementById(id);

        if (!Matchup.matches.length) {
            if (label) label.textContent = 'Sem confrontos';
            if (q('matchup-home-name')) q('matchup-home-name').textContent = currentManagerName;
            if (q('matchup-away-name')) q('matchup-away-name').textContent = '—';
            const rows = q('matchup-comparison-rows');
            if (rows) rows.innerHTML = `<p style="color:var(--text-muted); padding:20px; text-align:center;">
                O comissário ainda não gerou os confrontos da temporada.<br>
                <span style="font-size:11px;">(Configurações → Gerar Confrontos)</span></p>`;
            return;
        }

        const week = Matchup.currentWeek;
        const weekMatches = Matchup.matches.filter(m => m.week === week);
        const myMatch = weekMatches.find(m => m.home_manager_id === user.id || m.away_manager_id === user.id);

        const phaseRaw = weekMatches[0]?.phase;
        const phase = phaseRaw === 'semifinal' ? 'Semifinal' : phaseRaw === 'final' ? 'Final' : `Rodada ${week}`;
        if (label) label.textContent = phase;

        if (!myMatch) {
            if (q('matchup-home-name')) q('matchup-home-name').textContent = currentManagerName;
            if (q('matchup-home-avatar')) q('matchup-home-avatar').textContent = currentManagerAvatar;
            if (q('matchup-away-name')) q('matchup-away-name').textContent = 'FOLGA';
            if (q('matchup-away-avatar')) q('matchup-away-avatar').textContent = '—';
            if (q('matchup-home-score')) q('matchup-home-score').textContent = '—';
            if (q('matchup-away-score')) q('matchup-away-score').textContent = '—';
            Matchup.renderWeekList(weekMatches);
            return;
        }

        const isHome = myMatch.home_manager_id === user.id;
        const myName = (isHome ? myMatch.home?.team_name : myMatch.away?.team_name) || currentManagerName;
        const oppName = (isHome ? myMatch.away?.team_name : myMatch.home?.team_name) || '—';
        const oppId = isHome ? myMatch.away_manager_id : myMatch.home_manager_id;
        const myScore = isHome ? myMatch.home_score : myMatch.away_score;
        const oppScore = isHome ? myMatch.away_score : myMatch.home_score;

        if (q('matchup-home-name')) q('matchup-home-name').textContent = myName;
        if (q('matchup-home-avatar')) q('matchup-home-avatar').textContent = myName.charAt(0).toUpperCase();
        if (q('matchup-away-name')) q('matchup-away-name').textContent = oppName;
        if (q('matchup-away-avatar')) q('matchup-away-avatar').textContent = oppName.charAt(0).toUpperCase();

        // Projeções (a partir das escalações)
        let homeProj = 0;
        ['GOL','ZAG','LAT','MEI','ATA'].forEach(pos => {
            (lineup[pos] || []).forEach(p => { if (p) homeProj += (p.projPoints || 0); });
        });
        const oppStarters = await Matchup.getStarters(oppId, week);
        let awayProj = 0;
        oppStarters.forEach(p => { if (p) awayProj += (p.projPoints || 0); });

        if (q('matchup-home-projection')) q('matchup-home-projection').textContent = homeProj.toFixed(1);
        if (q('matchup-away-projection')) q('matchup-away-projection').textContent = awayProj.toFixed(1);

        if (myMatch.is_finished) {
            if (q('matchup-home-score')) q('matchup-home-score').textContent = Number(myScore || 0).toFixed(1);
            if (q('matchup-away-score')) q('matchup-away-score').textContent = Number(oppScore || 0).toFixed(1);
        } else {
            if (q('matchup-home-score')) q('matchup-home-score').textContent = '—';
            if (q('matchup-away-score')) q('matchup-away-score').textContent = '—';
        }

        const total = (homeProj + awayProj) || 100;
        const pct = Math.round((homeProj / total) * 100);
        if (q('h2h-bar-home-width')) q('h2h-bar-home-width').style.width = `${pct}%`;
        if (q('h2h-bar-away-width')) q('h2h-bar-away-width').style.width = `${100-pct}%`;
        if (q('matchup-bar-home-label')) q('matchup-bar-home-label').textContent = `${myName}: ${homeProj.toFixed(1)} pts`;
        if (q('matchup-bar-away-label')) q('matchup-bar-away-label').textContent = `${oppName}: ${awayProj.toFixed(1)} pts`;
        if (q('matchup-win-prob-label')) {
            const leader = pct >= 50 ? myName : oppName;
            q('matchup-win-prob-label').textContent = `Aproximação de Vitória: ${Math.max(pct, 100-pct)}% (${leader})`;
        }

        Matchup.renderComparison(oppStarters);
    },

    // Titulares de um manager: lineup salvo; fallback = melhores por posição do roster
    async getStarters(managerId, week) {
        if (!managerId) return [];
        const lid = currentLeagueId();

        let lq = window.supabaseClient.from('lineups').select('*')
            .eq('manager_id', managerId).eq('round', week);
        if (lid) lq = lq.eq('league_id', lid);
        const { data: lrows } = await lq.limit(1);
        const lrow = lrows?.[0];

        if (lrow?.starters) {
            const ids = Object.values(lrow.starters).flat().filter(Boolean);
            const list = ids.map(id => PLAYERS_DATABASE.find(p => p.id === id)).filter(Boolean);
            if (list.length) return list;
        }

        // Fallback: top-11 do roster em 4-3-3
        let pq = window.supabaseClient.from('draft_picks').select('player_id')
            .eq('manager_id', managerId);
        if (lid) pq = pq.eq('league_id', lid);
        const { data: picks } = await pq;
        const roster = (picks || [])
            .map(pk => PLAYERS_DATABASE.find(p => p.id === pk.player_id))
            .filter(Boolean);

        const need = { GOL: 1, ZAG: 2, LAT: 2, MEI: 3, ATA: 3 };
        const starters = [];
        Object.entries(need).forEach(([pos, n]) => {
            roster.filter(p => p.position === pos)
                .sort((a,b) => b.projPoints - a.projPoints)
                .slice(0, n)
                .forEach(p => starters.push(p));
        });
        return starters;
    },

    renderComparison(oppStarters) {
        const container = document.getElementById('matchup-comparison-rows');
        if (!container) return;
        container.innerHTML = '';

        const oppByPos = {};
        oppStarters.forEach(p => {
            if (!oppByPos[p.position]) oppByPos[p.position] = [];
            oppByPos[p.position].push(p);
        });
        Object.values(oppByPos).forEach(arr => arr.sort((a,b) => b.projPoints - a.projPoints));

        const slots = [];
        FORMATIONS[activeFormation].rows.forEach(row => {
            if (row.pos === 'DEFENSE') row.slots.forEach(s => slots.push(s));
            else for (let i = 0; i < row.count; i++) slots.push({ pos: row.pos, idx: i, name: (row.names||[])[i] || row.pos });
        });

        const used = {};
        slots.forEach(slot => {
            const player = lineup[slot.pos]?.[slot.idx];
            used[slot.pos] = used[slot.pos] || 0;
            const oppPlayer = (oppByPos[slot.pos] || [])[used[slot.pos]];
            used[slot.pos]++;

            const el = document.createElement('div');
            el.className = 'player-market-row';
            el.style.cssText = 'grid-template-columns:1fr 2fr 1fr 2fr; padding:10px 20px;';
            const pv = p => (p.totalPoints || 0) > 0 ? p.totalPoints : p.projPoints;
            const hHtml = player
                ? `<strong>${player.name}</strong> <span style="font-size:11px;color:var(--text-muted);">(${pv(player)}pts)</span>`
                : '<span style="color:var(--text-muted);">Não escalado</span>';
            const aHtml = oppPlayer
                ? `<strong>${oppPlayer.name}</strong> <span style="font-size:11px;color:var(--text-muted);">(${pv(oppPlayer)}pts)</span>`
                : '<span style="color:var(--text-muted);">—</span>';
            el.innerHTML = `
                <div style="font-weight:700;color:var(--text-secondary);font-size:11px;text-transform:uppercase;">${slot.name}</div>
                <div style="font-size:13px;color:var(--neon-blue);">${hHtml}</div>
                <div style="text-align:center;font-weight:800;color:var(--text-muted);">VS</div>
                <div style="font-size:13px;color:var(--neon-purple);text-align:right;">${aHtml}</div>`;
            container.appendChild(el);
        });
    },

    renderWeekList(weekMatches) {
        const container = document.getElementById('matchup-comparison-rows');
        if (!container) return;
        container.innerHTML = `<div style="padding:12px 20px; font-size:12px; color:var(--text-muted); font-weight:700; text-transform:uppercase;">Jogos da semana</div>` +
            weekMatches.map(m => `
            <div class="player-market-row" style="grid-template-columns:2fr 1fr 2fr; padding:10px 20px;">
                <div style="font-size:13px; text-align:right;">${m.home?.team_name || '—'}</div>
                <div style="text-align:center; font-weight:800;">
                    ${m.is_finished ? `${Number(m.home_score||0).toFixed(1)} × ${Number(m.away_score||0).toFixed(1)}` : 'vs'}
                </div>
                <div style="font-size:13px;">${m.away?.team_name || '—'}</div>
            </div>`).join('');
    },

    prevRound() {
        const i = Matchup.weeks.indexOf(Matchup.currentWeek);
        if (i > 0) { Matchup.currentWeek = Matchup.weeks[i-1]; Matchup.render(); }
    },
    nextRound() {
        const i = Matchup.weeks.indexOf(Matchup.currentWeek);
        if (i !== -1 && i < Matchup.weeks.length - 1) { Matchup.currentWeek = Matchup.weeks[i+1]; Matchup.render(); }
    }
};

function renderMatchup() { Matchup.render(); }

// --- Exposição global ---
window.switchTab = switchTab;
window.Matchup = Matchup;
window.changeFormation = changeFormation;
window.currentLeagueId = currentLeagueId;
