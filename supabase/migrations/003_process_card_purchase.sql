-- ============================================================
-- PLAYRS - Fase 1: compra atómica de fichas IPO
-- Reemplaza los 3 updates sueltos de /api/cards/buy (condición de carrera:
-- dos compras simultáneas del mismo jugador podían leer el mismo
-- stock_remaining/balance_usdc y pisarse entre sí) por una función
-- transaccional con bloqueo de fila (FOR UPDATE).
-- Ver docs/MODELO_CUSTODIA_FONDOS.md §6 (checks-effects-interactions)
-- ============================================================

CREATE OR REPLACE FUNCTION process_card_purchase(p_privy_did TEXT, p_player_id TEXT)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_profile   profiles%ROWTYPE;
  v_player    players%ROWTYPE;
  v_paused    JSONB;
  v_serial    INTEGER;
  v_card_id   UUID;
BEGIN
  -- Circuit breaker global (docs/MODELO_CUSTODIA_FONDOS.md §6)
  SELECT value INTO v_paused FROM platform_config WHERE key = 'platform_paused';
  IF v_paused = 'true'::jsonb THEN
    RAISE EXCEPTION 'platform_paused';
  END IF;

  -- Bloqueo de fila: ninguna otra transacción concurrente puede leer/escribir
  -- estas mismas filas hasta que esta termine (COMMIT/ROLLBACK).
  SELECT * INTO v_profile FROM profiles WHERE privy_did = p_privy_did FOR UPDATE;
  IF NOT FOUND THEN
    RAISE EXCEPTION 'profile_not_found';
  END IF;

  SELECT * INTO v_player FROM players WHERE id = p_player_id FOR UPDATE;
  IF NOT FOUND THEN
    RAISE EXCEPTION 'player_not_found';
  END IF;

  IF v_player.is_frozen THEN
    RAISE EXCEPTION 'match_lock_active';
  END IF;

  IF v_player.stock_remaining <= 0 THEN
    RAISE EXCEPTION 'stock_depleted';
  END IF;

  IF v_profile.balance_usdc < v_player.current_price THEN
    RAISE EXCEPTION 'insufficient_balance';
  END IF;

  v_serial := v_player.stock_total - v_player.stock_remaining + 1;

  INSERT INTO user_cards (owner_id, player_id, tier, serial_number, acquired_price)
  VALUES (v_profile.id, p_player_id, 'standard', v_serial, v_player.current_price)
  RETURNING id INTO v_card_id;

  UPDATE players SET stock_remaining = stock_remaining - 1 WHERE id = p_player_id;
  UPDATE profiles SET balance_usdc = balance_usdc - v_player.current_price WHERE id = v_profile.id;

  INSERT INTO transactions (user_id, type, amount, description, player_id, card_id)
  VALUES (
    v_profile.id, 'buy_ipo', -v_player.current_price,
    'Compra IPO ' || v_player.ticker || ' S/N #' || v_serial,
    p_player_id, v_card_id
  );

  RETURN jsonb_build_object(
    'card_id', v_card_id,
    'price_paid', v_player.current_price,
    'serial_number', v_serial,
    'new_balance', v_profile.balance_usdc - v_player.current_price
  );
END;
$$;

-- Defensa en profundidad: aunque el endpoint ya usa service_role, se revoca
-- explícitamente el permiso de ejecución a roles públicos/autenticados.
REVOKE EXECUTE ON FUNCTION process_card_purchase(TEXT, TEXT) FROM PUBLIC;
REVOKE EXECUTE ON FUNCTION process_card_purchase(TEXT, TEXT) FROM authenticated, anon;
