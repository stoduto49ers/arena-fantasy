// =============================================
// ARENA FANTASY - Jogos do Brasileirão 2026
// Navegação por rodada, resultados + futuros
// =============================================

const Jogos = {

    currentRound: 18,
    totalRounds: 38,

    // Todos os jogos do campeonato
    // Rodadas 1-18 com resultados, 19-38 sem placar
    allRounds: {

        17: [
            { home: 'São Paulo',    away: 'Botafogo',      hs: 1, as: 1, date: '22/05', time: '', status: 'finished' },
            { home: 'Vitória',      away: 'Internacional', hs: 2, as: 0, date: '22/05', time: '', status: 'finished' },
            { home: 'Mirassol',     away: 'Fluminense',    hs: 1, as: 0, date: '22/05', time: '', status: 'finished' },
            { home: 'Grêmio',       away: 'Santos',        hs: 3, as: 2, date: '23/05', time: '', status: 'finished' },
            { home: 'Flamengo',     away: 'Palmeiras',     hs: 0, as: 3, date: '23/05', time: '', status: 'finished' },
            { home: 'Cruzeiro',     away: 'Chapecoense',   hs: 2, as: 1, date: '24/05', time: '', status: 'finished' },
            { home: 'Remo',         away: 'Athletico-PR',  hs: 1, as: 2, date: '24/05', time: '', status: 'finished' },
            { home: 'Corinthians',  away: 'Atlético-MG',   hs: 1, as: 0, date: '24/05', time: '', status: 'finished' },
            { home: 'Vasco',        away: 'Bragantino',    hs: 0, as: 3, date: '24/05', time: '', status: 'finished' },
            { home: 'Coritiba',     away: 'Bahia',         hs: 3, as: 2, date: '25/05', time: '', status: 'finished' },
        ],

        18: [
            { home: 'Athletico-PR', away: 'Mirassol',      hs: 1, as: 0, date: '30/05', time: '16:00', status: 'finished' },
            { home: 'Flamengo',     away: 'Coritiba',      hs: 3, as: 0, date: '30/05', time: '16:00', status: 'finished' },
            { home: 'Grêmio',       away: 'Corinthians',   hs: 1, as: 3, date: '30/05', time: '17:30', status: 'finished' },
            { home: 'Bahia',        away: 'Botafogo',      hs: 2, as: 1, date: '30/05', time: '17:30', status: 'finished' },
            { home: 'Santos',       away: 'Vitória',       hs: 3, as: 1, date: '30/05', time: '20:00', status: 'finished' },
            { home: 'Bragantino',   away: 'Internacional', hs: 3, as: 1, date: '31/05', time: '11:00', status: 'finished' },
            { home: 'Vasco',        away: 'Atlético-MG',   hs: 0, as: 1, date: '31/05', time: '16:00', status: 'finished' },
            { home: 'Palmeiras',    away: 'Chapecoense',   hs: 1, as: 0, date: '31/05', time: '20:30', status: 'finished' },
            { home: 'Cruzeiro',     away: 'Fluminense',    hs: 1, as: 1, date: '31/05', time: '20:30', status: 'finished' },
            { home: 'Remo',         away: 'São Paulo',     hs: 1, as: 0, date: '31/05', time: '20:30', status: 'finished' },
        ],

        // Rodadas futuras (pausa Copa do Mundo jun-jul, retorno ago/2026)
        19: [
            { home: 'Palmeiras',    away: 'Flamengo',      hs: null, as: null, date: '09/08', time: '16:00', status: 'scheduled' },
            { home: 'Corinthians',  away: 'São Paulo',     hs: null, as: null, date: '09/08', time: '18:30', status: 'scheduled' },
            { home: 'Botafogo',     away: 'Cruzeiro',      hs: null, as: null, date: '09/08', time: '20:00', status: 'scheduled' },
            { home: 'Atlético-MG',  away: 'Grêmio',        hs: null, as: null, date: '10/08', time: '16:00', status: 'scheduled' },
            { home: 'Internacional',away: 'Vasco',         hs: null, as: null, date: '10/08', time: '18:30', status: 'scheduled' },
            { home: 'Fluminense',   away: 'Bahia',         hs: null, as: null, date: '10/08', time: '20:00', status: 'scheduled' },
            { home: 'Bragantino',   away: 'Santos',        hs: null, as: null, date: '10/08', time: '20:00', status: 'scheduled' },
            { home: 'Athletico-PR', away: 'Coritiba',      hs: null, as: null, date: '11/08', time: '16:00', status: 'scheduled' },
            { home: 'Mirassol',     away: 'Vitória',       hs: null, as: null, date: '11/08', time: '18:30', status: 'scheduled' },
            { home: 'Chapecoense',  away: 'Remo',          hs: null, as: null, date: '11/08', time: '20:00', status: 'scheduled' },
        ],

        20: [
            { home: 'Flamengo',     away: 'Atlético-MG',   hs: null, as: null, date: '16/08', time: '16:00', status: 'scheduled' },
            { home: 'São Paulo',    away: 'Palmeiras',     hs: null, as: null, date: '16/08', time: '18:30', status: 'scheduled' },
            { home: 'Cruzeiro',     away: 'Corinthians',   hs: null, as: null, date: '16/08', time: '20:00', status: 'scheduled' },
            { home: 'Grêmio',       away: 'Internacional', hs: null, as: null, date: '17/08', time: '16:00', status: 'scheduled' },
            { home: 'Bahia',        away: 'Bragantino',    hs: null, as: null, date: '17/08', time: '18:30', status: 'scheduled' },
            { home: 'Vasco',        away: 'Fluminense',    hs: null, as: null, date: '17/08', time: '20:00', status: 'scheduled' },
            { home: 'Santos',       away: 'Botafogo',      hs: null, as: null, date: '17/08', time: '20:00', status: 'scheduled' },
            { home: 'Coritiba',     away: 'Mirassol',      hs: null, as: null, date: '18/08', time: '16:00', status: 'scheduled' },
            { home: 'Vitória',      away: 'Athletico-PR',  hs: null, as: null, date: '18/08', time: '18:30', status: 'scheduled' },
            { home: 'Remo',         away: 'Chapecoense',   hs: null, as: null, date: '18/08', time: '20:00', status: 'scheduled' },
        ],
    },

    load() {
        Jogos.render();
    },

    render() {
        const list = document.getElementById('jogos-list');
        const loading = document.getElementById('jogos-loading');
        if (loading) loading.style.display = 'none';
        if (!list) return;

        const round = Jogos.currentRound;
        const games = Jogos.allRounds[round] || [];
        const isCurrentRound = round === 18;
        const isFuture = round > 18;
        const hasPause = round >= 19 && round <= 25;

        const clubMap = {
            'Flamengo':'FLA','Palmeiras':'PAL','Botafogo':'BOT','Cruzeiro':'CRU',
            'Bahia':'BAH','São Paulo':'SPFC','Atlético-MG':'CAM','Corinthians':'COR',
            'Grêmio':'GRE','Fluminense':'FLU','Vasco':'VAS','Internacional':'INT',
            'Bragantino':'BRA','Mirassol':'MIR','Athletico-PR':'ATH','Coritiba':'COT',
            'Chapecoense':'CHE','Remo':'REM','Vitória':'VIT','Santos':'SAN'
        };

        list.innerHTML = `
            <!-- Navegação de rodadas -->
            <div style="display:flex; align-items:center; justify-content:space-between; margin-bottom:20px; gap:12px;">
                <button class="action-btn" onclick="Jogos.goRound(-1)" ${round <= 1 ? 'disabled' : ''} style="padding:8px 16px;">
                    <i class="fa-solid fa-chevron-left"></i> Anterior
                </button>
                <div style="text-align:center;">
                    <div style="font-size:18px; font-weight:800; color:var(--text-primary);">Rodada ${round}</div>
                    <div style="font-size:11px; color:var(--text-muted); margin-top:2px;">
                        ${round <= 18 ? 'Brasileirão 2026 — 1º Turno' : 'Brasileirão 2026 — 2º Turno'}
                    </div>
                </div>
                <button class="action-btn" onclick="Jogos.goRound(1)" ${round >= Jogos.totalRounds ? 'disabled' : ''} style="padding:8px 16px;">
                    Próxima <i class="fa-solid fa-chevron-right"></i>
                </button>
            </div>

            ${hasPause && isFuture ? `
            <div style="display:flex; align-items:center; gap:10px; padding:10px 14px; margin-bottom:14px;
                background:rgba(255,159,67,0.06); border:1px solid rgba(255,159,67,0.2); border-radius:8px;">
                <i class="fa-solid fa-globe" style="color:var(--neon-orange);"></i>
                <span style="font-size:12px; color:var(--text-muted);">Pausa para a Copa do Mundo (junho/julho). Retorno previsto em agosto/2026.</span>
            </div>` : ''}

            ${games.length === 0 ? `
            <div class="glass-panel" style="text-align:center; padding:40px; color:var(--text-muted);">
                <i class="fa-solid fa-calendar" style="font-size:32px; margin-bottom:12px; opacity:0.3;"></i>
                <p>Jogos desta rodada ainda não foram divulgados.</p>
            </div>` :
            games.map(g => {
                const homeCode = clubMap[g.home] || '';
                const awayCode = clubMap[g.away] || '';
                const finished = g.status === 'finished';

                let middle = '';
                if (finished && g.hs !== null) {
                    middle = `<div class="jogo-score">${g.hs} - ${g.as}</div>`;
                } else {
                    middle = `<div class="jogo-score" style="font-size:13px; color:var(--text-muted); font-weight:600;">
                        <div>${g.time || 'A def.'}</div>
                        <div style="font-size:10px; margin-top:2px;">${g.date}</div>
                    </div>`;
                }

                return `<div class="jogo-card" style="${finished ? '' : 'opacity:0.75;'}">
                    <div class="jogo-team ${homeCode ? 'has-players' : ''}">
                        ${homeCode ? `<span class="jogo-club-badge">${homeCode}</span>` : ''}
                        <span class="jogo-team-name">${g.home}</span>
                    </div>
                    ${middle}
                    <div class="jogo-team away ${awayCode ? 'has-players' : ''}">
                        <span class="jogo-team-name">${g.away}</span>
                        ${awayCode ? `<span class="jogo-club-badge">${awayCode}</span>` : ''}
                    </div>
                </div>`;
            }).join('')}

            <p style="font-size:11px; color:var(--text-muted); margin-top:16px; text-align:center;">
                <i class="fa-solid fa-circle-info"></i> Horários de Brasília
            </p>`;
    },

    goRound(dir) {
        const next = Jogos.currentRound + dir;
        if (next < 1 || next > Jogos.totalRounds) return;
        Jogos.currentRound = next;
        Jogos.render();
    }
};
