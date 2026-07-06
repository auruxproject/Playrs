-- ============================================================
-- PLAYRS - Fase 1: política de cambio de username (1 vez cada 365 días)
-- Ver docs/AUTENTICACION_WALLETS_KYC.md §2. Hoy PATCH /api/user permite
-- cambiar el username libremente -- se cierra ese hueco con esta función.
-- ============================================================

CREATE OR REPLACE FUNCTION process_username_change(p_privy_did TEXT, p_new_username TEXT)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_profile profiles%ROWTYPE;
BEGIN
  SELECT * INTO v_profile FROM profiles WHERE privy_did = p_privy_did FOR UPDATE;
  IF NOT FOUND THEN
    RAISE EXCEPTION 'profile_not_found';
  END IF;

  -- Mismo username que ya tiene: no-op, no cuenta como "cambio".
  IF v_profile.username IS NOT NULL AND v_profile.username = p_new_username THEN
    RETURN to_jsonb(v_profile);
  END IF;

  -- Primera vez que se define (username aún NULL): sin restricción de tiempo.
  -- A partir de ahí, 1 cambio cada 365 días.
  IF v_profile.username IS NOT NULL AND v_profile.username_changed_at > NOW() - INTERVAL '365 days' THEN
    RAISE EXCEPTION 'username_change_too_soon';
  END IF;

  BEGIN
    INSERT INTO username_history (user_id, old_username) VALUES (v_profile.id, v_profile.username);

    UPDATE profiles
    SET username = p_new_username, username_changed_at = NOW()
    WHERE id = v_profile.id
    RETURNING * INTO v_profile;
  EXCEPTION WHEN unique_violation THEN
    RAISE EXCEPTION 'username_taken';
  END;

  RETURN to_jsonb(v_profile);
END;
$$;

REVOKE EXECUTE ON FUNCTION process_username_change(TEXT, TEXT) FROM PUBLIC;
REVOKE EXECUTE ON FUNCTION process_username_change(TEXT, TEXT) FROM authenticated, anon;
