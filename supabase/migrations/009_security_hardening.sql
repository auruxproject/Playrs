-- ============================================================
-- PLAYRS - Fase 1: hardening de seguridad
-- Cierra los warnings del Security Advisor de Supabase:
--  1) "Function Search Path Mutable" -- fija search_path en las funciones
--     que faltaban (las helper IMMUTABLE; las process_* ya lo tenían).
--  2) Tablas sin RLS habilitada (price_history, match_oracle_log).
-- ============================================================

-- ── 1. search_path fijo en las funciones helper ─────────────
-- Evita ataques de secuestro de search_path (especialmente si estas
-- funciones se usan dentro de funciones SECURITY DEFINER).
ALTER FUNCTION public.get_player_category(NUMERIC)            SET search_path = public;
ALTER FUNCTION public.get_card_valuation(NUMERIC, TEXT)      SET search_path = public;
ALTER FUNCTION public.get_forge_requirements(TEXT)           SET search_path = public;
ALTER FUNCTION public.get_forge_source_tier(TEXT)            SET search_path = public;
ALTER FUNCTION public.get_p2p_fee_percent(TEXT, TEXT)        SET search_path = public;
ALTER FUNCTION public.get_bet_fee_percent(TEXT, TEXT)        SET search_path = public;
ALTER FUNCTION public.get_bet_fee_percent_no_token(TEXT)     SET search_path = public;
ALTER FUNCTION public.get_tier_price_multiplier(NUMERIC, TEXT) SET search_path = public;
ALTER FUNCTION public.update_updated_at()                    SET search_path = public;

-- ── 2. RLS en tablas que quedaron sin proteger ──────────────

-- price_history: dato público (histórico de precios), solo lectura para todos.
ALTER TABLE price_history ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "price_history: public read" ON price_history;
CREATE POLICY "price_history: public read" ON price_history FOR SELECT USING (TRUE);

-- match_oracle_log: log interno del oráculo. NO debe ser accesible con el anon
-- key -- sin política de SELECT para roles públicos, RLS deniega por defecto.
-- Solo service_role (que bypassa RLS) puede leerlo desde el servidor.
ALTER TABLE match_oracle_log ENABLE ROW LEVEL SECURITY;
