// =============================================
// ARENA FANTASY - Notícias do Brasileirão
// Fonte: rss2json.com + ge.globo.com RSS
// =============================================

const News = {

    cache: null,
    cacheTime: null,
    CACHE_TTL: 15 * 60 * 1000,

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

        // Tenta múltiplos RSS via rss2json (gratuito, sem CORS)
        const feeds = [
            'https://ge.globo.com/rss/futebol/brasileirao-serie-a/',
            'https://www.gazetaesportiva.com/feed/',
            'https://www.lancenet.com.br/feed/',
        ];

        let noticias = null;
        for (const feed of feeds) {
            noticias = await News.fetchRSS(feed);
            if (noticias?.length) break;
        }

        if (!noticias?.length) {
            if (list) list.innerHTML = `
                <div class="glass-panel" style="text-align:center; padding:40px; color:var(--text-muted);">
                    <i class="fa-solid fa-newspaper" style="font-size:32px; margin-bottom:12px; opacity:0.4;"></i>
                    <p style="margin-bottom:8px;">Não foi possível carregar as notícias.</p>
                    <p style="font-size:12px;">Verifique sua conexão e tente novamente.</p>
                    <button class="action-btn primary" onclick="News.load()" style="margin-top:16px;">
                        <i class="fa-solid fa-rotate"></i> Tentar novamente
                    </button>
                </div>`;
            if (loading) loading.style.display = 'none';
            return;
        }

        News.cache = noticias;
        News.cacheTime = Date.now();
        News.render(noticias);
        if (loading) loading.style.display = 'none';
    },

    async fetchRSS(rssUrl) {
        try {
            const proxy = `https://api.rss2json.com/v1/api.json?rss_url=${encodeURIComponent(rssUrl)}&count=12&api_key=free`;
            const res = await fetch(proxy, { signal: AbortSignal.timeout(8000) });
            const data = await res.json();
            if (data.status !== 'ok' || !data.items?.length) return null;

            return data.items.map(item => ({
                titulo: item.title?.trim(),
                resumo: item.description
                    ?.replace(/<[^>]*>/g, '')
                    ?.replace(/\s+/g, ' ')
                    ?.trim()
                    ?.substring(0, 180) + '...',
                fonte: new URL(rssUrl).hostname.replace('www.', ''),
                url: item.link,
                data: item.pubDate
                    ? new Date(item.pubDate).toLocaleDateString('pt-BR', { day: '2-digit', month: 'short' })
                    : '',
                clube: News.detectClub(item.title + ' ' + (item.description || ''))
            })).filter(n => n.titulo);
        } catch { return null; }
    },

    detectClub(text) {
        const map = [
            ['Flamengo', 'FLA'], ['Palmeiras', 'PAL'], ['Botafogo', 'BOT'],
            ['Cruzeiro', 'CRU'], ['Bahia', 'BAH'], ['São Paulo', 'SPFC'],
            ['Atlético', 'CAM'], ['Corinthians', 'COR'], ['Grêmio', 'GRE'],
            ['Fluminense', 'FLU'], ['Vasco', 'VAS'], ['Internacional', 'INT'],
            ['Bragantino', 'BRA'], ['Mirassol', 'MIR'], ['Athletico', 'ATH'],
            ['Coritiba', 'COT'], ['Chapecoense', 'CHE'], ['Remo', 'REM'],
            ['Vitória', 'VIT'], ['Santos', 'SAN']
        ];
        for (const [name, code] of map) {
            if (text.includes(name)) return code;
        }
        return 'GERAL';
    },

    render(noticias) {
        const list = document.getElementById('news-list');
        if (!list || !noticias?.length) return;

        const clubColors = {
            FLA: '#e40000', PAL: '#006b3f', BOT: '#2c2c54', CRU: '#1c3f9e',
            BAH: '#003087', SPFC: '#cc0000', CAM: '#2c2c2c', COR: '#2c2c2c',
            GRE: '#3b6eb5', FLU: '#6d1f2f', VAS: '#2c2c54', INT: '#cc0000',
            BRA: '#e40000', MIR: '#005bac', ATH: '#c8102e', COT: '#006b3f',
            CHE: '#006b3f', REM: '#003087', VIT: '#e40000', SAN: '#2c2c2c',
            GERAL: '#00f2fe'
        };

        list.innerHTML = `<div class="news-grid">${noticias.map(n => {
            const color = clubColors[n.clube] || clubColors.GERAL;
            return `<a href="${n.url || '#'}" target="_blank" rel="noopener" class="news-card" style="--club-color:${color};">
                <div class="news-card-header">
                    <span class="news-club-badge" style="background:${color}20;color:${color};border-color:${color}50;">${n.clube || 'GERAL'}</span>
                    <span class="news-date">${n.data || ''}</span>
                </div>
                <h4 class="news-title">${n.titulo}</h4>
                <p class="news-summary">${n.resumo || ''}</p>
                <div class="news-footer">
                    <span class="news-source"><i class="fa-solid fa-link" style="font-size:9px;"></i> ${n.fonte || ''}</span>
                    <span style="color:var(--neon-blue);font-size:12px;">Ler →</span>
                </div>
            </a>`;
        }).join('')}</div>`;
    }
};
