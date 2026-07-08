// =============================================
// ARENA FANTASY - Processamento do Waiver (Vercel Cron)
// Roda automaticamente às 08:00 (horário de Brasília)
// via configuração "crons" no vercel.json.
//
// REQUER variável de ambiente no Vercel:
//   SUPABASE_SERVICE_ROLE_KEY  (Settings → API → service_role)
// Opcional:
//   CRON_SECRET  (protege o endpoint contra chamadas externas)
//
// Usa a REST API do Supabase direto (sem dependências npm).
// =============================================

const SUPABASE_URL = 'https://jrfbpxaszojqdxpqdtsx.supabase.co';

function sb(path, { method = 'GET', body = null, headers = {} } = {}) {
    const key = process.env.SUPABASE_SERVICE_ROLE_KEY;
    return fetch(`${SUPABASE_URL}/rest/v1/${path}`, {
        method,
        headers: {
            'apikey': key,
            'Authorization': `Bearer ${key}`,
            'Content-Type': 'application/json',
            'Prefer': method === 'GET' ? '' : 'return=representation',
            ...headers,
        },
        body: body ? JSON.stringify(body) : null,
    }).then(async r => {
        const text = await r.text();
        let data = null;
        try { data = text ? JSON.parse(text) : null; } catch(e) {}
        if (!r.ok) throw new Error(`Supabase ${r.status}: ${text}`);
        return data;
    });
}

export default async function handler(req, res) {
    // Proteção: só o cron do Vercel (ou quem tiver o secret) pode chamar
    const secret = process.env.CRON_SECRET;
    if (secret) {
        const auth = req.headers['authorization'] || '';
        if (auth !== `Bearer ${secret}`) {
            return res.status(401).json({ error: 'Não autorizado' });
        }
    }

    if (!process.env.SUPABASE_SERVICE_ROLE_KEY) {
        return res.status(500).json({ error: 'SUPABASE_SERVICE_ROLE_KEY não configurada no Vercel' });
    }

    try {
        // 1. Busca lances pendentes com vencimento até agora, maior lance primeiro
        const now = new Date().toISOString();
        const bids = await sb(
            `waiver_bids?status=eq.pending&process_at=lte.${now}&order=bid_amount.desc,created_at.asc`
        );

        if (!bids?.length) {
            return res.status(200).json({ ok: true, processed: 0, message: 'Nenhum lance pendente.' });
        }

        const processedPlayers = new Set();   // por liga+jogador
        const transactionsByLeague = {};      // resumos por liga
        let won = 0, lost = 0;

        for (const bid of bids) {
            const playerKey = `${bid.league_id || 'global'}:${bid.player_id}`;

            // Jogador já foi arrematado por lance maior nesta rodada de waiver
            if (processedPlayers.has(playerKey)) {
                await sb(`waiver_bids?id=eq.${bid.id}`, {
                    method: 'PATCH', body: { status: 'lost', result_note: 'Lance maior venceu' }
                });
                lost++;
                continue;
            }

            // Jogador já pertence a alguém? (proteção extra)
            const leagueFilter = bid.league_id ? `&league_id=eq.${bid.league_id}` : '';
            const owned = await sb(`draft_picks?player_id=eq.${bid.player_id}${leagueFilter}&select=id&limit=1`);
            if (owned?.length) {
                await sb(`waiver_bids?id=eq.${bid.id}`, {
                    method: 'PATCH', body: { status: 'lost', result_note: 'Jogador já contratado' }
                });
                lost++;
                continue;
            }

            // Saldo do manager
            const mgrs = await sb(`managers?id=eq.${bid.manager_id}&select=budget,team_name`);
            const mgr = mgrs?.[0];
            if (!mgr || mgr.budget < bid.bid_amount) {
                await sb(`waiver_bids?id=eq.${bid.id}`, {
                    method: 'PATCH', body: { status: 'lost', result_note: 'Saldo insuficiente' }
                });
                lost++;
                continue;
            }

            // Nome do jogador dropado (antes de deletar)
            let droppedName = null;
            if (bid.drop_player_id) {
                const dropped = await sb(
                    `draft_picks?manager_id=eq.${bid.manager_id}&player_id=eq.${bid.drop_player_id}&select=player_name&limit=1`
                );
                droppedName = dropped?.[0]?.player_name || `#${bid.drop_player_id}`;
            }

            // LANCE VENCEDOR: adiciona ao roster
            await sb('draft_picks', {
                method: 'POST',
                body: {
                    league_id: bid.league_id,
                    round: 0, pick_number: 9999,
                    manager_id: bid.manager_id,
                    player_id: bid.player_id,
                    player_name: bid.player_name,
                    player_position: bid.player_position,
                    player_club: bid.player_club,
                }
            });

            // Remove o dropado
            if (bid.drop_player_id) {
                await sb(
                    `draft_picks?manager_id=eq.${bid.manager_id}&player_id=eq.${bid.drop_player_id}`,
                    { method: 'DELETE' }
                );
            }

            // Desconta o lance
            await sb(`managers?id=eq.${bid.manager_id}`, {
                method: 'PATCH', body: { budget: mgr.budget - bid.bid_amount }
            });

            await sb(`waiver_bids?id=eq.${bid.id}`, {
                method: 'PATCH', body: { status: 'won' }
            });

            processedPlayers.add(playerKey);
            won++;

            const lkey = bid.league_id || 'global';
            if (!transactionsByLeague[lkey]) transactionsByLeague[lkey] = [];
            transactionsByLeague[lkey].push({
                team: mgr.team_name,
                player: bid.player_name,
                pos: bid.player_position,
                value: bid.bid_amount,
                dropped: droppedName,
            });
        }

        // 2. Resumo no chat de cada liga
        for (const [leagueId, txs] of Object.entries(transactionsByLeague)) {
            const lines = txs.map(t =>
                `• ${t.team}: +${t.player} (${t.pos}) D$${t.value}${t.dropped ? ` | -${t.dropped}` : ''}`
            ).join('\n');

            await sb('chat_messages', {
                method: 'POST',
                body: {
                    league_id: leagueId === 'global' ? null : leagueId,
                    manager_id: txs.length ? null : null, // sistema
                    team_name: '🔨 Resumo do Mercado',
                    avatar_color: '#ff9f43',
                    message: `Waiver das 08:00 processado!\n${lines}`
                }
            }).catch(e => console.error('chat insert:', e.message));
        }

        return res.status(200).json({ ok: true, won, lost, total: bids.length });
    } catch (err) {
        console.error('process-waiver error:', err);
        return res.status(500).json({ error: String(err.message || err) });
    }
}
