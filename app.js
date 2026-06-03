// Copia profunda da lista para controlar o estado do jogo
let players = JSON.parse(JSON.stringify(PLAYERS_DATABASE));

// --- ESTADO DO JOGO ---
const LEAGUE_TEAMS = []; // Substituído por managers reais do banco

let activeTab = "dashboard-tab";
let userBudget = ORCAMENTO_INICIAL; // Orçamento em D$ para o restante da temporada
let isGamesSimulated = false;

// Esquema Tático Ativo
let activeFormation = "4-3-3";

// Mapa de Formações Táticas Suportadas
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

// Lineup Inicial baseada no esquema default (4-3-3) com banco e lesões
let lineup = {
    GOL: [null],
    ZAG: [null, null],
    LAT: [null, null],
    MEI: [null, null, null],
    ATA: [null, null, null],
    RESERVAS: new Array(MAX_RESERVAS).fill(null),
    LESOES: new Array(MAX_VAGAS_LESIONADAS).fill(null)
};

// Configuração do Draft
const DRAFT_ROUNDS = RODADAS_DRAFT;
let draftBoardPicks = []; // Registro de todas as escolhas [{round, pick, teamId, player}]
let currentDraftPickIndex = 0; // 0 a (DRAFT_ROUNDS * TEAMS.length) - 1
let draftTimerSeconds = 90;
let draftTimerInterval = null;
let draftFinished = false;

// Mock de Adversários (Times montados para o Matchup)
let botALineup = [];

// --- HISTÓRICO DE MURAL (DASHBOARD) ---
let activityFeed = [];

// --- HISTÓRICO DE MENSAGENS DO CHAT ---
let chatMessages = [];

// initApp chamado pelo auth.js após login
// Variáveis de estado do manager atual
let currentManagerName = "Meu Time";
let currentManagerAvatar = "M";

function initApp(user) {
    setupTabListeners();
    setupChat();
    setupDraft();
    setupMarket();
    setupLineup();
    setupMatchup();
    setupHeaderActions();

    // Busca nome real do manager no banco
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

    // Renders iniciais
    renderMarket();
    renderPitch();
    renderMatchup();
    renderChat();

    // Carrega jogadores draftados do banco
    if (user) setTimeout(() => loadMyDraftedPlayers(), 200);
}

// Carrega jogadores draftados do banco e popula o lineup
async function loadMyDraftedPlayers() {
    const user = window._currentUser;
    if (!user) return;

    const { data: picks } = await window.supabaseClient
        .from('draft_picks')
        .select('*')
        .eq('manager_id', user.id);

    if (!picks?.length) return;

    // Marca jogadores como draftados e auto-popula o lineup
    picks.forEach(pick => {
        const player = PLAYERS_DATABASE.find(p => p.id === pick.player_id);
        if (!player) return;

        player.status = 'contratado';
        player.draftedBy = user.id;

        // Verifica se já está no lineup local
        let alreadyInLineup = false;
        Object.values(lineup).forEach(arr => {
            if (arr.some(p => p && p.id === player.id)) alreadyInLineup = true;
        });
        if (alreadyInLineup) return;

        // Tenta colocar na posição correta
        const pos = player.position;
        if (lineup[pos]) {
            const emptyIdx = lineup[pos].indexOf(null);
            if (emptyIdx !== -1) {
                lineup[pos][emptyIdx] = player;
                return;
            }
        }
        // Reserva se não couber
        const reserveIdx = lineup.RESERVAS.indexOf(null);
        if (reserveIdx !== -1) lineup.RESERVAS[reserveIdx] = player;
    });

    renderPitch();
    updateLineupStats();
}

// Função global exposta para uso no initApp
window.loadMyDraftedPlayers = loadMyDraftedPlayers;

// --- CONTROLE DE ABAS ---
function setupTabListeners() {
    const navItems = document.querySelectorAll(".nav-item");
    navItems.forEach(item => {
        item.addEventListener("click", () => {
            const tabId = item.getAttribute("data-tab");
            if (tabId) switchTab(tabId);
        });
    });

    const ctaBtn = document.getElementById("header-cta-btn");
    if (ctaBtn) {
        ctaBtn.addEventListener("click", () => {
            const tabId = ctaBtn.getAttribute("data-tab");
            if (tabId) switchTab(tabId);
        });
    }

    const logoBtn = document.getElementById("logo-btn");
    if (logoBtn) {
        logoBtn.addEventListener("click", () => switchTab("dashboard-tab"));
    }
}



function switchTab(tabId) {
    activeTab = tabId;
    
    // Atualiza estado visual no menu lateral
    const navItems = document.querySelectorAll(".nav-item");
    navItems.forEach(item => {
        if (item.getAttribute("data-tab") === tabId) {
            item.classList.add("active");
        } else {
            item.classList.remove("active");
        }
    });

    // Exibe a aba correspondente
    const tabContents = document.querySelectorAll(".tab-content");
    tabContents.forEach(content => {
        if (content.getAttribute("id") === tabId) {
            content.classList.add("active");
        } else {
            content.classList.remove("active");
        }
    });

    // Customizações de cabeçalho
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

    // Inicializa módulos ao trocar de aba
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
    if (tabId === "team-tab") {
        loadMyDraftedPlayers();
        renderPitch();
    }
}

// --- HEADER ACTIONS ---
function setupHeaderActions() {
    const simBtn = document.getElementById("simulate-round-btn");
    if (simBtn) simBtn.addEventListener("click", () => simulateRoundPoints());
}

