
import { createClient } from '@supabase/supabase-js';

const supabaseUrl = 'https://eorcjtcaxonmrohyrxnt.supabase.co';
const supabaseKey = 'sb_publishable_NEzSqzUjILO_FrRDpu6i8g_9yg3NG4r';

export const supabase = createClient(supabaseUrl, supabaseKey);
