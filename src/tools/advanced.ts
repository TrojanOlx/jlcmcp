import { z } from 'zod';
import { BridgeClient } from '../bridge-client.js';

export function registerAdvancedTools(server: any, bridge: BridgeClient) {
  server.tool('pcb_create_diff_pair', '创建差分对', {
    name: z.string().describe('差分对名称'),
    posNet: z.string().describe('正极网络名'),
    negNet: z.string().describe('负极网络名'),
  }, async ({ name, posNet, negNet }: { name: string; posNet: string; negNet: string }) => {
    const data = await bridge.command('create_differential_pair', { name, posNet, negNet });
    return { content: [{ type: 'text' as const, text: JSON.stringify(data ?? { success: true }, null, 2) }] };
  });

  server.tool('pcb_list_diff_pairs', '列出所有差分对', {}, async () => {
    const data = await bridge.command('list_differential_pairs');
    return { content: [{ type: 'text' as const, text: JSON.stringify(data, null, 2) }] };
  });

  server.tool('pcb_delete_diff_pair', '删除差分对', {
    name: z.string().describe('差分对名称'),
  }, async ({ name }: { name: string }) => {
    const data = await bridge.command('delete_differential_pair', { name });
    return { content: [{ type: 'text' as const, text: JSON.stringify(data ?? { success: true }, null, 2) }] };
  });

  server.tool('pcb_create_equal_length', '创建等长组', {
    name: z.string().describe('等长组名称'),
    nets: z.array(z.string()).describe('网络名称列表'),
  }, async ({ name, nets }: { name: string; nets: string[] }) => {
    const data = await bridge.command('create_equal_length_group', { name, nets });
    return { content: [{ type: 'text' as const, text: JSON.stringify(data ?? { success: true }, null, 2) }] };
  });

  server.tool('pcb_list_equal_lengths', '列出所有等长组', {}, async () => {
    const data = await bridge.command('list_equal_length_groups');
    return { content: [{ type: 'text' as const, text: JSON.stringify(data, null, 2) }] };
  });

  server.tool('pcb_delete_equal_length', '删除等长组', {
    name: z.string().describe('等长组名称'),
  }, async ({ name }: { name: string }) => {
    const data = await bridge.command('delete_equal_length_group', { name });
    return { content: [{ type: 'text' as const, text: JSON.stringify(data ?? { success: true }, null, 2) }] };
  });

  server.tool('pcb_get_drc_rules', '读取当前 PCB DRC 规则、网络类、差分对和等长组', {}, async () => {
    const data = await bridge.command('get_drc_rules', {}, 120_000);
    return { content: [{ type: 'text' as const, text: JSON.stringify(data, null, 2) }] };
  });

  server.tool('pcb_create_net_class', '创建 PCB 网络类', {
    name: z.string().describe('网络类名称'),
    nets: z.array(z.string()).describe('网络名称列表'),
    color: z.string().optional().describe('网络类颜色，可选'),
  }, async ({ name, nets, color }: { name: string; nets: string[]; color?: string }) => {
    const params: Record<string, unknown> = { name, nets };
    if (color) params.color = color;
    const data = await bridge.command('create_net_class', params);
    return { content: [{ type: 'text' as const, text: JSON.stringify(data ?? { success: true }, null, 2) }] };
  });

  server.tool('pcb_list_net_classes', '列出 PCB 网络类', {}, async () => {
    const data = await bridge.command('list_net_classes');
    return { content: [{ type: 'text' as const, text: JSON.stringify(data, null, 2) }] };
  });
}
