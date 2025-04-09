// supabase/functions/process-photo/index.ts
import { serve } from 'https://deno.land/std@0.168.0/http/server.ts';
import { createClient } from 'npm:@supabase/supabase-js@2.39.7';
import { InsightFace } from 'npm:@vladmandic/insightface@1.0.0';

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
      .select('*, events(id)')
      .eq('id', photoId)
      .single();

    if (photoError) throw photoError;

    // Update processing status
    await supabase
      .from('photos')
      .update({ 
        processing_started_at: new Date().toISOString() 
      })
      .eq('id', photoId);

    // Initialize InsightFace
    const model = new InsightFace({
      modelPath: './models',
      minConfidence: 0.5,
    });
    await model.load();

    // Download photo for processing
    const photoUrl = photo.url;
    const response = await fetch(photoUrl);
    const imageBuffer = await response.arrayBuffer();

    // Detect faces in the photo
    const detectedFaces = await model.detect(imageBuffer);

    // Get attendees for this event who have face embeddings
    const { data: attendees, error: attendeesError } = await supabase
      .from('event_attendees')
      .select(`
        user_id,
        users:user_id (
          id, 
          face_embedding
        )
      `)
      .eq('event_id', photo.events.id)
      .eq('registration_complete', true)
      .not('users.face_embedding', 'is', null);

    if (attendeesError) throw attendeesError;

    // Process each detected face
    const faceRecords = [];
    for (const face of detectedFaces) {
      // Skip faces with low confidence
      if (face.confidence < 0.5) continue;

      // Compare with registered attendees
      let bestMatch = null;
      let highestSimilarity = 0;

      for (const attendee of attendees) {
        if (!attendee.users?.face_embedding) continue;
        
        // Calculate similarity between detected face and attendee's face embedding
        const similarity = calculateCosineSimilarity(
          face.embedding,
          attendee.users.face_embedding
        );

        if (similarity > highestSimilarity && similarity > 0.7) { // Threshold for recognition
          highestSimilarity = similarity;
          bestMatch = attendee.users.id;
        }
      }

      // Create face record with the matched user (or null if no match)
      faceRecords.push({
        photo_id: photoId,
        user_id: bestMatch,
        embedding: face.embedding,
        confidence: face.confidence,
        bbox: {
          x: face.box[0],
          y: face.box[1],
          width: face.box[2],
          height: face.box[3]
        }
      });
    }

    // Insert face records
    if (faceRecords.length > 0) {
      const { error: facesError } = await supabase
        .from('faces')
        .insert(faceRecords);

      if (facesError) throw facesError;
    }

    // Update photo status
    await supabase
      .from('photos')
      .update({
        processed: true,
        processing_completed_at: new Date().toISOString()
      })
      .eq('id', photoId);

    return new Response(
      JSON.stringify({ 
        success: true, 
        facesDetected: faceRecords.length,
        facesRecognized: faceRecords.filter(f => f.user_id !== null).length
      }),
      {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 200,
      }
    );
  } catch (error) {
    console.error('Error processing photo:', error);
    return new Response(
      JSON.stringify({ error: error.message }),
      {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 400,
      }
    );
  }
});

// Helper function to calculate cosine similarity between face embeddings
function calculateCosineSimilarity(embedding1: number[], embedding2: number[]): number {
  if (!embedding1 || !embedding2 || embedding1.length !== embedding2.length) {
    return 0;
  }
  
  let dotProduct = 0;
  let norm1 = 0;
  let norm2 = 0;
  
  for (let i = 0; i < embedding1.length; i++) {
    dotProduct += embedding1[i] * embedding2[i];
    norm1 += embedding1[i] * embedding1[i];
    norm2 += embedding2[i] * embedding2[i];
  }
  
  return dotProduct / (Math.sqrt(norm1) * Math.sqrt(norm2));
}