import { serve } from 'https://deno.land/std@0.168.0/http/server.ts';
import { createClient } from 'npm:@supabase/supabase-js@2.39.7';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders });
  }

  try {
    const supabase = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
    );

    const { photoId } = await req.json();

    // Get photo details
    const { data: photo, error: photoError } = await supabase
      .from('photos')
      .select('*')
      .eq('id', photoId)
      .single();

    if (photoError) throw photoError;

    // Update processing status
    await supabase
      .from('photos')
      .update({ processing_started_at: new Date().toISOString() })
      .eq('id', photoId);

    // TODO: Implement actual face detection and recognition here
    // For now, we'll simulate processing
    await new Promise(resolve => setTimeout(resolve, 2000));

    // Update photo status
    await supabase
      .from('photos')
      .update({
        processed: true,
        processing_completed_at: new Date().toISOString()
      })
      .eq('id', photoId);

    return new Response(
      JSON.stringify({ success: true }),
      {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 200,
      }
    );
  } catch (error) {
    return new Response(
      JSON.stringify({ error: error.message }),
      {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 400,
      }
    );
  }
});