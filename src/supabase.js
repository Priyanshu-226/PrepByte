import { createClient } from '@supabase/supabase-js';

const url = import.meta.env.VITE_SUPABASE_URL;
const key = import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY;
// The example .env ships with placeholder values; treat those as "not configured".
const configured = Boolean(url && key) && !url.includes('your-project');

export const supabase = configured ? createClient(url, key, { auth: { flowType: 'pkce' } }) : null;
export const supabaseEnabled = Boolean(supabase);
