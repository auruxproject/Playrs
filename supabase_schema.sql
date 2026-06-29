-- ==========================================
-- SCRIPT DE INICIALIZACIÓN DE VALOR SINTÉTICO
-- ==========================================
-- Este script crea las tablas, habilitación de RLS, triggers y funciones RPC
-- necesarias para migrar el simulador del cliente a un backend real en Supabase.

-- Habilitar extensiones requeridas (UUID y Cripto)
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- ==========================================
-- 1. TABLAS PRINCIPALES
-- ==========================================

-- Tabla de Perfiles de Usuario (vinculados al auth.users de Supabase)
CREATE TABLE IF NOT EXISTS public.profiles (
    id UUID REFERENCES auth.users ON DELETE CASCADE PRIMARY KEY,
    username TEXT UNIQUE NOT NULL,
    avatar_url TEXT DEFAULT '👤',
    balance_usdc NUMERIC(20, 2) DEFAULT 1000.00 NOT NULL CHECK (balance_usdc >= 0),
    deposited_total NUMERIC(20, 2) DEFAULT 0.00 NOT NULL,
    withdrawn_total NUMERIC(20, 2) DEFAULT 0.00 NOT NULL,
    referral_code TEXT UNIQUE NOT NULL,
    referrer_id UUID REFERENCES public.profiles(id) ON DELETE SET NULL,
    is_influencer BOOLEAN DEFAULT FALSE NOT NULL,
    solana_wallet TEXT DEFAULT 'Hw2vQ1eB8x9uS3mN6tP4rA7yD5zW8xK2q3vS9aB' NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, NOW()) NOT NULL
);

-- Tabla de Jugadores (Oráculo)
CREATE TABLE IF NOT EXISTS public.players (
    id TEXT PRIMARY KEY, -- Ej: 'mbp-rm'
    name TEXT NOT NULL,
    ticker TEXT UNIQUE NOT NULL,
    team TEXT NOT NULL,
    position TEXT NOT NULL,
    nationality TEXT NOT NULL,
    price NUMERIC(20, 2) NOT NULL CHECK (price >= 10),
    price_change_percent NUMERIC(10, 2) DEFAULT 0.00 NOT NULL,
    stock_remaining INT NOT NULL CHECK (stock_remaining >= 0),
    stock_total INT NOT NULL,
    points_last_week NUMERIC(10, 1) DEFAULT 0.0 NOT NULL,
    global_rating NUMERIC(10, 1) DEFAULT 0.0 NOT NULL,
    streak INT DEFAULT 0 NOT NULL,
    goals INT DEFAULT 0 NOT NULL,
    assists INT DEFAULT 0 NOT NULL,
    shots INT DEFAULT 0 NOT NULL,
    is_frozen BOOLEAN DEFAULT FALSE NOT NULL,
    is_rookie BOOLEAN DEFAULT FALSE NOT NULL,
    is_high_hype BOOLEAN DEFAULT FALSE NOT NULL,
    price_history NUMERIC(20, 2)[] DEFAULT '{}'::NUMERIC[] NOT NULL,
    last_5_scores NUMERIC(10, 1)[] DEFAULT '{}'::NUMERIC[] NOT NULL,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, NOW()) NOT NULL
);

-- Tabla de Cartas de Usuarios (Portafolio de Fichas)
CREATE TABLE IF NOT EXISTS public.user_cards (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE NOT NULL,
    player_id TEXT REFERENCES public.players(id) ON DELETE CASCADE NOT NULL,
    tier TEXT NOT NULL CHECK (tier IN ('standard', 'silver', 'gold', 'diamond', 'legend')),
    serial_number INT NOT NULL,
    acquired_price NUMERIC(20, 2) NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, NOW()) NOT NULL
);

-- Tabla de Listados del Mercado P2P
CREATE TABLE IF NOT EXISTS public.p2p_listings (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    card_id UUID REFERENCES public.user_cards(id) ON DELETE CASCADE NOT NULL,
    player_id TEXT REFERENCES public.players(id) ON DELETE CASCADE NOT NULL,
    seller_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE NOT NULL,
    seller_name TEXT NOT NULL,
    price NUMERIC(20, 2) NOT NULL CHECK (price > 0),
    serial_number INT NOT NULL,
    tier TEXT NOT NULL,
    status TEXT DEFAULT 'open' NOT NULL CHECK (status IN ('open', 'sold', 'cancelled')),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, NOW()) NOT NULL
);

