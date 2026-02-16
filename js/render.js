import { generateScript } from '../services/openai';
import { generateVoiceover } from '../services/elevenlabs';
import { createShotstackRender, getShotstackStatus } from '../services/shortstack';
import { generateRunwayClips } from '../services/runway';
import { AuthService } from '../services/auth';
import { getBalance, deductCredits, hasBalance, VIDEO_PRICE } from '../services/wallet';

export async function handleRenderRoutes(request: Request, env: any): Promise<Response | null> {
  const url = new URL(request.url);
  const path = url.pathname;

  if (!path.startsWith('/api/render')) return null;

  const authService = new AuthService(env.DB);

  // Helper: Get authenticated user
  async function getAuthenticatedUser(request: Request) {
    const authHeader = request.headers.get('Authorization');
    if (!authHeader?.startsWith('Bearer ')) {
      return null;
    }
    const token = authHeader.substring(7);
    return await authService.verifySession(token);
  }

  // POST /api/render/preview (NO AUTH - Free 30-sec preview)
  if (path === '/api/render/preview' && request.method === 'POST') {
    try {
      // Safe JSON parsing
      let body: any;
      try {
        body = await request.json();
      } catch {
        return new Response(
          JSON.stringify({ error: 'Invalid JSON body' }),
          { status: 400, headers: { 'Content-Type': 'application/json' } }
        );
      }

      const {
        prompt,
        photoUrls,
        voiceId,
        photoCount,
      }: {
        prompt?: string;
        photoUrls?: string[];
        voiceId?: string;
        photoCount?: number;
      } = body;

      if (!prompt) {
        return new Response(
          JSON.stringify({ error: 'Prompt required' }),
          { status: 400, headers: { 'Content-Type': 'application/json' } }
        );
      }

      if (!voiceId) {
        return new Response(
          JSON.stringify({ error: 'Voice not cloned. Please record voice first.' }),
          { status: 400, headers: { 'Content-Type': 'application/json' } }
        );
      }

      // Generate script (short preview)
      const script = await generateScript(env, prompt, photoCount || 6);

      // Generate voiceover using cloned voice
      const audioUrl = await generateVoiceover(env, voiceId, script);

      // Generate visual clips via Runway (stub/real implementation)
      const clipUrls = await generateRunwayClips(env, script);

      // Render 30-sec preview with watermark via Shotstack
      const renderResult = await createShotstackRender(env, clipUrls, audioUrl) as any;

      return new Response(
        JSON.stringify({
          success: true,
          previewId: renderResult?.response?.id || 'preview_' + Date.now(),
          audioUrl,
          script,
          message: 'Preview generated successfully'
        }),
        { headers: { 'Content-Type': 'application/json' } }
      );
    } catch (error: any) {
      console.error('Preview render error:', error);
      return new Response(
        JSON.stringify({ error: error.message || 'Failed to render preview' }),
        { status: 500, headers: { 'Content-Type': 'application/json' } }
      );
    }
  }

  // POST /api/render/video (PROTECTED - Requires payment)
  if (path === '/api/render/video' && request.method === 'POST') {
    const user = await getAuthenticatedUser(request);

    if (!user) {
      return new Response(
        JSON.stringify({
          error: 'Please create an account to view full video',
          requiresAuth: true
        }),
        { status: 401, headers: { 'Content-Type': 'application/json' } }
      );
    }

    try {
      // Safe JSON parsing
      let body: any;
      try {
        body = await request.json();
      } catch {
        return new Response(
          JSON.stringify({ error: 'Invalid JSON body' }),
          { status: 400, headers: { 'Content-Type': 'application/json' } }
        );
      }

      const {
        prompt,
        photoCount,
      }: {
        prompt?: string;
        photoCount?: number;
      } = body;

      if (!prompt) {
        return new Response(
          JSON.stringify({ error: 'Prompt required' }),
          { status: 400, headers: { 'Content-Type': 'application/json' } }
        );
      }

      if (!user.voice_id) {
        return new Response(
          JSON.stringify({ error: 'Voice not cloned. Please upload voice first.' }),
          { status: 400, headers: { 'Content-Type': 'application/json' } }
        );
      }

      // Check wallet balance
      const balance = await getBalance(env, user.id);
      const canAfford = await hasBalance(env, user.id, VIDEO_PRICE);

      if (!canAfford) {
        return new Response(
          JSON.stringify({
            error: 'Insufficient balance',
            balance,
            required: VIDEO_PRICE,
            shortfall: VIDEO_PRICE - balance,
            needsPayment: true
          }),
          { status: 402, headers: { 'Content-Type': 'application/json' } }
        );
      }

      // Deduct credits BEFORE rendering
      const newBalance = await deductCredits(
        env,
        user.id,
        VIDEO_PRICE,
        `Full 3-min AI Film - ${prompt.substring(0, 50)}`
      );

      console.log(`✅ Charged user ${user.id} $${VIDEO_PRICE}. New balance: $${newBalance}`);

      // Generate script (full video)
      const script = await generateScript(env, prompt, photoCount || 5);

      // Generate voiceover
      const audioUrl = await generateVoiceover(env, user.voice_id, script);

      // Generate visual clips via Runway
      const clipUrls = await generateRunwayClips(env, script);

      // Render video via Shotstack
      const renderResult = await createShotstackRender(env, clipUrls, audioUrl) as any;

      const videoData = {
        id: renderResult?.response?.id || `video_${Date.now()}`,
        url: null,            // real URL comes from status endpoint when done
        status: 'rendering',
        duration: clipUrls.length * 6, // seconds, based on per-clip length
      };

      // Update user stats
      await env.DB
        .prepare('UPDATE users SET videos_created = videos_created + 1, updated_at = ? WHERE id = ?')
        .bind(Date.now(), user.id)
        .run();

      return new Response(
        JSON.stringify({
          success: true,
          video: videoData,
          newBalance,
          charged: VIDEO_PRICE,
          message: 'Full video render started'
        }),
        { headers: { 'Content-Type': 'application/json' } }
      );
    } catch (error: any) {
      console.error('Full render error:', error);

      // If render fails AFTER payment, refund the user
      if (user) {
        try {
          const { addCredits } = await import('../services/wallet');
          await addCredits(env, user.id, VIDEO_PRICE, 'Refund - Render failed');
          console.log(`✅ Refunded $${VIDEO_PRICE} to user ${user.id}`);

          return new Response(
            JSON.stringify({
              error: error.message || 'Failed to render video',
              refunded: true,
              refundAmount: VIDEO_PRICE,
              message: 'Payment has been refunded to your wallet'
            }),
            { status: 500, headers: { 'Content-Type': 'application/json' } }
          );
        } catch (refundError) {
          console.error('Refund failed:', refundError);
        }
      }

      return new Response(
        JSON.stringify({ error: error.message || 'Failed to render video' }),
        { status: 500, headers: { 'Content-Type': 'application/json' } }
      );
    }
  }

  // GET /api/render/status/:id (Check render status)
  if (path.startsWith('/api/render/status/') && request.method === 'GET') {
    try {
      const renderId = path.split('/').pop();

      if (!renderId) {
        return new Response(
          JSON.stringify({ error: 'Render ID required' }),
          { status: 400, headers: { 'Content-Type': 'application/json' } }
        );
      }

      const statusResult = await getShotstackStatus(env, renderId) as any;

      return new Response(
        JSON.stringify({
          success: true,
          status: statusResult?.response?.status || 'unknown',
          url: statusResult?.response?.url || null,
          progress: statusResult?.response?.progress || 0
        }),
        { headers: { 'Content-Type': 'application/json' } }
      );
    } catch (error: any) {
      console.error('Status check error:', error);
      return new Response(
        JSON.stringify({ error: error.message || 'Failed to check status' }),
        { status: 500, headers: { 'Content-Type': 'application/json' } }
      );
    }
  }

  return null;
}
