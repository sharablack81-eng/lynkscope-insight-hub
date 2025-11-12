-- Add location tracking columns to link_clicks table
ALTER TABLE link_clicks 
ADD COLUMN country text,
ADD COLUMN continent text;