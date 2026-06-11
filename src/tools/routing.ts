import { z } from 'zod';
import { BridgeClient } from '../bridge-client.js';

export function registerRoutingTools(server: any, bridge: BridgeClient) {
  server.tool('pcb_route_track', '画走线', {
    net: z.string().describe('网络名称'),
    points: z.array(z.object({ x: z.number(), y: z.number() })).describe('走线路径点 (mil)'),
    layer: z.number().describe('层号 (1=顶层, 2=底层)'),
    width: z.number().describe('线宽 (mil)'),
  }, async ({ net, points, layer, width }: { net: string; points: { x: number; y: number }[]; layer: number; width: number }) => {
    const data = await bridge.command('route_track', { net, points, layer, width });
    return { content: [{ type: 'text' as const, text: JSON.stringify(data ?? { success: true }, null, 2) }] };
  });

  server.tool('pcb_set_board_outline_rect', '重建矩形板框', {
    x1: z.number().describe('矩形角点 X1 (mil)'),
    y1: z.number().describe('矩形角点 Y1 (mil)'),
    x2: z.number().describe('矩形角点 X2 (mil)'),
    y2: z.number().describe('矩形角点 Y2 (mil)'),
  }, async ({ x1, y1, x2, y2 }: { x1: number; y1: number; x2: number; y2: number }) => {
    const data = await bridge.command('set_board_outline_rect', { x1, y1, x2, y2 });
    return { content: [{ type: 'text' as const, text: JSON.stringify(data ?? { success: true }, null, 2) }] };
  });

  server.tool('pcb_create_via', '创建过孔', {
    net: z.string().describe('网络名称'),
    x: z.number().describe('X 坐标 (mil)'),
    y: z.number().describe('Y 坐标 (mil)'),
    drill: z.number().describe('钻孔直径 (mil)'),
    diameter: z.number().describe('过孔外径 (mil)'),
  }, async ({ net, x, y, drill, diameter }: { net: string; x: number; y: number; drill: number; diameter: number }) => {
    const data = await bridge.command('create_via', { net, x, y, drill, diameter });
    return { content: [{ type: 'text' as const, text: JSON.stringify(data ?? { success: true }, null, 2) }] };
  });

  server.tool('pcb_delete_tracks', '删除走线', {
    primitiveIds: z.array(z.string()).describe('走线图元 ID 列表'),
  }, async ({ primitiveIds }: { primitiveIds: string[] }) => {
    const data = await bridge.command('delete_tracks', { primitiveIds });
    return { content: [{ type: 'text' as const, text: JSON.stringify(data ?? { success: true }, null, 2) }] };
  });

  server.tool('pcb_delete_tracks_by_filter', '按网络/层过滤删除走线', {
    net: z.string().optional().describe('网络名称；不填则不过滤网络'),
    layer: z.number().optional().describe('层号；不填则不过滤层'),
    includeBoardOutline: z.boolean().optional().describe('是否允许删除板框层走线，默认 false'),
    includeNoNet: z.boolean().optional().describe('是否允许删除空网络走线，默认 false'),
  }, async ({ net, layer, includeBoardOutline, includeNoNet }: {
    net?: string; layer?: number; includeBoardOutline?: boolean; includeNoNet?: boolean;
  }) => {
    const params: Record<string, unknown> = {};
    if (net !== undefined) params.net = net;
    if (layer !== undefined) params.layer = layer;
    if (includeBoardOutline !== undefined) params.includeBoardOutline = includeBoardOutline;
    if (includeNoNet !== undefined) params.includeNoNet = includeNoNet;
    const data = await bridge.command('delete_tracks_by_filter', params, 120_000);
    return { content: [{ type: 'text' as const, text: JSON.stringify(data ?? { success: true }, null, 2) }] };
  });

  server.tool('pcb_delete_via', '删除过孔', {
    primitiveIds: z.array(z.string()).describe('过孔图元 ID 列表'),
  }, async ({ primitiveIds }: { primitiveIds: string[] }) => {
    const data = await bridge.command('delete_via', { primitiveIds });
    return { content: [{ type: 'text' as const, text: JSON.stringify(data ?? { success: true }, null, 2) }] };
  });
}