-- Tabla de Apuestas P2P (Retos)
CREATE TABLE IF NOT EXISTS public.bets (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    player_id TEXT REFERENCES public.players(id) ON DELETE CASCADE NOT NULL,
    creator_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE NOT NULL,
    acceptor_id UUID REFERENCES public.profiles(id) ON DELETE SET NULL,
    title TEXT NOT NULL,
    stake NUMERIC(20, 2) NOT NULL CHECK (stake > 0),
    type TEXT NOT NULL DEFAULT 'over_70',
    status TEXT DEFAULT 'pending' NOT NULL CHECK (status IN ('pending', 'active', 'resolved_creator', 'resolved_acceptor', 'cancelled')),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, NOW()) NOT NULL
);

-- Tabla de Transacciones y Ledger de Auditoría
CREATE TABLE IF NOT EXISTS public.transactions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE NOT NULL,
    type TEXT NOT NULL, -- 'deposit', 'withdraw', 'buy_ipo', 'sell_quick', 'p2p_sale', 'p2p_purchase', 'bet_stake', 'bet_win', 'referral_bonus'
    amount NUMERIC(20, 2) NOT NULL,
    description TEXT NOT NULL,
    status TEXT DEFAULT 'success' NOT NULL CHECK (status IN ('success', 'pending', 'failed')),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, NOW()) NOT NULL
);

-- ==========================================
-- 2. HABILITAR SEGURIDAD (ROW LEVEL SECURITY - RLS)
-- ==========================================

ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.players ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.user_cards ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.p2p_listings ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.bets ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.transactions ENABLE ROW LEVEL SECURITY;

-- Políticas de lectura públicas para jugadores y listados
CREATE POLICY "Lectura pública de jugadores" ON public.players FOR SELECT TO PUBLIC USING (TRUE);
CREATE POLICY "Lectura pública de listados P2P abiertos" ON public.p2p_listings FOR SELECT TO PUBLIC USING (status = 'open');
CREATE POLICY "Lectura pública de apuestas" ON public.bets FOR SELECT TO PUBLIC USING (TRUE);

-- Políticas para perfiles
CREATE POLICY "Usuarios pueden leer todos los perfiles" ON public.profiles FOR SELECT TO PUBLIC USING (TRUE);
CREATE POLICY "Usuarios pueden editar su propio perfil" ON public.profiles FOR UPDATE USING (auth.uid() = id);

-- Políticas para cartas y transacciones privadas
CREATE POLICY "Usuarios pueden leer sus propias cartas" ON public.user_cards FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Usuarios pueden ver sus propias transacciones" ON public.transactions FOR SELECT USING (auth.uid() = user_id);

-- ==========================================
-- 3. TRIGGERS Y FUNCIONES AUXILIARES
-- ==========================================

-- Trigger para crear automáticamente el perfil en la tabla pública al registrarse en Auth
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
DECLARE
    new_username TEXT;
    new_ref_code TEXT;
BEGIN
    new_username := COALESCE(new.raw_user_meta_data->>'username', 'User_' || substr(new.id::text, 1, 8));
    new_ref_code := 'VALOR-' || UPPER(substr(md5(random()::text), 1, 6));
    
    INSERT INTO public.profiles (id, username, avatar_url, balance_usdc, referral_code, referrer_id, is_influencer)
    VALUES (
        new.id,
        new_username,
        COALESCE(new.raw_user_meta_data->>'avatar_url', '👤'),
        1000.00, -- Saldo de bienvenida de prueba
        new_ref_code,
        (new.raw_user_meta_data->>'referrer_id')::uuid,
        COALESCE((new.raw_user_meta_data->>'is_influencer')::boolean, FALSE)
    );
    RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE OR REPLACE TRIGGER on_auth_user_created
    AFTER INSERT ON auth.users
    FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- Helper para categorización de jugadores
CREATE OR REPLACE FUNCTION public.get_player_category(price NUMERIC)
RETURNS TEXT AS $$
BEGIN
    IF price < 30 THEN RETURN 'c1';
    ELSIF price < 60 THEN RETURN 'c2';
    ELSIF price < 100 THEN RETURN 'c3';
    ELSIF price < 160 THEN RETURN 'c4';
    ELSE RETURN 'c5';
    END IF;
END;
$$ LANGUAGE plpgsql IMMUTABLE;

-- Helper para calcular la valoración exacta de una carta (Fórmula de Forja v9.1)
CREATE OR REPLACE FUNCTION public.get_card_valuation(base_price NUMERIC, tier TEXT)
RETURNS NUMERIC AS $$
DECLARE
    cat TEXT;
    silver_val NUMERIC;
    gold_val NUMERIC;
    diamond_val NUMERIC;
