import { createClient } from '@supabase/supabase-js';

const SUPABASE_URL = 'https://dwjrwnwuktkvdggjnjrh.supabase.co';
const SUPABASE_ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImR3anJ3bnd1a3RrdmRnZ2puanJoIiwicm9sZSI6ImFub24iLCJpYXQiOjE3OTE0OTU3OTYsImV4cCI6MjEwNzA3MTc5Nn0.BKfjgodsmkKWrMYAXnuKOtgT_bitLKBcd1APM6AdnKI';

export const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY);