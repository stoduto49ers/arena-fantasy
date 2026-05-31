// =============================================
// ARENA FANTASY - Jogos do Brasileirão
// Fonte: API Cartola FC (não-oficial) + fallback Claude
// =============================================

const Jogos = {

    cache: null,
    cacheTime: null,
    CACHE_TTL: 5 * 60 * 1000, // 5 min

    async load() {
        const loading = document.getElementById('jogos-loading');
        const list = document.getElementById('jogos-list');
        if (loading) loading.style.display = 'block';
        if (list) list.innerHTML = '';

        // Cache
        if (Jogos.cache && Jogos.cacheTime && (Date.now() - Jogos.cacheTime) < Jogos.CACHE_TTL) {
            Jogos.render(Jogos.cache);
            if (loading) loading.style.display = 'none';
            return;
        }

        // Tenta API do Cartola primeiro
        let data = await Jogos.fetchCartola();

        // Fallback: usa Claude para buscar dados atuais
        if (!data) data = await Jogos.fetchViaClaude();

        if (data) {
            Jogos.cache = data;
            Jogos.cacheTime = Date.now();
            Jogos.render(data);
        } else {
            if (list) list.innerHTML = `<div class="glass-panel" style="text-align:center; padding:40px; color:var(--text-muted);">
                <i class="fa-solid fa-wifi" style="font-size:32px; margin-bottom:12px; opacity:0.4;"></i>
                <p>Não foi possível carregar os jogos.</p>
                <button class="action-btn primary" onclick="Jogos.load()" style="margin-top:12px;">Tentar novamente</button>
            </div>`;
        }

        if (loading) loading.style.display = 'none';
    },

    async fetchCartola() {
        try {
            const res = await fetch('https://api.cartola.globo.com/partidas', {
                headers: { 'Accept': 'application/json' }
            });
            if (!res.ok) return null;
            const raw = await res.json();
            // Normaliza para formato padrão
            const partidas = raw?.partidas || raw || [];
            return partidas.map(p => ({
                id: p.partida_id || Math.random(),
                home: p.clube_casa || '—',
                away: p.clube_visitante || '—',
                homeScore: p.placar_oficial_mandante ?? null,
                awayScore: p.placar_oficial_visitante ?? null,
                date: p.partida_data || '',
                stadium: p.local || '',
                status: p.status || 'scheduled',
                rodada: p.rodada || ''
            }));
        } catch { return null; }
    },

    async fetchViaClaude() {
        try {
            const response = await fetch('https://api.anthropic.com/v1/messages', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    model: 'claude-sonnet-4-20250514',
                    max_tokens: 1500,
                    tools: [{ type: 'web_search_20250305', name: 'web_search' }],
                    messages: [{
                        role: 'user',
                        content: `Busque os jogos da rodada atual do Campeonato Brasileiro Série A 2026.
                        Responda APENAS com JSON puro (sem markdown), array de objetos:
                        [{"home":"Nome Time Casa","away":"Nome Time Visitante","homeScore":null,"awayScore":null,"date":"2026-05-31","time":"16:00","stadium":"Nome Estádio","status":"scheduled","rodada":18}]
                        status pode ser: "scheduled", "live", "finished"
                        Para jogos finalizados, coloque os placares reais.
                        Para jogos a jogar, homeScore e awayScore devem ser null.`
                    }]
                })
            });
            const data = await response.json();
            const text = data.content?.map(c => c.text || '').join('') || '';
            const clean = text.replace(/```json|```/g, '').trim();
            const start = clean.indexOf('[');
            const end = clean.lastIndexOf(']');
            if (start === -1) return null;
            return JSON.parse(clean.substring(start, end + 1));
        } catch { return null; }
    },

    render(partidas) {
        const list = document.getElementById('jogos-list');
        if (!list || !partidas?.length) return;

        // Mapeia abreviações
        const clubMap = {
            'Flamengo': 'FLA', 'Palmeiras': 'PAL', 'Botafogo': 'BOT', 'Cruzeiro': 'CRU',
            'Bahia': 'BAH', 'São Paulo': 'SPFC', 'Atlético Mineiro': 'CAM', 'Atlético-MG': 'CAM',
            'Corinthians': 'COR', 'Grêmio': 'GRE', 'Fluminense': 'FLU', 'Vasco': 'VAS',
            'Internacional': 'INT', 'Red Bull Bragantino': 'BRA', 'Bragantino': 'BRA',
            'Mirassol': 'MIR', 'Athletico Paranaense': 'ATH', 'Athletico-PR': 'ATH',
            'Coritiba': 'COT', 'Chapecoense': 'CHE', 'Remo': 'REM', 'Vitória': 'VIT',
            'Santos': 'SAN', 'Vasco da Gama': 'VAS'
        };

        // Agrupa por rodada/data
        const byRodada = {};
        partidas.forEach(p => {
            const key = p.rodada ? `Rodada ${p.rodada}` : (p.date?.split('T')[0] || 'A definir');
            if (!byRodada[key]) byRodada[key] = [];
            byRodada[key].push(p);
        });

        list.innerHTML = Object.entries(byRodada).map(([rodada, jogos]) => `
            <div style="margin-bottom:20px;">
                <div style="font-size:11px; font-weight:800; color:var(--neon-blue); text-transform:uppercase;
                    letter-spacing:1px; padding:8px 0; margin-bottom:8px; border-bottom:1px solid var(--border-color);">
                    ${rodada}
                </div>
                ${jogos.map(j => {
                    const homeCode = clubMap[j.home] || '';
                    const awayCode = clubMap[j.away] || '';
                    const isLive = j.status === 'live' || j.status === 'ao_vivo';
                    const isFinished = j.status === 'finished' || j.status === 'encerrado';
                    const hasScore = j.homeScore !== null && j.homeScore !== undefined;

                    let middle = '';
                    if (isLive) {
                        middle = `<div class="jogo-score live">${j.homeScore} <span style="color:var(--neon-red);font-size:11px;animation:pulse 1s infinite;">●</span> ${j.awayScore}</div>`;
                    } else if (isFinished && hasScore) {
                        middle = `<div class="jogo-score">${j.homeScore} - ${j.awayScore}</div>`;
                    } else {
                        middle = `<div class="jogo-hora">${j.time || j.date?.split('T')[1]?.substring(0,5) || '—'}</div>`;
                    }

                    return `<div class="jogo-card ${isLive ? 'jogo-live' : ''}">
                        <div class="jogo-team ${homeCode ? 'has-players' : ''}">
                            ${homeCode ? `<span class="jogo-club-badge">${homeCode}</span>` : ''}
                            <span class="jogo-team-name">${j.home}</span>
                        </div>
                        ${middle}
                        <div class="jogo-team away ${awayCode ? 'has-players' : ''}">
                            <span class="jogo-team-name">${j.away}</span>
                            ${awayCode ? `<span class="jogo-club-badge">${awayCode}</span>` : ''}
                        </div>
                        ${j.stadium ? `<div style="position:absolute; bottom:2px; right:8px; font-size:9px; color:var(--text-muted);">${j.stadium}</div>` : ''}
                    </div>`;
                }).join('')}
            </div>`
        ).join('');
    }
};
