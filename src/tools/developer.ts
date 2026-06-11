import { z } from 'zod';
import { BridgeClient } from '../bridge-client.js';

export function registerDeveloperTools(server: any, bridge: BridgeClient) {
  server.tool('eda_execute_js', '在嘉立创 EDA 扩展运行时执行受信任 JavaScript 代码', {
    code: z.string().describe('要执行的 JavaScript 代码；需要用 return 返回结果，可 await eda API'),
    params: z.any().optional().describe('传给脚本的 params 对象'),
    timeoutMs: z.number().optional().describe('超时时间，默认 30000，范围 1000-120000'),
  }, async ({ code, params, timeoutMs }: { code: string; params?: unknown; timeoutMs?: number }) => {
    const payload: Record<string, unknown> = { code };
    if (params !== undefined) payload.params = params;
    if (timeoutMs !== undefined) payload.timeoutMs = timeoutMs;
    const data = await bridge.command('eda_execute', payload);
    return { content: [{ type: 'text' as const, text: JSON.stringify(data, null, 2) }] };
  });

  server.tool('eda_introspect_api', '探测嘉立创 EDA 扩展运行时 API 方法', {
    names: z.array(z.string()).optional().describe('要探测的 eda API 对象名列表，如 pcb_Drc、pcb_Document；不填则列出可枚举对象'),
  }, async ({ names }: { names?: string[] }) => {
    const params: Record<string, unknown> = {};
    if (names !== undefined) params.names = names;
    const data = await bridge.command('eda_introspect_api', params, 120_000);
    return { content: [{ type: 'text' as const, text: JSON.stringify(data, null, 2) }] };
  });
}
