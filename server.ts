/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 *
 * Local development server — imports the shared Express app from server/app.ts
 * and adds Vite dev middleware + static file serving.
 */

import express from 'express';
import path from 'path';
import { createServer as createViteServer } from 'vite';
import { createApp } from './server/app';

const PORT = 3000;

async function startServer() {
  const app = await createApp();

  // Vite middleware setup for dynamic development compilation
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
    console.log(`Server launched successfully on port ${PORT}`);
  });
}

startServer();
