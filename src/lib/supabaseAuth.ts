import { createClient } from '@supabase/supabase-js'

// Dedicated Supabase project for the Google Login / member-approval system.
// This is intentionally a SEPARATE project from the trip's main data
// project (chat, expenses, photos) so authentication can be built and
// tested without touching any live trip data. Once Google sign-in is
// verified end to end, this can be pointed at the main project instead.
const AUTH_URL = 'https://tvkguabbkmucjrxdcfaa.supabase.co'
const AUTH_ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InR2a2d1YWJia211Y2pyeGRjZmFhIiwicm9sZSI6ImFub24iLCJpYXQiOjE3OTAwODA0NjQsImV4cCI6MjEwNTY1NjQ2NH0.6x8uijhYIaknBcX5ikkE9UHguJrZBOmszi25ivibkmo'

export const supabaseAuth = createClient(AUTH_URL, AUTH_ANON_KEY)
