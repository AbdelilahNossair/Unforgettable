// src/services/NotificationService.ts - Updated with Gmail integration

import { supabase } from '../lib/supabase';
import { sendEmail, sendEmailBatch, EmailData } from './EmailService';

interface AttendeeNotificationData {
  email: string;
  fullName: string;
  eventName: string;
  photoCount: number;
  eventId: string;
}

/**
 * Service for handling attendee notifications when photos are processed
 */
export class NotificationService {
  
  // Maximum number of emails to send in one batch
  private static readonly BATCH_SIZE = 10;
  
  // Delay between batches in milliseconds (5 seconds)
  private static readonly BATCH_DELAY = 5000;
  
  /**
   * Send email notifications to all attendees of an event when photos are processed
   */
  static async notifyAttendeesForEvent(eventId: string): Promise<boolean> {
    try {
      console.log(`Preparing to notify attendees for event: ${eventId}`);
      
      // 1. Get event details
      const { data: event, error: eventError } = await supabase
        .from('events')
        .select('id, name, status')
        .eq('id', eventId)
        .single();
      
      if (eventError || !event) {
        console.error('Error fetching event:', eventError);
        return false;
      }
      
      // Only notify if the event is completed
      if (event.status !== 'completed') {
        console.log(`Event ${eventId} is not completed yet. Status: ${event.status}`);
        return false;
      }
      
      // 2. Get all attendees for this event
      const { data: attendees, error: attendeesError } = await supabase
        .from('event_attendees')
        .select(`
          id, 
          user_id,
          notification_sent_at,
          users:user_id (
            id,
            email,
            full_name
          )
        `)
        .eq('event_id', eventId)
        .eq('registration_complete', true)
        .is('notification_sent_at', null); // Only get attendees who haven't been notified yet
      
      if (attendeesError) {
        console.error('Error fetching attendees:', attendeesError);
        return false;
      }
      
      if (!attendees || attendees.length === 0) {
        console.log(`No attendees found for event: ${eventId} (or all were already notified)`);
        return true; // No attendees to notify
      }
      
      console.log(`Found ${attendees.length} attendees to notify for event: ${eventId}`);
      
      // 3. For each attendee, get photo count and prepare notification
      const notificationsToSend: EmailData[] = [];
      const attendeeIds: string[] = [];
      
      for (const attendee of attendees) {
        if (!attendee.users?.email) continue;
        
        // Count photos where this attendee was identified
        const { count: photoCount, error: photoError } = await supabase
          .from('faces')
          .select('id', { count: 'exact', head: true })
          .eq('user_id', attendee.user_id)
          .eq('photos.event_id', eventId)
          .in('photos.processed', [true]);
        
        if (photoError) {
          console.error(`Error counting photos for attendee ${attendee.user_id}:`, photoError);
          continue;
        }
        
        // Only notify attendees who appear in at least one photo
        if (photoCount && photoCount > 0) {
          const notificationData: AttendeeNotificationData = {
            email: attendee.users.email,
            fullName: attendee.users.full_name || 'Event Attendee',
            eventName: event.name,
            photoCount: photoCount,
            eventId: eventId
          };
          
          // Create email data from notification data
          const emailData = this.createAttendeeEmailData(notificationData);
          notificationsToSend.push(emailData);
          attendeeIds.push(attendee.id);
        }
      }
      
      // 4. Send emails in batches
      if (notificationsToSend.length > 0) {
        console.log(`Sending ${notificationsToSend.length} email notifications in batches`);
        
        const result = await sendEmailBatch(
          notificationsToSend,
          this.BATCH_SIZE,
          this.BATCH_DELAY
        );
        
        console.log(`Email batch processing complete: ${result.sent}/${result.total} sent, ${result.failed} failed`);
        
        // 5. Mark attendees as notified
        if (result.sent > 0) {
          const now = new Date().toISOString();
          
          // Update notification_sent_at for all successfully notified attendees
          const { error: updateError } = await supabase
            .from('event_attendees')
            .update({ notification_sent_at: now })
            .in('id', attendeeIds)
            .eq('event_id', eventId);
          
          if (updateError) {
            console.error('Error updating notification status:', updateError);
          } else {
            console.log(`Successfully marked ${attendeeIds.length} attendees as notified`);
          }
        }
        
        return result.sent > 0;
      } else {
        console.log(`No attendees with photos to notify for event: ${eventId}`);
        return true;
      }
    } catch (error) {
      console.error('Error in notifyAttendeesForEvent:', error);
      return false;
    }
  }
  
