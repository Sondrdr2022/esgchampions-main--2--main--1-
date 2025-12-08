// Supabase Configuration
// This file supports both direct configuration and environment variables
// For production (Vercel), set SUPABASE_URL and SUPABASE_ANON_KEY as environment variables
// For local development, update the values below or use environment variables

// Get configuration from environment variables (Vercel) or use direct values
const getSupabaseConfig = () => {
  // Try to get from window (injected by build process or inline script)
  if (typeof window !== 'undefined' && window.SUPABASE_CONFIG) {
    return window.SUPABASE_CONFIG;
  }
  
  // Try to get from environment (Node.js/Vercel build)
  if (typeof process !== 'undefined' && process.env) {
    if (process.env.SUPABASE_URL && process.env.SUPABASE_ANON_KEY) {
      return {
        url: process.env.SUPABASE_URL,
        anonKey: process.env.SUPABASE_ANON_KEY
      };
    }
  }
  
  // Fallback to direct configuration
  return {
    url: 'https://poshunghzxkpujdofyph.supabase.co',
    anonKey: 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InBvc2h1bmdoenhrcHVqZG9meXBoIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjMwMzQ3ODYsImV4cCI6MjA3ODYxMDc4Nn0.Y1WTWlWxCvHe2wfj6V6-khjvqoMOTPA1DI8kCaZ5uAw'
  };
};


const SUPABASE_CONFIG = getSupabaseConfig();

// Initialize Supabase client (only if supabase library is loaded)
let supabaseClient = null;
if (typeof supabase !== 'undefined' && supabase.createClient) {
  try {
    supabaseClient = supabase.createClient(SUPABASE_CONFIG.url, SUPABASE_CONFIG.anonKey);
    console.log('✅ Supabase client initialized');
  } catch (error) {
    console.error('❌ Error initializing Supabase client:', error);
  }
}

// Export for use in other files
if (typeof module !== 'undefined' && module.exports) {
  module.exports = { supabaseClient, SUPABASE_CONFIG };
}

// Make available globally
if (typeof window !== 'undefined') {
  window.SUPABASE_CONFIG = SUPABASE_CONFIG;
  window.supabaseClient = supabaseClient;
}

