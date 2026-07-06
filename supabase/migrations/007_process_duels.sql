-- ============================================================
-- PLAYRS - Fase 1: duelos P2P -- creación y aceptación (NO resolución)
--
-- La resolución (quién ganó, cálculo de rake, pago) queda fuera de este
-- alcance a propósito: requiere decidir la semántica exacta de cada
-- bet_type ('goals','assists','points','cleansheet' -- ¿supera un umbral?
-- ¿quién de los dos rinde mejor?) y conectar el resultado real del oráculo
-- (match_oracle_log) a un cron de resolución. Eso es una decisión de
-- producto pendiente, no solo una tarea técnica -- ver docs/state/backend.md.
-- No se implementa una resolución "aproximada" para no introducir un
-- mecanismo de pago de dinero real mal definido.
-- ============================================================

CREATE OR REPLACE FUNCTION process_duel_create(
  p_privy_did TEXT, p_player_id TEXT, p_title TEXT, p_bet_type TEXT, p_stake NUMERIC
)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_profile profiles%ROWTYPE;
  v_player  players%ROWTYPE;
  v_paused  JSONB;
  v_bet_id  UUID;
BEGIN
  SELECT value INTO v_paused FROM platform_config WHERE key = 'platform_paused';
  IF v_paused = 'true'::jsonb THEN
    RAISE EXCEPTION 'platform_paused';
  END IF;

  IF p_stake IS NULL OR p_stake <= 0 THEN
    RAISE EXCEPTION 'invalid_stake';
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

  IF v_profile.balance_usdc < p_stake THEN
    RAISE EXCEPTION 'insufficient_balance';
  END IF;

  UPDATE profiles SET balance_usdc = balance_usdc - p_stake WHERE id = v_profile.id;

  INSERT INTO bets (creator_id, player_id, title, bet_type, stake_usdc, pool_usdc, status)
  VALUES (v_profile.id, p_player_id, p_title, p_bet_type, p_stake, p_stake, 'open')
  RETURNING id INTO v_bet_id;

  INSERT INTO transactions (user_id, type, amount, description, player_id)
  VALUES (v_profile.id, 'duel_create', -p_stake, 'Duelo creado: "' || p_title || '"', p_player_id);

  RETURN jsonb_build_object(
    'betId', v_bet_id,
    'newBalance', v_profile.balance_usdc - p_stake
  );
END;
$$;

CREATE OR REPLACE FUNCTION process_duel_accept(p_privy_did TEXT, p_bet_id UUID)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_profile profiles%ROWTYPE;
  v_bet     bets%ROWTYPE;
  v_player  players%ROWTYPE;
  v_paused  JSONB;
BEGIN
  SELECT value INTO v_paused FROM platform_config WHERE key = 'platform_paused';
  IF v_paused = 'true'::jsonb THEN
    RAISE EXCEPTION 'platform_paused';
  END IF;

  SELECT * INTO v_bet FROM bets WHERE id = p_bet_id FOR UPDATE;
  IF NOT FOUND THEN
    RAISE EXCEPTION 'bet_not_found';
  END IF;

  IF v_bet.status <> 'open' THEN
    RAISE EXCEPTION 'bet_not_open';
  END IF;

  SELECT * INTO v_profile FROM profiles WHERE privy_did = p_privy_did FOR UPDATE;
  IF NOT FOUND THEN
    RAISE EXCEPTION 'profile_not_found';
  END IF;

  IF v_profile.id = v_bet.creator_id THEN
    RAISE EXCEPTION 'cannot_accept_own_duel';
  END IF;

  SELECT * INTO v_player FROM players WHERE id = v_bet.player_id FOR UPDATE;
  IF FOUND AND v_player.is_frozen THEN
    RAISE EXCEPTION 'match_lock_active';
  END IF;

  IF v_profile.balance_usdc < v_bet.stake_usdc THEN
    RAISE EXCEPTION 'insufficient_balance';
  END IF;

  UPDATE profiles SET balance_usdc = balance_usdc - v_bet.stake_usdc WHERE id = v_profile.id;

  UPDATE bets
  SET opponent_id = v_profile.id,
      pool_usdc = pool_usdc + v_bet.stake_usdc,
      status = 'accepted'
  WHERE id = p_bet_id;

  INSERT INTO transactions (user_id, type, amount, description, player_id)
  VALUES (v_profile.id, 'duel_accept', -v_bet.stake_usdc, 'Aceptaste el duelo: "' || v_bet.title || '"', v_bet.player_id);

  RETURN jsonb_build_object(
    'betId', p_bet_id,
    'poolUsdc', v_bet.pool_usdc + v_bet.stake_usdc,
    'newBalance', v_profile.balance_usdc - v_bet.stake_usdc
  );
END;
$$;

REVOKE EXECUTE ON FUNCTION process_duel_create(TEXT, TEXT, TEXT, TEXT, NUMERIC) FROM PUBLIC;
REVOKE EXECUTE ON FUNCTION process_duel_create(TEXT, TEXT, TEXT, TEXT, NUMERIC) FROM authenticated, anon;
REVOKE EXECUTE ON FUNCTION process_duel_accept(TEXT, UUID) FROM PUBLIC;
REVOKE EXECUTE ON FUNCTION process_duel_accept(TEXT, UUID) FROM authenticated, anon;
