-- Create the funding_requests table
CREATE TABLE IF NOT EXISTS funding_requests (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  user_email text NOT NULL,
  requested_amount numeric(15,2) NOT NULL,
  status text DEFAULT 'pending' NOT NULL,
  message text,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- Add constraint for status values
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.table_constraints 
    WHERE table_name = 'funding_requests' AND constraint_name = 'funding_requests_status_check'
  ) THEN
    ALTER TABLE funding_requests ADD CONSTRAINT funding_requests_status_check 
    CHECK (status IN ('pending', 'approved', 'rejected', 'completed'));
  END IF;
END $$;

-- Add constraint for positive amounts
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.table_constraints 
    WHERE table_name = 'funding_requests' AND constraint_name = 'funding_requests_amount_check'
  ) THEN
    ALTER TABLE funding_requests ADD CONSTRAINT funding_requests_amount_check 
    CHECK (requested_amount > 0);
  END IF;
END $$;

-- Enable RLS
ALTER TABLE funding_requests ENABLE ROW LEVEL SECURITY;

-- Drop existing policies if they exist and create new ones
DO $$
BEGIN
  -- Drop existing policies
  DROP POLICY IF EXISTS "Users can insert their own funding requests" ON funding_requests;
  DROP POLICY IF EXISTS "Users can view their own funding requests" ON funding_requests;
  DROP POLICY IF EXISTS "Admins can view all funding requests" ON funding_requests;
  DROP POLICY IF EXISTS "Admins can update funding requests" ON funding_requests;
  
  -- Create new policies
  CREATE POLICY "Users can insert their own funding requests"
    ON funding_requests
    FOR INSERT
    TO authenticated
    WITH CHECK (auth.uid() = user_id);

  CREATE POLICY "Users can view their own funding requests"
    ON funding_requests
    FOR SELECT
    TO authenticated
    USING (auth.uid() = user_id);

  CREATE POLICY "Admins can view all funding requests"
    ON funding_requests
    FOR SELECT
    TO authenticated
    USING (
      (auth.jwt() ->> 'email'::text) ~~ '%admin%'::text OR 
      (auth.jwt() ->> 'email'::text) ~~ '%support%'::text
    );

  CREATE POLICY "Admins can update funding requests"
    ON funding_requests
    FOR UPDATE
    TO authenticated
    USING (
      (auth.jwt() ->> 'email'::text) ~~ '%admin%'::text OR 
      (auth.jwt() ->> 'email'::text) ~~ '%support%'::text
    );
END $$;

-- Create indexes for better performance
CREATE INDEX IF NOT EXISTS idx_funding_requests_user_id ON funding_requests(user_id);
CREATE INDEX IF NOT EXISTS idx_funding_requests_status ON funding_requests(status);
CREATE INDEX IF NOT EXISTS idx_funding_requests_created_at ON funding_requests(created_at);

-- Create trigger function for updated_at
CREATE OR REPLACE FUNCTION update_funding_requests_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Drop existing trigger if it exists and create new one
DROP TRIGGER IF EXISTS update_funding_requests_updated_at ON funding_requests;
CREATE TRIGGER update_funding_requests_updated_at
  BEFORE UPDATE ON funding_requests
  FOR EACH ROW
  EXECUTE FUNCTION update_funding_requests_updated_at();