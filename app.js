// Copia profunda da lista para controlar o estado do jogo
let players = JSON.parse(JSON.stringify(PLAYERS_DATABASE));

// --- ESTADO DO JOGO ---
// Nome e dados do manager atual (preenchidos após login)
let currentManagerName = "Meu Time";
let currentManagerAvatar = "M";

let activeTab = "dashboard-tab";
let userBudget = ORCAMENTO_INICIAL;
let isGamesSimulated = false;
let activeFormation = "4-3-3";

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

// --- HISTÓRICO DE MURAL (DASHBOARD) ---
let activityFeed = [];

// --- HISTÓRICO DE MENSAGENS DO CHAT ---
let chatMessages = [];

// NÃO inicializa automaticamente — aguarda o login pelo auth.js
// initApp é chamado por auth.js após autenticação

function initApp(user) {
    setupTabListeners();
    setupChat();
    setupMarket();
    setupLineup();
    setupMatchup();
    setupHeaderActions();

    // Busca nome real do manager
    if (user) {
        window.supabaseClient
            .from('managers')
            .select('team_name, avatar_letter, budget')
            .eq('id', user.id)
            .single()
            .then(({ data }) => {
                if (data) {
                    currentManagerName = data.team_name || 'Meu Time';
                    currentManagerAvatar = data.avatar_letter || currentManagerName.charAt(0).toUpperCase();
                    userBudget = data.budget ?? ORCAMENTO_INICIAL;
                    const el = document.getElementById('team-name-display');
                    if (el) el.textContent = currentManagerName;
                    const budgetEl = document.getElementById('header-budget-badge');
                    if (budgetEl) budgetEl.textContent = `D$${userBudget}`;
                }
            });
    }

    renderMarket();
    renderPitch();
    renderChat();
}

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
            const tabId = ctaBtn.getAttribute("data-tab") || "draft-tab";
            switchTab(tabId);
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

    // Customizações adicionais de cabeçalho
    const pageTitle = document.getElementById("page-title");
    const ctaBtn = document.getElementById("header-cta-btn");

    if (tabId === "dashboard-tab") {
        pageTitle.innerText = "Painel da Liga";
        ctaBtn.style.display = "flex";
        ctaBtn.innerHTML = `<i class="fa-solid fa-trophy"></i> Ir para o Draft`;
        ctaBtn.setAttribute("data-tab", "draft-tab");
    } else if (tabId === "draft-tab") {
        pageTitle.innerText = "Draft ao Vivo";
        ctaBtn.style.display = "flex";
        ctaBtn.innerHTML = `<i class="fa-solid fa-people-group"></i> Ver Meu Time`;
        ctaBtn.setAttribute("data-tab", "team-tab");
        // Reinicia o timer se o draft estiver rodando
        if (!draftFinished && !draftTimerInterval) {
            startDraftTimer();
        }
    } else if (tabId === "team-tab") {
        pageTitle.innerText = "Minha Escalação";
        ctaBtn.style.display = "flex";
        ctaBtn.innerHTML = `<i class="fa-solid fa-shop"></i> Mercado de Atletas`;
        ctaBtn.setAttribute("data-tab", "market-tab");
    } else if (tabId === "matchup-tab") {
        pageTitle.innerText = "Confronto Direto";
        ctaBtn.style.display = "none";
    } else if (tabId === "market-tab") {
        pageTitle.innerText = "Mercado de Jogadores";
        ctaBtn.style.display = "flex";
        ctaBtn.innerHTML = `<i class="fa-solid fa-chart-simple"></i> Ver Confronto`;
        ctaBtn.setAttribute("data-tab", "matchup-tab");
    }
}

// --- HEADER ACTIONS ---
function setupHeaderActions() {
    const simBtn = document.getElementById("simulate-round-btn");
    if (simBtn) {
        simBtn.addEventListener("click", () => {
            simulateRoundPoints();
        });
    }

    const ctaBtn = document.getElementById("header-cta-btn");
    if (ctaBtn) {
        ctaBtn.addEventListener("click", () => {
            const tab = ctaBtn.getAttribute("data-tab") || "draft-tab";
            switchTab(tab);
        });
    }
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
    // Dashboard real gerenciado pelo dashboard.js
    // Esta função é mantida para compatibilidade com chamadas antigas
}

