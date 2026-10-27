import express from 'express';
import http from 'http';
import path from 'path';
import fs from 'fs';
import { WebSocketServer, WebSocket } from 'ws';

const app = express();
app.use(express.json());

// AI Studio and Cloud Run with reverse-proxy: NGINX listens on 8080 and forwards to 3000.
// If process.env.PORT is 8080, that belongs to NGINX, so the app must bind to DEFAULT_APP_PORT (3000).
const rawPort = process.env.DEFAULT_APP_PORT || (process.env.PORT !== '8080' ? process.env.PORT : null) || '3000';
const PORT = parseInt(rawPort, 10) || 3000;

const distDir = path.resolve(import.meta.dirname, 'dist');

// Remote Control API Hub (Enables cross-device phone clickers over Wi-Fi / Cloud URL)
interface RemoteCommand {
  id: number;
  type: string;
  payload?: any;
  timestamp: number;
}

let latestStatus: any = null;
const commands: RemoteCommand[] = [];
let nextCommandId = 1;
const waitingCommandClients: Array<(cmds: RemoteCommand[]) => void> = [];

// Create shared HTTP server
const server = http.createServer(app);

// Attach WebSocket server on /ws for near-zero latency bidirectional sync
const wss = new WebSocketServer({ server, path: '/ws' });

// Function to broadcast to all WebSocket clients (excluding sender if provided)
function broadcastWs(data: object, excludeClient?: WebSocket) {
  const message = JSON.stringify(data);
  for (const client of wss.clients) {
    if (client !== excludeClient && client.readyState === WebSocket.OPEN) {
      try {
        client.send(message);
      } catch (err) {
        console.warn('Failed to send to WS client:', err);
      }
    }
  }
}

wss.on('connection', (ws: WebSocket) => {
  // Immediately push the latest teleprompter status to the newly connected phone or host
  if (latestStatus) {
    try {
      ws.send(JSON.stringify({ type: 'status', status: latestStatus }));
    } catch {}
  }

  ws.on('message', (rawMessage: string) => {
    try {
      const data = JSON.parse(rawMessage.toString());

      // 1. Command from phone remote (play, pause, speed, font, start_record, stop_record, etc.)
      if (data.type === 'command' && data.command) {
        const cmd: RemoteCommand = {
          id: nextCommandId++,
          type: data.command.type,
          payload: data.command.payload,
          timestamp: data.command.timestamp || Date.now(),
        };

        commands.push(cmd);
        if (commands.length > 50) commands.shift();

        // Broadcast immediately to all other WebSocket clients with near-zero latency (< 2ms)
        broadcastWs({ type: 'command', command: cmd }, ws);

        // Also resolve any waiting HTTP long-poll clients (if any)
        while (waitingCommandClients.length > 0) {
          const resolve = waitingCommandClients.shift();
          if (resolve) resolve([cmd]);
        }
      }
      // 2. Status broadcast from host prompter (speed, text position, isRecording, time, etc.)
      else if (data.type === 'status' && data.status) {
        latestStatus = data.status;
        broadcastWs({ type: 'status', status: latestStatus }, ws);
      }
      // 3. Request fresh state sync
      else if (data.type === 'sync_state_req') {
        if (latestStatus) {
          try {
            ws.send(JSON.stringify({ type: 'status', status: latestStatus }));
          } catch {}
        }
        // Also ask host to broadcast status
        broadcastWs(
          {
            type: 'command',
            command: { id: nextCommandId++, type: 'sync_state_req', timestamp: Date.now() },
          },
          ws
        );
      }
    } catch (err) {
      console.warn('Error handling WS message:', err);
    }
  });

  ws.on('error', (err) => {
    console.warn('WS socket error:', err);
  });
});

// Send command from phone remote via HTTP (fallback)
app.post('/api/remote/command', (req, res) => {
  const { type, payload } = req.body || {};
  if (!type) {
    return res.status(400).json({ error: 'Missing command type' });
  }

  const cmd: RemoteCommand = {
    id: nextCommandId++,
    type,
    payload,
    timestamp: Date.now(),
  };

  commands.push(cmd);
  if (commands.length > 50) commands.shift();

  // Instant broadcast via WebSocket to host (< 2ms)
  broadcastWs({ type: 'command', command: cmd });

  // Notify waiting long-poll clients
  while (waitingCommandClients.length > 0) {
    const resolve = waitingCommandClients.shift();
    if (resolve) resolve([cmd]);
  }

  res.json({ success: true, command: cmd });
});

// Prompter desktop pulls commands (long-polling with 12s timeout)
app.get('/api/remote/commands', (req, res) => {
  const since = parseInt(req.query.since as string, 10) || 0;
  const newCommands = commands.filter((c) => c.timestamp > since);
  if (newCommands.length > 0) {
    return res.json({ commands: newCommands, timestamp: Date.now() });
  }

  let responded = false;
  const timer = setTimeout(() => {
    if (!responded) {
      responded = true;
      const idx = waitingCommandClients.indexOf(handler);
      if (idx !== -1) waitingCommandClients.splice(idx, 1);
      res.json({ commands: [], timestamp: Date.now() });
    }
  }, 12000);

  const handler = (cmds: RemoteCommand[]) => {
    if (!responded) {
      responded = true;
      clearTimeout(timer);
      res.json({ commands: cmds, timestamp: Date.now() });
    }
  };

  waitingCommandClients.push(handler);
});

// Prompter broadcasts live status (playing, recording, duration, speed, font) via HTTP (fallback)
app.post('/api/remote/status', (req, res) => {
  latestStatus = req.body;
  // Instant broadcast via WebSocket (< 2ms)
  broadcastWs({ type: 'status', status: latestStatus });
  res.json({ success: true });
});

// Remote phone gets live status via HTTP
app.get('/api/remote/status', (_req, res) => {
  res.json({ status: latestStatus || null });
});

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

  server.listen(PORT, '0.0.0.0', () => {
    console.log(`Teleprompter Pro Studio running on port ${PORT} with WebSocket /ws enabled`);
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
