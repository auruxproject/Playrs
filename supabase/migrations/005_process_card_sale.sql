-- ============================================================
-- PLAYRS - Fase 1: venta instantánea de ficha (instant-sell a la plataforma)
-- Réplica atómica de sellPlayer() en StoreContext.tsx.
-- ============================================================

CREATE OR REPLACE FUNCTION process_card_sale(p_privy_did TEXT, p_card_id UUID)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_profile   profiles%ROWTYPE;
  v_card      user_cards%ROWTYPE;
  v_player    players%ROWTYPE;
  v_paused    JSONB;
  v_category  TEXT;
  v_selling   NUMERIC;
  v_fee_pct   NUMERIC;
  v_fee       NUMERIC;
  v_final     NUMERIC;
BEGIN
  SELECT value INTO v_paused FROM platform_config WHERE key = 'platform_paused';
  IF v_paused = 'true'::jsonb THEN
    RAISE EXCEPTION 'platform_paused';
  END IF;

  SELECT * INTO v_profile FROM profiles WHERE privy_did = p_privy_did FOR UPDATE;
  IF NOT FOUND THEN
    RAISE EXCEPTION 'profile_not_found';
  END IF;

  -- Ownership: la ficha debe pertenecer al usuario que llama -- nunca se confía
  -- en que el cliente "diga" que es suya, se verifica contra la fila real.
  SELECT * INTO v_card FROM user_cards WHERE id = p_card_id AND owner_id = v_profile.id FOR UPDATE;
  IF NOT FOUND THEN
    RAISE EXCEPTION 'card_not_found';
  END IF;

  SELECT * INTO v_player FROM players WHERE id = v_card.player_id FOR UPDATE;
  IF NOT FOUND THEN
    RAISE EXCEPTION 'player_not_found';
  END IF;

  IF v_player.is_frozen THEN
    RAISE EXCEPTION 'match_lock_active';
  END IF;

  v_category := get_player_category(v_player.current_price);
  v_selling  := get_card_valuation(v_player.current_price, v_card.tier);
  v_fee_pct  := get_p2p_fee_percent(v_card.tier, v_category);
  v_fee      := ROUND(v_selling * v_fee_pct, 2);
  v_final    := v_selling - v_fee;

  -- Se registra la transacción ANTES de borrar la ficha (mientras card_id
  -- todavía existe); tras el fix de FK (ON DELETE SET NULL) el orden ya no
  -- es estrictamente obligatorio, pero preserva la referencia en el registro.
  INSERT INTO transactions (user_id, type, amount, description, player_id, card_id)
  VALUES (
    v_profile.id, 'sell', v_final,
    'Venta de ficha ' || v_player.ticker || ' (' || UPPER(v_card.tier) || ') -- comisión ' || v_fee || ' USDC',
    v_player.id, v_card.id
  );

  UPDATE profiles SET balance_usdc = balance_usdc + v_final WHERE id = v_profile.id;
  DELETE FROM user_cards WHERE id = v_card.id;

  RETURN jsonb_build_object(
    'sellingPrice', v_selling,
    'fee', v_fee,
    'finalAmount', v_final,
    'newBalance', v_profile.balance_usdc + v_final
  );
END;
$$;

REVOKE EXECUTE ON FUNCTION process_card_sale(TEXT, UUID) FROM PUBLIC;
REVOKE EXECUTE ON FUNCTION process_card_sale(TEXT, UUID) FROM authenticated, anon;
