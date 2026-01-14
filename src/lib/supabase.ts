import { createClient } from '@supabase/supabase-js'

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || `https://${process.env.DATABASE_URL?.split('@')[1]?.split('.')[0]}.supabase.co`
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY || ''

export const supabase = (supabaseUrl && supabaseKey)
    ? createClient(supabaseUrl, supabaseKey)
    : null
