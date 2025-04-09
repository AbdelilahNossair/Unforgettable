// supabase/functions/send-email/index.ts
import { serve } from 'https://deno.land/std@0.168.0/http/server.ts';
import { SmtpClient } from "https://deno.land/x/smtp@v0.7.0/mod.ts";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

serve(async (req) => {
  // Handle CORS preflight request
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders });
  }

  try {
    // Get email data from request
    const { to, subject, htmlContent, textContent } = await req.json();

    // Validate inputs
    if (!to || !subject || !htmlContent) {
      return new Response(
        JSON.stringify({ success: false, error: 'Missing required fields' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Get configuration from environment variables
    const smtpConfig = {
      hostname: Deno.env.get('SMTP_HOST') || 'smtp.gmail.com',
      port: parseInt(Deno.env.get('SMTP_PORT') || '587'),
      username: Deno.env.get('GMAIL_EMAIL') || '',
      password: Deno.env.get('GMAIL_APP_PASSWORD') || '',
    };

    const fromName = Deno.env.get('EMAIL_FROM_NAME') || 'EventFace';
    const fromEmail = smtpConfig.username;

    // Validate SMTP configuration
    if (!smtpConfig.username || !smtpConfig.password) {
      return new Response(
        JSON.stringify({ success: false, error: 'Email configuration not set' }),
        { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Create SMTP client
    const client = new SmtpClient();

    // Connect to SMTP server
    await client.connectTLS({
      hostname: smtpConfig.hostname,
      port: smtpConfig.port,
      username: smtpConfig.username,
      password: smtpConfig.password,
    });

    // Send email
    await client.send({
      from: `${fromName} <${fromEmail}>`,
      to: to,
      subject: subject,
      content: textContent || htmlContent.replace(/<[^>]*>/g, ''),
      html: htmlContent,
    });

    // Close the connection
    await client.close();

    // Return success response
    return new Response(
      JSON.stringify({ success: true, message: 'Email sent successfully' }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  } catch (error) {
    console.error('Error sending email:', error);
    
    return new Response(
      JSON.stringify({ success: false, error: error.message }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});