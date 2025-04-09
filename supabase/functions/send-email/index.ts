// supabase/functions/send-email/index.ts
import { serve } from 'https://deno.land/std@0.168.0/http/server.ts';
import { SmtpClient } from 'https://deno.land/x/smtp@v0.7.0/mod.ts';

interface EmailRequest {
  to: string;
  subject: string;
  htmlContent: string;
  textContent?: string;
}

serve(async (req) => {
  try {
    // CORS handling
    if (req.method === 'OPTIONS') {
      return new Response(null, {
        status: 204,
        headers: {
          'Access-Control-Allow-Origin': '*',
          'Access-Control-Allow-Methods': 'POST, OPTIONS',
          'Access-Control-Allow-Headers': 'Content-Type, Authorization',
          'Access-Control-Max-Age': '86400',
        },
      });
    }

    // Only allow POST method
    if (req.method !== 'POST') {
      return new Response(JSON.stringify({ error: 'Method not allowed' }), {
        status: 405,
        headers: {
          'Content-Type': 'application/json',
          'Access-Control-Allow-Origin': '*',
        },
      });
    }

    // Get environment variables
    const gmailEmail = Deno.env.get('GMAIL_EMAIL');
    const gmailAppPassword = Deno.env.get('GMAIL_APP_PASSWORD');
    const fromName = Deno.env.get('EMAIL_FROM_NAME') || 'EventFace';

    if (!gmailEmail || !gmailAppPassword) {
      console.error('Missing email configuration');
      return new Response(
        JSON.stringify({ error: 'Email service not configured' }),
        {
          status: 500,
          headers: {
            'Content-Type': 'application/json',
            'Access-Control-Allow-Origin': '*',
          },
        }
      );
    }

    // Parse request body
    const { to, subject, htmlContent, textContent } = await req.json() as EmailRequest;

    // Validate required fields
    if (!to || !subject || !htmlContent) {
      return new Response(
        JSON.stringify({ error: 'Missing required fields' }),
        {
          status: 400,
          headers: {
            'Content-Type': 'application/json',
            'Access-Control-Allow-Origin': '*',
          },
        }
      );
    }

    // Create SMTP client
    const client = new SmtpClient();

    // Connect to Gmail SMTP
    await client.connectTLS({
      hostname: 'smtp.gmail.com',
      port: 465,
      username: gmailEmail,
      password: gmailAppPassword,
    });

    // Send email
    await client.send({
      from: `${fromName} <${gmailEmail}>`,
      to: to,
      subject: subject,
      content: textContent || '',
      html: htmlContent,
    });

    // Close connection
    await client.close();

    // Return success response
    return new Response(
      JSON.stringify({ success: true, message: 'Email sent successfully' }),
      {
        status: 200,
        headers: {
          'Content-Type': 'application/json',
          'Access-Control-Allow-Origin': '*',
        },
      }
    );
  } catch (error) {
    console.error('Error sending email:', error);

    return new Response(
      JSON.stringify({ 
        error: 'Failed to send email', 
        details: error.message 
      }),
      {
        status: 500,
        headers: {
          'Content-Type': 'application/json',
          'Access-Control-Allow-Origin': '*',
        },
      }
    );
  }
});