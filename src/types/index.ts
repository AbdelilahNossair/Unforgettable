export interface User {
  id: string;
  email: string;
  role: 'admin' | 'photographer' | 'attendee';
  created_at: string;
  updated_at: string;
}

export interface Event {
  id: string;
  name: string;
  description: string;
  date: string;
  location: string;
  qr_code: string;
  status: 'upcoming' | 'active' | 'completed' | 'archived';
  created_by: string;
  created_at: string;
  updated_at: string;
}

export interface Photo {
  id: string;
  event_id: string;
  url: string;
  uploaded_by: string;
  processed: boolean;
  faces: Face[];
  created_at: string;
}

export interface Face {
  id: string;
  photo_id: string;
  user_id: string;
  embedding: number[];
  confidence: number;
  created_at: string;
}