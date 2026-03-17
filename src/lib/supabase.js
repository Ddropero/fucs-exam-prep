import { createClient } from '@supabase/supabase-js';

const SUPABASE_URL = 'https://huiahgjgewabfknqkkaw.supabase.co';
const SUPABASE_ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Imh1aWFoZ2pnZXdhYmZrbnFra2F3Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzM3MDUxNzAsImV4cCI6MjA4OTI4MTE3MH0.ZjF1ZrhVSBmUPr8tTdkl5Eoe9k-Owu5oF4q7vG-9EEc';

export const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY);
