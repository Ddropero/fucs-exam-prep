import { createClient } from '@supabase/supabase-js';

const SUPABASE_URL = 'https://htoyvhnfmhmipmpxnclw.supabase.co';
const SUPABASE_ANON_KEY = 'sb_publishable_wRP3TWAJrpJgSTAWiP310g_NUge2U7G';

export const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY);
