import express from 'express';
import path from 'path';
import fs from 'fs';

const app = express();

// AI Studio and Cloud Run with reverse-proxy: NGINX listens on 8080 and forwards to 3000.
// If process.env.PORT is 8080, that belongs to NGINX, so the app must bind to DEFAULT_APP_PORT (3000).
const rawPort = process.env.DEFAULT_APP_PORT || (process.env.PORT !== '8080' ? process.env.PORT : null) || '3000';
const PORT = parseInt(rawPort, 10) || 3000;

const distDir = path.resolve(import.meta.dirname, 'dist');

async function startServer() {
  if (fs.existsSync(distDir)) {
    // Serve production static assets from dist
    app.use(express.static(distDir));

    // Fallback for SPA client-side routing
    app.get('*', (_req, res) => {
      res.sendFile(path.resolve(distDir, 'index.html'));
    });
  } else {
    // Development fallback with Vite middleware
    const { createServer } = await import('vite');
    const vite = await createServer({
      server: { middlewareMode: true },
      appType: 'spa',
    });
    app.use(vite.middlewares);
  }

  const server = app.listen(PORT, '0.0.0.0', () => {
    console.log(`Teleprompter Pro Studio running on port ${PORT}`);
  });

  server.on('error', (err) => {
    console.error('Server error:', err);
    process.exit(1);
  });
}

startServer().catch((err) => {
  console.error('Failed to start server:', err);
  process.exit(1);
});
