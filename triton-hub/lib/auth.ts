import { supabase } from "./supabase";

/**
 * Check if the user is authenticated
 * @returns Promise<boolean> - true if authenticated, false otherwise
 */
export async function isAuthenticated(): Promise<boolean> {
  try {
    const { data: { session } } = await supabase.auth.getSession();
    return !!session;
  } catch (error) {
    console.error("Error checking authentication:", error);
    return false;
  }
}

/**
 * Get the current user
 * @returns Promise<User | null> - the current user or null
 */
export async function getCurrentUser() {
  try {
    const { data: { user } } = await supabase.auth.getUser();
    return user;
  } catch (error) {
    console.error("Error getting current user:", error);
    return null;
  }
}

/**
 * Sign out the current user
 */
export async function signOut() {
  try {
    await supabase.auth.signOut();
  } catch (error) {
    console.error("Error signing out:", error);
  }
}
