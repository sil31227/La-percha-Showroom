-- Migration: add retiro_local column to productos
-- Run in Supabase SQL Editor

BEGIN;

ALTER TABLE productos ADD COLUMN IF NOT EXISTS retiro_local BOOLEAN DEFAULT true;

COMMIT;