function simulateRoundPoints() {
    if (isGamesSimulated) {
        alert("Os jogos da rodada já foram simulados! Resete ou aguarde a próxima rodada.");
        return;
    }

    // Garante que o usuário escalou 11 jogadores titulares
    let filledCount = 0;
    const starterPositions = ["GOL", "ZAG", "LAT", "MEI", "ATA"];
    starterPositions.forEach(pos => {
        const arr = lineup[pos];
        if (arr) {
            arr.forEach(p => { if (p) filledCount++; });
        }
    });

    if (filledCount < 11) {
        alert("Atenção! Você precisa escalar todos os 11 titulares antes de simular os jogos da rodada. Vá na aba 'Minha Escalação' ou complete no Mercado.");
        switchTab("team-tab");
        return;
    }

    // Se o draft não foi concluído, avisa que deve ser finalizado
    if (!draftFinished) {
        let confirmDraft = confirm("O Draft não terminou. Deseja pular/completar o draft automaticamente para simular a rodada?");
        if (confirmDraft) {
            autoCompleteDraft();
        } else {
            return;
        }
    }

    isGamesSimulated = true;
    
    // Simula a pontuação real de cada jogador do Brasileirão
    players.forEach(p => {
        // Gera pontuação realista baseada na posição e na projeção
        let randomFactor = (Math.random() - 0.4) * 8; // Variabilidade de -3.2 a +4.8
        let score = Math.max(-2.0, (p.projPoints + randomFactor)).toFixed(2);
        p.realPoints = parseFloat(score);
    });

    // Simula a escalação do Adversário (Galácticos BR) caso não esteja montada
    if (botALineup.length === 0) {
        // Pega 11 jogadores aleatórios que não sejam os do usuário
        let userIds = [];
        Object.values(lineup).forEach(arr => {
            arr.forEach(p => { if (p) userIds.push(p.id); });
        });
        
        let availableForBot = players.filter(p => !userIds.includes(p.id));
        // Embaralha e pega os 11 primeiros com posições adequadas
        let tempBotLineup = [];
        const positionsNeeded = FORMATIONS[activeFormation].counts;
        
        Object.keys(positionsNeeded).forEach(pos => {
            let posPlayers = availableForBot.filter(p => p.position === pos);
            for (let i = 0; i < positionsNeeded[pos]; i++) {
                if (posPlayers[i]) tempBotLineup.push(posPlayers[i]);
            }
        });
        botALineup = tempBotLineup;
    }

    // Calcula os pontos totais (apenas para os titulares)
    let userTotalScore = 0;
    starterPositions.forEach(pos => {
        const arr = lineup[pos];
        if (arr) {
            arr.forEach(p => {
                if (p) {
                    const dbPlayer = players.find(x => x.id === p.id);
                    p.realPoints = dbPlayer.realPoints;
                    userTotalScore += p.realPoints;
                }
            });
        }
    });

    // Determina os titulares do Bot
    let botStarters = [];
    const positionsNeeded = FORMATIONS[activeFormation].counts;
    Object.keys(positionsNeeded).forEach(pos => {
        const neededCount = positionsNeeded[pos];
        let posPlayers = botALineup
            .filter(p => p.position === pos)
            .sort((a, b) => b.projPoints - a.projPoints);
        for (let i = 0; i < neededCount; i++) {
            if (posPlayers[i]) {
                botStarters.push(posPlayers[i]);
            }
        }
    });

    let botTotalScore = 0;
    botStarters.forEach(p => {
        const dbPlayer = players.find(x => x.id === p.id);
        p.realPoints = dbPlayer.realPoints;
        botTotalScore += p.realPoints;
    });

    userTotalScore = parseFloat(userTotalScore.toFixed(2));
    botTotalScore = parseFloat(botTotalScore.toFixed(2));

    // Atualiza classificação da Liga
    const standings = LEAGUE_TEAMS;
    
    // Jogo 1: Você vs Galácticos BR
    if (userTotalScore >= botTotalScore) {
        standings[0].wins++;
        standings[1].losses++;
    } else {
        standings[1].wins++;
        standings[0].losses++;
    }
    standings[0].points += userTotalScore;
    standings[1].points += botTotalScore;

    // Jogo 2: Mitadores vs Chapéu Cruzado (Simulado simples)
    let b2score = parseFloat((Math.random() * 40 + 50).toFixed(2));
    let b3score = parseFloat((Math.random() * 40 + 50).toFixed(2));
    if (b2score >= b3score) {
        standings[2].wins++;
        standings[3].losses++;
    } else {
        standings[3].wins++;
        standings[2].losses++;
    }
    standings[2].points += b2score;
    standings[3].points += b3score;

    // Ordena standings por vitórias, depois por pontos
    standings.sort((a, b) => (b.wins - a.wins) || (b.points - a.points));

    // Adiciona feed de atividade
    addActivityLog("system", `Rodada Simulada! <strong>Você</strong> fez <strong>${userTotalScore} pts</strong> vs <strong>${botTotalScore} pts</strong> de Galácticos BR.`);

    // Envia mensagem no Chat da Liga sobre o resultado
    setTimeout(() => {
        addChatMessage("Sistema", `FIM DA RODADA 1! 🚨 Resultados dos confrontos: \n- Você (${userTotalScore} pts) vs Galácticos BR (${botTotalScore} pts)\n- Mitadores (${b2score} pts) vs Chapéu Cruzado (${b3score} pts)`, "💡", "var(--text-muted)", false);
        
        let trashBotName = userTotalScore > botTotalScore ? "Galácticos BR" : "Mitadores FC";
        let botComment = userTotalScore > botTotalScore 
            ? "Dei sorte... Meus zagueiros negativaram tudo! Mas na rodada 2 eu pego o topo da tabela." 
            : "Fácil demais! Falei que meu time de draft estava monstruoso. Arrascaeta mitou!";
        
        setTimeout(() => {
            const activeBot = LEAGUE_TEAMS.find(b => b.name === trashBotName) || LEAGUE_TEAMS[1];
            addChatMessage(activeBot.name, botComment, activeBot.avatar, activeBot.color, false);
        }, 1500);
    }, 1000);

    // Re-renderiza views afetadas
    renderDashboard();
    renderMatchup();
    renderPitch();
    renderMarket();
    
    // Vai para a tela de matchups para ver os placares vibrantes
    switchTab("matchup-tab");
}

function addActivityLog(type, text) {
    const time = "Agora mesmo";
    activityFeed.unshift({ type, text, time });
    renderDashboard();
}

// --- TAB: DASHBOARD RENDERING ---
function renderDashboard() {
    const feedList = document.getElementById("activity-feed");
    feedList.innerHTML = "";
    
    activityFeed.forEach(item => {
        const row = document.createElement("div");
        row.className = "feed-item";
        
        row.innerHTML = `
            <div class="feed-meta">
                <span class="feed-badge ${item.type}">${item.type}</span>
                <span class="feed-text">${item.text}</span>
            </div>
            <span class="feed-time">${item.time}</span>
        `;
        feedList.appendChild(row);
    });

    const standingsBody = document.getElementById("standings-tbody");
    standingsBody.innerHTML = "";

    LEAGUE_TEAMS.forEach((team, idx) => {
        const tr = document.createElement("tr");
        tr.innerHTML = `
            <td>
                <div class="standing-team">
                    <span style="font-weight:700; width:15px; color: var(--text-muted);">${idx+1}</span>
                    <div class="team-avatar" style="background-color: ${team.color}; color: #fff;">${team.avatar}</div>
                    <span>${team.name}</span>
                </div>
            </td>
            <td class="standing-record">${team.wins} - ${team.losses}</td>
            <td class="standing-points">${team.points.toFixed(2)}</td>
        `;
        standingsBody.appendChild(tr);
    });
}

