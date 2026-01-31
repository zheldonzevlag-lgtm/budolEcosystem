-- Migration to enforce E.164 phone number format and add normalization
-- This migration ensures all phone numbers are stored in international format

-- Create a function to normalize Philippine phone numbers to E.164 format
CREATE OR REPLACE FUNCTION normalize_philippine_phone(phone TEXT) RETURNS TEXT AS $$
BEGIN
  -- Remove all non-digit characters
  phone := REGEXP_REPLACE(phone, '[^0-9]', '', 'g');
  
  -- If it starts with 0, replace with +63
  IF phone LIKE '0%' THEN
    phone := '+63' || SUBSTRING(phone, 2);
  -- If it starts with 63, add + prefix
  ELSIF phone LIKE '63%' AND LENGTH(phone) = 11 THEN
    phone := '+' || phone;
  -- If it starts with 9 and has 10 digits, assume Philippine number
  ELSIF phone LIKE '9%' AND LENGTH(phone) = 10 THEN
    phone := '+63' || phone;
  END IF;
  
  -- Validate final format (should be +63 followed by 10 digits)
  IF phone ~ '^\+63[0-9]{10}$' THEN
    RETURN phone;
  ELSE
    RETURN NULL;
  END IF;
END;
$$ LANGUAGE plpgsql;

-- Update existing phone numbers to E.164 format
UPDATE "User" 
SET "phoneNumber" = normalize_philippine_phone("phoneNumber")
WHERE "phoneNumber" IS NOT NULL;

-- Create index for faster phone number lookups
CREATE INDEX IF NOT EXISTS "User_phoneNumber_idx" ON "User" ("phoneNumber");

-- Add check constraint to ensure phone numbers are in E.164 format
ALTER TABLE "User" 
ADD CONSTRAINT "User_phoneNumber_format" 
CHECK (
  "phoneNumber" IS NULL OR 
  "phoneNumber" ~ '^\+63[0-9]{10}$'
);