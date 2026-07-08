// =============================================
// ARENA FANTASY - Proxy da API do Cartola FC
// A API do Cartola não envia headers de CORS,
// então o navegador não consegue chamá-la direto.
// Esta função roda no Vercel e repassa a resposta.
//
// Uso no front:
//   /api/cartola?endpoint=mercado    → todos os jogadores + clubes
//   /api/cartola?endpoint=pontuados  → pontuação da rodada em andamento/última
//   /api/cartola?endpoint=status     → status do mercado (rodada atual etc.)
//   /api/cartola?endpoint=rodadas    → calendário de rodadas
// =============================================

const ENDPOINTS = {
    mercado: 'https://api.cartola.globo.com/atletas/mercado',
    pontuados: 'https://api.cartola.globo.com/atletas/pontuados',
    status: 'https://api.cartola.globo.com/mercado/status',
    rodadas: 'https://api.cartola.globo.com/rodadas',
};

export default async function handler(req, res) {
    res.setHeader('Access-Control-Allow-Origin', '*');
    res.setHeader('Access-Control-Allow-Methods', 'GET, OPTIONS');
    if (req.method === 'OPTIONS') return res.status(200).end();

    const { endpoint } = req.query;
    const url = ENDPOINTS[endpoint];

    if (!url) {
        return res.status(400).json({
            error: 'Endpoint inválido. Use: ' + Object.keys(ENDPOINTS).join(', ')
        });
    }

    try {
        const response = await fetch(url, {
            headers: { 'User-Agent': 'Mozilla/5.0 (ArenaFantasy)' },
        });
        if (!response.ok) {
            return res.status(response.status).json({ error: `Cartola API respondeu ${response.status}` });
        }
        const data = await response.json();
        res.setHeader('Cache-Control', 's-maxage=60, stale-while-revalidate=120');
        return res.status(200).json(data);
    } catch (err) {
        return res.status(502).json({ error: 'Falha ao consultar a API do Cartola', detail: String(err) });
    }
}
