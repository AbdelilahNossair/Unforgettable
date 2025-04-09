// src/lib/send-demo-request.ts
import { sendDemoRequestEmail } from '../services/EmailService';

/**
 * Direct endpoint for handling demo requests
 * This file provides a handler function that can be imported by your routing system
 */
export default async function handleDemoRequest(req, res) {
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

    // Send the email
    const success = await sendDemoRequestEmail({
      eventName,
      eventDescription,
      attendeeCount,
      requesterName,
      requesterEmail,
      requesterPhone
    });

    if (success) {
      return res.status(200).json({ 
        success: true,
        message: 'Estimate request sent successfully' 
      });
    } else {
      return res.status(500).json({ 
        success: false, 
        error: 'Failed to send email' 
      });
    }
  } catch (error) {
    console.error('Error processing demo request:', error);
    return res.status(500).json({ 
      success: false, 
      error: 'Internal server error' 
    });
  }
}