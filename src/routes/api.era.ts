import { createFileRoute } from '@tanstack/react-router';

export const Route = createFileRoute('/api/era')({
  server: {
    handlers: {
      GET: async ({ request }) => (await import('@/lib/era/api.server')).handleEraGet(request),
      POST: async ({ request }) => (await import('@/lib/era/api.server')).handleEraPost(request),
    },
  },
});
