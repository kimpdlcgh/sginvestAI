-- Add admin_notes column to funding_requests table
ALTER TABLE funding_requests ADD COLUMN IF NOT EXISTS admin_notes text;

-- Update RLS policies to allow admins to update funding requests
DROP POLICY IF EXISTS "Admins can update funding requests" ON funding_requests;

CREATE POLICY "Admins can update funding requests" ON funding_requests
    FOR UPDATE 
    TO authenticated
    USING (
        (auth.jwt() ->> 'email') LIKE '%admin%' OR 
        (auth.jwt() ->> 'email') LIKE '%support%'
    );