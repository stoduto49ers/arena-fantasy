// =============================================
// ARENA FANTASY - Jogos do Brasileirão
// Usa API não-oficial do Cartola FC
// =============================================

const Jogos = {

    async load() {
        const loading = document.getElementById('jogos-loading');
        const list = document.getElementById('jogos-list');
        if (loading) loading.style.display = 'block';
        if (list) list.innerHTML = '';

        try {
            // API pública do Cartola FC
            const res = await fetch('https://api.cartola.globo.com/partidas');
            const data = await res.json();
            Jogos.render(data);
        } catch (e) {
            if (list) list.innerHTML = `
                <div class="glass-panel" style="text-align:center; padding:40px; color:var(--text-muted);">
                    <i class="fa-solid fa-wifi" style="font-size:32px; margin-bottom:12px; opacity:0.4;"></i>
                    <p>Não foi possível carregar os jogos.</p>
                    <p style="font-size:12px; margin-top:8px;">Verifique sua conexão ou tente novamente.</p>
                </div>`;
        }

        if (loading) loading.style.display = 'none';
    },

    render(data) {
        const list = document.getElementById('jogos-list');
        if (!list) return;

        const partidas = data?.partidas || data || [];

        if (!partidas.length) {
            list.innerHTML = `<div class="glass-panel" style="text-align:center; padding:40px; color:var(--text-muted);">
                <p>Nenhum jogo encontrado para a rodada atual.</p>
            </div>`;
            return;
        }

        // Agrupa por data
        const byDate = {};
        partidas.forEach(p => {
            const date = p.partida_data?.split(' ')[0] || 'A definir';
            if (!byDate[date]) byDate[date] = [];
            byDate[date].push(p);
        });

        list.innerHTML = Object.entries(byDate).map(([date, jogos]) => {
            const dateLabel = date !== 'A definir' ? Jogos.formatDate(date) : 'A definir';
            return `
                <div style="margin-bottom:16px;">
                    <div style="font-size:11px; font-weight:700; color:var(--text-muted); text-transform:uppercase;
                        letter-spacing:1px; padding:8px 0; margin-bottom:8px; border-bottom:1px solid var(--border-color);">
                        ${dateLabel}
                    </div>
                    ${jogos.map(j => Jogos.renderJogo(j)).join('')}
                </div>`;
        }).join('');
    },

    renderJogo(j) {
        const home = j.clube_casa_posicao ? j.clube?.[j.clube_casa_id] : null;
        const away = j.clube_visitante_posicao ? j.clube?.[j.clube_visitante_id] : null;

        // Nomes dos times
        const homeName = j.clube_casa || home?.nome || j.time_mandante || '—';
        const awayName = j.clube_visitante || away?.nome || j.time_visitante || '—';
        const homeScore = j.placar_oficial_mandante ?? j.placar_mandante ?? '';
        const awayScore = j.placar_oficial_visitante ?? j.placar_visitante ?? '';
        const hora = j.partida_data?.split(' ')[1]?.substring(0, 5) || j.hora || '';
        const status = j.status || '';

        const isLive = status === 'ao_vivo' || status === 'live';
        const isFinished = homeScore !== '' && !isLive;

        let scorePart = '';
        if (isLive) {
            scorePart = `<div class="jogo-score live">${homeScore} <span style="font-size:10px;color:var(--neon-red);animation:pulse 1s infinite;">●</span> ${awayScore}</div>`;
        } else if (isFinished) {
            scorePart = `<div class="jogo-score">${homeScore} - ${awayScore}</div>`;
        } else {
            scorePart = `<div class="jogo-hora">${hora || 'A def.'}</div>`;
        }

        // Destaca times que têm jogadores na liga
        const clubesCodes = {
            'Flamengo': 'FLA', 'Palmeiras': 'PAL', 'Botafogo': 'BOT',
            'Cruzeiro': 'CRU', 'Bahia': 'BAH', 'São Paulo': 'SPFC',
            'Atlético Mineiro': 'CAM', 'Corinthians': 'COR', 'Grêmio': 'GRE',
            'Fluminense': 'FLU', 'Vasco': 'VAS', 'Internacional': 'INT',
            'Red Bull Bragantino': 'BRA', 'Bragantino': 'BRA', 'Mirassol': 'MIR',
            'Athletico Paranaense': 'ATH', 'Athletico-PR': 'ATH',
            'Coritiba': 'COT', 'Chapecoense': 'CHE', 'Remo': 'REM',
            'Vitória': 'VIT', 'Santos': 'SAN'
        };

        const homeCode = clubesCodes[homeName] || '';
        const awayCode = clubesCodes[awayName] || '';

        return `
            <div class="jogo-card ${isLive ? 'jogo-live' : ''}">
                <div class="jogo-team ${homeCode ? 'has-players' : ''}">
                    ${homeCode ? `<span class="jogo-club-badge">${homeCode}</span>` : ''}
                    <span class="jogo-team-name">${homeName}</span>
                </div>
                ${scorePart}
                <div class="jogo-team away ${awayCode ? 'has-players' : ''}">
                    <span class="jogo-team-name">${awayName}</span>
                    ${awayCode ? `<span class="jogo-club-badge">${awayCode}</span>` : ''}
                </div>
            </div>`;
    },

    formatDate(dateStr) {
        try {
            const [y, m, d] = dateStr.split('-');
            const days = ['Dom', 'Seg', 'Ter', 'Qua', 'Qui', 'Sex', 'Sáb'];
            const months = ['Jan','Fev','Mar','Abr','Mai','Jun','Jul','Ago','Set','Out','Nov','Dez'];
            const date = new Date(y, m - 1, d);
            return `${days[date.getDay()]}, ${d} de ${months[m - 1]}`;
        } catch { return dateStr; }
    }
};