BEGIN
    cat := public.get_player_category(base_price);
    
    IF tier = 'standard' THEN
        RETURN base_price;
    ELSIF tier = 'silver' THEN
        -- 5 * basePrice + Premium
        IF cat = 'c1' THEN RETURN 5 * base_price + 10;
        ELSIF cat = 'c2' THEN RETURN 5 * base_price + 20;
        ELSIF cat = 'c3' THEN RETURN 5 * base_price + 30;
        ELSIF cat = 'c4' THEN RETURN 6 * base_price + 45;
        ELSE RETURN 6 * base_price + 60;
        END IF;
    ELSIF tier = 'gold' THEN
        silver_val := public.get_card_valuation(base_price, 'silver');
        IF cat = 'c1' THEN RETURN 4 * silver_val + 50;
        ELSIF cat = 'c2' THEN RETURN 4 * silver_val + 100;
        ELSIF cat = 'c3' THEN RETURN 4 * silver_val + 150;
        ELSIF cat = 'c4' THEN RETURN 4 * silver_val + 220;
        ELSE RETURN 4 * silver_val + 300;
        END IF;
    ELSIF tier = 'diamond' THEN
        gold_val := public.get_card_valuation(base_price, 'gold');
        IF cat = 'c1' THEN RETURN 3 * gold_val + 250;
        ELSIF cat = 'c2' THEN RETURN 3 * gold_val + 500;
        ELSIF cat = 'c3' THEN RETURN 3 * gold_val + 750;
        ELSIF cat = 'c4' THEN RETURN 3 * gold_val + 1100;
        ELSE RETURN 3 * gold_val + 1500;
        END IF;
    ELSIF tier = 'legend' THEN
        diamond_val := public.get_card_valuation(base_price, 'diamond');
        IF cat = 'c1' THEN RETURN 2 * diamond_val + 1000;
        ELSIF cat = 'c2' THEN RETURN 2 * diamond_val + 2000;
        ELSIF cat = 'c3' THEN RETURN 2 * diamond_val + 3000;
        ELSIF cat = 'c4' THEN RETURN 2 * diamond_val + 4500;
        ELSE RETURN 2 * diamond_val + 6000;
        END IF;
    END IF;
    RETURN base_price;
END;
$$ LANGUAGE plpgsql IMMUTABLE;

-- Helper para obtener comisiones de referidos (Primary IPO y Secondary P2P)
CREATE OR REPLACE FUNCTION public.get_referral_bonus_percent(tier TEXT, cat TEXT, market_type TEXT)
RETURNS NUMERIC AS $$
BEGIN
    IF tier = 'influencer' THEN
        IF market_type = 'primary' THEN RETURN 0.10;
        ELSE RETURN 0.60;
        END IF;
    END IF;

    IF market_type = 'secondary' THEN
        -- P2P Revenue Share de los fees cobrados
        IF tier = 'standard' THEN RETURN 0.10;
        ELSIF tier = 'silver' THEN 
            IF cat IN ('c1','c2') THEN RETURN 0.15; ELSE RETURN 0.20; END IF;
        ELSIF tier = 'gold' THEN 
            IF cat IN ('c1','c2') THEN RETURN 0.25; ELSE RETURN 0.30; END IF;
        ELSIF tier = 'diamond' THEN 
            IF cat IN ('c1','c2') THEN RETURN 0.35; ELSE RETURN 0.40; END IF;
        ELSE -- legend
            IF cat IN ('c1','c2') THEN RETURN 0.45; ELSE RETURN 0.50; END IF;
        END IF;
    ELSE
        -- Primary IPO Bonus del volumen de compra
        IF tier = 'standard' THEN RETURN 0.030;
        ELSIF tier = 'silver' THEN 
            IF cat IN ('c1','c2') THEN RETURN 0.035; ELSE RETURN 0.040; END IF;
        ELSIF tier = 'gold' THEN 
            IF cat IN ('c1','c2') THEN RETURN 0.045; ELSE RETURN 0.050; END IF;
        ELSIF tier = 'diamond' THEN 
            IF cat IN ('c1','c2') THEN RETURN 0.055; ELSE RETURN 0.060; END IF;
        ELSE -- legend
            IF cat IN ('c1','c2') THEN RETURN 0.070; ELSE RETURN 0.080; END IF;
        END IF;
    END IF;
END;
$$ LANGUAGE plpgsql IMMUTABLE;

-- ==========================================
-- 4. FUNCIONES DE NEGOCIO (RPC) TRANSACCIONALES
-- ==========================================

