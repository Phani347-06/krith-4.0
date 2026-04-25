import { createClient } from '@supabase/supabase-js'

const supabaseUrl = 'https://knqeiskbjdeyzaogdjhp.supabase.co'
const supabaseAnonKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImtucWVpc2tiamRleXphb2dkamhwIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzcwMjY4ODMsImV4cCI6MjA5MjYwMjg4M30.hzLlj9FYgZZPd_vvZ5KOIx2ZMf2d1DHSIUlOOAZ0G-o'

export const supabase = createClient(supabaseUrl, supabaseAnonKey)
