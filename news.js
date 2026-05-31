// =============================================
// ARENA FANTASY - Notícias do Brasileirão
// Fonte: ge.globo.com RSS + fallback Claude Search
// =============================================

const News = {

    cache: null,
    cacheTime: null,
    CACHE_TTL: 15 * 60 * 1000, // 15 min

    async load() {
        const loading = document.getElementById('news-loading');
        const list = document.getElementById('news-list');
        if (loading) loading.style.display = 'block';
        if (list) list.innerHTML = '';

        if (News.cache && News.cacheTime && (Date.now() - News.cacheTime) < News.CACHE_TTL) {
            News.render(News.cache);
            if (loading) loading.style.display = 'none';
            return;
        }

        // Tenta RSS do GE primeiro
        let noticias = await News.fetchRSS();

        // Fallback: Claude com busca web
        if (!noticias?.length) noticias = await News.fetchViaClaude();

        if (noticias?.length) {
            News.cache = noticias;
            News.cacheTime = Date.now();
            News.render(noticias);
        } else {
            if (list) list.innerHTML = `<div class="glass-panel" style="text-align:center; padding:40px; color:var(--text-muted);">
                <i class="fa-solid fa-newspaper" style="font-size:32px; margin-bottom:12px; opacity:0.4;"></i>
                <p>Não foi possível carregar as notícias.</p>
                <button class="action-btn primary" onclick="News.load()" style="margin-top:12px;">Tentar novamente</button>
            </div>`;
        }

        if (loading) loading.style.display = 'none';
    },

    async fetchRSS() {
        try {
            // Usa proxy público para evitar CORS
            const rssUrl = 'https://ge.globo.com/rss/futebol/brasileirao-serie-a/';
            const proxyUrl = `https://api.rss2json.com/v1/api.json?rss_url=${encodeURIComponent(rssUrl)}&count=12`;
            const res = await fetch(proxyUrl);
            const data = await res.json();
            if (!data.items?.length) return null;
            return data.items.map(item => ({
                titulo: item.title,
                resumo: item.description?.replace(/<[^>]*>/g, '').substring(0, 200) + '...',
                fonte: 'ge.globo.com',
                url: item.link,
                data: new Date(item.pubDate).toLocaleDateString('pt-BR', { day: '2-digit', month: 'short' }),
                clube: News.detectClub(item.title + ' ' + item.description)
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
                        content: `Busque as 10 notícias mais recentes do Campeonato Brasileiro Série A 2026.
                        Responda APENAS com JSON puro sem markdown:
                        [{"titulo":"...","resumo":"máximo 150 chars...","fonte":"nome do site","url":"link real","data":"DD/MM","clube":"FLA"}]
                        Clubes: FLA,PAL,BOT,CRU,BAH,SPFC,CAM,COR,GRE,FLU,VAS,INT,BRA,MIR,ATH,COT,CHE,REM,VIT,SAN,GERAL`
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

    detectClub(text) {
        const map = {
            'Flamengo': 'FLA', 'Palmeiras': 'PAL', 'Botafogo': 'BOT', 'Cruzeiro': 'CRU',
            'Bahia': 'BAH', 'São Paulo': 'SPFC', 'Atlético': 'CAM', 'Corinthians': 'COR',
            'Grêmio': 'GRE', 'Fluminense': 'FLU', 'Vasco': 'VAS', 'Internacional': 'INT',
            'Bragantino': 'BRA', 'Mirassol': 'MIR', 'Athletico': 'ATH', 'Coritiba': 'COT',
            'Chapecoense': 'CHE', 'Remo': 'REM', 'Vitória': 'VIT', 'Santos': 'SAN'
        };
        for (const [name, code] of Object.entries(map)) {
            if (text.includes(name)) return code;
        }
        return 'GERAL';
    },

    render(noticias) {
        const list = document.getElementById('news-list');
        if (!list || !noticias?.length) return;

        const clubColors = {
            FLA: '#e40000', PAL: '#006b3f', BOT: '#1a1a2e', CRU: '#1c3f9e',
            BAH: '#003087', SPFC: '#cc0000', CAM: '#1a1a1a', COR: '#1a1a1a',
            GRE: '#3b6eb5', FLU: '#6d1f2f', VAS: '#1a1a2e', INT: '#cc0000',
            BRA: '#e40000', MIR: '#005bac', ATH: '#c8102e', COT: '#006b3f',
            CHE: '#006b3f', REM: '#003087', VIT: '#e40000', SAN: '#1a1a2e',
            GERAL: '#00f2fe'
        };

        list.innerHTML = `<div class="news-grid">${noticias.map(n => {
            const color = clubColors[n.clube] || clubColors.GERAL;
            return `<a href="${n.url || '#'}" target="_blank" rel="noopener" class="news-card" style="--club-color:${color};">
                <div class="news-card-header">
                    <span class="news-club-badge" style="background:${color}20; color:${color}; border-color:${color}50;">
                        ${n.clube || 'GERAL'}
                    </span>
                    <span class="news-date">${n.data || ''}</span>
                </div>
                <h4 class="news-title">${n.titulo}</h4>
                <p class="news-summary">${n.resumo}</p>
                <div class="news-footer">
                    <span class="news-source"><i class="fa-solid fa-link" style="font-size:9px;"></i> ${n.fonte || ''}</span>
                    <span style="color:var(--neon-blue); font-size:12px;">Ler →</span>
                </div>
            </a>`;
        }).join('')}</div>`;
    }
};
