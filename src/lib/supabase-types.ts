export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[]

export type Database = {
  public: {
    Tables: {
      users: {
        Row: {
          id: string
          email: string
          password_hash: string
          role: 'admin' | 'photographer' | 'attendee'
          full_name: string | null
          avatar_url: string | null
          face_embedding: number[] | null
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          email: string
          password_hash: string
          role: 'admin' | 'photographer' | 'attendee'
          full_name?: string | null
          avatar_url?: string | null
          face_embedding?: number[] | null
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          email?: string
          password_hash?: string
          role?: 'admin' | 'photographer' | 'attendee'
          full_name?: string | null
          avatar_url?: string | null
          face_embedding?: number[] | null
          created_at?: string
          updated_at?: string
        }
      }
      events: {
        Row: {
          id: string
          name: string
          description: string | null
          date: string
          location: string
          qr_code: string
          status: 'upcoming' | 'active' | 'completed' | 'archived'
          created_by: string
          created_at: string
          updated_at: string
          event_time: string
          image_url: string | null
          host_type: 'company' | 'individual'
          host_name: string
          expected_attendees: number
        }
        Insert: {
          id?: string
          name: string
          description?: string | null
          date: string
          location: string
          qr_code: string
          status: 'upcoming' | 'active' | 'completed' | 'archived'
          created_by: string
          created_at?: string
          updated_at?: string
          event_time: string
          image_url?: string | null
          host_type: 'company' | 'individual'
          host_name: string
          expected_attendees: number
        }
        Update: {
          id?: string
          name?: string
          description?: string | null
          date?: string
          location?: string
          qr_code?: string
          status?: 'upcoming' | 'active' | 'completed' | 'archived'
          created_by?: string
          created_at?: string
          updated_at?: string
          event_time?: string
          image_url?: string | null
          host_type?: 'company' | 'individual'
          host_name?: string
          expected_attendees?: number
        }
      }
      photos: {
        Row: {
          id: string
          event_id: string
          url: string
          uploaded_by: string
          processed: boolean
          processing_started_at: string | null
          processing_completed_at: string | null
          created_at: string
        }
        Insert: {
          id?: string
          event_id: string
          url: string
          uploaded_by: string
          processed?: boolean
          processing_started_at?: string | null
          processing_completed_at?: string | null
          created_at?: string
        }
        Update: {
          id?: string
          event_id?: string
          url?: string
          uploaded_by?: string
          processed?: boolean
          processing_started_at?: string | null
          processing_completed_at?: string | null
          created_at?: string
        }
      }
      faces: {
        Row: {
          id: string
          photo_id: string
          user_id: string
          embedding: number[]
          confidence: number
          bbox: Json | null
          created_at: string
        }
        Insert: {
          id?: string
          photo_id: string
          user_id: string
          embedding: number[]
          confidence: number
          bbox?: Json | null
          created_at?: string
        }
        Update: {
          id?: string
          photo_id?: string
          user_id?: string
          embedding?: number[]
          confidence?: number
          bbox?: Json | null
          created_at?: string
        }
      }
      event_photographers: {
        Row: {
          id: string
          event_id: string
          photographer_id: string
          assigned_at: string
        }
        Insert: {
          id?: string
          event_id: string
          photographer_id: string
          assigned_at?: string
        }
        Update: {
          id?: string
          event_id?: string
          photographer_id?: string
          assigned_at?: string
        }
      }
      event_attendees: {
        Row: {
          id: string
          event_id: string
          user_id: string
          registration_date: string
          attendance_confirmed: boolean
          attendance_confirmed_at: string | null
        }
        Insert: {
          id?: string
          event_id: string
          user_id: string
          registration_date?: string
          attendance_confirmed?: boolean
          attendance_confirmed_at?: string | null
        }
        Update: {
          id?: string
          event_id?: string
          user_id?: string
          registration_date?: string
          attendance_confirmed?: boolean
          attendance_confirmed_at?: string | null
        }
      }
    }
  }
}