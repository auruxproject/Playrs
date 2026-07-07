-- ============================================================
-- PLAYRS - Fase 1: username automático al registrarse
--
-- Antes: username quedaba NULL hasta que el usuario lo definiera. Ahora se
-- asigna un nombre provisional (ej. "Player4F2A9C") automáticamente en el
-- INSERT. Para que esto no "gaste" el cambio gratuito del usuario, se marca
-- con username_is_default = TRUE; process_username_change() trata cualquier
-- cambio mientras esa bandera esté en TRUE como el primer cambio (libre),
-- y la pone en FALSE en cuanto el usuario elige su nombre real.
-- ============================================================

ALTER TABLE profiles ADD COLUMN IF NOT EXISTS username_is_default BOOLEAN NOT NULL DEFAULT TRUE;

-- Username provisional único, generado en el propio INSERT.
ALTER TABLE profiles ALTER COLUMN username
  SET DEFAULT ('Player' || upper(substring(gen_random_uuid()::text, 1, 6)));

-- Perfiles ya existentes sin username (creados antes de este cambio): les
-- asignamos uno provisional también, para no dejar NULLs sueltos.
UPDATE profiles
SET username = 'Player' || upper(substring(gen_random_uuid()::text, 1, 6)),
    username_is_default = TRUE
WHERE username IS NULL;

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
  IF v_profile.username = p_new_username THEN
    RETURN to_jsonb(v_profile);
  END IF;

  -- Mientras el username siga siendo el provisional autogenerado, el cambio
  -- es libre (es su primera elección real). A partir de ahí, 1 cambio/año.
  IF NOT v_profile.username_is_default AND v_profile.username_changed_at > NOW() - INTERVAL '365 days' THEN
    RAISE EXCEPTION 'username_change_too_soon';
  END IF;

  BEGIN
    INSERT INTO username_history (user_id, old_username) VALUES (v_profile.id, v_profile.username);

    UPDATE profiles
    SET username = p_new_username, username_changed_at = NOW(), username_is_default = FALSE
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