-- RPC: Comprar un jugador en IPO de forma atómica
CREATE OR REPLACE FUNCTION public.buy_player_ipo(player_id_input TEXT, user_id_input UUID)
RETURNS JSON AS $$
DECLARE
    player_price NUMERIC;
    user_balance NUMERIC;
    current_stock INT;
    new_serial INT;
    referrer UUID;
    ref_is_influencer BOOLEAN;
    ref_tier TEXT;
    ref_cat TEXT;
    ref_bonus NUMERIC := 0;
    ref_bonus_percent NUMERIC;
BEGIN
    -- Bloquear fila del jugador para evitar race conditions en stock
    SELECT price, stock_remaining, stock_total 
    INTO player_price, current_stock
    FROM public.players 
    WHERE id = player_id_input FOR UPDATE;
    
    IF NOT FOUND THEN
        RETURN json_build_object('success', false, 'message', 'Jugador no encontrado');
    END IF;
    
    IF current_stock <= 0 THEN
        RETURN json_build_object('success', false, 'message', 'Agotado en mercado de lanzamientos (IPO)');
    END IF;
    
    -- Obtener y bloquear balance del usuario
    SELECT balance_usdc, referrer_id 
    INTO user_balance, referrer
    FROM public.profiles 
    WHERE id = user_id_input FOR UPDATE;
    
    IF user_balance < player_price THEN
        RETURN json_build_object('success', false, 'message', 'Saldo USDC insuficiente');
    END IF;
    
    -- Calcular número de serie
    new_serial := (50 - current_stock) + 1;
    
    -- Transacción: descontar balance del comprador y stock
    UPDATE public.profiles SET balance_usdc = balance_usdc - player_price WHERE id = user_id_input;
    UPDATE public.players SET stock_remaining = stock_remaining - 1 WHERE id = player_id_input;
    
    -- Crear la carta
    INSERT INTO public.user_cards (user_id, player_id, tier, serial_number, acquired_price)
    VALUES (user_id_input, player_id_input, 'standard', new_serial, player_price);
    
    -- Registrar transacción del comprador
    INSERT INTO public.transactions (user_id, type, amount, description)
    VALUES (user_id_input, 'buy_ipo', -player_price, 'Compra IPO de ficha ' || player_id_input);
    
    -- Lógica de Referidos (Bono del Mercado Primario)
    IF referrer IS NOT NULL THEN
        -- Obtener datos del referidor
        SELECT is_influencer INTO ref_is_influencer FROM public.profiles WHERE id = referrer;
        
        IF ref_is_influencer THEN
            ref_tier := 'influencer';
        ELSE
            -- Encontrar la carta de mayor nivel del referidor para determinar su tier
            SELECT COALESCE(MAX(
                CASE 
                    WHEN tier = 'legend' THEN 4
                    WHEN tier = 'diamond' THEN 3
                    WHEN tier = 'gold' THEN 2
                    WHEN tier = 'silver' THEN 1
                    ELSE 0 
                END), 0) INTO new_serial
            FROM public.user_cards WHERE user_id = referrer;
            
            ref_tier := CASE 
                WHEN new_serial = 4 THEN 'legend'
                WHEN new_serial = 3 THEN 'diamond'
                WHEN new_serial = 2 THEN 'gold'
                WHEN new_serial = 1 THEN 'silver'
                ELSE 'standard'
            END;
        END IF;
        
        ref_cat := public.get_player_category(player_price);
        ref_bonus_percent := public.get_referral_bonus_percent(ref_tier, ref_cat, 'primary');
        ref_bonus := player_price * ref_bonus_percent;
        
        -- Abonar bono al referidor
        UPDATE public.profiles SET balance_usdc = balance_usdc + ref_bonus WHERE id = referrer;
        
        -- Registrar transacción de referidos
        INSERT INTO public.transactions (user_id, type, amount, description)
        VALUES (referrer, 'referral_bonus', ref_bonus, 'Bono de afiliado IPO por la compra de ' || user_id_input);
    END IF;
    
    RETURN json_build_object(
        'success', true, 
        'message', 'Ficha adquirida exitosamente en IPO', 
        'acquired_price', player_price, 
        'serial_number', new_serial,
        'referral_paid', ref_bonus
    );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- RPC: Quick Sell (Venta instantánea protegida por tasación)
CREATE OR REPLACE FUNCTION public.quick_sell_card(card_id_input UUID, user_id_input UUID)
RETURNS JSON AS $$
DECLARE
    card_tier TEXT;
    base_player_price NUMERIC;
    player_id_var TEXT;
    valuation NUMERIC;
    fee_percent NUMERIC := 0.05; -- 5% de tarifa estándar para venta instantánea
    net_value NUMERIC;
