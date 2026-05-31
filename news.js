// =============================================
// ARENA FANTASY - Notícias do Brasileirão
// Via API do Claude (busca notícias reais)
// =============================================

const News = {

    cache: null,
    cacheTime: null,

    async load() {
        const loading = document.getElementById('news-loading');
        const list = document.getElementById('news-list');
        if (loading) loading.style.display = 'block';
        if (list) list.innerHTML = '';

        // Cache de 15 minutos
        if (News.cache && News.cacheTime && (Date.now() - News.cacheTime) < 15 * 60 * 1000) {
            News.render(News.cache);
            if (loading) loading.style.display = 'none';
            return;
        }

        try {
            // Usa a API do Claude para buscar notícias atuais do Brasileirão
            const response = await fetch('https://api.anthropic.com/v1/messages', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    model: 'claude-sonnet-4-20250514',
                    max_tokens: 1000,
                    tools: [{ type: 'web_search_20250305', name: 'web_search' }],
                    messages: [{
                        role: 'user',
                        content: `Busque as 8 notícias mais recentes do Campeonato Brasileiro Série A 2026. 
                        Responda APENAS com um JSON array sem markdown, sem explicações, no formato:
                        [{"titulo":"...","resumo":"...","fonte":"...","url":"...","data":"...","clube":"FLA ou PAL ou etc"}]
                        Clubes válidos: FLA,PAL,BOT,CRU,BAH,SPFC,CAM,COR,GRE,FLU,VAS,INT,BRA,MIR,ATH,COT,CHE,REM,VIT,SAN
                        Se não souber o clube, use "GERAL".`
                    }]
                })
            });

            const data = await response.json();
            const text = data.content?.map(c => c.text || '').join('') || '';
            const clean = text.replace(/```json|```/g, '').trim();
            const noticias = JSON.parse(clean);

            News.cache = noticias;
            News.cacheTime = Date.now();
            News.render(noticias);

        } catch(e) {
            if (list) list.innerHTML = `
                <div class="glass-panel" style="text-align:center; padding:40px; color:var(--text-muted);">
                    <i class="fa-solid fa-newspaper" style="font-size:32px; margin-bottom:12px; opacity:0.4;"></i>
                    <p>Não foi possível carregar as notícias.</p>
                    <p style="font-size:12px; margin-top:8px;">Tente novamente em instantes.</p>
                </div>`;
        }

        if (loading) loading.style.display = 'none';
    },

    render(noticias) {
        const list = document.getElementById('news-list');
        if (!list || !noticias?.length) return;

        const clubColors = {
            FLA: '#e40000', PAL: '#006b3f', BOT: '#000000', CRU: '#1c3f9e',
            BAH: '#003087', SPFC: '#cc0000', CAM: '#000000', COR: '#000000',
            GRE: '#3b6eb5', FLU: '#6d1f2f', VAS: '#000000', INT: '#cc0000',
            BRA: '#e40000', MIR: '#005bac', ATH: '#c8102e', COT: '#006b3f',
            CHE: '#006b3f', REM: '#003087', VIT: '#e40000', SAN: '#000000',
            GERAL: '#00f2fe'
        };

        list.innerHTML = `<div class="news-grid">${noticias.map(n => {
            const color = clubColors[n.clube] || clubColors.GERAL;
            return `
                <a href="${n.url || '#'}" target="_blank" rel="noopener" class="news-card" style="--club-color:${color};">
                    <div class="news-card-header">
                        <span class="news-club-badge" style="background:${color}20; color:${color}; border-color:${color}40;">
                            ${n.clube || 'GERAL'}
                        </span>
                        <span class="news-date">${n.data || ''}</span>
                    </div>
                    <h4 class="news-title">${n.titulo}</h4>
                    <p class="news-summary">${n.resumo}</p>
                    <div class="news-footer">
                        <span class="news-source"><i class="fa-solid fa-link" style="font-size:10px;"></i> ${n.fonte || 'Fonte'}</span>
                        <span style="color:var(--neon-blue); font-size:12px;">Ler mais →</span>
                    </div>
                </a>`;
        }).join('')}</div>`;
    }
};
