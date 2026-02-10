# ResonaTale

A cost-efficient web application built on Cloudflare Workers and Pages using TypeScript.

## Features

- **TypeScript**: Full type safety with strict compiler options
- **Cloudflare Workers**: Edge deployment for low latency and cost efficiency
- **Simple Architecture**: Explicit code structure without unnecessary abstractions
- **Cost-Efficient**: 
  - Runs on Cloudflare's free tier (100,000 requests/day)
  - Edge caching for static responses
  - Minimal dependencies
  - Fast cold starts

## Project Structure

```
resonatale-app/
├── src/
│   └── index.ts          # Main worker entry point
├── package.json          # Project dependencies
├── tsconfig.json         # TypeScript configuration
├── wrangler.toml         # Cloudflare Workers configuration
└── README.md            # This file
```

## Getting Started

### Prerequisites

- Node.js 18 or later
- npm or pnpm

### Installation

```bash
npm install
```

### Development

Run the worker locally with hot reload:

```bash
npm run dev
```

The application will be available at `http://localhost:8787`

### Type Checking

```bash
npm run typecheck
```

### Deployment

Deploy to Cloudflare Workers:

```bash
npm run deploy
```

## API Endpoints

- `GET /` - Home page with application information
- `GET /health` - Health check endpoint
- `GET /api/status` - Application status and version

## Cost Efficiency

This application is designed to be cost-efficient:

1. **Cloudflare Workers Free Tier**: 100,000 requests per day
2. **Edge Caching**: Static responses are cached for reduced compute time
3. **Minimal Dependencies**: Only essential development dependencies
4. **No Database**: Stateless design reduces operational costs
5. **Fast Execution**: TypeScript compiled to efficient JavaScript

## Development Principles

- **Simple and Explicit**: Code is straightforward and easy to understand
- **Type Safety**: Full TypeScript with strict mode enabled
- **No Over-Engineering**: Avoiding unnecessary abstractions and complexity
- **Performance**: Optimized for edge deployment

## License

ISC
