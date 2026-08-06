-- =====================================================================
-- GToolix Monitoring Module — Hardened Supabase Postgres Schema & RLS
-- Execute this entire script in Supabase SQL Editor.
-- =====================================================================

-- 1. PROFILES TABLE (Extends auth.users with admin flag)
CREATE TABLE IF NOT EXISTS public.profiles (
    id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
    email TEXT,
    is_admin BOOLEAN NOT NULL DEFAULT FALSE,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- 2. SESSIONS TABLE
CREATE TABLE IF NOT EXISTS public.sessions (
    id UUID PRIMARY KEY,
    visitor_id TEXT NOT NULL,
    user_agent TEXT,
    device_type TEXT,
    browser TEXT,
    os TEXT,
    country TEXT,
    ip_masked TEXT DEFAULT 'anonymized',
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    last_seen_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- 3. PAGE VIEWS TABLE
CREATE TABLE IF NOT EXISTS public.page_views (
    id BIGINT PRIMARY KEY GENERATED ALWAYS AS IDENTITY,
    session_id UUID REFERENCES public.sessions(id) ON DELETE CASCADE,
    visitor_id TEXT NOT NULL,
    path TEXT NOT NULL,
    referrer TEXT,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- 4. TOOL USAGE TABLE
CREATE TABLE IF NOT EXISTS public.tool_usage (
    id BIGINT PRIMARY KEY GENERATED ALWAYS AS IDENTITY,
    session_id UUID REFERENCES public.sessions(id) ON DELETE CASCADE,
    tool_name TEXT NOT NULL,
    metadata JSONB DEFAULT '{}'::jsonb,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- 5. ERRORS TABLE
CREATE TABLE IF NOT EXISTS public.errors (
    id BIGINT PRIMARY KEY GENERATED ALWAYS AS IDENTITY,
    session_id UUID REFERENCES public.sessions(id) ON DELETE CASCADE,
    error_message TEXT NOT NULL,
    stack TEXT,
    context JSONB DEFAULT '{}'::jsonb,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- 6. FEEDBACK TABLE
CREATE TABLE IF NOT EXISTS public.feedback (
    id BIGINT PRIMARY KEY GENERATED ALWAYS AS IDENTITY,
    session_id UUID REFERENCES public.sessions(id) ON DELETE SET NULL,
    rating INTEGER CHECK (rating BETWEEN 1 AND 5),
    comment TEXT,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- 7. NOTIFICATIONS TABLE
CREATE TABLE IF NOT EXISTS public.notifications (
    id BIGINT PRIMARY KEY GENERATED ALWAYS AS IDENTITY,
    title TEXT NOT NULL,
    message TEXT NOT NULL,
    type TEXT DEFAULT 'info',
    is_read BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- 8. HEALTH CHECKS TABLE
CREATE TABLE IF NOT EXISTS public.health_checks (
    id BIGINT PRIMARY KEY GENERATED ALWAYS AS IDENTITY,
    service_name TEXT NOT NULL,
    status TEXT NOT NULL,
    response_time_ms INTEGER,
    checked_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- =====================================================================
-- PERFORMANCE INDEXES
-- =====================================================================
CREATE INDEX IF NOT EXISTS idx_sessions_last_seen ON public.sessions(last_seen_at);
CREATE INDEX IF NOT EXISTS idx_sessions_visitor ON public.sessions(visitor_id);
CREATE INDEX IF NOT EXISTS idx_page_views_created ON public.page_views(created_at);
CREATE INDEX IF NOT EXISTS idx_page_views_session ON public.page_views(session_id);
CREATE INDEX IF NOT EXISTS idx_tool_usage_name ON public.tool_usage(tool_name);
CREATE INDEX IF NOT EXISTS idx_tool_usage_created ON public.tool_usage(created_at);
CREATE INDEX IF NOT EXISTS idx_errors_created ON public.errors(created_at);
CREATE INDEX IF NOT EXISTS idx_health_checks_time ON public.health_checks(checked_at);

-- =====================================================================
-- SECURITY DEFINER FUNCTIONS & TRIGGERS
-- =====================================================================

-- Security Definer function to verify admin status
CREATE OR REPLACE FUNCTION public.is_admin()
RETURNS BOOLEAN
LANGUAGE sql
SECURITY DEFINER
STABLE
AS $$
  SELECT COALESCE(
    (SELECT is_admin FROM public.profiles WHERE id = auth.uid()),
    FALSE
  );
$$;

-- Trigger to auto-create profile on user signup (first user auto-admin)
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
    INSERT INTO public.profiles (id, email, is_admin)
    VALUES (
        NEW.id,
        NEW.email,
        NOT EXISTS (SELECT 1 FROM public.profiles)
    )
    ON CONFLICT (id) DO UPDATE SET email = EXCLUDED.email;
    RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
    AFTER INSERT ON auth.users
    FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- Two-layer Hardened Data Retention Cleanup Function
CREATE OR REPLACE FUNCTION public.cleanup_old_monitoring_data(retention_days INTEGER DEFAULT 30)
RETURNS VOID
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
    -- Layer 1: In-function admin check
    IF NOT public.is_admin() THEN
        RAISE EXCEPTION 'Unauthorized: admin privileges required to run cleanup';
    END IF;

    DELETE FROM public.page_views WHERE created_at < NOW() - (retention_days || ' days')::INTERVAL;
    DELETE FROM public.tool_usage WHERE created_at < NOW() - (retention_days || ' days')::INTERVAL;
    DELETE FROM public.errors WHERE created_at < NOW() - (retention_days || ' days')::INTERVAL;
    DELETE FROM public.feedback WHERE created_at < NOW() - (retention_days || ' days')::INTERVAL;
    DELETE FROM public.health_checks WHERE checked_at < NOW() - (retention_days || ' days')::INTERVAL;
    DELETE FROM public.sessions WHERE last_seen_at < NOW() - (retention_days || ' days')::INTERVAL;
END;
$$;

-- Layer 2: Explicit privilege lockdown
REVOKE EXECUTE ON FUNCTION public.cleanup_old_monitoring_data(INTEGER) FROM PUBLIC;
REVOKE EXECUTE ON FUNCTION public.cleanup_old_monitoring_data(INTEGER) FROM anon;
GRANT EXECUTE ON FUNCTION public.cleanup_old_monitoring_data(INTEGER) TO authenticated;

-- Enable Supabase Realtime on sessions table
ALTER PUBLICATION supabase_realtime ADD TABLE public.sessions;

-- =====================================================================
-- ROW LEVEL SECURITY (RLS) POLICIES
-- =====================================================================

ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.sessions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.page_views ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.tool_usage ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.errors ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.feedback ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.notifications ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.health_checks ENABLE ROW LEVEL SECURITY;

-- 1. PROFILES POLICIES
CREATE POLICY "Users read own profile or admin reads all" ON public.profiles
    FOR SELECT USING (auth.uid() = id OR public.is_admin());

CREATE POLICY "Admins update profiles" ON public.profiles
    FOR UPDATE USING (public.is_admin());

-- 2. SESSIONS POLICIES
CREATE POLICY "Anon/Public insert sessions" ON public.sessions
    FOR INSERT WITH CHECK (true);

CREATE POLICY "Anon/Public update session heartbeat" ON public.sessions
    FOR UPDATE USING (true) WITH CHECK (true);

CREATE POLICY "Admins select sessions" ON public.sessions
    FOR SELECT USING (public.is_admin());

-- 3. PAGE VIEWS POLICIES
CREATE POLICY "Anon/Public insert page_views" ON public.page_views
    FOR INSERT WITH CHECK (true);

CREATE POLICY "Admins select page_views" ON public.page_views
    FOR SELECT USING (public.is_admin());

-- 4. TOOL USAGE POLICIES
CREATE POLICY "Anon/Public insert tool_usage" ON public.tool_usage
    FOR INSERT WITH CHECK (true);

CREATE POLICY "Admins select tool_usage" ON public.tool_usage
    FOR SELECT USING (public.is_admin());

-- 5. ERRORS POLICIES
CREATE POLICY "Anon/Public insert errors" ON public.errors
    FOR INSERT WITH CHECK (true);

CREATE POLICY "Admins select errors" ON public.errors
    FOR SELECT USING (public.is_admin());

-- 6. FEEDBACK POLICIES
CREATE POLICY "Anon/Public insert feedback" ON public.feedback
    FOR INSERT WITH CHECK (true);

CREATE POLICY "Admins select feedback" ON public.feedback
    FOR SELECT USING (public.is_admin());

-- 7. NOTIFICATIONS POLICIES
CREATE POLICY "Admins manage notifications" ON public.notifications
    FOR ALL USING (public.is_admin());

-- 8. HEALTH CHECKS POLICIES
CREATE POLICY "Anon/Public insert health checks" ON public.health_checks
    FOR INSERT WITH CHECK (true);

CREATE POLICY "Admins select health checks" ON public.health_checks
    FOR SELECT USING (public.is_admin());
