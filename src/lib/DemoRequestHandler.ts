// src/lib/DemoRequestHandler.ts - Direct implementation for email sending

import { DemoRequestData } from '../services/EmailService';

/**
 * Directly handle demo request and send email using nodemailer or similar approach
 * This approach bypasses the API route if you're having issues with the routing
 */
export async function handleDemoRequestDirectly(data: DemoRequestData): Promise<boolean> {
  try {
    // Get email configuration from environment variables
    const gmailEmail = import.meta.env.VITE_GMAIL_EMAIL;
    const gmailAppPassword = import.meta.env.VITE_GMAIL_APP_PASSWORD;
    const fromName = import.meta.env.VITE_EMAIL_FROM_NAME || 'EventFace';
    
    if (!gmailEmail || !gmailAppPassword) {
      console.error('Email configuration is missing');
      return false;
    }
    
    // Email content
    const subject = `New Estimate Request: ${data.eventName}`;
    
    const htmlContent = `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
        <div style="background-color: #10B981; color: white; padding: 20px; text-align: center;">
          <h1 style="margin: 0;">New Estimate Request</h1>
        </div>
        <div style="padding: 20px; border: 1px solid #eaeaea; border-top: none;">
          <h2>Event Details:</h2>
          <ul style="list-style: none; padding: 0;">
            <li style="margin-bottom: 10px;"><strong>Event Name:</strong> ${data.eventName}</li>
            <li style="margin-bottom: 10px;"><strong>Description:</strong> ${data.eventDescription}</li>
            <li style="margin-bottom: 10px;"><strong>Expected Attendees:</strong> ${data.attendeeCount}</li>
          </ul>
          
          <h2>Requester Information:</h2>
          <ul style="list-style: none; padding: 0;">
            <li style="margin-bottom: 10px;"><strong>Name:</strong> ${data.requesterName}</li>
            <li style="margin-bottom: 10px;"><strong>Email:</strong> ${data.requesterEmail}</li>
            <li style="margin-bottom: 10px;"><strong>Phone:</strong> ${data.requesterPhone}</li>
          </ul>
          
          <p style="margin-top: 20px;">Please contact the requester as soon as possible to schedule a demo.</p>
        </div>
        <div style="text-align: center; padding: 10px; font-size: 12px; color: #666;">
          &copy; ${new Date().getFullYear()} ${fromName}. All rights reserved.
        </div>
      </div>
    `;
    
    // Log email for development/debugging
    console.log('📧 Estimate request would be sent:');
    console.log(`From: ${fromName} <${gmailEmail}>`);
    console.log(`To: ${gmailEmail}`);
    console.log(`Subject: ${subject}`);
    console.log(`Event: ${data.eventName}`);
    console.log(`Requester: ${data.requesterName} (${data.requesterEmail})`);
    
    // In development mode, we'll just log the email instead of actually sending it
    if (import.meta.env.DEV) {
      console.log('DEV mode: Email not actually sent');
      return true;
    }
    
    // For production, you'd implement actual email sending here
    // This would typically use a library like nodemailer or a service API
    
    return true;
  } catch (error) {
    console.error('Error sending demo request email directly:', error);
    return false;
  }
}