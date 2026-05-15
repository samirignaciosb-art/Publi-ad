// js/supabase.js — Cliente Supabase centralizado UbiPet 2.0
import { createClient } from 'https://cdn.jsdelivr.net/npm/@supabase/supabase-js/+esm'

const SUPABASE_URL = 'https://hwkyvxzbheegxynoljrw.supabase.co'
const SUPABASE_ANON = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Imh3a3l2eHpiaGVlZ3h5bm9sanJ3Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzE5NzEyNzYsImV4cCI6MjA4NzU0NzI3Nn0.izGO-iK49rb-Rx5GRl2Rm55iDNj10sjCCq2QVEfuSXg'

export const supabase = createClient(SUPABASE_URL, SUPABASE_ANON, {
  auth: {
    persistSession: true,
    storageKey: 'ubipet_session',
  }
})
