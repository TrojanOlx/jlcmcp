import { randomUUID } from 'node:crypto';
import WebSocket from 'ws';

const [, , action, paramsJson = '{}'] = process.argv;
if (!action) {
  console.error('usage: node call-bridge.mjs <action> [params-json]');
  process.exit(2);
}

let params;
try {
  params = JSON.parse(paramsJson);
} catch (error) {
  console.error(`invalid params json: ${error.message}`);
  process.exit(2);
}

const url = process.env.GATEWAY_WS_URL ?? 'ws://127.0.0.1:18800/ws/bridge';
const commandId = randomUUID();
const ws = new WebSocket(url);

const timeout = setTimeout(() => {
  console.error(`timed out waiting for ${action}`);
  ws.close();
  process.exit(1);
}, Number(process.env.BRIDGE_CALL_TIMEOUT_MS ?? 60000));

ws.on('open', () => {
  ws.send(JSON.stringify({
    type: 'command',
    id: commandId,
    timestamp: Date.now(),
    payload: { action, params },
  }));
});

ws.on('message', (raw) => {
  let msg;
  try {
    msg = JSON.parse(String(raw));
  } catch {
    return;
  }
  if (msg?.type !== 'result' || msg?.payload?.commandId !== commandId) return;
  clearTimeout(timeout);
  console.log(JSON.stringify(msg.payload, null, 2));
  ws.close();
  process.exit(msg.payload.success ? 0 : 1);
});

ws.on('error', (error) => {
  clearTimeout(timeout);
  console.error(error.message);
  process.exit(1);
});
