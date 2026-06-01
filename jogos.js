// =============================================
// ARENA FANTASY - Jogos do Brasileirão
// Fonte: API pública SofaScore (sem CORS) + dados hardcoded atualizados
// =============================================

const Jogos = {

    cache: null,
    cacheTime: null,
    CACHE_TTL: 10 * 60 * 1000,

    async load() {
        const loading = document.getElementById('jogos-loading');
        const list = document.getElementById('jogos-list');
        if (loading) loading.style.display = 'block';
        if (list) list.innerHTML = '';

        if (Jogos.cache && Jogos.cacheTime && (Date.now() - Jogos.cacheTime) < Jogos.CACHE_TTL) {
            Jogos.render(Jogos.cache);
            if (loading) loading.style.display = 'none';
            return;
        }

        // Tenta buscar dados via proxies públicos
        let data = await Jogos.fetchAllSources();

        if (!data?.length) {
            // Fallback: dados fixos da rodada atual (atualizados manualmente)
            data = Jogos.getRodadaAtual();
        }

        Jogos.cache = data;
        Jogos.cacheTime = Date.now();
        Jogos.render(data);

        if (loading) loading.style.display = 'none';
    },

    async fetchAllSources() {
        // Tenta TheSportsDB (API gratuita, sem CORS)
        try {
            const res = await fetch(
                'https://www.thesportsdb.com/api/v1/json/3/eventsseason.php?id=4967&s=2025-2026',
                { signal: AbortSignal.timeout(5000) }
            );
            const data = await res.json();
            const eventos = data?.events || [];
            if (eventos.length) {
                // Filtra jogos recentes (últimos 7 dias + próximos 7 dias)
                const now = Date.now();
                const recentes = eventos.filter(e => {
                    const d = new Date(e.dateEvent).getTime();
                    return Math.abs(d - now) < 7 * 24 * 3600 * 1000;
                }).slice(0, 20);
                if (recentes.length) return recentes.map(e => ({
                    home: e.strHomeTeam,
                    away: e.strAwayTeam,
                    homeScore: e.intHomeScore !== null ? parseInt(e.intHomeScore) : null,
                    awayScore: e.intAwayScore !== null ? parseInt(e.intAwayScore) : null,
                    date: e.dateEvent,
                    time: e.strTime?.substring(0,5) || '',
                    stadium: e.strVenue || '',
                    status: e.strStatus === 'Match Finished' ? 'finished' : 'scheduled',
                    rodada: e.intRound || ''
                }));
            }
        } catch {}
        return null;
    },

    // Rodada atual com resultados reais (atualizado 31/mai/2026)
    getRodadaAtual() {
        return [
            // Rodada 18 — encerrada
            { home: 'Athletico-PR',  away: 'Mirassol',     homeScore: 1, awayScore: 0, date: '2026-05-30', time: '16:00', stadium: 'Arena da Baixada',    status: 'finished', rodada: 18 },
            { home: 'Flamengo',      away: 'Coritiba',     homeScore: 3, awayScore: 0, date: '2026-05-30', time: '16:00', stadium: 'Maracanã',            status: 'finished', rodada: 18 },
            { home: 'Grêmio',        away: 'Corinthians',  homeScore: 1, awayScore: 3, date: '2026-05-30', time: '17:30', stadium: 'Arena do Grêmio',     status: 'finished', rodada: 18 },
            { home: 'Bahia',         away: 'Botafogo',     homeScore: 2, awayScore: 1, date: '2026-05-30', time: '17:30', stadium: 'Arena Fonte Nova',    status: 'finished', rodada: 18 },
            { home: 'Santos',        away: 'Vitória',      homeScore: 3, awayScore: 1, date: '2026-05-30', time: '20:00', stadium: 'Vila Belmiro',        status: 'finished', rodada: 18 },
            { home: 'Bragantino',    away: 'Internacional',homeScore: 3, awayScore: 1, date: '2026-05-31', time: '11:00', stadium: 'Nabi Abi Chedid',    status: 'finished', rodada: 18 },
            { home: 'Vasco',         away: 'Atlético-MG',  homeScore: 0, awayScore: 1, date: '2026-05-31', time: '16:00', stadium: 'São Januário',  status: 'finished', rodada: 18 },
            { home: 'Palmeiras',     away: 'Chapecoense',  homeScore: 1, awayScore: 0, date: '2026-05-31', time: '20:30', stadium: 'Allianz Parque',      status: 'finished', rodada: 18 },
            { home: 'Cruzeiro',      away: 'Fluminense',   homeScore: 1, awayScore: 1, date: '2026-05-31', time: '20:30', stadium: 'Mineirão',            status: 'finished', rodada: 18 },
            { home: 'Remo',          away: 'São Paulo',    homeScore: 1, awayScore: 0, date: '2026-05-31', time: '20:30', stadium: 'Mangueirão',          status: 'finished', rodada: 18 },
            // Rodada 17 — encerrada
            { home: 'São Paulo',     away: 'Botafogo',     homeScore: 1, awayScore: 1, date: '2026-05-22', time: '', stadium: 'MorumBIS',              status: 'finished', rodada: 17 },
            { home: 'Vitória',       away: 'Internacional',homeScore: 2, awayScore: 0, date: '2026-05-22', time: '', stadium: 'Barradão',             status: 'finished', rodada: 17 },
            { home: 'Mirassol',      away: 'Fluminense',   homeScore: 1, awayScore: 0, date: '2026-05-22', time: '', stadium: 'Maião',               status: 'finished', rodada: 17 },
            { home: 'Grêmio',        away: 'Santos',       homeScore: 3, awayScore: 2, date: '2026-05-23', time: '', stadium: 'Arena do Grêmio',     status: 'finished', rodada: 17 },
            { home: 'Flamengo',      away: 'Palmeiras',    homeScore: 0, awayScore: 3, date: '2026-05-23', time: '', stadium: 'Maracanã',            status: 'finished', rodada: 17 },
            { home: 'Cruzeiro',      away: 'Chapecoense',  homeScore: 2, awayScore: 1, date: '2026-05-24', time: '', stadium: 'Arena MRV',           status: 'finished', rodada: 17 },
            { home: 'Remo',          away: 'Athletico-PR', homeScore: 1, awayScore: 2, date: '2026-05-24', time: '', stadium: 'Mangueirão',          status: 'finished', rodada: 17 },
            { home: 'Corinthians',   away: 'Atlético-MG',  homeScore: 1, awayScore: 0, date: '2026-05-24', time: '', stadium: 'Neo Química Arena',  status: 'finished', rodada: 17 },
            { home: 'Vasco',         away: 'Bragantino',   homeScore: 0, awayScore: 3, date: '2026-05-24', time: '', stadium: 'São Januário',        status: 'finished', rodada: 17 },
            { home: 'Coritiba',      away: 'Bahia',        homeScore: 3, awayScore: 2, date: '2026-05-25', time: '', stadium: 'Couto Pereira',       status: 'finished', rodada: 17 },
        ];
    },

    render(partidas) {
        const list = document.getElementById('jogos-list');
        if (!list || !partidas?.length) return;

        const clubMap = {
            'Flamengo': 'FLA', 'Palmeiras': 'PAL', 'Botafogo': 'BOT', 'Cruzeiro': 'CRU',
            'Bahia': 'BAH', 'São Paulo': 'SPFC', 'Atlético-MG': 'CAM', 'Atlético Mineiro': 'CAM',
            'Corinthians': 'COR', 'Grêmio': 'GRE', 'Fluminense': 'FLU', 'Vasco': 'VAS',
            'Internacional': 'INT', 'Red Bull Bragantino': 'BRA', 'Bragantino': 'BRA',
            'Mirassol': 'MIR', 'Athletico-PR': 'ATH', 'Athletico Paranaense': 'ATH',
            'Coritiba': 'COT', 'Chapecoense': 'CHE', 'Remo': 'REM', 'Vitória': 'VIT', 'Santos': 'SAN'
        };

        const byRodada = {};
        partidas.forEach(p => {
            const key = `Rodada ${p.rodada || '—'}`;
            if (!byRodada[key]) byRodada[key] = [];
            byRodada[key].push(p);
        });

        list.innerHTML = Object.entries(byRodada).map(([rodada, jogos]) => `
            <div style="margin-bottom:20px;">
                <div style="font-size:11px; font-weight:800; color:var(--neon-blue); text-transform:uppercase;
                    letter-spacing:1px; padding:8px 0; margin-bottom:8px; border-bottom:1px solid var(--border-color);">
                    ${rodada} — Últimas antes da pausa para a Copa do Mundo
                </div>
                ${jogos.map(j => {
                    const homeCode = clubMap[j.home] || '';
                    const awayCode = clubMap[j.away] || '';
                    const isLive = j.status === 'live';
                    const isFinished = j.status === 'finished' && j.homeScore !== null;

                    let middle = '';
                    if (isLive) {
                        middle = `<div class="jogo-score live">${j.homeScore} <span style="color:var(--neon-red);font-size:11px;">●</span> ${j.awayScore}</div>`;
                    } else if (isFinished) {
                        middle = `<div class="jogo-score">${j.homeScore} - ${j.awayScore}</div>`;
                    } else {
                        const dateLabel = j.date ? new Date(j.date + 'T12:00:00').toLocaleDateString('pt-BR', { day:'2-digit', month:'2-digit' }) : '';
                        middle = `<div style="text-align:center; min-width:70px;">
                            <div class="jogo-hora">${j.time || '—'}</div>
                            <div style="font-size:10px; color:var(--text-muted);">${dateLabel}</div>
                        </div>`;
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
                    </div>`;
                }).join('')}
            </div>`
        ).join('') + `<p style="font-size:11px; color:var(--text-muted); margin-top:12px; text-align:center;">
            <i class="fa-solid fa-circle-info"></i> Horários de Brasília • Atualizado manualmente — integração com API em desenvolvimento
        </p>`;
    }
};
