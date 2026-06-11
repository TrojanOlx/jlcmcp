import { z } from 'zod';
import { BridgeClient } from '../bridge-client.js';

export function registerPcbDocumentTools(server: any, bridge: BridgeClient) {
  server.tool('pcb_import_changes', '从原理图导入变更到 PCB（同步网表/器件变更）', {
    uuid: z.string().optional().describe('PCB 文档 UUID；不填则使用当前 PCB 文档'),
  }, async ({ uuid }: { uuid?: string }) => {
    const params: Record<string, unknown> = {};
    if (uuid) params.uuid = uuid;
    const data = await bridge.command('pcb_import_changes', params, 120_000);
    return { content: [{ type: 'text' as const, text: JSON.stringify(data, null, 2) }] };
  });

  server.tool('pcb_save_document', '保存 PCB 文档', {
    uuid: z.string().optional().describe('PCB 文档 UUID；不填则保存当前 PCB 文档'),
  }, async ({ uuid }: { uuid?: string }) => {
    const params: Record<string, unknown> = {};
    if (uuid) params.uuid = uuid;
    const data = await bridge.command('pcb_save_document', params);
    return { content: [{ type: 'text' as const, text: JSON.stringify(data, null, 2) }] };
  });

  server.tool('sch_save_document', '保存当前原理图文档', {}, async () => {
    const data = await bridge.command('sch_save_document');
    return { content: [{ type: 'text' as const, text: JSON.stringify(data, null, 2) }] };
  });

  server.tool('pcb_clear_routing', '清除 PCB 走线', {
    uuid: z.string().optional().describe('PCB 文档 UUID；不填则使用当前 PCB 文档'),
  }, async ({ uuid }: { uuid?: string }) => {
    const params: Record<string, unknown> = {};
    if (uuid) params.uuid = uuid;
    const data = await bridge.command('pcb_clear_routing', params, 120_000);
    return { content: [{ type: 'text' as const, text: JSON.stringify(data, null, 2) }] };
  });

  server.tool('pcb_get_nets', '读取 PCB 网络列表', {
    includePrimitives: z.boolean().optional().describe('是否同时读取每个网络关联的图元'),
    primitiveTypes: z.array(z.string()).optional().describe('读取关联图元时过滤图元类型'),
  }, async ({ includePrimitives, primitiveTypes }: { includePrimitives?: boolean; primitiveTypes?: string[] }) => {
    const params: Record<string, unknown> = {};
    if (includePrimitives !== undefined) params.includePrimitives = includePrimitives;
    if (primitiveTypes !== undefined) params.primitiveTypes = primitiveTypes;
    const data = await bridge.command('pcb_get_nets', params, includePrimitives ? 120_000 : undefined);
    return { content: [{ type: 'text' as const, text: JSON.stringify(data, null, 2) }] };
  });

  server.tool('pcb_get_netlist', '读取 PCB 网表文本', {
    type: z.string().optional().describe('网表类型；不填使用嘉立创 EDA 默认类型'),
  }, async ({ type }: { type?: string }) => {
    const params: Record<string, unknown> = {};
    if (type) params.type = type;
    const data = await bridge.command('pcb_get_netlist', params, 120_000);
    return { content: [{ type: 'text' as const, text: JSON.stringify(data, null, 2) }] };
  });

  server.tool('pcb_set_netlist', '写入 PCB 网表文本', {
    netlist: z.string().describe('网表文本'),
    type: z.string().optional().describe('网表类型；不填使用嘉立创 EDA 默认类型'),
  }, async ({ netlist, type }: { netlist: string; type?: string }) => {
    const params: Record<string, unknown> = { netlist };
    if (type) params.type = type;
    const data = await bridge.command('pcb_set_netlist', params, 120_000);
    return { content: [{ type: 'text' as const, text: JSON.stringify(data, null, 2) }] };
  });

  server.tool('pcb_modify_pad_net', '修改独立 PCB 焊盘网络', {
    primitiveId: z.string().describe('焊盘图元 ID'),
    net: z.string().optional().describe('目标网络名；空值表示清空网络'),
  }, async ({ primitiveId, net }: { primitiveId: string; net?: string }) => {
    const params: Record<string, unknown> = { primitiveId };
    if (net !== undefined) params.net = net;
    const data = await bridge.command('pcb_modify_pad_net', params);
    return { content: [{ type: 'text' as const, text: JSON.stringify(data, null, 2) }] };
  });

  server.tool('pcb_get_component_pins', '读取 PCB 元件焊盘坐标和网络', {
    designator: z.string().optional().describe('元件位号；不填则读取全部元件'),
    includeEmptyNets: z.boolean().optional().describe('是否返回空网络焊盘，默认 true'),
  }, async ({ designator, includeEmptyNets }: { designator?: string; includeEmptyNets?: boolean }) => {
    const params: Record<string, unknown> = {};
    if (designator !== undefined) params.designator = designator;
    if (includeEmptyNets !== undefined) params.includeEmptyNets = includeEmptyNets;
    const data = await bridge.command('pcb_get_component_pins', params, 120_000);
    return { content: [{ type: 'text' as const, text: JSON.stringify(data, null, 2) }] };
  });

  server.tool('pcb_assign_pad_nets_by_designator', '按元件位号批量修改 PCB 焊盘网络', {
    designator: z.string().describe('元件位号，如 U1、J1'),
    assignments: z.array(z.object({
      primitiveId: z.string().optional().describe('焊盘图元 ID；优先使用'),
      pinIndex: z.number().int().nonnegative().optional().describe('0 基焊盘序号'),
      padIndex: z.number().int().positive().optional().describe('1 基焊盘序号'),
      net: z.string().optional().describe('目标网络名；空值表示清空网络'),
    })).describe('焊盘网络修改列表'),
  }, async ({ designator, assignments }: {
    designator: string;
    assignments: { primitiveId?: string; pinIndex?: number; padIndex?: number; net?: string }[];
  }) => {
    const data = await bridge.command('pcb_assign_pad_nets_by_designator', { designator, assignments }, 120_000);
    return { content: [{ type: 'text' as const, text: JSON.stringify(data, null, 2) }] };
  });
}