// LEAGUE_TEAMS substituído pelo banco — mantido como array vazio para compatibilidade
const LEAGUE_TEAMS = [];

// --- CHAT SYSTEM ---
function setupChat() {
    const chatForm = document.getElementById("chat-form");
    if (!chatForm) return;
    chatForm.addEventListener("submit", (e) => {
        e.preventDefault();
        const input = document.getElementById("chat-input-msg");
        const msgText = input?.value.trim();
        if (msgText) {
            addChatMessage(currentManagerName, msgText, currentManagerAvatar, "var(--neon-blue)", true);
            input.value = "";
            triggerBotChatReply(msgText);
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
            const randomTaunt = taunts[Math.floor(Math.random() * taunts.length)];
            addChatMessage(currentManagerName, randomTaunt, currentManagerAvatar, "var(--neon-blue)", true);
            triggerBotChatReply(randomTaunt);
        });
    }

    const gifBtn = document.getElementById("chat-gif-btn");
    if (gifBtn) {
        gifBtn.addEventListener("click", () => {
            const gifUrls = [
                "https://media.giphy.com/media/l0HlIDtV6zvnC7f4k/giphy.gif",
                "https://media.giphy.com/media/t3s3XSxOJZEas/giphy.gif",
            ];
            const randomGif = gifUrls[Math.floor(Math.random() * gifUrls.length)];
            addChatMessageWithGif(currentManagerName, "Esse é o sentimento da rodada!", randomGif, currentManagerAvatar, "var(--neon-blue)", true);
            triggerBotChatReply("gif");
        });
    }
}

    // Enviar Provocação (Trash Talk)
    const trashBtn = document.getElementById("chat-trash-talk-btn");
    trashBtn.addEventListener("click", () => {
        const taunts = [
            "Esquece, esse ano a taça é minha! Podem chorar no vestiário já 😂",
            "Acabei de fechar uma contratação cirúrgica no mercado, meu time tá voando baixo!",
            "Galácticos BR, tá preparado pra passar vergonha no confronto direto?",
            "Quem escalou o Yuri Alberto tá rezando pra ele não errar o gol sem goleiro kkkkk",
            "Cadê as estatísticas? Meu time tá com projeção de pontuação recorde!"
        ];
        const randomTaunt = taunts[Math.floor(Math.random() * taunts.length)];
        addChatMessage(currentManagerName, randomTaunt, "P", "var(--neon-blue)", true);
        triggerBotChatReply(randomTaunt);
    });

    // Botão de GIF (simula o anexo de meme no Sleeper)
    const gifBtn = document.getElementById("chat-gif-btn");
    gifBtn.addEventListener("click", () => {
        const gifUrls = [
            "https://media.giphy.com/media/l0HlIDtV6zvnC7f4k/giphy.gif", // Campo vibrante / futebol
            "https://media.giphy.com/media/t3s3XSxOJZEas/giphy.gif",
            "https://media.giphy.com/media/26AHONQ79FdWZhAI0/giphy.gif"
        ];
        const randomGif = gifUrls[Math.floor(Math.random() * gifUrls.length)];
        addChatMessageWithGif(currentManagerName, "Esse é o sentimento da rodada!", randomGif, "P", "var(--neon-blue)", true);
        triggerBotChatReply("gif");
    });
}

function addChatMessage(author, text, avatar, color, isUser) {
    const now = new Date();
    const time = `${String(now.getHours()).padStart(2, '0')}:${String(now.getMinutes()).padStart(2, '0')}`;
    chatMessages.push({ author, text, avatar, color, isUser, time });
    renderChat();
}

function addChatMessageWithGif(author, text, gifUrl, avatar, color, isUser) {
    const now = new Date();
    const time = `${String(now.getHours()).padStart(2, '0')}:${String(now.getMinutes()).padStart(2, '0')}`;
    chatMessages.push({ author, text, gifUrl, avatar, color, isUser, time });
    renderChat();
}

