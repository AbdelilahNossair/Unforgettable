// src/services/EmailService.ts - Updated to include demo request handling

// Email data interface
export interface EmailData {
    to: string;
    subject: string;
    htmlContent: string;
    textContent?: string;
  }
  
  // Demo request interface
  export interface DemoRequestData {
    eventName: string;
    eventDescription: string;
    attendeeCount: string;
    requesterName: string;
    requesterEmail: string;
    requesterPhone: string;
  }
  
  // Get configuration from environment variables
  const emailConfig = {
    supabaseUrl: import.meta.env.VITE_SUPABASE_URL || '',
    fromName: import.meta.env.VITE_EMAIL_FROM_NAME || 'EventFace',
    gmailEmail: import.meta.env.VITE_GMAIL_EMAIL || '',
    gmailAppPassword: import.meta.env.VITE_GMAIL_APP_PASSWORD || '',
  };
  
  /**
   * Send an email using Supabase Edge Function
   */
  export async function sendEmail(
    to: string, 
    subject: string, 
    htmlContent: string, 
    textContent?: string
  ): Promise<boolean> {
    try {
      // For development/demo purposes, just log the email
      if (import.meta.env.DEV && !emailConfig.supabaseUrl) {
        console.log('📧 Email would be sent in production:');
        console.log(`To: ${to}`);
        console.log(`Subject: ${subject}`);
        console.log(`Content: ${htmlContent.substring(0, 100)}...`);
        return true;
      }
  
      // Validate configuration
      if (!emailConfig.supabaseUrl) {
        throw new Error('Supabase URL not configured');
      }
  
      // Call the Supabase Edge Function
      const response = await fetch(`${emailConfig.supabaseUrl}/functions/v1/send-email`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          // Add authorization header if needed
          // 'Authorization': `Bearer ${supabaseKey}`
        },
        body: JSON.stringify({
          to,
          subject,
          htmlContent,
          textContent
        })
      });
  
      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to send email');
      }
  
      const result = await response.json();
      console.log('Email sent successfully:', result);
      
      return true;
    } catch (error) {
      console.error('Error sending email:', error);
      return false;
    }
  }
  
  /**
   * Send demo request email to the admin team
   */
  export async function sendDemoRequestEmail(demoData: DemoRequestData): Promise<boolean> {
    const subject = `New Estimate Request: ${demoData.eventName}`;
    
    const htmlContent = `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
        <div style="background-color: #10B981; color: white; padding: 20px; text-align: center;">
          <h1 style="margin: 0;">New Estimate Request</h1>
        </div>
        <div style="padding: 20px; border: 1px solid #eaeaea; border-top: none;">
          <h2>Event Details:</h2>
          <ul style="list-style: none; padding: 0;">
            <li style="margin-bottom: 10px;"><strong>Event Name:</strong> ${demoData.eventName}</li>
            <li style="margin-bottom: 10px;"><strong>Description:</strong> ${demoData.eventDescription}</li>
            <li style="margin-bottom: 10px;"><strong>Expected Attendees:</strong> ${demoData.attendeeCount}</li>
          </ul>
          
          <h2>Requester Information:</h2>
          <ul style="list-style: none; padding: 0;">
            <li style="margin-bottom: 10px;"><strong>Name:</strong> ${demoData.requesterName}</li>
            <li style="margin-bottom: 10px;"><strong>Email:</strong> ${demoData.requesterEmail}</li>
            <li style="margin-bottom: 10px;"><strong>Phone:</strong> ${demoData.requesterPhone}</li>
          </ul>
          
          <p style="margin-top: 20px;">Please contact the requester as soon as possible to schedule a demo.</p>
        </div>
        <div style="text-align: center; padding: 10px; font-size: 12px; color: #666;">
          &copy; ${new Date().getFullYear()} ${emailConfig.fromName}. All rights reserved.
        </div>
      </div>
    `;
    
    const textContent = `
      NEW DEMO REQUEST
      
      Event Details:
      - Event Name: ${demoData.eventName}
      - Description: ${demoData.eventDescription}
      - Expected Attendees: ${demoData.attendeeCount}
      
      Requester Information:
      - Name: ${demoData.requesterName}
      - Email: ${demoData.requesterEmail}
      - Phone: ${demoData.requesterPhone}
      
      Please contact the requester as soon as possible to schedule a demo.
    `;
    
    // Send email to the admin (using the configured Gmail address)
    return await sendEmail(
      emailConfig.gmailEmail, // Send to ourselves
      subject,
      htmlContent,
      textContent
    );
  }
  
  /**
   * Send emails in batches
   */
  export async function sendEmailBatch(
    emails: EmailData[],
    batchSize = 10,
    delayBetweenBatchesMs = 5000
  ): Promise<{
    total: number;
    sent: number;
    failed: number;
  }> {
    let sent = 0;
    let failed = 0;
    const total = emails.length;
    
    // Process in batches
    for (let i = 0; i < emails.length; i += batchSize) {
      console.log(`Processing batch ${Math.floor(i / batchSize) + 1} of ${Math.ceil(emails.length / batchSize)}`);
      
      const batch = emails.slice(i, i + batchSize);
      const batchPromises = batch.map(async (email) => {
        try {
          const success = await sendEmail(
            email.to,
            email.subject,
            email.htmlContent,
            email.textContent
          );
          
          return success;
        } catch (error) {
          console.error(`Failed to send email to ${email.to}:`, error);
          return false;
        }
      });
      
      // Wait for all emails in this batch to process
      const batchResults = await Promise.all(batchPromises);
      
      // Count successes and failures
      batchResults.forEach(success => {
        if (success) {
          sent++;
        } else {
          failed++;
        }
      });
      
      // Wait before processing next batch (if there is one)
      if (i + batchSize < emails.length) {
        console.log(`Waiting ${delayBetweenBatchesMs}ms before sending next batch...`);
        await new Promise(resolve => setTimeout(resolve, delayBetweenBatchesMs));
      }
    }
    
    console.log(`Email batch processing complete: ${sent}/${total} sent, ${failed} failed`);
    
    return {
      total,
      sent,
      failed
    };
  }
  
  /**
   * Test the email configuration
   */
  export async function testEmailConfiguration(): Promise<boolean> {
    try {
      // Get the current user's email for testing
      // This assumes you're logged in with Supabase auth
      const testEmail = prompt('Enter your email address for testing:', '');
      
      if (!testEmail) {
        console.error('No test email provided');
        return false;
      }
      
      const testResult = await sendEmail(
        testEmail,
        'EventFace Email System Test',
        `
          <h1>Email Configuration Test</h1>
          <p>This is a test email sent from the EventFace application.</p>
          <p>If you're receiving this, your email configuration is working correctly!</p>
          <p>Timestamp: ${new Date().toISOString()}</p>
        `
      );
      
      return testResult;
    } catch (error) {
      console.error('Email configuration test failed:', error);
      return false;
    }
  }