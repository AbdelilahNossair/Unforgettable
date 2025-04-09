// src/lib/EmailSender.ts
import nodemailer from 'nodemailer';
import { DemoRequestData } from '../services/EmailService';

/**
 * Email sender using Nodemailer to send actual emails
 */
export async function sendDemoRequestEmail(data: DemoRequestData): Promise<boolean> {
  try {
    // Get email configuration from environment variables
    const gmailEmail = import.meta.env.VITE_GMAIL_EMAIL;
    const gmailAppPassword = import.meta.env.VITE_GMAIL_APP_PASSWORD;
    const fromName = import.meta.env.VITE_EMAIL_FROM_NAME || 'EventFace';
    
    if (!gmailEmail || !gmailAppPassword) {
      console.error('Email configuration is missing');
      return false;
    }
    
    // Create email transport using Gmail
    const transporter = nodemailer.createTransport({
      service: 'gmail',
      auth: {
        user: gmailEmail,
        pass: gmailAppPassword
      }
    });
    
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
    
    const textContent = `
      NEW DEMO REQUEST
      
      Event Details:
      - Event Name: ${data.eventName}
      - Description: ${data.eventDescription}
      - Expected Attendees: ${data.attendeeCount}
      
      Requester Information:
      - Name: ${data.requesterName}
      - Email: ${data.requesterEmail}
      - Phone: ${data.requesterPhone}
      
      Please contact the requester as soon as possible to schedule a demo.
    `;
    
    // Configure email options
    const mailOptions = {
      from: `${data.requesterName} <${data.requesterEmail}>`, // Sender is the requester
      to: gmailEmail, // Send to our Unforgettable email
      replyTo: data.requesterEmail, // Make replies go to the requester
      subject: subject,
      text: textContent,
      html: htmlContent
    };
    
    // Send the email
    const info = await transporter.sendMail(mailOptions);
    
    console.log('Estimate request email sent successfully:', info.messageId);
    return true;
  } catch (error) {
    console.error('Error sending demo request email:', error);
    return false;
  }
}