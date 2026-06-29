-- ============================================================
-- PLAYRS - Schema inicial de base de datos
-- ============================================================

-- Habilitar extensiones necesarias
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS "pgcrypto";

-- ============================================================
-- TABLA: profiles (usuarios de la plataforma)
-- ============================================================
CREATE TABLE IF NOT EXISTS profiles (
  id            UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  privy_did     TEXT UNIQUE NOT NULL,         -- ID de Privy (ej: did:privy:xxx)
  username      TEXT UNIQUE,
  avatar_emoji  TEXT DEFAULT '👤',
  wallet_address TEXT,                        -- Wallet Solana del usuario (embedded o externa)
  balance_usdc  NUMERIC(18,6) DEFAULT 0,
  tier          TEXT DEFAULT 'standard' CHECK (tier IN ('standard','silver','gold','diamond','legend')),
  is_influencer BOOLEAN DEFAULT FALSE,
  referral_code TEXT UNIQUE DEFAULT upper(substring(gen_random_uuid()::text, 1, 8)),
  referred_by   UUID REFERENCES profiles(id),
  deposited_total NUMERIC(18,6) DEFAULT 0,
  withdrawn_total NUMERIC(18,6) DEFAULT 0,
  created_at    TIMESTAMPTZ DEFAULT NOW(),
  updated_at    TIMESTAMPTZ DEFAULT NOW()
);

-- ============================================================
-- TABLA: players (jugadores del catálogo)
-- ============================================================
CREATE TABLE IF NOT EXISTS players (
  id              TEXT PRIMARY KEY,           -- ej: "mbp-rm"
  api_football_id INTEGER,                   -- ID en API-Football
  name            TEXT NOT NULL,
  ticker          TEXT UNIQUE NOT NULL,
  team            TEXT NOT NULL,
  position        TEXT NOT NULL CHECK (position IN ('GK','DF','MD','FW')),
  nationality     TEXT,
  anchor_price    NUMERIC(10,2) NOT NULL,     -- P_anchor base
  current_price   NUMERIC(10,2) NOT NULL,
  price_change_pct NUMERIC(6,2) DEFAULT 0,
  stock_total     INTEGER DEFAULT 50,
  stock_remaining INTEGER DEFAULT 50,
  streak          INTEGER DEFAULT 0,
  is_frozen       BOOLEAN DEFAULT FALSE,
  is_rookie       BOOLEAN DEFAULT FALSE,
  is_high_hype    BOOLEAN DEFAULT FALSE,
  is_retired      BOOLEAN DEFAULT FALSE,
  historical_teams TEXT[],
  global_rating   NUMERIC(5,2) DEFAULT 70,
  last5_scores    NUMERIC(5,2)[] DEFAULT '{}',
  goals_season    INTEGER DEFAULT 0,
  assists_season  INTEGER DEFAULT 0,
  created_at      TIMESTAMPTZ DEFAULT NOW(),
  updated_at      TIMESTAMPTZ DEFAULT NOW()
);

