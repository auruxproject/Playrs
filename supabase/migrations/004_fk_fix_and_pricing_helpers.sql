-- ============================================================
-- PLAYRS - Fase 1: fix de FK + funciones de valoración/fees reutilizables
--
-- BUG encontrado antes de implementar venta/forja: transactions.card_id y
-- p2p_listings.card_id referencian user_cards(id) SIN "ON DELETE", lo que
-- por defecto es "NO ACTION" -- en cuanto exista una transacción histórica
-- apuntando a una ficha (ej. su compra original), esa ficha ya NUNCA podría
-- borrarse (instant-sell, quema por forja) sin violar la FK. Se corrige
-- a ON DELETE SET NULL: el registro histórico se conserva (la descripción
-- de texto ya explica qué pasó), solo se limpia la referencia.
-- ============================================================

ALTER TABLE transactions DROP CONSTRAINT IF EXISTS transactions_card_id_fkey;
ALTER TABLE transactions ADD CONSTRAINT transactions_card_id_fkey
  FOREIGN KEY (card_id) REFERENCES user_cards(id) ON DELETE SET NULL;

ALTER TABLE p2p_listings DROP CONSTRAINT IF EXISTS p2p_listings_card_id_fkey;
ALTER TABLE p2p_listings ADD CONSTRAINT p2p_listings_card_id_fkey
  FOREIGN KEY (card_id) REFERENCES user_cards(id) ON DELETE SET NULL;

-- ============================================================
-- Puerto a SQL de la lógica de valoración/fees hoy solo en
-- src/context/StoreContext.tsx (cliente). Es el mismo cálculo,
-- server-side, para que compra/venta/forja recalculen todo desde
-- la DB y nunca confíen en un monto que mande el cliente.
-- ============================================================

CREATE OR REPLACE FUNCTION get_player_category(p_price NUMERIC)
RETURNS TEXT LANGUAGE sql IMMUTABLE AS $$
  SELECT CASE
    WHEN p_price < 30  THEN 'c1'
    WHEN p_price < 60  THEN 'c2'
    WHEN p_price < 100 THEN 'c3'
    WHEN p_price < 160 THEN 'c4'
    ELSE 'c5'
  END;
$$;

-- Recursivo: replica getCardValuation() de StoreContext.tsx. La categoría
-- se calcula UNA vez a partir del precio base y se reutiliza en toda la
-- recursión (igual que en el original) -- no se recalcula sobre el valor
-- ya multiplicado.
CREATE OR REPLACE FUNCTION get_card_valuation(p_base_price NUMERIC, p_tier TEXT)
RETURNS NUMERIC LANGUAGE plpgsql IMMUTABLE AS $$
DECLARE
  v_category TEXT := get_player_category(p_base_price);
  v_premium  NUMERIC;
  v_prev     NUMERIC;
BEGIN
  IF p_tier = 'standard' THEN
    RETURN p_base_price;
  ELSIF p_tier = 'silver' THEN
    v_premium := CASE v_category WHEN 'c1' THEN 10 WHEN 'c2' THEN 20 WHEN 'c3' THEN 30 WHEN 'c4' THEN 45 ELSE 60 END;
    RETURN 10 * p_base_price + v_premium;
  ELSIF p_tier = 'gold' THEN
    v_premium := CASE v_category WHEN 'c1' THEN 50 WHEN 'c2' THEN 100 WHEN 'c3' THEN 150 WHEN 'c4' THEN 220 ELSE 300 END;
    v_prev := get_card_valuation(p_base_price, 'silver');
    RETURN 8 * v_prev + v_premium;
  ELSIF p_tier = 'diamond' THEN
    v_premium := CASE v_category WHEN 'c1' THEN 250 WHEN 'c2' THEN 500 WHEN 'c3' THEN 750 WHEN 'c4' THEN 1100 ELSE 1500 END;
    v_prev := get_card_valuation(p_base_price, 'gold');
    RETURN 6 * v_prev + v_premium;
  ELSIF p_tier = 'legend' THEN
    v_premium := CASE v_category WHEN 'c1' THEN 1000 WHEN 'c2' THEN 2000 WHEN 'c3' THEN 3000 WHEN 'c4' THEN 4500 ELSE 6000 END;
    v_prev := get_card_valuation(p_base_price, 'diamond');
    RETURN 5 * v_prev + v_premium;
  ELSE
    RETURN p_base_price;
  END IF;
END;
$$;

