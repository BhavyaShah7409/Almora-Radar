import { createClient } from '@supabase/supabase-js';

if (!process.env.NEXT_PUBLIC_SUPABASE_URL) {
  throw new Error('Missing NEXT_PUBLIC_SUPABASE_URL environment variable');
}

if (!process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY) {
  throw new Error('Missing NEXT_PUBLIC_SUPABASE_ANON_KEY environment variable');
}

/**
 * Client-side Supabase client with anonymous key
 * Safe to use in the browser
 */
export const supabaseClient = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY,
  {
    auth: {
      autoRefreshToken: true,
      persistSession: true,
      detectSessionInUrl: true,
    },
  }
);

/**
 * Sign up a new user
 */
export async function signUp(email: string, password: string, name: string) {
  const { data, error } = await supabaseClient.auth.signUp({
    email,
    password,
    options: {
      data: {
        name,
      },
    },
  });

  if (error) {
    throw error;
  }

  return data;
}

/**
 * Sign in with email and password
 */
export async function signIn(email: string, password: string) {
  const { data, error } = await supabaseClient.auth.signInWithPassword({
    email,
    password,
  });

  if (error) {
    throw error;
  }

  return data;
}

/**
 * Sign in with Google OAuth
 */
export async function signInWithGoogle() {
  const { data, error } = await supabaseClient.auth.signInWithOAuth({
    provider: 'google',
    options: {
      redirectTo: `${window.location.origin}/auth/callback`,
    },
  });

  if (error) {
    throw error;
  }

  return data;
}

/**
 * Sign out
 */
export async function signOut() {
  const { error } = await supabaseClient.auth.signOut();

  if (error) {
    throw error;
  }
}

/**
 * Get current session
 */
export async function getSession() {
  const { data, error } = await supabaseClient.auth.getSession();

  if (error) {
    throw error;
  }

  return data.session;
}

/**
 * Get current user
 */
export async function getCurrentUser() {
  const { data, error } = await supabaseClient.auth.getUser();

  if (error) {
    throw error;
  }

  return data.user;
}

/**
 * Subscribe to auth state changes
 */
export function onAuthStateChange(callback: (event: string, session: any) => void) {
  return supabaseClient.auth.onAuthStateChange(callback);
}

/**
 * Subscribe to realtime comments for an event
 */
export function subscribeToComments(
  eventId: string,
  callback: (payload: any) => void
) {
  return supabaseClient
    .channel(`comments:${eventId}`)
    .on(
      'postgres_changes',
      {
        event: '*',
        schema: 'public',
        table: 'comments',
        filter: `event_id=eq.${eventId}`,
      },
      callback
    )
    .subscribe();
}

/**
 * Unsubscribe from a channel
 */
export async function unsubscribe(channel: any) {
  await supabaseClient.removeChannel(channel);
}
