// src/services/PhotoCleanupService.ts

import { supabase } from '../lib/supabase';

/**
 * Service for managing photo lifecycle, including scheduled deletion
 */
export class PhotoCleanupService {
  
  // Retention period in days
  private static readonly RETENTION_DAYS = 7;
  
  /**
   * Schedule a photo for deletion in 7 days
   * This sets the deletion_scheduled_at timestamp in the database
   */
  static async schedulePhotoDeletion(photoId: string): Promise<boolean> {
    try {
      // Calculate the deletion date (7 days from now)
      const deletionDate = new Date();
      deletionDate.setDate(deletionDate.getDate() + this.RETENTION_DAYS);
      
      // Update the photo record with the scheduled deletion date
      const { error } = await supabase
        .from('photos')
        .update({
          deletion_scheduled_at: deletionDate.toISOString()
        })
        .eq('id', photoId);
      
      if (error) {
        console.error(`Error scheduling photo ${photoId} for deletion:`, error);
        return false;
      }
      
      return true;
    } catch (error) {
      console.error('Error in schedulePhotoDeletion:', error);
      return false;
    }
  }
  
  /**
   * Schedule all photos for an event for deletion in 7 days
   */
  static async scheduleEventPhotosDeletion(eventId: string): Promise<boolean> {
    try {
      // Calculate the deletion date (7 days from now)
      const deletionDate = new Date();
      deletionDate.setDate(deletionDate.getDate() + this.RETENTION_DAYS);
      
      // Update all photos for this event with the scheduled deletion date
      const { error } = await supabase
        .from('photos')
        .update({
          deletion_scheduled_at: deletionDate.toISOString()
        })
        .eq('event_id', eventId)
        .eq('processed', true);
      
      if (error) {
        console.error(`Error scheduling photos for event ${eventId} for deletion:`, error);
        return false;
      }
      
      return true;
    } catch (error) {
      console.error('Error in scheduleEventPhotosDeletion:', error);
      return false;
    }
  }
  
  /**
   * Process all photos scheduled for deletion that have reached their deletion date
   * This should be run by a daily cron job or similar
   */
  static async processScheduledDeletions(): Promise<{
    success: boolean;
    deletedCount: number;
    errors: string[];
  }> {
    try {
      const now = new Date().toISOString();
      const errors: string[] = [];
      let deletedCount = 0;
      
      // Get all photos that are scheduled for deletion and past their deletion date
      const { data: photosToDelete, error: fetchError } = await supabase
        .from('photos')
        .select('id, url')
        .lt('deletion_scheduled_at', now)
        .is('deleted_at', null);
      
      if (fetchError) {
        console.error('Error fetching photos for deletion:', fetchError);
        errors.push(`Failed to fetch photos: ${fetchError.message}`);
        return { success: false, deletedCount: 0, errors };
      }
      
      if (!photosToDelete || photosToDelete.length === 0) {
        console.log('No photos to delete at this time');
        return { success: true, deletedCount: 0, errors };
      }
      
      console.log(`Found ${photosToDelete.length} photos to delete`);
      
      // Process each photo
      for (const photo of photosToDelete) {
        try {
          // 1. Delete the file from storage
          const fileKey = photo.url.split('/').pop();
          
          if (fileKey) {
            const { error: storageError } = await supabase.storage
              .from('event-photos')
              .remove([fileKey]);
            
            if (storageError) {
              console.error(`Error deleting photo file ${fileKey}:`, storageError);
              errors.push(`Failed to delete file for photo ${photo.id}: ${storageError.message}`);
            }
          }
          
          // 2. Mark the photo as deleted in the database
          const { error: updateError } = await supabase
            .from('photos')
            .update({
              deleted_at: now
            })
            .eq('id', photo.id);
          
          if (updateError) {
            console.error(`Error marking photo ${photo.id} as deleted:`, updateError);
            errors.push(`Failed to mark photo ${photo.id} as deleted: ${updateError.message}`);
          } else {
            deletedCount++;
          }
        } catch (photoError) {
          console.error(`Error processing deletion for photo ${photo.id}:`, photoError);
          errors.push(`Error processing photo ${photo.id}: ${photoError}`);
        }
      }
      
      return {
        success: errors.length === 0,
        deletedCount,
        errors
      };
    } catch (error) {
      console.error('Error in processScheduledDeletions:', error);
      return {
        success: false,
        deletedCount: 0,
        errors: [`Unexpected error: ${error}`]
      };
    }
  }
  
  /**
   * Schedule deletion and run cleanup process for an event
   * This should be called when an event is marked as completed
   */
  static async handleEventCompletion(eventId: string): Promise<boolean> {
    try {
      // Schedule all photos for deletion
      const scheduled = await this.scheduleEventPhotosDeletion(eventId);
      
      if (!scheduled) {
        console.error(`Failed to schedule photos for event ${eventId} for deletion`);
        return false;
      }
      
      console.log(`Successfully scheduled photos for event ${eventId} for deletion in ${this.RETENTION_DAYS} days`);
      return true;
    } catch (error) {
      console.error('Error in handleEventCompletion:', error);
      return false;
    }
  }
}