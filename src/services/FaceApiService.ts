// src/services/FaceApiService.ts

/**
 * Service for interacting with the Python Face API backend
 */
class FaceApiService {
    private apiUrl: string;
    private supabaseUrl: string;
    private supabaseKey: string;
  
    constructor() {
      // Get API URL and remove any quotes
      const rawApiUrl = import.meta.env.VITE_FACE_API_URL || 'http://localhost:5000';
      // Clean the URL by removing any quotes
      this.apiUrl = rawApiUrl.replace(/["']/g, '');
      
      this.supabaseUrl = import.meta.env.VITE_SUPABASE_URL || '';
      this.supabaseKey = import.meta.env.VITE_SUPABASE_SERVICE_KEY || import.meta.env.VITE_SUPABASE_ANON_KEY || '';
      
      console.log('FaceApiService initialized with URL:', this.apiUrl);
    }
  
    /**
     * Check if the API is healthy and running
     */
    async checkHealth(): Promise<{ status: string; model_loaded: boolean }> {
      try {
        console.log('Checking health at:', `${this.apiUrl}/health`);
        const response = await fetch(`${this.apiUrl}/health`);
        if (!response.ok) {
          throw new Error(`API health check failed: ${response.statusText}`);
        }
        
        return await response.json();
      } catch (error) {
        console.error('Health check error:', error);
        throw error;
      }
    }
  
    /**
     * Register a face for an event attendee
     */
    async registerFace(eventCode: string, userId: string, imageFile: File): Promise<any> {
      try {
        const formData = new FormData();
        formData.append('event_code', eventCode);
        formData.append('user_id', userId);
        formData.append('supabase_url', this.supabaseUrl);
        formData.append('supabase_key', this.supabaseKey);
        formData.append('image', imageFile);
  
        const response = await fetch(`${this.apiUrl}/register-face`, {
          method: 'POST',
          body: formData,
        });
  
        if (!response.ok) {
          const errorData = await response.json();
          throw new Error(errorData.error || 'Failed to register face');
        }
  
        return await response.json();
      } catch (error) {
        console.error('Error registering face:', error);
        throw error;
      }
    }
  
    /**
     * Process a single photo to detect and recognize faces
     */
    async processPhoto(photoId: string): Promise<any> {
      try {
        const formData = new FormData();
        formData.append('photo_id', photoId);
        formData.append('supabase_url', this.supabaseUrl);
        formData.append('supabase_key', this.supabaseKey);
  
        console.log('Processing photo at:', `${this.apiUrl}/process-photo`);
        
        const response = await fetch(`${this.apiUrl}/process-photo`, {
          method: 'POST',
          body: formData,
        });
  
        if (!response.ok) {
          // Handle non-JSON responses gracefully
          const text = await response.text();
          let errorMessage = 'Failed to process photo';
          try {
            if (text) {
              const errorData = JSON.parse(text);
              errorMessage = errorData.error || errorMessage;
            }
          } catch (e) {
            errorMessage = text || `HTTP error ${response.status}`;
          }
          throw new Error(errorMessage);
        }
  
        return await response.json();
      } catch (error) {
        console.error(`Error processing photo ${photoId}:`, error);
        throw error;
      }
    }
  
    /**
     * Check if the Face API is available
     * If not, falls back to using Supabase
     */
    async isAvailable(): Promise<boolean> {
      try {
        const health = await this.checkHealth();
        return health.status === 'healthy' && health.model_loaded;
      } catch (error) {
        console.error('Face API is not available:', error);
        return false;
      }
    }
  }
  
  // Export a singleton instance
  export const faceApiService = new FaceApiService();