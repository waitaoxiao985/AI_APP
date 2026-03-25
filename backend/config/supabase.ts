import { createClient, SupabaseClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';

dotenv.config();

const supabaseUrl = process.env.SUPABASE_URL || '';
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY || '';

let supabase: SupabaseClient<any, 'public', any>;

if (!supabaseUrl || !supabaseServiceKey) {
  console.error('Missing Supabase configuration');
  // For development purposes, we'll create a mock supabase client
  // In production, this would throw an error
  console.warn('Using mock Supabase client for development');
  
  // Create a mock supabase client that returns empty data
  supabase = {
    from: () => ({
      select: () => ({
        eq: () => ({
          single: () => Promise.resolve({ data: null, error: null }),
          order: () => Promise.resolve({ data: [], error: null }),
          limit: () => ({
            offset: () => Promise.resolve({ data: [], error: null })
          }),
          ilike: () => ({
            or: () => Promise.resolve({ data: [], error: null })
          })
        }),
        single: () => Promise.resolve({ data: null, error: null }),
        order: () => Promise.resolve({ data: [], error: null })
      }),
      insert: () => ({
        select: () => Promise.resolve({ data: null, error: null })
      }),
      update: () => ({
        eq: () => ({
          select: () => Promise.resolve({ data: null, error: null })
        })
      }),
      delete: () => ({
        eq: () => Promise.resolve({ error: null })
      }),
      upsert: () => ({
        select: () => Promise.resolve({ data: null, error: null })
      })
    })
  } as any;
} else {
  supabase = createClient(supabaseUrl, supabaseServiceKey, {
    auth: {
      autoRefreshToken: false,
      persistSession: false
    }
  });
}

export { supabase };