-- Cuántas fichas del tier anterior + fee USDC se necesitan para forjar a p_target_tier.
-- (En el diseño actual el número/fee es fijo por tier destino, no varía por categoría
-- -- se mantiene el parámetro de categoría por si eso cambia a futuro.)
CREATE OR REPLACE FUNCTION get_forge_requirements(p_target_tier TEXT)
RETURNS TABLE(cards_needed INTEGER, fee_usdc NUMERIC)
LANGUAGE sql IMMUTABLE AS $$
  SELECT t.cards_needed, t.fee_usdc FROM (VALUES
    ('silver',  10, 10::numeric),
    ('gold',     8, 22::numeric),
    ('diamond',  6, 42::numeric),
    ('legend',   5, 78::numeric)
  ) AS t(tier, cards_needed, fee_usdc)
  WHERE t.tier = p_target_tier;
$$;

CREATE OR REPLACE FUNCTION get_forge_source_tier(p_target_tier TEXT)
RETURNS TEXT LANGUAGE sql IMMUTABLE AS $$
  SELECT CASE p_target_tier
    WHEN 'silver'  THEN 'standard'
    WHEN 'gold'    THEN 'silver'
    WHEN 'diamond' THEN 'gold'
    WHEN 'legend'  THEN 'diamond'
    ELSE NULL
  END;
$$;

-- Fee de venta P2P / instant-sell por tier+categoría (getP2PVolumeFeePercent).
CREATE OR REPLACE FUNCTION get_p2p_fee_percent(p_tier TEXT, p_category TEXT)
RETURNS NUMERIC LANGUAGE sql IMMUTABLE AS $$
  SELECT CASE
    WHEN p_tier = 'standard' THEN 0.05
    WHEN p_tier = 'silver'   THEN CASE WHEN p_category IN ('c1','c2') THEN 0.045 ELSE 0.040 END
    WHEN p_tier = 'gold'     THEN CASE WHEN p_category IN ('c1','c2') THEN 0.038 ELSE 0.032 END
    WHEN p_tier = 'diamond'  THEN CASE WHEN p_category IN ('c1','c2') THEN 0.031 ELSE 0.026 END
    WHEN p_tier = 'legend'   THEN CASE WHEN p_category IN ('c1','c2') THEN 0.025 ELSE 0.020 END
    ELSE 0.05
  END;
$$;

-- Fee de duelo P2P por tier+categoría del ganador CON ficha (getBetFeePercent).
CREATE OR REPLACE FUNCTION get_bet_fee_percent(p_tier TEXT, p_category TEXT)
RETURNS NUMERIC LANGUAGE sql IMMUTABLE AS $$
  SELECT CASE
    WHEN p_tier = 'standard' THEN 0.05
    WHEN p_tier = 'silver'   THEN CASE WHEN p_category IN ('c1','c2') THEN 0.047 ELSE 0.044 END
    WHEN p_tier = 'gold'     THEN CASE WHEN p_category IN ('c1','c2') THEN 0.041 ELSE 0.037 END
    WHEN p_tier = 'diamond'  THEN CASE WHEN p_category IN ('c1','c2') THEN 0.036 ELSE 0.031 END
    WHEN p_tier = 'legend'   THEN CASE WHEN p_category IN ('c1','c2') THEN 0.030 ELSE 0.025 END
    ELSE 0.05
  END;
$$;

-- Fee de duelo P2P para el ganador SIN ficha del jugador, según su tier de usuario más alto.
CREATE OR REPLACE FUNCTION get_bet_fee_percent_no_token(p_user_tier TEXT)
RETURNS NUMERIC LANGUAGE sql IMMUTABLE AS $$
  SELECT CASE p_user_tier
    WHEN 'standard' THEN 0.18
    WHEN 'silver'   THEN 0.15
    WHEN 'gold'     THEN 0.12
    WHEN 'diamond'  THEN 0.10
    WHEN 'legend'   THEN 0.08
    ELSE 0.18
  END;
$$;

-- Multiplicador de precio al forjar (getTierPriceMultiplier) -- cuánto vale la
-- ficha forjada respecto al precio base del jugador.
CREATE OR REPLACE FUNCTION get_tier_price_multiplier(p_base_price NUMERIC, p_tier TEXT)
RETURNS NUMERIC LANGUAGE sql IMMUTABLE AS $$
  SELECT CASE
    WHEN p_tier = 'standard' THEN 1.0
    ELSE get_card_valuation(p_base_price, p_tier) / p_base_price
  END;
$$;