function renderChat() {
    const container = document.getElementById("chat-messages-container");
    container.innerHTML = "";

    chatMessages.forEach(msg => {
        const bubble = document.createElement("div");
        bubble.className = `message-bubble ${msg.isUser ? 'user-message' : ''}`;
        
        let gifHtml = msg.gifUrl ? `<img class="chat-gif" src="${msg.gifUrl}" alt="GIF do Chat">` : '';

        bubble.innerHTML = `
            <div class="message-avatar" style="background-color: ${msg.color}; color: #fff;">${msg.avatar}</div>
            <div class="message-content-wrapper">
                <div class="message-meta">
                    <span class="message-author">${msg.author}</span>
                    <span class="message-time">${msg.time}</span>
                </div>
                <div class="message-text">
                    ${msg.text}
                    ${gifHtml}
                </div>
            </div>
        `;
        container.appendChild(bubble);
    });

    // Auto scroll para o final do chat
    container.scrollTop = container.scrollHeight;
}

function triggerBotChatReply(userMsg) {
    // Escolhe um bot aleatório para responder
    const botIndex = Math.floor(Math.random() * (LEAGUE_TEAMS.length - 1)) + 1; // 1, 2, ou 3
    const bot = LEAGUE_TEAMS[botIndex];
    
    let botReplies = [
        "Ih rapaz... Falou muito e jogou pouco na rodada passada.",
        "Projeção não ganha jogo! Quero ver pontuar no campinho.",
        "Sei não hein, acho que você gastou muita cartoleta à toa.",
        "Vou até ficar quieto pra não passar vergonha depois.",
        "Minha escalação secreta vai desbancar a sua!",
        "Chora menos e escala mais!"
    ];

    if (userMsg.includes("Hulk") || userMsg.includes("Pedro")) {
        botReplies = [
            "Pedro tá com cara de que vai fazer gol contra hoje haha",
            "Hulk é garantia de pontos. Pena que eu não consegui draftar ele antes."
        ];
    } else if (userMsg === "gif") {
        botReplies = [
            "Kkkkkkkk que GIF é esse!",
            "Típico meme de quem vai perder a liga"
        ];
    }

    const randomReply = botReplies[Math.floor(Math.random() * botReplies.length)];

    setTimeout(() => {
        addChatMessage(bot.name, randomReply, bot.avatar, bot.color, false);
    }, 1500 + Math.random() * 1000);
}

// --- DRAFT ROOM SIMULATOR ---
function setupDraft() {
    // Draft gerenciado pelo draft.js — esta função mantida para compatibilidade
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
    const searchInput = document.getElementById("market-player-search");
    const posSelect = document.getElementById("market-pos-filter");
    const clubSelect = document.getElementById("market-club-filter");

    const refresh = () => filterMarket(
        posSelect?.value || "TODOS",
        searchInput?.value || "",
        clubSelect?.value || "TODOS"
    );

    searchInput?.addEventListener("input", refresh);
    posSelect?.addEventListener("change", refresh);
    clubSelect?.addEventListener("change", refresh);
}

function filterMarket(position = "TODOS", searchVal = "", club = "TODOS") {
    let filtered = PLAYERS_DATABASE;

    if (searchVal) filtered = filtered.filter(p => p.name.toLowerCase().includes(searchVal.toLowerCase()));
    if (position !== "TODOS") filtered = filtered.filter(p => p.position === position);
    if (club !== "TODOS") filtered = filtered.filter(p => p.club === club);

    renderMarketList(filtered);
}

function renderMarket() {
    filterMarket("TODOS", "", "TODOS");
}

