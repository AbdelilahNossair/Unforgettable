import Cookies from 'js-cookie';
import { supabase } from './supabase';
import { toast } from 'sonner';

const SESSION_COOKIE = 'user_session';

export interface AuthUser {
  id: string;
  email: string;
  role: 'admin' | 'photographer' | 'attendee';
}

export async function signUp(email: string, password: string, fullName: string, role: 'admin' | 'photographer' | 'attendee' = 'attendee'): Promise<AuthUser> {
  try {
    // Create user in the users table
    const { data: user, error: userError } = await supabase
      .from('users')
      .insert([
        { 
          email, 
          password_hash: password, 
          role,
          full_name: fullName 
        }
      ])
      .select()
      .single();

    if (userError) throw userError;

    const sessionUser: AuthUser = {
      id: user.id,
      email: user.email,
      role: user.role,
    };

    Cookies.set(SESSION_COOKIE, JSON.stringify(sessionUser), { expires: 7 });
    return sessionUser;
  } catch (error) {
    console.error('Signup error:', error);
    throw new Error(error instanceof Error ? error.message : 'Error during signup');
  }
}

export async function signIn(email: string, password: string): Promise<AuthUser> {
  try {
    const { data: user, error } = await supabase
      .from('users')
      .select('*')
      .eq('email', email)
      .single();

    if (error || !user) {
      throw new Error('Invalid email or password');
    }

    if (user.password_hash !== password) {
      throw new Error('Invalid email or password');
    }

    const sessionUser: AuthUser = {
      id: user.id,
      email: user.email,
      role: user.role,
    };

    Cookies.set(SESSION_COOKIE, JSON.stringify(sessionUser), { expires: 7 });
    return sessionUser;
  } catch (error) {
    console.error('Login error:', error);
    throw error instanceof Error ? error : new Error('Authentication failed');
  }
}

export function signOut(): void {
  try {
    Cookies.remove(SESSION_COOKIE);
    toast.success('Signed out successfully');
  } catch (error) {
    console.error('Error during sign out:', error);
    toast.error('Failed to sign out');
  }
}

export function getCurrentUser(): AuthUser | null {
  const sessionData = Cookies.get(SESSION_COOKIE);
  if (!sessionData) return null;

  try {
    return JSON.parse(sessionData) as AuthUser;
  } catch {
    return null;
  }
}