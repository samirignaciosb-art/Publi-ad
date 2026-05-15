// js/supabase.js — Cliente Supabase centralizado UbiPet 2.0
import { createClient } from 'https://cdn.jsdelivr.net/npm/@supabase/supabase-js/+esm'

const SUPABASE_URL = 'https://hwkyvxzbheegxynoljrw.supabase.co'
const SUPABASE_ANON = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Imh3a3l2eHpiaGVlZ3h5bm9sanJ3Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3MTI2MDMxOTgsImV4cCI6MjAyODE3OTE5OH0.uP_-_DPeWRGRjkGxRfmVhYsKMJqHBt8JcfMcJXaUTGo'

export const supabase = createClient(SUPABASE_URL, SUPABASE_ANON, {
  auth: {
    persistSession: true,
    storageKey: 'ubipet_session',
  }
})
