import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version',
};

// FIXED: Changed v1beta to v1 for stability
const GEMINI_URL = "https://generativelanguage.googleapis.com/v1/models/gemini-1.5-flash:generateContent";

const FISH_POINTS: Record<string, number> = {
  "largemouth bass": 75,
  "smallmouth bass": 85,
  "spotted bass": 70,
  "northern pike": 100,
  "muskellunge": 150,
  "muskie": 150,
  "walleye": 90,
  "rainbow trout": 60,
  "brown trout": 65,
  "brook trout": 55,
  "lake trout": 80,
  "bluegill": 25,
  "pumpkinseed": 25,
  "crappie": 35,
  "channel catfish": 50,
  "blue catfish": 60,
  "flathead catfish": 70,
  "yellow perch": 30,
  "common carp": 40,
  "striped bass": 95,
  "bullhead": 20,
};

function getPointsForSpecies(species: string): number {
  const normalized = species.toLowerCase().trim();
  for (const [key, points] of Object.entries(FISH_POINTS)) {
    if (normalized.includes(key) || key.includes(normalized)) {
      return points;
    }
  }
  return 25; // Default points for unrecognized species
}

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const GOOGLE_API_KEY = Deno.env.get('OPENAI_API_KEY');
    if (!GOOGLE_API_KEY) {
      throw new Error('OPENAI_API_KEY (Google API Key) is not configured');
    }

    const { image } = await req.json();
    
    if (!image) {
      return new Response(
        JSON.stringify({ error: 'No image provided' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    console.log('Processing fish image with Gemini 1.5 Flash...');

    const geminiResponse = await fetch(`${GEMINI_URL}?key=${GOOGLE_API_KEY}`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        contents: [{
          parts: [
            {
              text: `You are a fish identification expert. Analyze this image and identify the fish species. Respond with ONLY a JSON object: {"species": "Common Name", "length": estimated_length_in_inches}`
            },
            {
              inline_data: {
                mime_type: "image/jpeg",
                data: image
              }
            }
          ]
        }],
        generationConfig: {
          temperature: 0.1,
          maxOutputTokens: 256
        }
      })
    });

    if (!geminiResponse.ok) {
      const errorText = await geminiResponse.text();
      console.error('Gemini API error:', geminiResponse.status, errorText);
      throw new Error(`Gemini API error: ${geminiResponse.status}`);
    }

    const geminiData = await geminiResponse.json();
    const textContent = geminiData.candidates?.[0]?.content?.parts?.[0]?.text;
    
    if (!textContent) {
      throw new Error('No response from AI model');
    }

    const cleanedText = textContent.replace(/```json\n?/g, '').replace(/```\n?/g, '').trim();
    const parsedResult = JSON.parse(cleanedText);

    if (parsedResult.error) {
      return new Response(
        JSON.stringify({ error: parsedResult.error }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const points = getPointsForSpecies(parsedResult.species);

    const result = {
      species: parsedResult.species,
      length: parsedResult.length || null,
      points: points,
      verified: true
    };

    return new Response(
      JSON.stringify(result),
      { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );

  } catch (error) {
    console.error('clever-endpoint error:', error);
    return new Response(
      JSON.stringify({ error: error instanceof Error ? error.message : 'Unknown error' }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});
