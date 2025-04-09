// supabase/functions/cleanup-photos/index.ts
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
    // Create Supabase client with admin privileges
    const supabase = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
    );

    const now = new Date().toISOString();
    
    // Get photos that need to be deleted
    const { data: photosToDelete, error: fetchError } = await supabase
      .from('photos')
      .select('id, url')
      .lt('deletion_scheduled_at', now)
      .is('deleted_at', null);
    
    if (fetchError) {
      throw fetchError;
    }
    
    if (!photosToDelete || photosToDelete.length === 0) {
      return new Response(
        JSON.stringify({ success: true, message: 'No photos to delete' }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }
    
    console.log(`Found ${photosToDelete.length} photos to delete`);
    
    // Track results
    const results = {
      total: photosToDelete.length,
      deleted: 0,
      errors: []
    };
    
    // Process each photo
    for (const photo of photosToDelete) {
      try {
        // 1. Delete file from storage
        const fileKey = photo.url.split('/').pop();
        
        if (fileKey) {
          const { error: storageError } = await supabase.storage
            .from('event-photos')
            .remove([fileKey]);
          
          if (storageError) {
            results.errors.push(`Failed to delete file: ${storageError.message}`);
            continue;
          }
        }
        
        // 2. Mark as deleted in database
        const { error: updateError } = await supabase
          .from('photos')
          .update({ deleted_at: now })
          .eq('id', photo.id);
        
        if (updateError) {
          results.errors.push(`Failed to update record: ${updateError.message}`);
          continue;
        }
        
        results.deleted++;
      } catch (err) {
        results.errors.push(`Error processing photo ${photo.id}: ${err.message}`);
      }
    }
    
    return new Response(
      JSON.stringify({
        success: true,
        results
      }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  } catch (error) {
    return new Response(
      JSON.stringify({ success: false, error: error.message }),
      { 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 500
      }
    );
  }
});