// --- CHAT SYSTEM ---
function setupChat() {
    const chatForm = document.getElementById("chat-form");
    if (!chatForm) return;

    // Carrega mensagens anteriores
    Chat.loadMessages();

    chatForm.addEventListener("submit", (e) => {
        e.preventDefault();
        const input = document.getElementById("chat-input-msg");
        const msgText = input?.value.trim();
        if (msgText) {
            Chat.sendMessage(msgText);
            input.value = "";
        }
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

// --- SISTEMA DE CHAT REAL (SUPABASE) ---
const Chat = {
    subscription: null,

    async clearHistory() {
        if (!confirm('Limpar todo o histórico do chat? Esta ação não pode ser desfeita.')) return;
        await window.supabaseClient.from('chat_messages').delete().neq('id', 0);
        chatMessages = [];
        renderChat();
        Chat.toast?.('Histórico limpo!');
    },

    toast(msg) {
        let t = document.getElementById('chat-toast');
        if (!t) { t = document.createElement('div'); t.id = 'chat-toast'; document.body.appendChild(t); }
        t.textContent = msg;
        t.style.cssText = 'position:fixed;bottom:80px;right:24px;z-index:99999;padding:10px 16px;border-radius:8px;font-size:12px;font-weight:700;background:rgba(0,255,135,0.15);color:var(--neon-green);border:1px solid rgba(0,255,135,0.3);';
        t.style.display = 'block';
        setTimeout(() => { t.style.display = 'none'; }, 2000);
    },

    // Busca nome real do manager diretamente do banco
    async getMyTeamName() {
        const user = window._currentUser;
        if (!user) return 'Meu Time';
        const { data } = await window.supabaseClient
            .from('managers').select('team_name').eq('id', user.id).single();
        return data?.team_name || currentManagerName || 'Meu Time';
    },

    async loadMessages() {
        const { data } = await window.supabaseClient
            .from('chat_messages')
            .select('*')
            .order('created_at', { ascending: true });
            // sem .limit() — carrega todas as mensagens

        chatMessages = (data || []).map(m => Chat.formatMessage(m));
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

        // Usa nome já carregado ou busca do banco
        let teamName = currentManagerName;
        if (!teamName || teamName === 'Meu Time') {
            try {
                teamName = await Chat.getMyTeamName();
            } catch(e) {
                teamName = user.email?.split('@')[0] || 'Manager';
            }
        }

        const { error } = await window.supabaseClient.from('chat_messages').insert({
            league_id: window._currentLeague?.id || null,
            manager_id: user.id,
            team_name: teamName,
            avatar_color: '#00f2fe',
            message: text.trim()
        });

        if (error) console.warn('Chat send error:', error);
    },

    subscribe() {
        if (Chat.subscription) {
            window.supabaseClient.removeChannel(Chat.subscription);
            Chat.subscription = null;
        }

        Chat.subscription = window.supabaseClient
            .channel('chat-live-' + Date.now())
            .on('postgres_changes', {
                event: 'INSERT',
                schema: 'public',
                table: 'chat_messages'
            }, (payload) => {
                // Evita duplicatas
                const exists = chatMessages.some(m => m._id === payload.new.id);
                if (!exists) {
                    const msg = Chat.formatMessage(payload.new);
                    msg._id = payload.new.id;
                    chatMessages.push(msg);
                    renderChat();
                }
            })
            .subscribe((status) => {
                console.log('Chat status:', status);
                if (status === 'CLOSED' || status === 'CHANNEL_ERROR') {
                    setTimeout(() => Chat.subscribe(), 3000);
                }
            });

        // Polling de fallback: recarrega últimas msgs a cada 15s
        if (Chat._pollInterval) clearInterval(Chat._pollInterval);
        Chat._pollInterval = setInterval(async () => {
            const lastId = chatMessages.length > 0
                ? (chatMessages[chatMessages.length-1]._id || 0)
                : 0;
            if (!lastId) return;
            const { data } = await window.supabaseClient
                .from('chat_messages')
                .select('*')
                .gt('id', lastId)
                .order('created_at', { ascending: true });
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

function addChatMessage(author, text, avatar, color, isUser) {
    Chat.sendMessage(text);
}

function addChatMessageWithGif(author, text, gifUrl, avatar, color, isUser) {
    Chat.sendMessage(text);
}

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
            </div>
        `;
        container.appendChild(bubble);
    });

    container.scrollTop = container.scrollHeight;
}

function triggerBotChatReply(userMsg) {
    // Bots removidos — chat real via Supabase
}

// --- DRAFT ROOM SIMULATOR ---
function setupDraft() {
    // Inicializa a grade do Draft de forma visual
    // Snake Board: 4 Times, 6 Rodadas
    // Times: P(User), G(botA), M(botB), C(botC)
    // Inicializa picks livres
    draftBoardPicks = [];
    let pickNum = 1;
    for (let round = 1; round <= DRAFT_ROUNDS; round++) {
        let roundPicks = [];
        let isEvenRound = (round % 2 === 0);
        
        // No snake draft, rounds pares invertem a ordem
        let order = [0, 1, 2, 3]; // Índices dos times
        if (isEvenRound) {
            order.reverse();
        }

        for (let i = 0; i < order.length; i++) {
            const teamIndex = order[i];
            draftBoardPicks.push({
                pickIndex: pickNum - 1,
                round: round,
                pickNumber: pickNum,
                teamId: LEAGUE_TEAMS[teamIndex].id,
                teamName: LEAGUE_TEAMS[teamIndex].name,
                teamColor: LEAGUE_TEAMS[teamIndex].color,
                teamAvatar: LEAGUE_TEAMS[teamIndex].avatar,
                player: null
            });
            pickNum++;
        }
    }

    renderDraftBoard();
    renderDraftPool();

    // Filtro de Busca no Pool de Draft
    const searchInput = document.getElementById("draft-player-search");
    searchInput.addEventListener("input", () => {
        renderDraftPool(searchInput.value);
    });
}

function renderDraftBoard() {
    const boardGrid = document.getElementById("draft-board-grid");
    boardGrid.innerHTML = "";

    // Criamos colunas por time para visualização clássica vertical
    LEAGUE_TEAMS.forEach(team => {
        const col = document.createElement("div");
        col.className = "draft-column";
        col.innerHTML = `<div class="draft-column-header">${team.name}</div>`;

        // Filtra todas as escolhas deste time
        const teamPicks = draftBoardPicks.filter(p => p.teamId === team.id);
        
        teamPicks.forEach(pick => {
            const cell = document.createElement("div");
            cell.className = "draft-cell";
            
            // Verifica se é a pick atual
            const isCurrentPick = !draftFinished && (draftBoardPicks[currentDraftPickIndex].pickNumber === pick.pickNumber);
            if (isCurrentPick) {
                cell.classList.add("active-pick");
            }
            if (pick.teamId === 'user') {
                cell.classList.add("user-pick");
            }

            let playerHtml = "";
            if (pick.player) {
                const posClass = `pos-${pick.player.position.toLowerCase()}`;
                playerHtml = `
                    <span class="player-name">${pick.player.name}</span>
                    <span class="player-info">${pick.player.club}</span>
                    <span class="player-pos ${posClass}">${pick.player.position}</span>
                `;
            } else {
                playerHtml = `<span style="color:var(--text-muted); font-style:italic;">Aguardando...</span>`;
            }

            cell.innerHTML = `
                <div class="pick-num">R${pick.round} #P${pick.pickNumber}</div>
                ${playerHtml}
            `;
            col.appendChild(cell);
        });

        boardGrid.appendChild(col);
    });
}

function renderDraftPool(searchQuery = "") {
    const poolList = document.getElementById("draft-pool-list");
    poolList.innerHTML = "";

    // Filtra jogadores ainda não escolhidos
    let availablePool = players.filter(p => p.status === "disponivel" || p.status === "escalado"); // No draft tudo é livre se não draftado
    
    // Também não permite jogadores já draftados no board
    const draftedIds = draftBoardPicks.filter(p => p.player !== null).map(p => p.player.id);
    availablePool = availablePool.filter(p => !draftedIds.includes(p.id));

    // Filtra busca por texto
    if (searchQuery) {
        availablePool = availablePool.filter(p => p.name.toLowerCase().includes(searchQuery.toLowerCase()));
    }

    // Ordena por maior pontuação projetada
    availablePool.sort((a,b) => b.projPoints - a.projPoints);

    if (availablePool.length === 0) {
        poolList.innerHTML = `<div style="padding:10px; color:var(--text-muted); text-align:center;">Nenhum atleta disponível</div>`;
        return;
    }

    // Desativa botão se não for a vez do usuário
    const isUserTurn = !draftFinished && (draftBoardPicks[currentDraftPickIndex].teamId === 'user');

    availablePool.forEach(player => {
        const row = document.createElement("div");
        row.className = "draft-player-row";
        
        const posClass = `pos-${player.position.toLowerCase()}`;
        
        row.innerHTML = `
            <div class="draft-player-details">
                <span class="player-name-txt">${player.name}</span>
                <div class="draft-player-meta">
                    <span class="player-pos-badge ${posClass}">${player.position}</span>
                    <span class="player-club-txt">${player.club}</span>
                    <span>• Proj: <strong>${player.projPoints.toFixed(2)}</strong></span>
                </div>
            </div>
            <button class="draft-btn" ${!isUserTurn ? 'disabled' : ''} onclick="draftPlayer(${player.id})">
                Escolher
            </button>
        `;
        poolList.appendChild(row);
    });
}

function startDraftTimer() {
    if (draftTimerInterval) clearInterval(draftTimerInterval);
    draftTimerSeconds = 90;
    document.getElementById("draft-timer-clock").innerText = "01:30";

    draftTimerInterval = setInterval(() => {
        draftTimerSeconds--;
        let min = String(Math.floor(draftTimerSeconds / 60)).padStart(2, '0');
        let sec = String(draftTimerSeconds % 60).padStart(2, '0');
        document.getElementById("draft-timer-clock").innerText = `${min}:${sec}`;

        if (draftTimerSeconds <= 0) {
            clearInterval(draftTimerInterval);
            // Escolha automática (tempo esgotado)
            forceAutoDraftPick();
        }
    }, 1000);
}

// O usuário clica em Escolher jogador
function draftPlayer(playerId) {
    if (draftFinished) return;
    
    const currentPick = draftBoardPicks[currentDraftPickIndex];
    if (currentPick.teamId !== 'user') return; // Segurança

    const player = players.find(p => p.id === playerId);
    if (!player) return;

    // Registra escolha
    executeDraftPick(currentPick, player);
}

function executeDraftPick(pickObj, playerObj) {
    // Altera o estado do jogador no banco
    playerObj.status = "draftado";
    playerObj.draftedBy = pickObj.teamId;
    
    pickObj.player = playerObj;

    // Adiciona ao feed de atividades
    addActivityLog("draft", `<strong>${pickObj.teamName}</strong> escolheu o atacante/meia <strong>${playerObj.name}</strong> (${playerObj.position} - ${playerObj.club}) na escolha #${pickObj.pickNumber}.`);

    // Envia aviso no chat
    addChatMessage(pickObj.teamName, `Draftado! Garanti o ${playerObj.name} (${playerObj.position} - ${playerObj.club}) para o meu esquadrão! 🚀`, pickObj.teamAvatar, pickObj.teamColor, pickObj.teamId === 'user');

    // Se for o usuário, tenta colocar automaticamente no lineup se a vaga estiver livre
    if (pickObj.teamId === 'user') {
        autoInsertIntoLineup(playerObj);
    } else if (pickObj.teamId === 'botA') {
        // Guarda também no mock de lineup do adversário principal para o Matchup
        botALineup.push(playerObj);
    }

    // Avança turno
    currentDraftPickIndex++;
    
    if (currentDraftPickIndex >= draftBoardPicks.length) {
        // Fim do Draft
        finishDraft();
    } else {
        // Próxima escolha
        renderDraftBoard();
        renderDraftPool();
        startDraftTimer();
        
        // Verifica se é a vez do robô escolher
        checkAndExecuteBotPick();
    }
}

function checkAndExecuteBotPick() {
    if (draftFinished) return;

    const nextPick = draftBoardPicks[currentDraftPickIndex];
    if (nextPick.teamId !== 'user') {
        // Desativa ações e inicia simulação de escolha do Bot
        document.getElementById("current-pick-announcement").innerHTML = `Aguardando a escolha de <strong>${nextPick.teamName}</strong>...`;
        document.getElementById("draft-ticker-msg").innerText = `RODADA ${nextPick.round} • ESCOLHA #${nextPick.pickNumber}`;

        // Simula decisão do bot após 2 a 3 segundos
        setTimeout(() => {
            if (draftFinished) return;
            
            // Pega o melhor jogador disponível baseado na maior projeção
            const draftedIds = draftBoardPicks.filter(p => p.player !== null).map(p => p.player.id);
            const available = players
                .filter(p => !draftedIds.includes(p.id))
                .sort((a,b) => b.projPoints - a.projPoints);

            if (available.length > 0) {
                // Bots preferem posições faltantes (lógica simples: primeiro que aparecer)
                executeDraftPick(nextPick, available[0]);
            }
        }, 2000 + Math.random() * 1000);
    } else {
        // Turno do Usuário
        document.getElementById("current-pick-announcement").innerHTML = `Seu turno! Faça sua escolha na rodada ${nextPick.round}.`;
        document.getElementById("draft-ticker-msg").innerText = `RODADA ${nextPick.round} • ESCOLHA #${nextPick.pickNumber}`;
        renderDraftPool(); // Ativa os botões
    }
}

function forceAutoDraftPick() {
    const nextPick = draftBoardPicks[currentDraftPickIndex];
    const draftedIds = draftBoardPicks.filter(p => p.player !== null).map(p => p.player.id);
    const available = players
        .filter(p => !draftedIds.includes(p.id))
        .sort((a,b) => b.projPoints - a.projPoints);

    if (available.length > 0) {
        executeDraftPick(nextPick, available[0]);
    }
}

function finishDraft() {
    draftFinished = true;
    if (draftTimerInterval) clearInterval(draftTimerInterval);
    
    document.getElementById("draft-timer-clock").innerText = "FIM";
    document.getElementById("current-pick-announcement").innerText = "Draft Concluído com Sucesso!";
    document.getElementById("draft-ticker-msg").innerText = "LIGA PRONTA PARA A RODADA";
    
    // Esconde Badge LIVE da sidebar
    document.getElementById("draft-badge").style.display = "none";

    addActivityLog("system", "O draft da liga foi concluído! Times estruturados e prontos para a simulação.");
    addChatMessage("Sistema", "O Draft foi finalizado! Verifique suas escalações no campinho e prepare-se para simular a rodada. 🏆", "💡", "var(--text-muted)", false);

    renderDraftBoard();
    renderDraftPool();
    renderPitch();
    renderMatchup();
}

function autoCompleteDraft() {
    while (!draftFinished) {
        forceAutoDraftPick();
    }
}

function autoInsertIntoLineup(player) {
    let slots = lineup[player.position];
    let emptyIdx = slots ? slots.indexOf(null) : -1;
    if (emptyIdx !== -1) {
        slots[emptyIdx] = player;
        player.status = "escalado";
    } else {
        // Tenta colocar no banco de reservas
        let reserveIdx = lineup.RESERVAS.indexOf(null);
        if (reserveIdx !== -1) {
            lineup.RESERVAS[reserveIdx] = player;
            player.status = "escalado";
        }
    }
}

// --- MARKET AND LINEUP MANAGEMENT ---
function setupMarket() {
    // Filtro por Posição (Pills)
    const pills = document.querySelectorAll("#position-filter-container .filter-pill");
    pills.forEach(pill => {
        pill.addEventListener("click", () => {
            pills.forEach(p => p.classList.remove("active"));
            pill.classList.add("active");
            
            const selectedPos = pill.getAttribute("data-pos");
            filterMarket(selectedPos, document.getElementById("market-player-search").value);
        });
    });

    // Filtro por barra de busca
    const searchInput = document.getElementById("market-player-search");
    searchInput.addEventListener("input", () => {
        const activePill = document.querySelector("#position-filter-container .filter-pill.active");
        const pos = activePill ? activePill.getAttribute("data-pos") : "TODOS";
        filterMarket(pos, searchInput.value);
    });
}

function filterMarket(position = "TODOS", searchVal = "") {
    let filtered = players;

    // Filtro de busca textual
    if (searchVal) {
        filtered = filtered.filter(p => p.name.toLowerCase().includes(searchVal.toLowerCase()));
    }

    // Filtro de posição
    if (position !== "TODOS") {
        filtered = filtered.filter(p => p.position === position);
    }

    renderMarketList(filtered);
}

function renderMarket() {
    filterMarket("TODOS", "");
}

function renderMarketList(playerList) {
    const container = document.getElementById("market-players-list");
    if (!container) return;
    container.innerHTML = "";

    if (playerList.length === 0) {
        container.innerHTML = `<div style="padding: 20px; text-align: center; color: var(--text-muted);">Nenhum jogador encontrado.</div>`;
        return;
    }

    // Ordena por projeção de temporada
    const sorted = [...playerList].sort((a,b) => b.projPoints - a.projPoints);

    sorted.forEach(player => {
        const row = document.createElement("div");
        row.className = "player-market-row";
        const posClass = `pos-${player.position.toLowerCase()}`;

        let isHired = false;
        Object.values(lineup).forEach(arr => {
            if (arr.some(p => p && p.id === player.id)) isHired = true;
        });

        let buttonHtml = "";
        const draftIsFinished = (typeof Draft !== 'undefined' && Draft.state.draftState?.is_finished)
            || window._draftState?.is_finished;
        const draftIsActive = (typeof Draft !== 'undefined' && Draft.state.draftState?.draft_status === 'active')
            || window._draftState?.draft_status === 'active';

        if (isHired) {
            buttonHtml = `<button class="market-action-btn added" onclick="sellPlayerFromMarket(${player.id})">Remover</button>`;
        } else if (draftIsFinished) {
            buttonHtml = `<button class="market-action-btn" onclick="buyPlayerFromMarket(${player.id})">Waiver</button>`;
        } else if (draftIsActive) {
            buttonHtml = `<button class="market-action-btn" disabled style="opacity:0.4;cursor:not-allowed;">
                <i class="fa-solid fa-circle-dot" style="font-size:10px;color:var(--neon-green);"></i> Draft
            </button>`;
        } else {
            buttonHtml = `<button class="market-action-btn" disabled style="opacity:0.4;cursor:not-allowed;">
                <i class="fa-solid fa-lock" style="font-size:10px;"></i> Bloqueado
            </button>`;
        }

        // Stats reais
        const gols = player.gols || 0;
        const assists = player.assistencias || 0;
        const jogos = player.jogos || 0;
        const cs = player.cleanSheets || 0;
        const pos = player.position;

        let statParts = [];
        if (gols > 0) statParts.push(`⚽${gols}`);
        if (assists > 0) statParts.push(`🅰️${assists}`);
        if (cs > 0 && (pos === 'GOL' || pos === 'ZAG' || pos === 'LAT')) statParts.push(`🧤${cs} CS`);
        if (jogos > 0) statParts.push(`${jogos}j`);
        const statsStr = statParts.length ? statParts.join(' · ') : 'Sem dados';

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
                <span class="player-stat-val" style="color:var(--neon-green);">${player.projPoints}</span>
                <span class="player-stat-lbl">proj. temporada</span>
            </div>

            ${buttonHtml}
        `;
        container.appendChild(row);
    });
}

function buyPlayerFromMarket(playerId) {
    const player = players.find(p => p.id === playerId);
    if (!player) return;

    // Confere orçamento
    if (userBudget < player.cost) {
        alert(`Erro: Você não tem ${MOEDA_LABEL} suficientes! Venda jogadores do seu elenco atual para obter saldo.`);
        return;
    }

    // Procura vaga livre na respectiva posição
    let slots = lineup[player.position];
    let emptyIndex = slots ? slots.indexOf(null) : -1;

    if (emptyIndex === -1) {
        // Tenta colocar no banco de reservas
        let reserveSlots = lineup.RESERVAS;
        let reserveIdx = reserveSlots.findIndex(p => p === null);
        if (reserveIdx !== -1) {
            reserveSlots[reserveIdx] = player;
        } else {
            // Tenta colocar nas vagas de lesão (permite usuário manualmente)
            let injurySlots = lineup.LESOES;
            let injuryIdx = injurySlots.findIndex(p => p === null);
            if (injuryIdx !== -1) {
                injurySlots[injuryIdx] = player;
            } else {
                alert(`Erro: Não há vagas disponíveis nem nos titulares, nem no banco de reservas, nem nas vagas de lesão.`);
                return;
            }
        }
    } else {
        // Adiciona ao lineup
        slots[emptyIndex] = player;
    }
    player.status = "escalado";
    userBudget -= player.cost;

    addActivityLog("trade", `Você contratou <strong>${player.name}</strong> por <strong>${MOEDA_LABEL} ${player.cost.toFixed(2)}</strong>.`);

    updateLineupStats();
    renderMarket();
    renderPitch();
    renderMatchup();
}

function sellPlayerFromMarket(playerId) {
    const player = players.find(p => p.id === playerId);
    if (!player) return;

    let removed = false;
    // Check starters
    if (lineup[player.position]) {
        let slots = lineup[player.position];
        let idx = slots.findIndex(p => p && p.id === player.id);
        if (idx !== -1) {
            slots[idx] = null;
            removed = true;
        }
    }
    // Check reserves
    if (!removed) {
        let rIdx = lineup.RESERVAS.findIndex(p => p && p.id === player.id);
        if (rIdx !== -1) {
            lineup.RESERVAS[rIdx] = null;
            removed = true;
        }
    }
    // Check injuries
    if (!removed) {
        let iIdx = lineup.LESOES.findIndex(p => p && p.id === player.id);
        if (iIdx !== -1) {
            lineup.LESOES[iIdx] = null;
            removed = true;
        }
    }

    if (removed) {
        player.status = "disponivel";
        userBudget += player.cost;

        addActivityLog("trade", `Você vendeu/removeu <strong>${player.name}</strong> e obteve reembolso de <strong>${MOEDA_LABEL} ${player.cost.toFixed(2)}</strong>.`);

        updateLineupStats();
        renderMarket();
        renderPitch();
        renderMatchup();
    }
}

function setupLineup() {
    const resetBtn = document.getElementById("reset-team-btn");
    if (resetBtn) resetBtn.addEventListener("click", () => {
        let confirmReset = confirm("Deseja realmente remover todos os jogadores de sua escalação tática?");
        if (confirmReset) {
            Object.keys(lineup).forEach(pos => {
                lineup[pos] = lineup[pos].map(p => {
                    if (p) {
                        const dbPlayer = players.find(x => x.id === p.id);
                        if (dbPlayer) dbPlayer.status = "disponivel";
                    }
                    return null;
                });
            });
            userBudget = ORCAMENTO_INICIAL;
            updateLineupStats();
            renderMarket();
            renderPitch();
            renderMatchup();
            addActivityLog("system", "Você desescalou todos os atletas de sua equipe.");
        }
    });

    const formationSelect = document.getElementById("formation-select");
    if (formationSelect) formationSelect.addEventListener("change", (e) => {
        changeFormation(e.target.value);
    });
}

function changeFormation(newFormation) {
    if (!FORMATIONS[newFormation]) return;
    activeFormation = newFormation;
    const newCounts = FORMATIONS[newFormation].counts;

    // Coleta todos os jogadores titulares atuais
    const allPlayers = { GOL:[], ZAG:[], LAT:[], MEI:[], ATA:[] };
    ['GOL','ZAG','LAT','MEI','ATA'].forEach(pos => {
        (lineup[pos] || []).forEach(p => { if (p) allPlayers[pos].push(p); });
    });

    // Reconstrói lineup com novo tamanho
    ['GOL','ZAG','LAT','MEI','ATA'].forEach(pos => {
        const slots = newCounts[pos] || 0;
        lineup[pos] = [];
        for (let i = 0; i < slots; i++) {
            lineup[pos].push(allPlayers[pos][i] || null);
        }
        // Jogadores excedentes vão para reservas (expande se precisar)
        for (let i = slots; i < allPlayers[pos].length; i++) {
            const player = allPlayers[pos][i];
            const ri = lineup.RESERVAS.indexOf(null);
            if (ri !== -1) {
                lineup.RESERVAS[ri] = player;
            } else {
                lineup.RESERVAS.push(player); // expande reservas
            }
        }
    });

    renderPitch();
    renderMarket();
    updateLineupStats();
}

function updateLineupStats() {
    let startersCount = 0;
    let benchCount = 0;
    let injuredCount = 0;
    let proj = 0.0;
    const starterPositions = ["GOL", "ZAG", "LAT", "MEI", "ATA"];

    starterPositions.forEach(pos => {
        (lineup[pos] || []).forEach(p => {
            if (p) { startersCount++; proj += p.projPoints || 0; }
        });
    });
    (lineup.RESERVAS || []).forEach(p => { if (p) benchCount++; });
    (lineup.LESOES || []).forEach(p => { if (p) injuredCount++; });

    const set = (id, val) => { const el = document.getElementById(id); if (el) el.innerText = val; };
    set("lineup-count-val", `${startersCount} / 11`);
    set("bench-count-val", `${benchCount} / 7`);
    set("injured-count-val", `${injuredCount} / 2`);
    set("lineup-cost-val", `${MOEDA_LABEL} ${userBudget.toFixed(2)}`);
    set("lineup-projection-val", `${proj.toFixed(2)} pts`);
}

function renderPitch() {
    const pitchGrid = document.getElementById("pitch-grid-slots");
    if (!pitchGrid) return;
    pitchGrid.innerHTML = "";

    const oldReserves = document.getElementById("reserves-container");
    if (oldReserves) oldReserves.remove();
    const oldInjuries = document.getElementById("injuries-container");
    if (oldInjuries) oldInjuries.remove();

    const formationConfig = FORMATIONS[activeFormation];
    if (!formationConfig) return;

    // Garante que lineup tem slots suficientes para a formação (só adiciona, não remove)
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
                const player = lineup[slot.pos][slot.idx];
                const slotEl = generateSlotHtml(slot.pos, slot.idx, player, slot.name);
                rowDiv.appendChild(slotEl);
            });
        } else {
            for (let idx = 0; idx < rowConfig.count; idx++) {
                const player = lineup[rowConfig.pos][idx];
                const displayName = rowConfig.names[idx] || rowConfig.pos;
                const slotEl = generateSlotHtml(rowConfig.pos, idx, player, displayName);
                rowDiv.appendChild(slotEl);
            }
        }

        pitchGrid.appendChild(rowDiv);
    });

    // Render reservas — usa container fixo no HTML abaixo do campo
    const benchSlots = document.getElementById("bench-slots");
    if (benchSlots) {
        benchSlots.innerHTML = "";
        lineup.RESERVAS.forEach((player, idx) => {
            const slotEl = generateBenchSlotHtml("RESERVAS", idx, player, `Reserva ${idx + 1}`);
            benchSlots.appendChild(slotEl);
        });
    }

    // Render lesões — usa container fixo no HTML
    const injuredSlots = document.getElementById("injured-slots");
    if (injuredSlots) {
        injuredSlots.innerHTML = "";
        lineup.LESOES.forEach((player, idx) => {
            const slotEl = generateBenchSlotHtml("LESOES", idx, player, `Lesão ${idx + 1}`);
            injuredSlots.appendChild(slotEl);
        });
    }

    updateLineupStats();
}

// Gera slot para banco de reservas e lesionados (estilo diferente do campo)
function generateBenchSlotHtml(pos, idx, player, defaultName) {
    const slotEl = document.createElement("div");
    slotEl.className = "bench-player-slot";
    slotEl.setAttribute("data-position", pos);
    slotEl.setAttribute("data-index", idx);
    slotEl.draggable = true;

    slotEl.addEventListener('dragstart', (e) => {
        e.dataTransfer.setData('text/plain', JSON.stringify({ pos, idx }));
    });
    slotEl.addEventListener('dragover', (e) => { e.preventDefault(); });
    slotEl.addEventListener('drop', (e) => {
        e.preventDefault();
        const data = JSON.parse(e.dataTransfer.getData('text/plain'));
        const srcArr = lineup[data.pos];
        const dstArr = lineup[pos];
        const tmp = srcArr[data.idx];
        srcArr[data.idx] = dstArr[idx];
        dstArr[idx] = tmp;
        renderPitch();
    });

    if (player) {
        slotEl.classList.add("filled");
        const badgeEl = document.createElement("div");
        badgeEl.className = "bench-slot-badge";
        badgeEl.innerText = player.name.substring(0, 2).toUpperCase();
        slotEl.appendChild(badgeEl);
        const nameEl = document.createElement("div");
        nameEl.className = "bench-slot-name";
        nameEl.innerText = player.name;
        slotEl.appendChild(nameEl);
    } else {
        const badgeEl = document.createElement("div");
        badgeEl.className = "bench-slot-badge";
        badgeEl.innerHTML = `<i class="fa-solid fa-shirt" style="font-size:14px;"></i>`;
        slotEl.appendChild(badgeEl);
        const nameEl = document.createElement("div");
        nameEl.className = "bench-slot-name";
        nameEl.innerText = defaultName;
        slotEl.appendChild(nameEl);
    }

    slotEl.addEventListener("click", () => {
        if (player) {
            const confirmRemove = confirm(`Remover ${player.name} do banco?`);
            if (confirmRemove) {
                lineup[pos][idx] = null;
                const dbPlayer = players.find(p => p.id === player.id);
                if (dbPlayer) dbPlayer.status = "disponivel";
                renderPitch();
                renderMarket();
            }
        }
    });

    return slotEl;
}
function generateSlotHtml(pos, idx, player, defaultName) {
    const slotEl = document.createElement("div");
    slotEl.className = "pitch-player-slot";
    slotEl.setAttribute("data-position", pos);
    slotEl.setAttribute("data-index", idx);
    // Make slot draggable
    slotEl.draggable = true;
    slotEl.addEventListener('dragstart', (e) => {
        e.dataTransfer.setData('text/plain', JSON.stringify({ pos, idx }));
        // optional visual cue
        e.dataTransfer.effectAllowed = 'move';
    });
    slotEl.addEventListener('dragover', (e) => {
        e.preventDefault();
        e.dataTransfer.dropEffect = 'move';
    });
    slotEl.addEventListener('drop', (e) => {
        e.preventDefault();
        const data = JSON.parse(e.dataTransfer.getData('text/plain'));
        const srcPos = data.pos;
        const srcIdx = data.idx;
        const dstPos = pos;
        const dstIdx = idx;

        const srcArr = lineup[srcPos];
        const dstArr = lineup[dstPos];
        const dragPlayer = srcArr[srcIdx];
        const targetPlayer = dstArr[dstIdx];

        // Se a posição de destino for titular, o jogador arrastado deve ser daquela posição
        const starterPositions = ["GOL", "ZAG", "LAT", "MEI", "ATA"];
        if (starterPositions.includes(dstPos) && dragPlayer && dragPlayer.position !== dstPos) {
            alert(`Erro: Apenas jogadores da posição ${dstPos} podem ser colocados nesta vaga!`);
            return;
        }
        // Se a posição de origem for titular, o jogador de destino (se houver) deve ser daquela posição
        if (starterPositions.includes(srcPos) && targetPlayer && targetPlayer.position !== srcPos) {
            alert(`Erro: Apenas jogadores da posição ${srcPos} podem ser colocados nesta vaga!`);
            return;
        }

        // Swap players in lineup
        srcArr[srcIdx] = targetPlayer;
        dstArr[dstIdx] = dragPlayer;
        renderPitch();
    });

    if (player) {
        slotEl.classList.add("filled");
        const badgeEl = document.createElement("div");
        badgeEl.className = "player-slot-badge";
        badgeEl.innerText = player.name.substring(0,2).toUpperCase();
        slotEl.appendChild(badgeEl);

        const nameEl = document.createElement("div");
        nameEl.className = "player-slot-name";
        nameEl.innerText = player.name;
        slotEl.appendChild(nameEl);

        const clubEl = document.createElement("div");
        clubEl.className = "player-slot-club";
        let ptsText = isGamesSimulated ? `${player.realPoints.toFixed(1)}` : `${player.projPoints.toFixed(1)}`;
        clubEl.innerText = `${player.club} (${ptsText} pts)`;
        slotEl.appendChild(clubEl);

        slotEl.onclick = () => {
            sellPlayerFromMarket(player.id);
        };
    } else {
        const badgeEl = document.createElement("div");
        badgeEl.className = "player-slot-badge";
        badgeEl.innerHTML = `<i class="fa-solid fa-shirt"></i>`;
        slotEl.appendChild(badgeEl);

        const nameEl = document.createElement("div");
        nameEl.className = "player-slot-name";
        nameEl.innerText = defaultName;
        slotEl.appendChild(nameEl);

        const clubEl = document.createElement("div");
        clubEl.className = "player-slot-club";
        clubEl.innerText = "Vago";
        slotEl.appendChild(clubEl);
        // No onclick for empty slot
    }
    return slotEl;
}

// --- CONFRONTOS (MATCHUPS) ---
function setupMatchup() {}

// Sistema de confrontos com navegação por rodada
const Matchup = {
    currentRound: 1,
    totalRounds: 38,
    schedule: null, // gerado uma vez com base nos managers

    // Gera calendário round-robin para todos os managers
    generateSchedule(managers) {
        // Algoritmo round-robin com todos os managers (reais + bots)
        const n = managers.length;
        if (n < 2) return {};
        const schedule = {};

        // Se n ímpar, adiciona BYE
        const teams = n % 2 === 0 ? [...managers] : [...managers, { id: 'BYE', team_name: 'BYE' }];
        const t = teams.length;
        const rounds = t - 1;

        for (let r = 0; r < rounds; r++) {
            schedule[r + 1] = [];
            for (let i = 0; i < t / 2; i++) {
                const home = teams[i];
                const away = teams[t - 1 - i];
                if (home.id !== 'BYE' && away.id !== 'BYE') {
                    schedule[r + 1].push({ home, away });
                }
            }
            // Rotaciona (mantém teams[0] fixo)
            teams.splice(1, 0, teams.pop());
        }

        // Repete para completar 38 rodadas (2º turno inverte mandos)
        for (let r = rounds + 1; r <= 38; r++) {
            const baseRound = schedule[((r - rounds - 1) % rounds) + 1] || [];
            schedule[r] = baseRound.map(m => ({ home: m.away, away: m.home }));
        }

        return schedule;
    },

    async render() {
        const user = window._currentUser;
        if (!user) return;

        const { data: allManagers } = await window.supabaseClient
            .from('managers').select('id, team_name, total_points');
        if (!allManagers?.length) return;

        // Inclui TODOS os managers (reais + bots) no schedule
        if (!Matchup.schedule) Matchup.schedule = Matchup.generateSchedule(allManagers);
        const BOT_PREFIX = '00000000-0000-0000-0000-';

        const round = Matchup.currentRound;
        document.getElementById('matchup-round-label').textContent = `Rodada ${round}`;

        // Nome do meu time direto do banco
        const myManager = allManagers.find(m => m.id === user.id);
        const myName = myManager?.team_name || 'Meu Time';
        const myLetter = myName.charAt(0).toUpperCase();

        // Adversário desta rodada — round-robin ou fallback
        const roundMatches = Matchup.schedule[round] || [];
        const myMatch = roundMatches.find(m => m.home?.id === user.id || m.away?.id === user.id);
        const others = managers.filter(m => m.id !== user.id);
        let opponentId = null, opponentName = '—', opponentLetter = '?';

        if (myMatch) {
            const opp = myMatch.home?.id === user.id ? myMatch.away : myMatch.home;
            opponentId = opp?.id; opponentName = opp?.team_name || '—'; opponentLetter = opponentName.charAt(0).toUpperCase();
        } else if (others.length > 0) {
            const opp = others[(round - 1) % others.length];
            opponentId = opp?.id; opponentName = opp?.team_name || '—'; opponentLetter = opponentName.charAt(0).toUpperCase();
        }

        // Projeção do meu time
        let homeProj = 0;
        ['GOL','ZAG','LAT','MEI','ATA'].forEach(pos => {
            (lineup[pos] || []).forEach(p => { if (p) homeProj += (p.projPoints || 0); });
        });

        // Projeção do adversário
        let awayProj = 0;
        if (opponentId) {
            const { data: oppPicks } = await window.supabaseClient.from('draft_picks').select('player_id').eq('manager_id', opponentId);
            if (oppPicks?.length) {
                let total = 0;
                oppPicks.forEach(pk => { const p = PLAYERS_DATABASE.find(x => x.id === pk.player_id); if (p) total += (p.projPoints || 0); });
                awayProj = Math.round((total / oppPicks.length) * 11 * 10) / 10;
            }
        }

        const q = id => document.getElementById(id);
        if (q('matchup-home-name')) q('matchup-home-name').textContent = myName;
        if (q('matchup-home-avatar')) q('matchup-home-avatar').textContent = myLetter;
        if (q('matchup-away-name')) q('matchup-away-name').textContent = opponentName;
        if (q('matchup-away-avatar')) q('matchup-away-avatar').textContent = opponentLetter;
        if (q('matchup-home-projection')) q('matchup-home-projection').textContent = homeProj.toFixed(1);
        if (q('matchup-away-projection')) q('matchup-away-projection').textContent = awayProj.toFixed(1);
        if (q('matchup-home-score')) q('matchup-home-score').textContent = '—';
        if (q('matchup-away-score')) q('matchup-away-score').textContent = '—';

        const total = (homeProj + awayProj) || 100;
        const pct = Math.round((homeProj / total) * 100);
        if (q('h2h-bar-home-width')) q('h2h-bar-home-width').style.width = `${pct}%`;
        if (q('h2h-bar-away-width')) q('h2h-bar-away-width').style.width = `${100-pct}%`;
        if (q('matchup-bar-home-label')) q('matchup-bar-home-label').textContent = `${myName}: ${homeProj.toFixed(1)} pts`;
        if (q('matchup-bar-away-label')) q('matchup-bar-away-label').textContent = `${opponentName}: ${awayProj.toFixed(1)} pts`;
        if (q('matchup-win-prob-label')) {
            const leader = pct >= 50 ? myName : opponentName;
            q('matchup-win-prob-label').textContent = `Aproximação de Vitória: ${Math.max(pct, 100-pct)}% (${leader})`;
        }

        // Carrega picks do adversário para o comparativo
        let oppPlayerMap = {}; // pos -> [player, ...]
        if (opponentId && !opponentId.startsWith('BYE')) {
            const { data: oppPicks } = await window.supabaseClient
                .from('draft_picks').select('*').eq('manager_id', opponentId);
            if (oppPicks?.length) {
                oppPicks.forEach(pk => {
                    const p = PLAYERS_DATABASE.find(x => x.id === pk.player_id);
                    if (p) {
                        if (!oppPlayerMap[p.position]) oppPlayerMap[p.position] = [];
                        oppPlayerMap[p.position].push(p);
                    }
                });
                // Ordena por projeção desc
                Object.keys(oppPlayerMap).forEach(pos => {
                    oppPlayerMap[pos].sort((a,b) => b.projPoints - a.projPoints);
                });
            }
        }
        if (listContainer) {
            listContainer.innerHTML = '';
            const slots = [];
            FORMATIONS[activeFormation].rows.forEach(row => {
                if (row.pos === 'DEFENSE') row.slots.forEach(s => slots.push(s));
                else for (let i = 0; i < row.count; i++) slots.push({ pos: row.pos, idx: i, name: (row.names||[])[i] || row.pos });
            });
            slots.forEach(slot => {
                const player = lineup[slot.pos]?.[slot.idx];
                const el = document.createElement('div');
                el.className = 'player-market-row';
                el.style.cssText = 'grid-template-columns:1fr 2fr 1fr 2fr; padding:10px 20px;';
                const hHtml = player ? `<strong>${player.name}</strong> <span style="font-size:11px;color:var(--text-muted);">(${player.projPoints}pts)</span>` : '<span style="color:var(--text-muted);">Não escalado</span>';
                const oppIdx = slot.idx || 0;
                const oppPlayer = (oppPlayerMap[slot.pos] || [])[oppIdx];
                const aHtml = oppPlayer ? `<strong>${oppPlayer.name}</strong> <span style="font-size:11px;color:var(--text-muted);">(${oppPlayer.projPoints}pts)</span>` : '<span style="color:var(--text-muted);">—</span>';
                el.innerHTML = `<div style="font-weight:700;color:var(--text-secondary);font-size:11px;text-transform:uppercase;">${slot.name}</div><div style="font-size:13px;color:var(--neon-blue);">${hHtml}</div><div style="text-align:center;font-weight:800;color:var(--text-muted);">VS</div><div style="font-size:13px;color:var(--neon-purple);text-align:right;">${aHtml}</div>`;
                listContainer.appendChild(el);
            });
        }
    },
    prevRound() {
        if (Matchup.currentRound > 1) { Matchup.currentRound--; Matchup.render(); }
    },
    nextRound() {
        if (Matchup.currentRound < 38) { Matchup.currentRound++; Matchup.render(); }
    }
};

function renderMatchup() { Matchup.render(); }


// Expondo funções necessárias globalmente para os handlers de eventos inline
window.switchTab = switchTab;
window.draftPlayer = draftPlayer;
window.buyPlayerFromMarket = buyPlayerFromMarket;
window.sellPlayerFromMarket = sellPlayerFromMarket;
window.Matchup = Matchup;
window.changeFormation = changeFormation;
