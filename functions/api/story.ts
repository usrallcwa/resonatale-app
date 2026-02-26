// functions/api/story.ts
// Cloudflare Pages Function — handles POST /api/story

interface Env {
  OPENAI_API_KEY: string;
  OPENAI_MODEL?: string;
}

// CORS helper
function corsHeaders(request: Request): Record<string, string> {
  return {
    'Access-Control-Allow-Origin': request.headers.get('Origin') || '*',
    'Access-Control-Allow-Methods': 'POST, OPTIONS',
    'Access-Control-Allow-Headers': 'Content-Type',
    'Access-Control-Max-Age': '86400',
  };
}

function jsonResponse(body: object, status: number, request: Request): Response {
  return new Response(JSON.stringify(body), {
    status,
    headers: {
      'Content-Type': 'application/json',
      ...corsHeaders(request),
    },
  });
}

// Handle OPTIONS preflight
export const onRequestOptions: PagesFunction<Env> = async ({ request }) => {
  return new Response(null, {
    status: 204,
    headers: corsHeaders(request),
  });
};

// Handle POST /api/story
export const onRequestPost: PagesFunction<Env> = async ({ request, env }) => {
  try {
    const body: any = await request.json();

    // Validate required fields
    if (!body.brief || typeof body.brief !== 'string' || body.brief.trim().length < 3) {
      return jsonResponse({ error: 'Brief is required (min 3 chars)' }, 400, request);
    }
    if (!body.mood) {
      return jsonResponse({ error: 'Mood is required' }, 400, request);
    }
    if (!body.language) {
      return jsonResponse({ error: 'Language is required' }, 400, request);
    }
    if (!body.durationMinutes || isNaN(Number(body.durationMinutes))) {
      return jsonResponse({ error: 'Duration is required' }, 400, request);
    }

    const model = env.OPENAI_MODEL || 'gpt-4.1-mini';

    const systemPrompt = `You are an expert film writer creating concise scene breakdowns for a short vertical video.
Return ONLY valid JSON, no markdown, no code fences, no extra text. Use exactly this structure:
{
  "scenes": [
    { "title": "string", "description": "string", "voiceover": "string" }
  ]
}`;

    const userPrompt = `Brief: ${body.brief.trim()}
Mood: ${body.mood}
Language: ${body.language}
Duration: ${body.durationMinutes} minutes

Write a sequence of short scenes for this film.
Each scene must have:
- title: a short scene title
- description: what happens visually (camera angles, lighting, movement)
- voiceover: the spoken narration line(s)

Match the mood precisely. Write in the specified language.`;

    // Call OpenAI
    const aiResponse = await fetch('https://api.openai.com/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${env.OPENAI_API_KEY}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model,
        messages: [
          { role: 'system', content: systemPrompt },
          { role: 'user', content: userPrompt },
        ],
        temperature: 0.4,
      }),
    });

    if (!aiResponse.ok) {
      const errText = await aiResponse.text();
      console.error('OpenAI error:', aiResponse.status, errText);
      return jsonResponse(
        { error: 'AI generation failed', detail: `OpenAI HTTP ${aiResponse.status}` },
        502,
        request
      );
    }

    const aiData: any = await aiResponse.json();
    const raw = aiData.choices?.[0]?.message?.content;

    if (!raw) {
      return jsonResponse({ error: 'Empty response from AI' }, 502, request);
    }

    // Extract JSON from response (handles code fences, extra text)
    const jsonStart = raw.indexOf('{');
    const jsonEnd = raw.lastIndexOf('}');

    if (jsonStart === -1 || jsonEnd === -1 || jsonEnd <= jsonStart) {
      console.error('Bad AI output:', raw);
      return jsonResponse({ error: 'AI returned invalid format' }, 502, request);
    }

    const parsed = JSON.parse(raw.slice(jsonStart, jsonEnd + 1));

    if (!parsed.scenes || !Array.isArray(parsed.scenes) || parsed.scenes.length === 0) {
      return jsonResponse({ error: 'AI returned no scenes' }, 502, request);
    }

    // Sanitize scenes
    const scenes = parsed.scenes.map((s: any) => ({
      title: String(s.title || 'Untitled'),
      description: String(s.description || ''),
      voiceover: String(s.voiceover || ''),
    }));

    return jsonResponse({ scenes }, 200, request);
  } catch (err: any) {
    console.error('Story generation error:', err);
    return jsonResponse(
      { error: 'Failed to generate scenes', detail: String(err?.message || err) },
      500,
      request
    );
  }
};
