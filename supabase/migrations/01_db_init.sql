-- Supabase Consolidated Initial Schema

-- Create ENUM types
CREATE TYPE public.court_status AS ENUM ('available', 'reserved', 'maintenance');
CREATE TYPE public.reservation_status AS ENUM ('pending', 'confirmed', 'cancelled');

-- Create PROFILES table
CREATE TABLE IF NOT EXISTS public.profiles (
  id UUID PRIMARY KEY REFERENCES auth.users ON DELETE CASCADE,
  role TEXT NOT NULL DEFAULT 'client' CHECK (role IN ('client', 'admin')),
  created_at TIMESTAMPTZ DEFAULT now()
);

-- Create COURTS table
CREATE TABLE IF NOT EXISTS public.courts (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  description TEXT,
  price_per_hour NUMERIC NOT NULL CHECK (price_per_hour >= 0),
  image_url TEXT,
  status public.court_status DEFAULT 'available',
  created_at TIMESTAMPTZ DEFAULT now()
);

-- Create RESERVATIONS table
CREATE TABLE IF NOT EXISTS public.reservations (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  court_id UUID NOT NULL REFERENCES public.courts(id) ON DELETE CASCADE,
  start_time TIMESTAMPTZ NOT NULL,
  end_time TIMESTAMPTZ NOT NULL,
  total_price NUMERIC NOT NULL CHECK (total_price >= 0),
  status public.reservation_status DEFAULT 'pending',
  created_at TIMESTAMPTZ DEFAULT now(),
  CONSTRAINT reservations_timeframe_check CHECK (end_time > start_time)
);

-- Create PAYMENTS table
CREATE TABLE IF NOT EXISTS public.payments (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  reservation_id UUID NOT NULL REFERENCES public.reservations(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE, -- References auth.users directly
  amount DECIMAL(10, 2) NOT NULL,
  currency TEXT NOT NULL DEFAULT 'XOF',
  payment_method TEXT NOT NULL CHECK (payment_method IN ('online', 'on_spot')),
  payment_provider TEXT,
  provider_payment_id TEXT,
  status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'completed', 'failed', 'refunded')),
  payment_url TEXT,
  payment_date TIMESTAMP WITH TIME ZONE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now() NOT NULL,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT now() NOT NULL
);

-- Create INDEXES for PAYMENTS table
CREATE INDEX IF NOT EXISTS payments_reservation_id_idx ON public.payments(reservation_id);
CREATE INDEX IF NOT EXISTS payments_user_id_idx ON public.payments(user_id);
CREATE INDEX IF NOT EXISTS payments_status_idx ON public.payments(status);

-- Function and Trigger to HANDLE NEW USER (create profile)
CREATE OR REPLACE FUNCTION public.handle_new_user() 
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO public.profiles (id, role)
  VALUES (NEW.id, 
    CASE 
      WHEN NOT EXISTS (SELECT 1 FROM public.profiles) THEN 'admin' -- First user becomes admin
      ELSE 'client'
    END
  )
  ON CONFLICT (id) DO NOTHING; -- Important for idempotency if trigger fires multiple times or user already exists
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- Function and Trigger to UPDATE 'updated_at' timestamp on PAYMENTS table
CREATE OR REPLACE FUNCTION public.update_payments_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER update_payments_updated_at_trigger
BEFORE UPDATE ON public.payments
FOR EACH ROW
EXECUTE FUNCTION public.update_payments_updated_at();

-- Function and Trigger to UPDATE RESERVATION STATUS when PAYMENT is completed
CREATE OR REPLACE FUNCTION public.update_reservation_status_on_payment()
RETURNS TRIGGER AS $$
BEGIN
  IF NEW.status = 'completed' AND OLD.status != 'completed' THEN
    UPDATE public.reservations
    SET status = 'confirmed'
    WHERE id = NEW.reservation_id;
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER update_reservation_status_on_payment_trigger
AFTER UPDATE ON public.payments
FOR EACH ROW
EXECUTE FUNCTION public.update_reservation_status_on_payment();

