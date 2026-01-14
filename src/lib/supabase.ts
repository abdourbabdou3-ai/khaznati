import { createClient } from '@supabase/supabase-js'

// Simple helper to extract project ref from DATABASE_URL if needed
function getRefFromUrl(url: string | undefined): string {
    if (!url) return ''
    try {
        // Handling pooler format: postgres://postgres.[REF]:[PASS]@...
        const username = url.split('//')[1]?.split(':')[0] || ''
        if (username.includes('.')) {
            return username.split('.')[1]
        }
        // Handling direct format: postgres://postgres:[PASS]@db.[REF].supabase.co
        const host = url.split('@')[1]?.split(':')[0] || ''
        if (host.includes('db.')) {
            return host.split('.')[1]
        }
    } catch (e) {
        return ''
    }
    return ''
}

const ref = getRefFromUrl(process.env.DATABASE_URL)
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || (ref ? `https://${ref}.supabase.co` : '')
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY || ''

if (!supabaseUrl || !supabaseKey) {
    console.warn('Supabase Storage not fully configured. Missing URL or Key.')
}

export const supabase = (supabaseUrl && supabaseKey)
    ? createClient(supabaseUrl, supabaseKey)
    : null