  /**
   * Create email data for an attendee notification
   */
  private static createAttendeeEmailData(data: AttendeeNotificationData): EmailData {
    const subject = `Your photos from ${data.eventName} are ready!`;
    
    const htmlContent = `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
        <div style="background-color: #4F46E5; color: white; padding: 20px; text-align: center;">
          <h1 style="margin: 0;">EventFace</h1>
        </div>
        <div style="padding: 20px; border: 1px solid #eaeaea; border-top: none;">
          <p>Hello ${data.fullName},</p>
          <p>Great news! Your photos from <strong>${data.eventName}</strong> have been processed and are ready to view.</p>
          <p>We've identified you in <strong>${data.photoCount}</strong> photo${data.photoCount !== 1 ? 's' : ''}!</p>
          <p>You can view and download your photos by logging into your account.</p>
          <div style="margin: 25px 0; text-align: center;">
            <a href="${window.location.origin}/events/${data.eventId}/photos" 
               style="background-color: #4F46E5; color: white; padding: 12px 24px; text-decoration: none; border-radius: 4px; font-weight: bold;">
              View My Photos
            </a>
          </div>
          <p><strong>Important:</strong> These photos will be automatically deleted in 7 days, so be sure to download any photos you'd like to keep!</p>
          <p>Thank you for using EventFace!</p>
        </div>
        <div style="text-align: center; padding: 10px; font-size: 12px; color: #666;">
          &copy; ${new Date().getFullYear()} EventFace. All rights reserved.
        </div>
      </div>
    `;
    
    const textContent = `
      Hello ${data.fullName},
      
      Great news! Your photos from ${data.eventName} have been processed and are ready to view.
      
      We've identified you in ${data.photoCount} photo${data.photoCount !== 1 ? 's' : ''}!
      
      You can view and download your photos by logging into your account at:
      ${window.location.origin}/events/${data.eventId}/photos
      
      IMPORTANT: These photos will be automatically deleted in 7 days, so be sure to download any photos you'd like to keep!
      
      Thank you for using EventFace!
    `;
    
    return {
      to: data.email,
      subject,
      htmlContent,
      textContent
    };
  }
  
  /**
   * Check if an event's photo processing is complete and notify attendees if needed
   */
  static async checkEventCompletionAndNotify(eventId: string): Promise<void> {
    try {
      // Check if all photos for this event are processed
      const { count: totalPhotos, error: totalError } = await supabase
        .from('photos')
        .select('id', { count: 'exact', head: true })
        .eq('event_id', eventId);
      
      if (totalError) {
        console.error('Error counting total photos:', totalError);
        return;
      }
      
      const { count: processedPhotos, error: processedError } = await supabase
        .from('photos')
        .select('id', { count: 'exact', head: true })
        .eq('event_id', eventId)
        .eq('processed', true);
      
      if (processedError) {
        console.error('Error counting processed photos:', processedError);
        return;
      }
      
      // Check if all photographers have completed their uploads
      const { data: allDone } = await checkAllPhotographersDone(eventId);
      
      // If all photos are processed and all photographers are done, mark event as completed
      if (allDone && totalPhotos === processedPhotos && totalPhotos > 0) {
        console.log(`All photos processed for event ${eventId}. Marking as completed.`);
        
        // Update event status to completed
        const { error: updateError } = await supabase
          .from('events')
          .update({ 
            status: 'completed',
            updated_at: new Date().toISOString()
          })
          .eq('id', eventId);
        
        if (updateError) {
          console.error('Error updating event status:', updateError);
          return;
        }
        
        // Notify attendees
        await this.notifyAttendeesForEvent(eventId);
      }
    } catch (error) {
      console.error('Error in checkEventCompletionAndNotify:', error);
    }
  }
}

// Helper function to check if all photographers have completed their uploads
async function checkAllPhotographersDone(eventId: string) {
  try {
    // Get all photographers assigned to this event
    const { data: photographers, error: getError } = await supabase
      .from('event_photographers')
      .select('uploads_complete')
      .eq('event_id', eventId);
      
    if (getError) throw getError;
    
    // If no photographers assigned, consider it done
    if (!photographers || photographers.length === 0) {
      return { data: true };
    }
    
    // Check if all photographers have marked uploads as complete
    const allDone = photographers.every(p => p.uploads_complete === true);
    return { data: allDone };
  } catch (error) {
    console.error('Error checking photographer status:', error);
    throw error;
  }
}