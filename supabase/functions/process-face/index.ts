import { createClient } from 'npm:@supabase/supabase-js@2.39.7';
import { InsightFace } from 'npm:@vladmandic/insightface@1.0.0';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders });
  }

  try {
    const { imageUrl, userId, supabaseUrl, supabaseKey } = await req.json();

    if (!imageUrl || !userId || !supabaseUrl || !supabaseKey) {
      throw new Error('Missing required parameters');
    }

    // Create Supabase client with provided credentials
    const supabase = createClient(supabaseUrl, supabaseKey);

    // Initialize InsightFace
    const model = new InsightFace({
      modelPath: './models',
      minConfidence: 0.5,
    });
    await model.load();

    // Download image using Supabase storage client
    const { data: imageData, error: downloadError } = await supabase.storage
      .from('face-images')
      .download(imageUrl.split('/').pop());

    if (downloadError) {
      throw new Error(`Failed to download image: ${downloadError.message}`);
    }

    // Convert image data to ArrayBuffer
    const buffer = await imageData.arrayBuffer();
    
    // Get face embedding
    const faces = await model.detect(buffer);
    
    if (faces.length === 0) {
      throw new Error('No face detected in the image');
    }

    if (faces.length > 1) {
      throw new Error('Multiple faces detected. Please provide an image with a single face');
    }

    const embedding = faces[0].embedding;

    return new Response(
      JSON.stringify({ embedding }),
      {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 200,
      }
    );
  } catch (error) {
    console.error('Process face error:', error);
    return new Response(
      JSON.stringify({ error: error.message }),
      {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 400,
      }
    );
  }
});