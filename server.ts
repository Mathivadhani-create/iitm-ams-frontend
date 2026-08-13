import express from 'express';
import path from 'path';
import cors from 'cors';
import dotenv from 'dotenv';
import http from 'http';
import { spawn } from 'child_process';
import { createServer as createViteServer } from 'vite';

dotenv.config();

async function startServer() {
  const app = express();
  const PORT = parseInt(process.env.PORT || '3000', 10);
  const GO_PORT = process.env.GO_PORT || '9090';

  // 1. Launch Go production backend binary
  console.log(`[IITM AMS] Starting Go Production Backend on port ${GO_PORT}...`);
  const goBackend = spawn('./backend/bin/server', [], {
    env: {
      ...process.env,
      PORT: GO_PORT,
    },
    stdio: 'inherit',
  });

  goBackend.on('error', (err) => {
    console.error('[IITM AMS] Failed to start Go backend binary:', err);
  });

  goBackend.on('exit', (code) => {
    if (code !== 0) {
      console.warn(`[IITM AMS] Go backend binary exited with code ${code}`);
    }
  });

  // Global Middlewares
  const corsOrigin = process.env.CORS_ORIGIN || '*';
  app.use(cors({ origin: corsOrigin, credentials: true }));

  // 2. Reverse Proxy ALL /api/* requests directly to Go Production Backend (running Gorilla Mux)
  app.use('/api', (req, res) => {
    const targetPath = '/api' + (req.url === '/' ? '' : req.url);
    const options: http.RequestOptions = {
      hostname: '127.0.0.1',
      port: parseInt(GO_PORT, 10),
      path: targetPath,
      method: req.method,
      headers: {
        ...req.headers,
        host: `127.0.0.1:${GO_PORT}`,
      },
    };

    const proxyReq = http.request(options, (proxyRes) => {
      res.writeHead(proxyRes.statusCode || 500, proxyRes.headers);
      proxyRes.pipe(res, { end: true });
    });

    proxyReq.on('error', (err) => {
      console.error(`[Proxy Error] Failed to reach Go backend on port ${GO_PORT}:`, err.message);
      res.status(502).json({
        success: false,
        error: 'Go Production Backend Service Unavailable.',
      });
    });

    req.pipe(proxyReq, { end: true });
  });

  // Express body parsing for non-API routes if needed
  app.use(express.json());
  app.use(express.urlencoded({ extended: true }));

  // 3. Vite middleware for development or static serving for production
  if (process.env.NODE_ENV !== 'production') {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: 'spa',
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), 'dist');
    app.use(express.static(distPath));
    app.get('*', (req, res) => {
      res.sendFile(path.join(distPath, 'index.html'));
    });
  }

  app.listen(PORT, '0.0.0.0', () => {
    console.log(`[IITM AMS Frontend Gateway] Running on http://0.0.0.0:${PORT}`);
  });
}

startServer().catch((err) => {
  console.error('[IITM AMS Server] Failed to start server:', err);
  process.exit(1);
});
