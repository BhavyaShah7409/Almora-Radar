import { createClient } from '@supabase/supabase-js';

if (!process.env.SUPABASE_URL) {
  throw new Error('Missing SUPABASE_URL environment variable');
}

if (!process.env.SUPABASE_SERVICE_KEY) {
  throw new Error('Missing SUPABASE_SERVICE_KEY environment variable');
}

/**
 * Server-side Supabase client with service role key
 * Use this for admin operations and server-side logic
 * DO NOT expose this client to the browser
 */
export const supabaseServer = createClient(
  process.env.SUPABASE_URL,
  process.env.SUPABASE_SERVICE_KEY,
  {
    auth: {
      autoRefreshToken: false,
      persistSession: false,
    },
  }
);

/**
 * Get user by ID (server-side)
 */
export async function getUserById(userId: string) {
  const { data, error } = await supabaseServer
    .from('users')
    .select('*')
    .eq('id', userId)
    .single();

  if (error) {
    console.error('Error fetching user:', error);
    return null;
  }

  return data;
}

/**
 * Get user preferences (server-side)
 */
export async function getUserPreferences(userId: string) {
  const { data, error } = await supabaseServer
    .from('preferences')
    .select('*')
    .eq('user_id', userId)
    .single();

  if (error) {
    console.error('Error fetching preferences:', error);
    return null;
  }

  return data;
}

/**
 * Update user preferences (server-side)
 */
export async function updateUserPreferences(
  userId: string,
  preferences: {
    language?: string;
    categories?: string[];
    location_text?: string;
    location_coords?: { lat: number; lng: number };
    notifications_enabled?: boolean;
    fcm_token?: string;
  }
) {
  const { data, error } = await supabaseServer
    .from('preferences')
    .update({
      ...preferences,
      updated_at: new Date().toISOString(),
    })
    .eq('user_id', userId)
    .select()
    .single();

  if (error) {
    console.error('Error updating preferences:', error);
    throw error;
  }

  return data;
}

/**
 * Get comments for an event (server-side)
 */
export async function getEventComments(eventId: string) {
  const { data, error } = await supabaseServer
    .from('comments')
    .select(`
      *,
      users (
        name
      )
    `)
    .eq('event_id', eventId)
    .order('timestamp', { ascending: false });

  if (error) {
    console.error('Error fetching comments:', error);
    return [];
  }

  return data;
}

/**
 * Create a comment (server-side)
 */
export async function createComment(
  eventId: string,
  userId: string,
  commentText: string
) {
  const { data, error } = await supabaseServer
    .from('comments')
    .insert({
      event_id: eventId,
      user_id: userId,
      comment_text: commentText,
    })
    .select(`
      *,
      users (
        name
      )
    `)
    .single();

  if (error) {
    console.error('Error creating comment:', error);
    throw error;
  }

  return data;
}

/**
 * Delete a comment (server-side)
 */
export async function deleteComment(commentId: string, userId: string) {
  // First verify the user owns the comment
  const { data: comment } = await supabaseServer
    .from('comments')
    .select('user_id')
    .eq('id', commentId)
    .single();

  if (!comment || comment.user_id !== userId) {
    throw new Error('Unauthorized to delete this comment');
  }

  const { error } = await supabaseServer
    .from('comments')
    .delete()
    .eq('id', commentId);

  if (error) {
    console.error('Error deleting comment:', error);
    throw error;
  }

  return true;
}

/**
 * Delete comments by event ID (server-side)
 * Used during cleanup when events are deleted
 */
export async function deleteCommentsByEventId(eventId: string) {
  const { error } = await supabaseServer
    .from('comments')
    .delete()
    .eq('event_id', eventId);

  if (error) {
    console.error('Error deleting comments for event:', error);
    throw error;
  }

  return true;
}

/**
 * Get total user count (server-side)
 */
export async function getTotalUserCount() {
  const { count, error } = await supabaseServer
    .from('users')
    .select('*', { count: 'exact', head: true });

  if (error) {
    console.error('Error getting user count:', error);
    return 0;
  }

  return count || 0;
}

/**
 * Get users with notification preferences (server-side)
 * Used for sending push notifications
 */
export async function getUsersForNotifications(category: string) {
  const { data, error } = await supabaseServer
    .from('preferences')
    .select('*')
    .eq('notifications_enabled', true)
    .contains('categories', [category])
    .not('fcm_token', 'is', null);

  if (error) {
    console.error('Error fetching users for notifications:', error);
    return [];
  }

  return data;
}