function renderMarketList(playerList) {
    const container = document.getElementById("market-players-list");
    container.innerHTML = "";

    if (playerList.length === 0) {
        container.innerHTML = `<div style="padding: 20px; text-align: center; color: var(--text-muted);">Nenhum jogador encontrado com os filtros selecionados.</div>`;
        return;
    }

    // Ordena por preço (Cartoletas) do mais caro para o mais barato
    const sorted = [...playerList].sort((a,b) => b.cost - a.cost);

    sorted.forEach(player => {
        const row = document.createElement("div");
        row.className = "player-market-row";
        
        const posClass = `pos-${player.position.toLowerCase()}`;
        
        // Verifica se jogador está escalado no time do usuário
        let isHired = false;
        Object.values(lineup).forEach(arr => {
            if (arr.some(p => p && p.id === player.id)) isHired = true;
        });

        let buttonHtml = "";
        const draftFinished = typeof Draft !== 'undefined' && Draft.state.draftState?.is_finished;
        if (isHired) {
            buttonHtml = `<button class="market-action-btn added" onclick="sellPlayerFromMarket(${player.id})">Remover</button>`;
        } else if (!draftFinished) {
            buttonHtml = `<button class="market-action-btn" disabled style="opacity:0.4; cursor:not-allowed;" title="Disponível após o draft">
                <i class="fa-solid fa-lock" style="font-size:10px;"></i> Draft
            </button>`;
        } else {
            buttonHtml = `<button class="market-action-btn" onclick="buyPlayerFromMarket(${player.id})">Contratar</button>`;
        }

        let scoreHtml = "";
        if (isGamesSimulated) {
            scoreHtml = `<span class="player-stat-val" style="color:var(--neon-green);">${player.realPoints.toFixed(2)}</span>`;
        } else {
            scoreHtml = `<span class="player-stat-val">${player.projPoints.toFixed(2)}</span>`;
        }

        row.innerHTML = `
            <div class="player-main-info">
                <div class="player-avatar-circle">${player.name.substring(0,2).toUpperCase()}</div>
                <div>
                    <span class="player-name-txt">${player.name}</span>
                    <div class="player-sub-txt">
                        <span class="player-pos-badge ${posClass}">${player.position}</span>
                        <span class="player-club-txt">${player.club}</span>
                    </div>
                </div>
            </div>
            
            <div class="player-stat-col">
                <span class="player-stat-val">${MOEDA_LABEL} ${player.cost.toFixed(2)}</span>
                <span class="player-stat-lbl">Preço</span>
            </div>

            <div class="player-stat-col">
                ${scoreHtml}
                <span class="player-stat-lbl">${isGamesSimulated ? 'Fez' : 'Proj'}</span>
            </div>

            <div class="player-stat-col">
                <span class="player-stat-val">${(player.projPoints * 0.9).toFixed(1)} - ${(player.projPoints * 1.1).toFixed(1)}</span>
                <span class="player-stat-lbl">Faixa</span>
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
    resetBtn.addEventListener("click", () => {
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
    formationSelect.addEventListener("change", (e) => {
        changeFormation(e.target.value);
    });
}

function changeFormation(newFormation) {
    if (!FORMATIONS[newFormation]) return;

    activeFormation = newFormation;
    const targetCounts = FORMATIONS[newFormation].counts;

    // Ajusta cada posição do lineup liberando e reembolsando os excedentes
    Object.keys(targetCounts).forEach(pos => {
        const currentArr = lineup[pos] || [];
        const targetCount = targetCounts[pos];

        if (currentArr.length > targetCount) {
            // Remove jogadores extras e reembolsa
            for (let i = targetCount; i < currentArr.length; i++) {
                const player = currentArr[i];
                if (player) {
                    userBudget += player.cost;
                    const dbPlayer = players.find(p => p.id === player.id);
                    if (dbPlayer) {
                        dbPlayer.status = "disponivel";
                    }
                }
            }
            lineup[pos] = currentArr.slice(0, targetCount);
        } else if (currentArr.length < targetCount) {
            // Preenche com nulls extras
            while (lineup[pos].length < targetCount) {
                lineup[pos].push(null);
            }
        }
    });

    // Se já simulamos a rodada, reseta a simulação porque o time mudou
    if (isGamesSimulated) {
        isGamesSimulated = false;
        players.forEach(p => p.realPoints = 0.0);
        document.getElementById("matchup-home-score").innerText = "0.00";
        document.getElementById("matchup-away-score").innerText = "0.00";
        addActivityLog("system", "Esquema tático alterado. Pontuação da rodada resetada.");
    }

    addActivityLog("system", `Esquema tático alterado para <strong>${newFormation}</strong>.`);
    
    // Atualiza exibições
    renderPitch();
    renderMarket();
    renderMatchup();
}

function updateLineupStats() {
    let startersCount = 0;
    let proj = 0.0;
    const starterPositions = ["GOL", "ZAG", "LAT", "MEI", "ATA"];
    
    starterPositions.forEach(pos => {
        const arr = lineup[pos];
        if (arr) {
            arr.forEach(p => {
                if (p) {
                    startersCount++;
                    proj += p.projPoints;
                }
            });
        }
    });

    document.getElementById("lineup-count-val").innerText = `${startersCount} / 11`;
    document.getElementById("lineup-cost-val").innerText = `${MOEDA_LABEL} ${userBudget.toFixed(2)}`;
    document.getElementById("lineup-projection-val").innerText = `${proj.toFixed(2)} pts`;
}

function renderPitch() {
    const pitchGrid = document.getElementById("pitch-grid-slots");
    if (!pitchGrid) return;
    pitchGrid.innerHTML = "";
    
    // Remove containers antigos se existirem
    const oldReserves = document.getElementById("reserves-container");
    if (oldReserves) oldReserves.remove();
    const oldInjuries = document.getElementById("injuries-container");
    if (oldInjuries) oldInjuries.remove();

    const formationConfig = FORMATIONS[activeFormation];
    if (!formationConfig) return;
    
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

    // Render reservas
    const reservesContainer = document.getElementById("bench-slots") || (() => {
        const c = document.createElement("div");
        c.id = "reserves-container";
        c.className = "reserves-grid";
        pitchGrid.parentElement.appendChild(c);
        return c;
    })();
    reservesContainer.innerHTML = "";
    lineup.RESERVAS.forEach((player, idx) => {
        const slotEl = generateSlotHtml("RESERVAS", idx, player, `Reserva ${idx + 1}`);
        slotEl.className = "bench-player-slot";
        const badge = slotEl.querySelector(".player-slot-badge");
        if (badge) badge.className = "bench-slot-badge";
        const name = slotEl.querySelector(".player-slot-name");
        if (name) name.className = "bench-slot-name";
        reservesContainer.appendChild(slotEl);
    });

    // Render lesões
    const injuriesContainer = document.getElementById("injured-slots") || (() => {
        const c = document.createElement("div");
        c.id = "injuries-container";
        c.className = "injuries-grid";
        pitchGrid.parentElement.appendChild(c);
        return c;
    })();
    injuriesContainer.innerHTML = "";
    lineup.LESOES.forEach((player, idx) => {
        const slotEl = generateSlotHtml("LESOES", idx, player, `Lesão ${idx + 1}`);
        slotEl.className = "bench-player-slot";
        const badge = slotEl.querySelector(".player-slot-badge");
        if (badge) badge.className = "bench-slot-badge";
        const name = slotEl.querySelector(".player-slot-name");
        if (name) name.className = "bench-slot-name";
        injuriesContainer.appendChild(slotEl);
    });

    updateLineupStats();
}

// Updated generateSlotHtml with drag-and-drop support
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

function renderMatchup() {
    // Calcula pontos/projeções para renderizar no header do Matchup (titulares apenas)
    let homeProj = 0.0;
    let homeReal = 0.0;

    const starterPositions = ["GOL", "ZAG", "LAT", "MEI", "ATA"];
    starterPositions.forEach(pos => {
        const arr = lineup[pos];
        if (arr) {
            arr.forEach(p => {
                if (p) {
                    homeProj += p.projPoints;
                    homeReal += p.realPoints;
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

    // Se o botALineup estiver vazio, preenche com um mock fixo de pontuação
    let awayProj = 75.10;
    let awayReal = 0.0;
    if (botALineup.length > 0) {
        awayProj = 0.0;
        botStarters.forEach(p => {
            awayProj += p.projPoints;
            awayReal += p.realPoints;
        });
    }

    document.getElementById("matchup-home-projection").innerText = homeProj.toFixed(2);
    document.getElementById("matchup-away-projection").innerText = awayProj.toFixed(2);

    if (isGamesSimulated) {
        document.getElementById("matchup-home-score").innerText = homeReal.toFixed(2);
        document.getElementById("matchup-away-score").innerText = awayReal.toFixed(2);
        
        // Ajusta barra h2h com base nos pontos reais
        let total = homeReal + awayReal;
        if (total > 0) {
            let pct = (homeReal / total) * 100;
            document.getElementById("h2h-bar-home-width").style.width = `${pct}%`;
            document.getElementById("h2h-bar-away-width").style.width = `${100 - pct}%`;
            
            let labelText = pct >= 50 
                ? `Vitória: ${pct.toFixed(0)}% (Você)` 
                : `Vitória: ${(100-pct).toFixed(0)}% (Galácticos BR)`;
            document.querySelector(".projection-label:last-child").innerText = labelText;
        }
    } else {
        document.getElementById("matchup-home-score").innerText = "0.00";
        document.getElementById("matchup-away-score").innerText = "0.00";
        
        // Barra baseada em projeção
        let total = homeProj + awayProj;
        if (total > 0) {
            let pct = (homeProj / total) * 100;
            document.getElementById("h2h-bar-home-width").style.width = `${pct}%`;
            document.getElementById("h2h-bar-away-width").style.width = `${100 - pct}%`;
        }
    }

    // Renderiza a lista comparativa de atletas (Posição por Posição)
    const listContainer = document.getElementById("matchup-comparison-rows");
    listContainer.innerHTML = "";

    // Posições sequenciais para o comparativo baseadas no esquema atual
    const flatPositions = [];
    const formationConfig = FORMATIONS[activeFormation];
    formationConfig.rows.forEach(rowConfig => {
        if (rowConfig.pos === "DEFENSE") {
            rowConfig.slots.forEach(slot => {
                flatPositions.push({ pos: slot.pos, idx: slot.idx, name: slot.name });
            });
        } else {
            for (let idx = 0; idx < rowConfig.count; idx++) {
                const displayName = rowConfig.names[idx] || rowConfig.pos;
                flatPositions.push({ pos: rowConfig.pos, idx: idx, name: displayName });
            }
        }
    });

    flatPositions.forEach(slot => {
        const homePlayer = lineup[slot.pos][slot.idx];
        
        // Acha o i-ésimo jogador daquela posição nos titulares do bot
        let matchingPosBots = botStarters.filter(x => x.position === slot.pos);
        let botMatch = matchingPosBots[slot.idx] || null;

        let homeHtml = `<span style="color:var(--text-muted); font-style:italic;">Não escalado</span>`;
        let awayHtml = `<span style="color:var(--text-muted); font-style:italic;">Não escalado</span>`;

        if (homePlayer) {
            let score = isGamesSimulated ? homePlayer.realPoints.toFixed(2) : homePlayer.projPoints.toFixed(2);
            homeHtml = `<strong>${homePlayer.name}</strong> <span style="font-size:11px;color:var(--text-secondary); margin-left:6px;">(${score} pts)</span>`;
        }

        if (botMatch) {
            let score = isGamesSimulated ? botMatch.realPoints.toFixed(2) : botMatch.projPoints.toFixed(2);
            awayHtml = `<strong>${botMatch.name}</strong> <span style="font-size:11px;color:var(--text-secondary); margin-left:6px;">(${score} pts)</span>`;
        }

        const row = document.createElement("div");
        // Reutiliza o grid styling da tabela de mercado
        row.className = "player-market-row";
        row.style.gridTemplateColumns = "1fr 2fr 1fr 2fr";
        row.style.padding = "10px 20px";
        
        row.innerHTML = `
            <div style="font-weight:700; color:var(--text-secondary); font-size:11px; text-transform:uppercase;">${slot.name}</div>
            <div style="font-size:13px; color:var(--neon-blue);">${homeHtml}</div>
            <div style="text-align:center; font-weight:800; color:var(--text-muted);">VS</div>
            <div style="font-size:13px; color:var(--neon-purple); text-align:right;">${awayHtml}</div>
        `;
        listContainer.appendChild(row);
    });
}

// Expondo funções necessárias globalmente para os handlers de eventos inline
window.switchTab = switchTab;
window.draftPlayer = draftPlayer;
window.buyPlayerFromMarket = buyPlayerFromMarket;
window.sellPlayerFromMarket = sellPlayerFromMarket;