-- Procedure to FIX MISSING PROFILES (definition only, call it from seed.sql)
CREATE OR REPLACE PROCEDURE public.fix_missing_profiles()
LANGUAGE plpgsql
AS $$
BEGIN
  -- Insert profiles for any users that don't have them
  INSERT INTO public.profiles (id, role)
  SELECT u.id, 'client' FROM auth.users u
  WHERE NOT EXISTS (SELECT 1 FROM public.profiles p WHERE p.id = u.id)
  ON CONFLICT (id) DO NOTHING;
  
  -- Set the first user (by auth.users.created_at) as admin if no admin profile exists
  IF NOT EXISTS (SELECT 1 FROM public.profiles WHERE role = 'admin') THEN
    UPDATE public.profiles
    SET role = 'admin'
    WHERE id = (
      SELECT u_inner.id FROM auth.users u_inner 
      ORDER BY u_inner.created_at 
      LIMIT 1
    );
  END IF;
END;
$$;

-- Enable ROW LEVEL SECURITY (RLS)
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.courts ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.reservations ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.payments ENABLE ROW LEVEL SECURITY;

-- POLICIES for PROFILES table
CREATE POLICY "Users can read their own profile"
  ON public.profiles FOR SELECT TO authenticated USING (auth.uid() = id);
CREATE POLICY "Admins can read all profiles"
  ON public.profiles FOR SELECT TO authenticated USING (EXISTS (SELECT 1 FROM public.profiles p WHERE p.id = auth.uid() AND p.role = 'admin'));
CREATE POLICY "Users can insert their own profile"
  ON public.profiles FOR INSERT TO authenticated WITH CHECK (auth.uid() = id AND role = 'client');
  
-- POLICIES for COURTS table
CREATE POLICY "Anyone can read courts"
  ON public.courts FOR SELECT TO authenticated USING (true); -- Or `TO anon, authenticated` if public read desired
CREATE POLICY "Admins can insert courts"
  ON public.courts FOR INSERT TO authenticated WITH CHECK (EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid() AND role = 'admin'));
CREATE POLICY "Admins can update courts"
  ON public.courts FOR UPDATE TO authenticated USING (EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid() AND role = 'admin'));
CREATE POLICY "Admins can delete courts"
  ON public.courts FOR DELETE TO authenticated USING (EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid() AND role = 'admin'));

-- POLICIES for RESERVATIONS table
CREATE POLICY "Admins can read all reservations"
  ON public.reservations FOR SELECT TO authenticated USING (EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid() AND role = 'admin'));
CREATE POLICY "Users can read their own reservations"
  ON public.reservations FOR SELECT TO authenticated USING (auth.uid() = user_id);
CREATE POLICY "Users can insert reservations for themselves"
  ON public.reservations FOR INSERT TO authenticated WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can update their own pending reservations"
  ON public.reservations FOR UPDATE TO authenticated USING (auth.uid() = user_id AND status = 'pending');
CREATE POLICY "Admins can update any reservation"
  ON public.reservations FOR UPDATE TO authenticated USING (EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid() AND role = 'admin'));

-- POLICIES for PAYMENTS table
CREATE POLICY "Users can view their own payments"
  ON public.payments FOR SELECT TO authenticated USING (user_id = auth.uid());
CREATE POLICY "Admins can view all payments"
  ON public.payments FOR SELECT TO authenticated USING (EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid() AND role = 'admin'));
CREATE POLICY "Users can create their own payments"
  ON public.payments FOR INSERT TO authenticated WITH CHECK (user_id = auth.uid());
CREATE POLICY "Admins can update all payments"
  ON public.payments FOR UPDATE TO authenticated USING (EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid() AND role = 'admin'));

-- GRANTS (Example for courts, adjust as needed)
GRANT SELECT ON public.courts TO authenticated;
GRANT SELECT ON public.courts TO anon; -- If courts should be publicly readable

RAISE NOTICE 'Consolidated initial schema migration complete.'; 