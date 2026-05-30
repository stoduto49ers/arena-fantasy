# Arena Fantasy 🏆

Fantasy Football do Brasileirão — formato draft + temporada estilo NFL.

## Stack
- HTML / CSS / JS puro (sem framework)
- Supabase (banco de dados + autenticação + realtime)
- Vercel (hospedagem)

## Arquivos principais
| Arquivo | Função |
|---|---|
| `index.html` | App principal |
| `app.js` | Lógica geral (dashboard, escalação, mercado) |
| `auth.js` | Login / cadastro |
| `draft.js` | Sistema de slow draft |
| `waiver.js` | Mercado waiver pós-draft |
| `trades.js` | Sistema de trocas |
| `league-config.js` | Configurações da liga (comissário) |
| `players.js` | Base de jogadores do Brasileirão 2026 |
| `supabase.js` | Conexão com Supabase |
| `config.js` | Constantes do jogo |
| `styles.css` | Estilos |

## Setup
1. Crie um projeto no [Supabase](https://supabase.com)
2. Rode os arquivos `.sql` no SQL Editor do Supabase
3. Preencha `supabase.js` com sua URL e chave
4. Suba no Vercel conectando este repositório
