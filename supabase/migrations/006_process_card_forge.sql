-- ============================================================
-- PLAYRS - Fase 1: forja/crafteo de tier (standard→silver→gold→diamond→legend)
-- Réplica atómica de forgeCard() en StoreContext.tsx.
-- ============================================================

CREATE OR REPLACE FUNCTION process_card_forge(p_privy_did TEXT, p_player_id TEXT, p_target_tier TEXT)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_profile      profiles%ROWTYPE;
  v_player       players%ROWTYPE;
  v_paused       JSONB;
  v_source_tier  TEXT;
  v_cards_needed INTEGER;
  v_fee          NUMERIC;
  v_card_ids     UUID[];
  v_serials      INTEGER[];
  v_best_serial  INTEGER;
  v_multiplier   NUMERIC;
  v_forged_price NUMERIC;
  v_new_card_id  UUID;
BEGIN
  SELECT value INTO v_paused FROM platform_config WHERE key = 'platform_paused';
  IF v_paused = 'true'::jsonb THEN
    RAISE EXCEPTION 'platform_paused';
  END IF;

  IF p_target_tier NOT IN ('silver','gold','diamond','legend') THEN
    RAISE EXCEPTION 'invalid_target_tier';
  END IF;

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

  v_source_tier := get_forge_source_tier(p_target_tier);
  SELECT cards_needed, fee_usdc INTO v_cards_needed, v_fee FROM get_forge_requirements(p_target_tier);

  IF v_profile.balance_usdc < v_fee THEN
    RAISE EXCEPTION 'insufficient_balance';
  END IF;

  -- Bloquea (FOR UPDATE) las fichas candidatas a quemar, las más antiguas
  -- primero (menor serial_number), igual que el original.
  SELECT array_agg(id ORDER BY serial_number ASC), array_agg(serial_number ORDER BY serial_number ASC)
  INTO v_card_ids, v_serials
  FROM (
    SELECT id, serial_number FROM user_cards
    WHERE owner_id = v_profile.id AND player_id = p_player_id AND tier = v_source_tier
    ORDER BY serial_number ASC
    LIMIT v_cards_needed
    FOR UPDATE
  ) sub;

  IF v_card_ids IS NULL OR array_length(v_card_ids, 1) < v_cards_needed THEN
    RAISE EXCEPTION 'insufficient_cards';
  END IF;

  v_best_serial := v_serials[1];

  -- Se borran las fichas origen ANTES de insertar la nueva: la nueva ficha
  -- reutiliza v_best_serial, que hasta este punto sigue ocupado por una de
  -- las fichas que se están quemando (UNIQUE(player_id, serial_number)).
  DELETE FROM user_cards WHERE id = ANY(v_card_ids);

  v_multiplier   := get_tier_price_multiplier(v_player.current_price, p_target_tier);
  v_forged_price := ROUND(v_player.current_price * v_multiplier, 2);

  INSERT INTO user_cards (owner_id, player_id, tier, serial_number, acquired_price)
  VALUES (v_profile.id, p_player_id, p_target_tier, v_best_serial, v_forged_price)
  RETURNING id INTO v_new_card_id;

  INSERT INTO transactions (user_id, type, amount, description, player_id, card_id)
  VALUES (
    v_profile.id, 'forge', -v_fee,
    'Forja a ' || UPPER(p_target_tier) || ' de ' || v_player.ticker ||
      ' quemando ' || v_cards_needed || ' fichas ' || UPPER(v_source_tier) || ' + ' || v_fee || ' USDC de fee',
    p_player_id, v_new_card_id
  );

  UPDATE profiles SET balance_usdc = balance_usdc - v_fee WHERE id = v_profile.id;

  -- NOTA DE PRODUCTO: el código original (StoreContext.tsx) incrementa el
  -- streak del jugador en +1 al forjar, algo sin relación con su rendimiento
  -- real en cancha. Se preserva para no cambiar la economía sin aprobación
  -- explícita, pero queda marcado en docs/state/economia.md para revisión.
  UPDATE players SET streak = streak + 1 WHERE id = p_player_id;

  RETURN jsonb_build_object(
    'newCardId', v_new_card_id,
    'serialNumber', v_best_serial,
    'feePaid', v_fee,
    'cardsBurned', v_cards_needed,
    'newBalance', v_profile.balance_usdc - v_fee
  );
END;
$$;

REVOKE EXECUTE ON FUNCTION process_card_forge(TEXT, TEXT, TEXT) FROM PUBLIC;
REVOKE EXECUTE ON FUNCTION process_card_forge(TEXT, TEXT, TEXT) FROM authenticated, anon;
