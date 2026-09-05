import { createClient, type SupabaseClient } from '@supabase/supabase-js'

const url = import.meta.env.VITE_SUPABASE_URL as string | undefined
const anonKey = import.meta.env.VITE_SUPABASE_ANON_KEY as string | undefined

// The browser uses only the public anon key. Service-role credentials belong in Edge Functions.
export const supabase: SupabaseClient | null = url && anonKey ? createClient(url, anonKey) : null
export const isCloudSyncReady = Boolean(supabase)
