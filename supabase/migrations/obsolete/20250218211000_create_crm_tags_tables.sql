-- Create crm_tags table
CREATE TABLE IF NOT EXISTS public.crm_tags (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    name TEXT NOT NULL,
    color TEXT NOT NULL,
    owner_phone TEXT NOT NULL REFERENCES public.clientes(phone) ON DELETE CASCADE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
    UNIQUE(name, owner_phone)
);

-- Create crm_lead_tags pivot table
CREATE TABLE IF NOT EXISTS public.crm_lead_tags (
    lead_id UUID NOT NULL REFERENCES public.evolution_contacts(id) ON DELETE CASCADE,
    tag_id UUID NOT NULL REFERENCES public.crm_tags(id) ON DELETE CASCADE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
    PRIMARY KEY (lead_id, tag_id)
);

-- Enable RLS
ALTER TABLE public.crm_tags ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.crm_lead_tags ENABLE ROW LEVEL SECURITY;

-- RLS Policies for crm_tags
CREATE POLICY "Users can view their own tags"
    ON public.crm_tags
    FOR SELECT
    USING (owner_phone = (SELECT phone FROM public.clientes WHERE auth_user_id = auth.uid() LIMIT 1));

CREATE POLICY "Users can insert their own tags"
    ON public.crm_tags
    FOR INSERT
    WITH CHECK (owner_phone = (SELECT phone FROM public.clientes WHERE auth_user_id = auth.uid() LIMIT 1));

CREATE POLICY "Users can update their own tags"
    ON public.crm_tags
    FOR UPDATE
    USING (owner_phone = (SELECT phone FROM public.clientes WHERE auth_user_id = auth.uid() LIMIT 1));

CREATE POLICY "Users can delete their own tags"
    ON public.crm_tags
    FOR DELETE
    USING (owner_phone = (SELECT phone FROM public.clientes WHERE auth_user_id = auth.uid() LIMIT 1));

-- RLS Policies for crm_lead_tags
-- Users can view lead tags if they own the lead (via evolution_contacts -> instance -> owner)
-- OR if they own the tag. Since both should belong to the same user, checking tag ownership is sufficient and faster.
CREATE POLICY "Users can view their lead tags"
    ON public.crm_lead_tags
    FOR SELECT
    USING (
        EXISTS (
            SELECT 1 FROM public.crm_tags
            WHERE crm_tags.id = crm_lead_tags.tag_id
            AND crm_tags.owner_phone = (SELECT phone FROM public.clientes WHERE auth_user_id = auth.uid() LIMIT 1)
        )
    );

CREATE POLICY "Users can insert their lead tags"
    ON public.crm_lead_tags
    FOR INSERT
    WITH CHECK (
        EXISTS (
            SELECT 1 FROM public.crm_tags
            WHERE crm_tags.id = crm_lead_tags.tag_id
            AND crm_tags.owner_phone = (SELECT phone FROM public.clientes WHERE auth_user_id = auth.uid() LIMIT 1)
        )
    );

CREATE POLICY "Users can delete their lead tags"
    ON public.crm_lead_tags
    FOR DELETE
    USING (
        EXISTS (
            SELECT 1 FROM public.crm_tags
            WHERE crm_tags.id = crm_lead_tags.tag_id
            AND crm_tags.owner_phone = (SELECT phone FROM public.clientes WHERE auth_user_id = auth.uid() LIMIT 1)
        )
    );

-- Data Migration: Migrate existing tags from array to relational tables
DO $$
DECLARE
    r RECORD;
    tag_text TEXT;
    new_tag_id UUID;
    contact_owner_phone TEXT;
    tag_color TEXT;
    colors TEXT[] := ARRAY[
        'bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-300 border-blue-200 dark:border-blue-800',
        'bg-purple-100 text-purple-700 dark:bg-purple-900/30 dark:text-purple-300 border-purple-200 dark:border-purple-800',
        'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-300 border-green-200 dark:border-green-800',
        'bg-yellow-100 text-yellow-700 dark:bg-yellow-900/30 dark:text-yellow-300 border-yellow-200 dark:border-yellow-800',
        'bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-300 border-red-200 dark:border-red-800',
        'bg-pink-100 text-pink-700 dark:bg-pink-900/30 dark:text-pink-300 border-pink-200 dark:border-pink-800',
        'bg-indigo-100 text-indigo-700 dark:bg-indigo-900/30 dark:text-indigo-300 border-indigo-200 dark:border-indigo-800',
        'bg-teal-100 text-teal-700 dark:bg-teal-900/30 dark:text-teal-300 border-teal-200 dark:border-teal-800',
        'bg-orange-100 text-orange-700 dark:bg-orange-900/30 dark:text-orange-300 border-orange-200 dark:border-orange-800',
        'bg-cyan-100 text-cyan-700 dark:bg-cyan-900/30 dark:text-cyan-300 border-cyan-200 dark:border-cyan-800'
    ];
BEGIN
    -- Iterate over all contacts that have tags
    FOR r IN SELECT id, crm_tags, instance_id FROM public.evolution_contacts WHERE crm_tags IS NOT NULL AND array_length(crm_tags, 1) > 0 LOOP
        
        -- Get the owner phone for this contact (via instance -> cliente)
        SELECT phone INTO contact_owner_phone
        FROM public.evolution_instances
        WHERE id = r.instance_id;

        IF contact_owner_phone IS NOT NULL THEN
            -- Iterate over each tag in the array
            FOREACH tag_text IN ARRAY r.crm_tags LOOP
                IF tag_text IS NOT NULL AND length(trim(tag_text)) > 0 THEN
                    tag_text := trim(tag_text);
                    
                    -- Determine color (simple hash logic for migration consistency)
                    tag_color := colors[(abs(hashtext(tag_text)) % array_length(colors, 1)) + 1];

                    -- Insert tag if not exists, or get existing ID
                    INSERT INTO public.crm_tags (name, color, owner_phone)
                    VALUES (tag_text, tag_color, contact_owner_phone)
                    ON CONFLICT (name, owner_phone) DO UPDATE SET name = EXCLUDED.name -- Dummy update to return ID
                    RETURNING id INTO new_tag_id;

                    -- Create relation
                    INSERT INTO public.crm_lead_tags (lead_id, tag_id)
                    VALUES (r.id, new_tag_id)
                    ON CONFLICT DO NOTHING;
                END IF;
            END LOOP;
        END IF;
    END LOOP;
END $$;