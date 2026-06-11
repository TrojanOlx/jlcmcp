import { z } from 'zod';
import { BridgeClient } from '../bridge-client.js';

export function registerSchematicTools(server: any, bridge: BridgeClient) {
  server.tool('lib_search_devices', '搜索嘉立创 EDA 器件库', {
    key: z.string().describe('搜索关键字，如 ESP32-S3-WROOM 或 USB-C'),
    libraryUuid: z.string().optional().describe('库 UUID，可选；不填使用系统库'),
    itemsOfPage: z.number().optional().describe('返回数量，默认 10，最大 50'),
    page: z.number().optional().describe('页码，默认 1'),
  }, async ({ key, libraryUuid, itemsOfPage, page }: { key: string; libraryUuid?: string; itemsOfPage?: number; page?: number }) => {
    const params: Record<string, unknown> = { key };
    if (libraryUuid) params.libraryUuid = libraryUuid;
    if (itemsOfPage !== undefined) params.itemsOfPage = itemsOfPage;
    if (page !== undefined) params.page = page;
    const data = await bridge.command('lib_search_devices', params);
    return { content: [{ type: 'text' as const, text: JSON.stringify(data, null, 2) }] };
  });

  server.tool('lib_get_devices_by_lcsc', '按立创 C 编号搜索器件', {
    lcscIds: z.union([z.string(), z.array(z.string())]).describe('立创 C 编号，字符串或字符串数组'),
    libraryUuid: z.string().optional().describe('库 UUID，可选'),
    allowMultiMatch: z.boolean().optional().describe('是否允许多匹配'),
  }, async ({ lcscIds, libraryUuid, allowMultiMatch }: { lcscIds: string | string[]; libraryUuid?: string; allowMultiMatch?: boolean }) => {
    const params: Record<string, unknown> = { lcscIds };
    if (libraryUuid) params.libraryUuid = libraryUuid;
    if (allowMultiMatch !== undefined) params.allowMultiMatch = allowMultiMatch;
    const data = await bridge.command('lib_get_devices_by_lcsc', params);
    return { content: [{ type: 'text' as const, text: JSON.stringify(data, null, 2) }] };
  });

  server.tool('sch_get_state', '读取原理图状态', {}, async () => {
    const data = await bridge.command('get_schematic_state');
    return { content: [{ type: 'text' as const, text: JSON.stringify(data, null, 2) }] };
  });

  server.tool('sch_get_netlist', '导出网表', {
    type: z.string().optional().describe('网表格式'),
  }, async ({ type }: { type?: string }) => {
    const params: Record<string, unknown> = {};
    if (type) params.type = type;
    const data = await bridge.command('get_netlist', params);
    return { content: [{ type: 'text' as const, text: JSON.stringify(data, null, 2) }] };
  });

  server.tool('sch_run_drc', '运行原理图 DRC', {
    strict: z.boolean().optional().describe('是否严格模式'),
  }, async ({ strict }: { strict?: boolean }) => {
    const params: Record<string, unknown> = {};
    if (strict !== undefined) params.strict = strict;
    const data = await bridge.command('run_sch_drc', params);
    return { content: [{ type: 'text' as const, text: JSON.stringify(data, null, 2) }] };
  });

  server.tool('pcb_open_document', '切换到指定文档（原理图或 PCB）', {
    uuid: z.string().describe('文档 UUID'),
  }, async ({ uuid }: { uuid: string }) => {
    const data = await bridge.command('open_document', { uuid });
    return { content: [{ type: 'text' as const, text: JSON.stringify(data ?? { success: true }, null, 2) }] };
  });

  server.tool('sch_create_component', '在当前原理图放置器件', {
    libraryUuid: z.string().describe('器件库 UUID'),
    componentUuid: z.string().describe('器件 UUID'),
    x: z.number().describe('X 坐标'),
    y: z.number().describe('Y 坐标'),
    designator: z.string().optional().describe('位号，如 U1'),
    name: z.string().optional().describe('名称/值'),
    rotation: z.number().optional().describe('旋转角度'),
    addIntoPcb: z.boolean().optional().describe('是否加入 PCB，默认 true'),
  }, async ({ libraryUuid, componentUuid, x, y, designator, name, rotation, addIntoPcb }: {
    libraryUuid: string; componentUuid: string; x: number; y: number; designator?: string; name?: string; rotation?: number; addIntoPcb?: boolean;
  }) => {
    const params: Record<string, unknown> = {
      component: { libraryUuid, uuid: componentUuid },
      x, y,
    };
    if (designator) params.designator = designator;
    if (name) params.name = name;
    if (rotation !== undefined) params.rotation = rotation;
    if (addIntoPcb !== undefined) params.addIntoPcb = addIntoPcb;
    const data = await bridge.command('sch_create_component', params);
    return { content: [{ type: 'text' as const, text: JSON.stringify(data, null, 2) }] };
  });

  server.tool('sch_create_netflag', '在当前原理图创建电源/地网络标识', {
    net: z.string().describe('网络名，如 3V3、GND、VBUS'),
    x: z.number().describe('X 坐标'),
    y: z.number().describe('Y 坐标'),
    identification: z.enum(['Power', 'Ground', 'AnalogGround', 'ProtectGround']).optional().describe('标识类型'),
    rotation: z.number().optional().describe('旋转角度'),
  }, async ({ net, x, y, identification, rotation }: {
    net: string; x: number; y: number; identification?: 'Power' | 'Ground' | 'AnalogGround' | 'ProtectGround'; rotation?: number;
  }) => {
    const params: Record<string, unknown> = { net, x, y };
    if (identification) params.identification = identification;
    if (rotation !== undefined) params.rotation = rotation;
    const data = await bridge.command('sch_create_netflag', params);
    return { content: [{ type: 'text' as const, text: JSON.stringify(data, null, 2) }] };
  });

  server.tool('sch_create_netport', '在当前原理图创建网络端口', {
    net: z.string().describe('网络名，如 USB_DP、USB_DN、EN'),
    x: z.number().describe('X 坐标'),
    y: z.number().describe('Y 坐标'),
    direction: z.enum(['IN', 'OUT', 'BI']).optional().describe('端口方向，默认 BI'),
    rotation: z.number().optional().describe('旋转角度'),
  }, async ({ net, x, y, direction, rotation }: {
    net: string; x: number; y: number; direction?: 'IN' | 'OUT' | 'BI'; rotation?: number;
  }) => {
    const params: Record<string, unknown> = { net, x, y };
    if (direction) params.direction = direction;
    if (rotation !== undefined) params.rotation = rotation;
    const data = await bridge.command('sch_create_netport', params);
    return { content: [{ type: 'text' as const, text: JSON.stringify(data, null, 2) }] };
  });

  server.tool('sch_create_wire', '在当前原理图创建导线', {
    line: z.union([z.array(z.number()), z.array(z.array(z.number()))]).describe('导线坐标，如 [x1,y1,x2,y2]'),
    net: z.string().optional().describe('网络名'),
    lineWidth: z.number().optional().describe('线宽 1-10'),
  }, async ({ line, net, lineWidth }: { line: number[] | number[][]; net?: string; lineWidth?: number }) => {
    const params: Record<string, unknown> = { line };
    if (net) params.net = net;
    if (lineWidth !== undefined) params.lineWidth = lineWidth;
    const data = await bridge.command('sch_create_wire', params);
    return { content: [{ type: 'text' as const, text: JSON.stringify(data, null, 2) }] };
  });
}
