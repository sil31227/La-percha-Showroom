-- Migration v3: Add phone column to profiles
-- Run this after schema.sql in Supabase SQL Editor
-- https://hvmctiqzjbqsghuwhquk.supabase.co

ALTER TABLE profiles
ADD COLUMN IF NOT EXISTS phone TEXT;

ALTER TABLE vendedores
ADD COLUMN IF NOT EXISTS phone TEXT;
