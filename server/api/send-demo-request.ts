// src/server/api/send-demo-request.ts
import express from 'express';
import nodemailer from 'nodemailer';
import dotenv from 'dotenv';

// Load environment variables
dotenv.config();

const router = express.Router();

// POST endpoint for sending demo request emails
router.post('/send-demo-request', async (req, res) => {
  try {
    const {
      eventName,
      eventDescription,
      attendeeCount,
      requesterName,
      requesterEmail,
      requesterPhone
    } = req.body;

    // Validate required fields
    if (!eventName || !eventDescription || !attendeeCount || 
        !requesterName || !requesterEmail || !requesterPhone) {
      return res.status(400).json({ 
        success: false, 
        error: 'Missing required fields' 
      });
    }

    // Get email configuration from environment variables
    const gmailEmail = process.env.VITE_GMAIL_EMAIL;
    const gmailAppPassword = process.env.VITE_GMAIL_APP_PASSWORD;
    const fromName = process.env.VITE_EMAIL_FROM_NAME || 'EventFace';
    
    if (!gmailEmail || !gmailAppPassword) {
      console.error('Email configuration is missing');
      return res.status(500).json({ 
        success: false, 
        error: 'Email service not configured' 
      });
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
    const subject = `New Estimate Request: ${eventName}`;
    
    const htmlContent = `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
        <div style="background-color: #10B981; color: white; padding: 20px; text-align: center;">
          <h1 style="margin: 0;">New Estimate Request</h1>
        </div>
        <div style="padding: 20px; border: 1px solid #eaeaea; border-top: none;">
          <h2>Event Details:</h2>
          <ul style="list-style: none; padding: 0;">
            <li style="margin-bottom: 10px;"><strong>Event Name:</strong> ${eventName}</li>
            <li style="margin-bottom: 10px;"><strong>Description:</strong> ${eventDescription}</li>
            <li style="margin-bottom: 10px;"><strong>Expected Attendees:</strong> ${attendeeCount}</li>
          </ul>
          
          <h2>Requester Information:</h2>
          <ul style="list-style: none; padding: 0;">
            <li style="margin-bottom: 10px;"><strong>Name:</strong> ${requesterName}</li>
            <li style="margin-bottom: 10px;"><strong>Email:</strong> ${requesterEmail}</li>
            <li style="margin-bottom: 10px;"><strong>Phone:</strong> ${requesterPhone}</li>
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
      - Event Name: ${eventName}
      - Description: ${eventDescription}
      - Expected Attendees: ${attendeeCount}
      
      Requester Information:
      - Name: ${requesterName}
      - Email: ${requesterEmail}
      - Phone: ${requesterPhone}
      
      Please contact the requester as soon as possible to schedule a demo.
    `;
    
    // Configure email options
    const mailOptions = {
      from: `${requesterName} <${requesterEmail}>`, // Sender is the requester
      to: gmailEmail, // Send to our Unforgettable email
      replyTo: requesterEmail, // Make replies go to the requester
      subject: subject,
      text: textContent,
      html: htmlContent
    };
    
    // Send the email
    const info = await transporter.sendMail(mailOptions);
    
    console.log('Estimate request email sent successfully:', info.messageId);
    
    return res.status(200).json({ 
      success: true,
      message: 'Estimate request sent successfully' 
    });
  } catch (error) {
    console.error('Error sending demo request email:', error);
    return res.status(500).json({ 
      success: false, 
      error: 'Failed to send email', 
      details: error.message 
    });
  }
});

export default router;