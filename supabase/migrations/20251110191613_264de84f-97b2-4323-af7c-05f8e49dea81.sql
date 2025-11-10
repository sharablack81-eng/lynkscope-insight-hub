-- Add browser and device_type columns to link_clicks table
ALTER TABLE link_clicks 
ADD COLUMN browser text,
ADD COLUMN device_type text;