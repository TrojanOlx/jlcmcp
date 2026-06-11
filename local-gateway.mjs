import http from 'node:http';
import { WebSocketServer } from 'ws';

const host = process.env.JLC_GATEWAY_HOST ?? '127.0.0.1';
const port = Number(process.env.JLC_GATEWAY_PORT ?? 18800);
const path = process.env.JLC_GATEWAY_PATH ?? '/ws/bridge';

const clients = new Map();

function now() {
  return Date.now();
}

function log(message) {
  console.log(`${new Date().toISOString()} ${message}`);
}

function send(ws, data) {
  if (ws.readyState !== ws.OPEN) return;
  ws.send(JSON.stringify(data));
}

function peersByRole(role) {
  return [...clients.entries()]
    .filter(([ws, info]) => info.role === role && ws.readyState === ws.OPEN)
    .map(([ws]) => ws);
}

function errorResult(command, error) {
  return {
    type: 'result',
    id: command?.id ?? `error-${now()}`,
    timestamp: now(),
    payload: {
      commandId: command?.id,
      success: false,
      error,
      durationMs: 0,
    },
  };
}

const server = http.createServer((req, res) => {
  if (req.url === '/health') {
    const snapshot = [...clients.values()].reduce((acc, info) => {
      acc[info.role] = (acc[info.role] ?? 0) + 1;
      return acc;
    }, {});
    res.writeHead(200, { 'content-type': 'application/json' });
    res.end(JSON.stringify({ ok: true, path, clients: snapshot }));
    return;
  }

  res.writeHead(404);
  res.end('not found');
});

const wss = new WebSocketServer({ server, path });

wss.on('connection', (ws) => {
  clients.set(ws, { role: 'unknown', connectedAt: now() });
  log('client connected as unknown');

  ws.on('message', (raw) => {
    let msg;
    try {
      msg = JSON.parse(String(raw));
    } catch {
      return;
    }

    const info = clients.get(ws);
    if (!info) return;

    if (msg?.type === 'hello') {
      info.role = 'bridge';
      info.name = msg.name;
      info.version = msg.version;
      log(`bridge hello: ${info.name ?? 'unknown'} v${info.version ?? 'unknown'}`);
      send(ws, { type: 'ping', id: `ping-${now()}`, timestamp: now() });
      return;
    }

    if (msg?.type === 'command') {
      if (info.role !== 'mcp') log('client promoted to mcp after command');
      info.role = 'mcp';
      const bridge = peersByRole('bridge')[0];
      if (!bridge) {
        log(`command rejected without bridge: ${msg.payload?.action ?? msg.action ?? 'unknown'}`);
        send(ws, errorResult(msg, 'No jlc-bridge client is connected to the gateway'));
        return;
      }
      log(`forward command to bridge: ${msg.payload?.action ?? msg.action ?? 'unknown'}`);
      send(bridge, msg);
      return;
    }

    if (msg?.type === 'result' || msg?.type === 'event' || msg?.type === 'pong') {
      if (info.role === 'unknown') info.role = 'bridge';
      if (msg?.type === 'result') {
        log(`forward result to mcp: ${msg.payload?.commandId ?? msg.id ?? 'unknown'}`);
      }
      for (const peer of peersByRole('mcp')) {
        send(peer, msg);
      }
    }
  });

  ws.on('close', () => {
    const info = clients.get(ws);
    log(`client disconnected: ${info?.role ?? 'unknown'}`);
    clients.delete(ws);
  });
});

server.listen(port, host, () => {
  log(`jlceda gateway listening on ws://${host}:${port}${path}`);
  log(`health check: http://${host}:${port}/health`);
});
