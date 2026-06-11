import { z } from 'zod';
import { BridgeClient } from '../bridge-client.js';

export function registerProjectTools(server: any, bridge: BridgeClient) {
  server.tool('project_get_tree', '读取当前工程、板子、原理图、图页和当前文档信息', {}, async () => {
    const data = await bridge.command('project_get_tree');
    return { content: [{ type: 'text' as const, text: JSON.stringify(data, null, 2) }] };
  });

  server.tool('dmt_create_board', '在当前工程创建板子', {
    schematicUuid: z.string().optional().describe('关联原理图 UUID'),
    pcbUuid: z.string().optional().describe('关联 PCB UUID'),
    boardName: z.string().optional().describe('创建后要改成的板子名称'),
  }, async ({ schematicUuid, pcbUuid, boardName }: { schematicUuid?: string; pcbUuid?: string; boardName?: string }) => {
    const params: Record<string, unknown> = {};
    if (schematicUuid) params.schematicUuid = schematicUuid;
    if (pcbUuid) params.pcbUuid = pcbUuid;
    if (boardName) params.boardName = boardName;
    const data = await bridge.command('dmt_create_board', params);
    return { content: [{ type: 'text' as const, text: JSON.stringify(data, null, 2) }] };
  });

  server.tool('dmt_create_schematic', '在当前工程创建原理图，可选创建并打开图页', {
    boardName: z.string().optional().describe('所属板子名称，不填则创建游离原理图'),
    schematicName: z.string().optional().describe('原理图名称'),
    createPage: z.boolean().optional().describe('是否同时创建图页，默认 true'),
    pageName: z.string().optional().describe('图页名称'),
    open: z.boolean().optional().describe('是否打开创建的图页或原理图，默认 true'),
  }, async ({ boardName, schematicName, createPage, pageName, open }: {
    boardName?: string; schematicName?: string; createPage?: boolean; pageName?: string; open?: boolean;
  }) => {
    const params: Record<string, unknown> = {};
    if (boardName) params.boardName = boardName;
    if (schematicName) params.schematicName = schematicName;
    if (createPage !== undefined) params.createPage = createPage;
    if (pageName) params.pageName = pageName;
    if (open !== undefined) params.open = open;
    const data = await bridge.command('dmt_create_schematic', params);
    return { content: [{ type: 'text' as const, text: JSON.stringify(data, null, 2) }] };
  });

  server.tool('dmt_create_schematic_page', '在指定原理图下创建图页', {
    schematicUuid: z.string().describe('所属原理图 UUID'),
    pageName: z.string().optional().describe('图页名称'),
    open: z.boolean().optional().describe('是否打开图页，默认 true'),
  }, async ({ schematicUuid, pageName, open }: { schematicUuid: string; pageName?: string; open?: boolean }) => {
    const params: Record<string, unknown> = { schematicUuid };
    if (pageName) params.pageName = pageName;
    if (open !== undefined) params.open = open;
    const data = await bridge.command('dmt_create_schematic_page', params);
    return { content: [{ type: 'text' as const, text: JSON.stringify(data, null, 2) }] };
  });
}
