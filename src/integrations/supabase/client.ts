import { createClient } from '@supabase/supabase-js'

const supabaseUrl = 'https://wepxsfjfolohhggdaqle.supabase.co'
const supabaseAnonKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6IndlcHhzZmpmb2xvaGhnZ2RhcWxlIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTk0OTA0OTgsImV4cCI6MjA3NTA2NjQ5OH0.WMkHroXAXOSf-aSLatDffgk13I5HIpqCEfKrm0fcrlk'

export const supabase = createClient(supabaseUrl, supabaseAnonKey)