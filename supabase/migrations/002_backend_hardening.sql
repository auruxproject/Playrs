-- ============================================================
-- PLAYRS - Fase 1: Backend hardening
-- Roles, programa de creadores/influencers, política de username,
-- KYC, circuit breaker y auditoría de tesorería.
-- Ver docs/AUDITORIA_Y_PLAN.md, docs/PROGRAMA_INFLUENCERS.md,
-- docs/AUTENTICACION_WALLETS_KYC.md, docs/MODELO_CUSTODIA_FONDOS.md
-- ============================================================

-- ============================================================
-- ROLES (para el panel /admin protegido server-side)
-- ============================================================
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS role TEXT DEFAULT 'user' CHECK (role IN ('user','admin'));

-- ============================================================
-- PROGRAMA DE CREADORES / INFLUENCERS
-- Ver docs/PROGRAMA_INFLUENCERS.md §4 y §3.2
-- ============================================================
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS creator_tier TEXT DEFAULT NULL
  CHECK (creator_tier IN (NULL, 'verified', 'featured'));

-- Ancla FIJA del ciclo de 12 meses: se setea UNA VEZ al entrar al programa.
-- NO se toca cuando un admin sube/baja el tier dentro del ciclo.
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS creator_program_started_at TIMESTAMPTZ;
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS creator_cycle_renews_at TIMESTAMPTZ;

-- Puramente informativo/auditoría — no afecta el conteo de los 12 meses.
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS creator_tier_updated_at TIMESTAMPTZ;

-- Nota: la columna is_influencer (booleana, auto-toggleable por el usuario) queda
-- OBSOLETA a nivel de producto -- no se agrega aquí porque no existía en el schema
-- original; la lógica equivalente en StoreContext.tsx (isInfluencer/toggleInfluencer)
-- se reemplaza por creator_tier en el frontend durante la migración de Fase 1.

CREATE TABLE IF NOT EXISTS influencer_earnings (
  id              UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  creator_id      UUID REFERENCES profiles(id),
  period_month    DATE NOT NULL,              -- primer día del mes que se está agregando
  referred_active_count INTEGER DEFAULT 0,    -- referidos con >=1 transacción en el período
  fees_generated  NUMERIC(18,6) DEFAULT 0,    -- fees totales generados por sus referidos ese mes
  revenue_share_pct NUMERIC(5,4) NOT NULL,    -- 0.20 o 0.25 vigente ese mes
  earnings_usdc   NUMERIC(18,6) NOT NULL,     -- fees_generated * revenue_share_pct
  paid_at         TIMESTAMPTZ,
  created_at      TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(creator_id, period_month)
);

CREATE INDEX IF NOT EXISTS idx_influencer_earnings_creator ON influencer_earnings(creator_id, period_month DESC);

ALTER TABLE influencer_earnings ENABLE ROW LEVEL SECURITY;
CREATE POLICY "influencer_earnings: own data" ON influencer_earnings
  FOR SELECT USING (
    creator_id = (SELECT id FROM profiles WHERE privy_did = current_setting('request.jwt.claims', true)::json->>'sub')
  );
-- Sin política de INSERT/UPDATE para 'authenticated': solo service_role escribe aquí.

-- ============================================================
-- POLÍTICA DE USERNAME (1 cambio cada 365 días, validado en backend)
-- Ver docs/AUTENTICACION_WALLETS_KYC.md §2
-- ============================================================
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS username_changed_at TIMESTAMPTZ DEFAULT NOW();

CREATE TABLE IF NOT EXISTS username_history (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID REFERENCES profiles(id),
  old_username TEXT,
  changed_at TIMESTAMPTZ DEFAULT NOW()
);

ALTER TABLE username_history ENABLE ROW LEVEL SECURITY;
-- Sin políticas para 'authenticated': solo visible/escribible por service_role (soporte/moderación).

-- ============================================================
-- KYC (activado bajo demanda, no en el registro)
-- Ver docs/MODELO_CUSTODIA_FONDOS.md §5
-- ============================================================
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS kyc_verified BOOLEAN DEFAULT FALSE;
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS kyc_verified_at TIMESTAMPTZ;

-- ============================================================
-- CIRCUIT BREAKER GLOBAL (pausa de movimientos de fondos)
-- Ver docs/MODELO_CUSTODIA_FONDOS.md §6
-- ============================================================
CREATE TABLE IF NOT EXISTS platform_config (
  key   TEXT PRIMARY KEY,
  value JSONB NOT NULL,
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

INSERT INTO platform_config (key, value) VALUES ('platform_paused', 'false'::jsonb)
ON CONFLICT (key) DO NOTHING;

ALTER TABLE platform_config ENABLE ROW LEVEL SECURITY;
CREATE POLICY "platform_config: public read" ON platform_config FOR SELECT USING (TRUE);
-- Escritura solo por service_role (sin política INSERT/UPDATE para 'authenticated').

-- ============================================================
-- AUDITORÍA DE MOVIMIENTOS DE TESORERÍA (Hot / Operativa / Cold)
-- Ver docs/MODELO_CUSTODIA_FONDOS.md §2 y checklist
-- ============================================================
CREATE TABLE IF NOT EXISTS treasury_movements (
  id            BIGSERIAL PRIMARY KEY,
  movement_type TEXT NOT NULL CHECK (movement_type IN ('deposit_in','withdrawal_out','sweep_to_cold','fee_topup_hot','manual_adjustment')),
  from_wallet   TEXT,             -- 'hot' | 'operativa' | 'cold' | 'external'
  to_wallet     TEXT,
  amount_usdc   NUMERIC(18,6),
  amount_sol    NUMERIC(18,9),
  tx_signature  TEXT,             -- firma de la transacción Solana, si aplica
  notes         TEXT,
  created_at    TIMESTAMPTZ DEFAULT NOW()
);

-- Sin RLS de lectura pública: tabla interna, solo accesible vía service_role / panel admin.
ALTER TABLE treasury_movements ENABLE ROW LEVEL SECURITY;

-- ============================================================
-- RLS FALTANTE: escritura de transactions y bets SOLO por service_role
-- (el rol 'authenticated' -- cliente del navegador -- nunca tiene INSERT/UPDATE
-- aquí; el hallazgo de la auditoría era la ausencia explícita de esta restricción)
-- Ver docs/MODELO_CUSTODIA_FONDOS.md §6
-- ============================================================
-- No se agregan políticas de INSERT/UPDATE para 'authenticated' intencionalmente:
-- por defecto, sin una política que lo permita, RLS deniega. Esto documenta la
-- intención explícita de que solo service_role (que bypassa RLS) puede escribir.

-- ============================================================
-- updated_at trigger para las tablas nuevas que lo necesiten
-- ============================================================
CREATE TRIGGER trg_platform_config_updated BEFORE UPDATE ON platform_config
  FOR EACH ROW EXECUTE FUNCTION update_updated_at();
