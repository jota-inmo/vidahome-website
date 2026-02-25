-- Fix: Allow superficie = 0 in property_features table
-- Current constraint: CHECK (superficie > 0)
-- New constraint: CHECK (superficie >= 0)

ALTER TABLE public.property_features 
DROP CONSTRAINT IF EXISTS property_features_superficie_check;

ALTER TABLE public.property_features 
ADD CONSTRAINT property_features_superficie_check 
CHECK (superficie >= 0);

-- Verify constraint updated
SELECT constraint_name, constraint_type
FROM information_schema.table_constraints
WHERE table_name = 'property_features' AND constraint_type = 'CHECK';