BEGIN
    -- Validar propiedad de la carta
    SELECT uc.tier, p.price, uc.player_id INTO card_tier, base_player_price, player_id_var
    FROM public.user_cards uc
    JOIN public.players p ON p.id = uc.player_id
    WHERE uc.id = card_id_input AND uc.user_id = user_id_input FOR UPDATE;
    
    IF NOT FOUND THEN
        RETURN json_build_object('success', false, 'message', 'Ficha no encontrada en tu inventario');
    END IF;
    
    -- Calcular valoración optimizada
    valuation := public.get_card_valuation(base_player_price, card_tier);
    net_value := valuation * (1 - fee_percent);
    
    -- Transacción: eliminar carta de usuario e incrementar balance
    DELETE FROM public.user_cards WHERE id = card_id_input;
    UPDATE public.profiles SET balance_usdc = balance_usdc + net_value WHERE id = user_id_input;
    
    -- Registrar transacción
    INSERT INTO public.transactions (user_id, type, amount, description)
    VALUES (user_id_input, 'sell_quick', net_value, 'Venta instantánea (Quick Sell) de ficha ' || player_id_var || ' (' || card_tier || ')');
    
    RETURN json_build_object(
        'success', true,
        'message', 'Ficha vendida instantáneamente a la plataforma',
        'valuation', valuation,
        'commission_paid', valuation * fee_percent,
        'net_received', net_value
    );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- ==========================================
-- 5. CARGAR JUGADORES INICIALES (MOCK DATA)
-- ==========================================

INSERT INTO public.players (id, name, ticker, team, position, nationality, price, stock_remaining, stock_total, points_last_week, global_rating, streak, goals, assists, shots, is_frozen, is_rookie, is_high_hype, price_history, last_5_scores)
VALUES 
('mbp-rm', 'Kylian Mbappé', 'MBP-RM', 'Real Madrid', 'FW', 'Francia 🇫🇷', 94.40, 8, 50, 84.0, 80.5, 5, 2, 1, 4, FALSE, FALSE, TRUE, '{94.40}', '{84.0}'),
('erh-mc', 'Erling Haaland', 'ERH-MC', 'Man City', 'FW', 'Noruega 🇳🇴', 72.30, 15, 50, 81.2, 79.0, 4, 1, 0, 5, FALSE, FALSE, TRUE, '{72.30}', '{81.2}'),
('vnj-rm', 'Vinícius Júnior', 'VNJ-RM', 'Real Madrid', 'FW', 'Brasil 🇧🇷', 88.50, 12, 50, 64.8, 68.9, 2, 1, 1, 3, FALSE, FALSE, TRUE, '{88.50}', '{64.8}'),
('yam-bl', 'Lamine Yamal', 'YAM-BL', 'FC Barcelona', 'FW', 'España 🇪🇸', 48.50, 20, 50, 92.5, 84.0, 5, 1, 2, 3, FALSE, TRUE, TRUE, '{48.50}', '{92.5}'),
('bel-rm', 'Jude Bellingham', 'BEL-RM', 'Real Madrid', 'MF', 'Inglaterra 🏴󠁧󠁢󠁥󠁮󠁧󠁿', 78.20, 18, 50, 75.0, 76.5, 3, 0, 1, 2, FALSE, FALSE, TRUE, '{78.20}', '{75.0}'),
('cot-rm', 'Thibaut Courtois', 'COT-RM', 'Real Madrid', 'GK', 'Bélgica 🇧🇪', 45.20, 25, 50, 90.0, 88.0, 4, 0, 0, 0, FALSE, FALSE, FALSE, '{45.20}', '{90.0}'),
('sal-aj', 'Mohamed Salah', 'SAL-AJ', 'Liverpool', 'FW', 'Egipto 🇪🇬', 68.90, 19, 50, 88.0, 82.0, 5, 2, 0, 4, FALSE, FALSE, FALSE, '{68.90}', '{88.0}'),
('mus-by', 'Jamal Musiala', 'MUS-BY', 'Bayern Munich', 'MF', 'Alemania 🇩🇪', 52.10, 22, 50, 70.2, 72.0, 3, 0, 1, 2, FALSE, TRUE, TRUE, '{52.10}', '{70.2}'),
('wrt-bl', 'Florian Wirtz', 'WRT-BL', 'Bayer Leverkusen', 'MF', 'Alemania 🇩🇪', 51.50, 21, 50, 73.4, 75.2, 3, 1, 0, 1, FALSE, TRUE, TRUE, '{51.50}', '{73.4}')
ON CONFLICT (id) DO NOTHING;