-- ============================================================
-- TABLA: price_history (historial de precios por jugador)
-- ============================================================
CREATE TABLE IF NOT EXISTS price_history (
  id          BIGSERIAL PRIMARY KEY,
  player_id   TEXT REFERENCES players(id) ON DELETE CASCADE,
  price       NUMERIC(10,2) NOT NULL,
  recorded_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_price_history_player ON price_history(player_id, recorded_at DESC);

-- ============================================================
-- TABLA: user_cards (fichas en posesión de usuarios)
-- ============================================================
CREATE TABLE IF NOT EXISTS user_cards (
  id              UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  owner_id        UUID REFERENCES profiles(id) ON DELETE CASCADE,
  player_id       TEXT REFERENCES players(id),
  tier            TEXT DEFAULT 'standard' CHECK (tier IN ('standard','silver','gold','diamond','legend')),
  serial_number   INTEGER NOT NULL,
  acquired_price  NUMERIC(10,2) NOT NULL,
  is_listed       BOOLEAN DEFAULT FALSE,      -- TRUE si está en el mercado P2P
  retired_team    TEXT,                       -- Para leyendas retiradas
  retired_free_used BOOLEAN DEFAULT FALSE,
  acquired_at     TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(player_id, serial_number)
);

CREATE INDEX idx_user_cards_owner ON user_cards(owner_id);
CREATE INDEX idx_user_cards_player ON user_cards(player_id);

-- ============================================================
-- TABLA: p2p_listings (mercado secundario P2P)
-- ============================================================
CREATE TABLE IF NOT EXISTS p2p_listings (
  id          UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  card_id     UUID REFERENCES user_cards(id) ON DELETE CASCADE,
  seller_id   UUID REFERENCES profiles(id),
  player_id   TEXT REFERENCES players(id),
  price       NUMERIC(10,2) NOT NULL,
  status      TEXT DEFAULT 'active' CHECK (status IN ('active','sold','cancelled')),
  created_at  TIMESTAMPTZ DEFAULT NOW(),
  sold_at     TIMESTAMPTZ
);

CREATE INDEX idx_p2p_listings_status ON p2p_listings(status, created_at DESC);

-- ============================================================
-- TABLA: transactions (historial de transacciones)
-- ============================================================
CREATE TABLE IF NOT EXISTS transactions (
  id          UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id     UUID REFERENCES profiles(id),
  type        TEXT NOT NULL,                  -- 'buy_ipo','sell','p2p_buy','p2p_sell','deposit','withdraw','forge','bet_create','bet_win','bet_loss'
  amount      NUMERIC(18,6) NOT NULL,         -- positivo=entrada, negativo=salida
  description TEXT,
  player_id   TEXT REFERENCES players(id),
  card_id     UUID REFERENCES user_cards(id),
  status      TEXT DEFAULT 'success' CHECK (status IN ('success','pending','failed')),
  created_at  TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_transactions_user ON transactions(user_id, created_at DESC);

-- ============================================================
-- TABLA: bets (apuestas P2P)
-- ============================================================
CREATE TABLE IF NOT EXISTS bets (
  id              UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  creator_id      UUID REFERENCES profiles(id),
  opponent_id     UUID REFERENCES profiles(id),
  player_id       TEXT REFERENCES players(id),
  title           TEXT NOT NULL,
  bet_type        TEXT NOT NULL,              -- 'goals','assists','points','cleansheet'
  stake_usdc      NUMERIC(10,2) NOT NULL,
  pool_usdc       NUMERIC(10,2) NOT NULL,
  rake_pct        NUMERIC(5,4) DEFAULT 0.05,
  status          TEXT DEFAULT 'open' CHECK (status IN ('open','accepted','resolved','cancelled')),
  winner_id       UUID REFERENCES profiles(id),
  resolved_at     TIMESTAMPTZ,
  created_at      TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_bets_status ON bets(status, created_at DESC);

-- ============================================================
-- TABLA: match_oracle_log (log del oráculo por partido)
-- ============================================================
CREATE TABLE IF NOT EXISTS match_oracle_log (
  id              BIGSERIAL PRIMARY KEY,
  player_id       TEXT REFERENCES players(id),
  api_fixture_id  INTEGER,
  competition     TEXT,
  goals           INTEGER DEFAULT 0,
  assists         INTEGER DEFAULT 0,
  saves           INTEGER DEFAULT 0,
  clean_sheet     BOOLEAN DEFAULT FALSE,
  raw_score       NUMERIC(8,4),
  match_rating    NUMERIC(5,2),
  price_before    NUMERIC(10,2),
  price_after     NUMERIC(10,2),
  change_pct      NUMERIC(6,4),
  streak_before   INTEGER,
  streak_after    INTEGER,
  processed_at    TIMESTAMPTZ DEFAULT NOW()
);

-- ============================================================
-- ROW LEVEL SECURITY (RLS) - Seguridad por fila
-- ============================================================
ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE user_cards ENABLE ROW LEVEL SECURITY;
ALTER TABLE transactions ENABLE ROW LEVEL SECURITY;
ALTER TABLE bets ENABLE ROW LEVEL SECURITY;

-- Policies: cada usuario solo ve sus propios datos
CREATE POLICY "profiles: own data" ON profiles
  FOR ALL USING (privy_did = current_setting('request.jwt.claims', true)::json->>'sub');

CREATE POLICY "user_cards: own cards" ON user_cards
  FOR SELECT USING (
    owner_id = (SELECT id FROM profiles WHERE privy_did = current_setting('request.jwt.claims', true)::json->>'sub')
  );

CREATE POLICY "user_cards: insert own" ON user_cards
  FOR INSERT WITH CHECK (
    owner_id = (SELECT id FROM profiles WHERE privy_did = current_setting('request.jwt.claims', true)::json->>'sub')
  );

CREATE POLICY "transactions: own" ON transactions
  FOR SELECT USING (
    user_id = (SELECT id FROM profiles WHERE privy_did = current_setting('request.jwt.claims', true)::json->>'sub')
  );

-- Players y p2p_listings son públicos (solo lectura)
ALTER TABLE players ENABLE ROW LEVEL SECURITY;
CREATE POLICY "players: public read" ON players FOR SELECT USING (TRUE);

ALTER TABLE p2p_listings ENABLE ROW LEVEL SECURITY;
CREATE POLICY "p2p_listings: public read" ON p2p_listings FOR SELECT USING (status = 'active');

-- ============================================================
-- FUNCIÓN: actualizar updated_at automáticamente
-- ============================================================
CREATE OR REPLACE FUNCTION update_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trg_profiles_updated BEFORE UPDATE ON profiles
  FOR EACH ROW EXECUTE FUNCTION update_updated_at();

CREATE TRIGGER trg_players_updated BEFORE UPDATE ON players
  FOR EACH ROW EXECUTE FUNCTION update_updated_at();

-- ============================================================
-- SEED: jugadores iniciales del catálogo
-- ============================================================
INSERT INTO players (id, name, ticker, team, position, nationality, anchor_price, current_price, stock_total, stock_remaining, is_high_hype, is_rookie, global_rating)
VALUES
  ('mbp-rm', 'Kylian Mbappé',     'MBP-RM',  'Real Madrid',       'FW', 'Francia 🇫🇷',        60.00, 60.00, 50, 8,  TRUE,  FALSE, 80.5),
  ('erh-mc', 'Erling Haaland',    'ERH-MC',  'Man City',          'FW', 'Noruega 🇳🇴',        60.00, 60.00, 50, 15, TRUE,  FALSE, 79.0),
  ('vnj-rm', 'Vinícius Júnior',   'VNJ-RM',  'Real Madrid',       'FW', 'Brasil 🇧🇷',         60.00, 60.00, 50, 12, FALSE, FALSE, 68.9),
  ('bel-rm', 'Jude Bellingham',   'BEL-RM',  'Real Madrid',       'MD', 'Inglaterra 🇬🇧',     50.00, 50.00, 50, 10, FALSE, FALSE, 71.9),
  ('yam-bl', 'Lamine Yamal',      'YAM-BL',  'FC Barcelona',      'FW', 'España 🇪🇸',         45.00, 45.00, 50, 3,  TRUE,  TRUE,  87.0),
  ('cot-rm', 'Thibaut Courtois',  'COT-RM',  'Real Madrid',       'GK', 'Bélgica 🇧🇪',        25.00, 25.00, 50, 20, FALSE, FALSE, 78.6),
  ('sal-aj', 'Mohamed Salah',     'SAL-AJ',  'Liverpool',         'FW', 'Egipto 🇪🇬',         35.00, 35.00, 50, 18, FALSE, FALSE, 74.2),
  ('van-li', 'Virgil van Dijk',   'VAN-LI',  'Liverpool',         'DF', 'Países Bajos 🇳🇱',   25.00, 25.00, 50, 22, FALSE, FALSE, 73.0),
  ('mai-mu', 'Kobbie Mainoo',     'MAI-MU',  'Manchester United', 'MD', 'Inglaterra 🇬🇧',     25.00, 25.00, 50, 15, FALSE, TRUE,  70.2),
  ('end-rm', 'Endrick',           'END-RM',  'Real Madrid',       'FW', 'Brasil 🇧🇷',         25.00, 25.00, 50, 5,  TRUE,  TRUE,  75.0),
  ('gul-rm', 'Arda Güler',        'GUL-RM',  'Real Madrid',       'MD', 'Turquía 🇹🇷',        25.00, 25.00, 50, 20, FALSE, TRUE,  72.4)
ON CONFLICT (id) DO NOTHING;
