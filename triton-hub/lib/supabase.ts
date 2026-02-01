
import { createClient } from '@supabase/supabase-js';

const supabaseUrl = 'https://eorcjtcaxonmrohyrxnt.supabase.co';
const supabaseKey = 'sb_publishable_RvwKD178hlTNUOOqwkg1DA_X6S4g25O';

export const supabase = createClient(supabaseUrl, supabaseKey);
