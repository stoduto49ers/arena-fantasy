-- =============================================
-- ARENA FANTASY - Setup do Banco de Dados
-- Cole esse SQL inteiro no Supabase SQL Editor e clique em Run
-- =============================================

-- Tabela de managers (um por usuário)
CREATE TABLE IF NOT EXISTS managers (
    id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
    email TEXT NOT NULL,
    team_name TEXT NOT NULL,
    avatar_letter TEXT DEFAULT 'A',
    budget INTEGER DEFAULT 1000,
    wins INTEGER DEFAULT 0,
    losses INTEGER DEFAULT 0,
    total_points NUMERIC(8,2) DEFAULT 0,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Tabela de picks do draft
CREATE TABLE IF NOT EXISTS draft_picks (
    id SERIAL PRIMARY KEY,
    round INTEGER NOT NULL,
    pick_number INTEGER NOT NULL,
    manager_id UUID REFERENCES managers(id) ON DELETE SET NULL,
    player_id INTEGER NOT NULL,
    player_name TEXT NOT NULL,
    player_position TEXT NOT NULL,
    player_club TEXT NOT NULL,
    picked_at TIMESTAMPTZ DEFAULT NOW()
);

-- Tabela de estado do draft (controla de quem é a vez)
CREATE TABLE IF NOT EXISTS draft_state (
    id INTEGER PRIMARY KEY DEFAULT 1, -- só uma linha
    current_pick_index INTEGER DEFAULT 0,
    is_finished BOOLEAN DEFAULT FALSE,
    timer_expires_at TIMESTAMPTZ,
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Insere o estado inicial do draft
INSERT INTO draft_state (id, current_pick_index, is_finished)
VALUES (1, 0, FALSE)
ON CONFLICT (id) DO NOTHING;

-- Tabela de escalação semanal de cada manager
CREATE TABLE IF NOT EXISTS lineups (
    id SERIAL PRIMARY KEY,
    manager_id UUID REFERENCES managers(id) ON DELETE CASCADE,
    round INTEGER NOT NULL,
    formation TEXT DEFAULT '4-3-3',
    starters JSONB DEFAULT '[]',
    bench JSONB DEFAULT '[]',
    updated_at TIMESTAMPTZ DEFAULT NOW(),
    UNIQUE(manager_id, round)
);

-- =============================================
-- PERMISSÕES (Row Level Security)
-- Cada manager só vê/edita seus próprios dados
-- =============================================

ALTER TABLE managers ENABLE ROW LEVEL SECURITY;
ALTER TABLE draft_picks ENABLE ROW LEVEL SECURITY;
ALTER TABLE draft_state ENABLE ROW LEVEL SECURITY;
ALTER TABLE lineups ENABLE ROW LEVEL SECURITY;

-- Managers: lê todos, edita só o próprio
CREATE POLICY "managers_select" ON managers FOR SELECT USING (true);
CREATE POLICY "managers_insert" ON managers FOR INSERT WITH CHECK (auth.uid() = id);
CREATE POLICY "managers_update" ON managers FOR UPDATE USING (auth.uid() = id);

-- Draft picks: todos leem, cada um insere só a sua
CREATE POLICY "picks_select" ON draft_picks FOR SELECT USING (true);
CREATE POLICY "picks_insert" ON draft_picks FOR INSERT WITH CHECK (auth.uid() = manager_id);

-- Draft state: todos leem
CREATE POLICY "state_select" ON draft_state FOR SELECT USING (true);
CREATE POLICY "state_update" ON draft_state FOR UPDATE USING (true);

-- Lineups: lê todas, edita só a própria
CREATE POLICY "lineups_select" ON lineups FOR SELECT USING (true);
CREATE POLICY "lineups_insert" ON lineups FOR INSERT WITH CHECK (auth.uid() = manager_id);
CREATE POLICY "lineups_update" ON lineups FOR UPDATE USING (auth.uid() = manager_id);
