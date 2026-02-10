/**
 * ResonaTale Application - Cloudflare Workers Entry Point
 * 
 * This worker handles HTTP requests at the edge for cost efficiency.
 * Simple and explicit code structure without unnecessary abstractions.
 */

export interface Env {
  // Add environment variables and bindings here as needed
  // Example: DATABASE: D1Database;
}

/**
 * Main request handler
 * Processes all incoming HTTP requests
 */
export default {
  async fetch(request: Request, env: Env, ctx: ExecutionContext): Promise<Response> {
    const url = new URL(request.url);
    
    // Simple routing based on pathname
    switch (url.pathname) {
      case '/':
        return handleHome(request);
      
      case '/health':
        return handleHealth();
      
      case '/api/status':
        return handleStatus(env);
      
      default:
        return handleNotFound(url.pathname);
    }
  },
};

/**
 * Home page handler
 */
function handleHome(request: Request): Response {
  const html = `
<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>ResonaTale</title>
  <style>
    body {
      font-family: system-ui, -apple-system, sans-serif;
      max-width: 800px;
      margin: 40px auto;
      padding: 20px;
      line-height: 1.6;
    }
    h1 { color: #2563eb; }
    .info { background: #f3f4f6; padding: 20px; border-radius: 8px; }
    code { background: #e5e7eb; padding: 2px 6px; border-radius: 4px; }
  </style>
</head>
<body>
  <h1>ResonaTale</h1>
  <div class="info">
    <p>Welcome to ResonaTale - A Cloudflare Workers application.</p>
    <p><strong>Built with:</strong></p>
    <ul>
      <li>TypeScript for type safety</li>
      <li>Cloudflare Workers for edge deployment</li>
      <li>Simple, explicit code structure</li>
      <li>Cost-efficient architecture</li>
    </ul>
    <p><strong>Available endpoints:</strong></p>
    <ul>
      <li><code>GET /</code> - This page</li>
      <li><code>GET /health</code> - Health check</li>
      <li><code>GET /api/status</code> - Application status</li>
    </ul>
  </div>
</body>
</html>`;

  return new Response(html, {
    headers: {
      'Content-Type': 'text/html; charset=utf-8',
      'Cache-Control': 'public, max-age=300', // Cache for 5 minutes for cost efficiency
    },
  });
}

/**
 * Health check endpoint
 */
function handleHealth(): Response {
  return new Response(
    JSON.stringify({
      status: 'ok',
      timestamp: new Date().toISOString(),
    }),
    {
      headers: {
        'Content-Type': 'application/json',
        'Cache-Control': 'no-cache',
      },
    }
  );
}

/**
 * Status endpoint
 */
function handleStatus(env: Env): Response {
  return new Response(
    JSON.stringify({
      application: 'ResonaTale',
      version: '1.0.0',
      environment: 'production',
      timestamp: new Date().toISOString(),
    }),
    {
      headers: {
        'Content-Type': 'application/json',
        'Cache-Control': 'public, max-age=60', // Cache for 1 minute
      },
    }
  );
}

/**
 * 404 Not Found handler
 */
function handleNotFound(pathname: string): Response {
  return new Response(
    JSON.stringify({
      error: 'Not Found',
      message: `The requested path '${pathname}' was not found`,
      timestamp: new Date().toISOString(),
    }),
    {
      status: 404,
      headers: {
        'Content-Type': 'application/json',
      },
    }
  );
}
