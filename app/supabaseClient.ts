import { createClient } from '@supabase/supabase-js'

const supabaseUrl = 'https://tqlcfmrtszgrtmnuydhl.supabase.co'
const supabaseAnonKey = 'sb_publishable_5zzjcayXXzXzRxeWO6V08Q_-c5GE-cA'

export const supabase = createClient(supabaseUrl, supabaseAnonKey)
