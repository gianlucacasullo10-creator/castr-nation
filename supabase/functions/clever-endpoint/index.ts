import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version',
};

const GEMINI_URL = "https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent";

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
  // Handle CORS preflight
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
              text: `You are a fish identification expert. Analyze this image and identify the fish species.

IMPORTANT RULES:
1. If this is NOT a real photograph of a fish being held or displayed, respond with: {"error": "No valid fish photo detected"}
2. If you cannot clearly identify a fish species, respond with: {"error": "Could not identify fish species"}
3. If this looks like a fake, edited, or AI-generated image, respond with: {"error": "Image appears manipulated"}

If you CAN identify a real fish, respond with ONLY a JSON object in this exact format:
{"species": "Common Name", "length": estimated_length_in_inches}

Examples of valid responses:
{"species": "Largemouth Bass", "length": 18}
{"species": "Northern Pike", "length": 32}
{"species": "Walleye", "length": 22}

Respond with ONLY the JSON, no other text.`
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
    console.log('Gemini raw response:', JSON.stringify(geminiData));

    const textContent = geminiData.candidates?.[0]?.content?.parts?.[0]?.text;
    
    if (!textContent) {
      throw new Error('No response from AI model');
    }

    // Parse the JSON from Gemini's response
    let parsedResult;
    try {
      // Clean up the response - remove markdown code blocks if present
      const cleanedText = textContent.replace(/```json\n?/g, '').replace(/```\n?/g, '').trim();
      parsedResult = JSON.parse(cleanedText);
    } catch (parseError) {
      console.error('Failed to parse Gemini response:', textContent);
      throw new Error('AI response was not valid JSON');
    }

    // Check for error responses from AI
    if (parsedResult.error) {
      return new Response(
        JSON.stringify({ error: parsedResult.error }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Validate we have species
    if (!parsedResult.species) {
      throw new Error('AI did not identify a fish species');
    }

    // Calculate points based on species
    const points = getPointsForSpecies(parsedResult.species);

    const result = {
      species: parsedResult.species,
      length: parsedResult.length || null,
      points: points,
      verified: true
    };

    console.log('Final result:', result);

    return new Response(
      JSON.stringify(result),
      { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );

  } catch (error) {
    console.error('clever-endpoint error:', error);
    return new Response(
      JSON.stringify({ error: error instanceof Error ? error.message : 'Unknown error occurred' }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});
