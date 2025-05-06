
/*
  # Create Payments Table
  
  Cette migration crée une table de paiements pour suivre les transactions
  liées aux réservations de courts de padel.
*/

-- Création de la table payments
CREATE TABLE IF NOT EXISTS public.payments (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  reservation_id UUID NOT NULL REFERENCES public.reservations(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
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

-- Index pour accélérer les recherches
CREATE INDEX IF NOT EXISTS payments_reservation_id_idx ON public.payments(reservation_id);
CREATE INDEX IF NOT EXISTS payments_user_id_idx ON public.payments(user_id);
CREATE INDEX IF NOT EXISTS payments_status_idx ON public.payments(status);

-- Trigger pour mettre à jour le champ updated_at
CREATE OR REPLACE FUNCTION update_payments_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER update_payments_updated_at
BEFORE UPDATE ON public.payments
FOR EACH ROW
EXECUTE FUNCTION update_payments_updated_at();

-- Politiques de sécurité RLS (Row Level Security)
ALTER TABLE public.payments ENABLE ROW LEVEL SECURITY;

-- Politique pour permettre aux utilisateurs de voir leurs propres paiements
CREATE POLICY "users_can_view_own_payments"
ON public.payments
FOR SELECT
TO authenticated
USING (user_id = auth.uid());

-- Politique pour permettre aux administrateurs de voir tous les paiements
CREATE POLICY "admins_can_view_all_payments"
ON public.payments
FOR SELECT
TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM profiles 
    WHERE id = auth.uid() AND role = 'admin'
  )
);

-- Politique pour permettre aux utilisateurs de créer leurs propres paiements
CREATE POLICY "users_can_create_own_payments"
ON public.payments
FOR INSERT
TO authenticated
WITH CHECK (user_id = auth.uid());

-- Politique pour permettre aux administrateurs de mettre à jour tous les paiements
CREATE POLICY "admins_can_update_all_payments"
ON public.payments
FOR UPDATE
TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM profiles 
    WHERE id = auth.uid() AND role = 'admin'
  )
);

-- Fonction pour mettre à jour le statut de la réservation lorsqu'un paiement est complété
CREATE OR REPLACE FUNCTION update_reservation_status_on_payment()
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

CREATE TRIGGER update_reservation_status_on_payment
AFTER UPDATE ON public.payments
FOR EACH ROW
EXECUTE FUNCTION update_reservation_status_on_payment();

-- Logging pour le débogage
DO $$
BEGIN
  RAISE NOTICE 'Migration terminée : Table de paiements créée avec succès.';
END
$$;