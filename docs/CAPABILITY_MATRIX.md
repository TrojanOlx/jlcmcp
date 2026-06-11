# JLCMCP Capability Matrix

This project extends `hyl64/jlcmcp` for local Codex control of 嘉立创EDA.

The implementation follows the official 嘉立创EDA extension API model:

- Extension APIs are JavaScript APIs exposed through the `eda` object in each extension runtime.
- API objects use names such as `dmt_Project`, `dmt_Board`, `sch_PrimitiveComponent`, and `pcb_PrimitiveVia`.
- The official EasyEDA API Skill and Run API Gateway both use a WebSocket bridge plus runtime JavaScript execution for AI tooling.

## Current Architecture

| Layer | Local path | Role |
| --- | --- | --- |
| Codex MCP server | `src/` | Registers user-facing MCP tools and sends commands to the gateway. |
| Local gateway | `local-gateway.mjs` | Routes commands between Codex and the EDA extension over WebSocket. |
| EDA extension | `jlc-bridge/` | Runs inside 嘉立创EDA and calls `eda.*` APIs. |
| Official API docs cache | `../easyeda-api-skill/` | Local reference for class docs, quick reference, and source formats. |
| Official gateway reference | `../eext-run-api-gateway/` | Reference implementation for AI-to-EDA code execution. |

## Implemented Tool Families

| Family | MCP tools | Bridge actions | Status |
| --- | --- | --- | --- |
| Connectivity | `pcb_ping`, `pcb_get_feature_support` | `ping`, `get_feature_support` | Working. |
| Developer runtime | `eda_execute_js` | `eda_execute` | Added in `jlc-bridge` v0.1.16. Executes trusted JS inside EDA runtime. |
| Project tree | `project_get_tree` | `project_get_tree` | Added in v0.1.16. Reads project, board, schematic, page, current document, split-screen info when available. |
| Document creation | `dmt_create_board`, `dmt_create_schematic`, `dmt_create_schematic_page`, `pcb_open_document` | `dmt_create_board`, `dmt_create_schematic`, `dmt_create_schematic_page`, `open_document` | Added/available. |
| Document sync/save | `pcb_import_changes`, `pcb_save_document`, `sch_save_document`, `pcb_clear_routing` | `pcb_import_changes`, `pcb_save_document`, `sch_save_document`, `pcb_clear_routing` | Added after ESP32/USB-C trial to reduce dependence on raw JS. Runtime behavior still needs validation across online/offline modes. |
| Library lookup | `lib_search_devices`, `lib_get_devices_by_lcsc` | `lib_search_devices`, `lib_get_devices_by_lcsc` | Added in v0.1.15. |
| Schematic primitives | `sch_create_component`, `sch_create_netflag`, `sch_create_netport`, `sch_create_wire`, `sch_get_state`, `sch_get_netlist`, `sch_run_drc` | matching actions | Partially implemented. |
| PCB state | `pcb_get_state`, `pcb_get_pads`, `pcb_get_tracks`, `pcb_get_net_primitives`, `pcb_get_board_info`, `pcb_screenshot` | matching actions | Implemented for inspection and screenshots. |
| PCB netlist/net tools | `pcb_get_nets`, `pcb_get_netlist`, `pcb_set_netlist`, `pcb_modify_pad_net` | matching actions | Added. `pcb_modify_pad_net` is intended for independent pad primitives; component pad support depends on EDA runtime behavior. |
| PCB editing | component move/relocate, route track, via, pours, keepouts, diff pairs, equal-length groups, silkscreen | matching actions | Implemented around common board automation workflows. |
| Calculators | impedance, trace width | local MCP only | Implemented without EDA runtime dependency. |

## Gaps To Fill Next

| Area | Official API families | Suggested additions |
| --- | --- | --- |
| Schematic editing | `SCH_Primitive*`, `SCH_Document`, `SCH_Net`, `SCH_SelectControl` | Delete/modify schematic primitives, select primitives, save document, richer net queries. |
| PCB editing | `PCB_Primitive*`, `PCB_Document`, `PCB_Layer`, `PCB_Net`, `PCB_SelectControl` | Board outline creation/editing, component-pad net sync, layer stack/rules, export/manufacturing outputs, selected primitive operations. |
| Library | `LIB_Device`, `LIB_Symbol`, `LIB_Footprint`, `LIB_LibrariesList` | Symbol/footprint search, open library documents, place symbol+footprint by selected device. |
| Project management | `DMT_Project`, `DMT_Board`, `DMT_Schematic`, `DMT_EditorControl` | Rename/delete/copy board/schematic/page, save/open workflows, multi-window awareness. |
| AI workflows | generic `eda_execute_js` plus high-level recipes | ESP32 + USB-C minimum-system generator, validated parts lookup, BOM/netlist/PCB placement pipeline. |

## Safety Notes

`eda_execute_js` is intentionally powerful. It should only be used against the user's local trusted 嘉立创EDA session. Prefer high-level MCP tools for routine actions, and use `eda_execute_js` to probe APIs or bridge capability gaps before promoting a stable action into a typed MCP tool.

## Useful Verification Commands

```bash
curl -sS http://127.0.0.1:18800/health
node tools/jlcmcp/call-bridge.mjs get_feature_support '{}'
node tools/jlcmcp/call-bridge.mjs eda_execute '{"code":"return await eda.dmt_Project.getCurrentProjectInfo();"}'
node tools/jlcmcp/call-bridge.mjs project_get_tree '{}'
node tools/jlcmcp/call-bridge.mjs pcb_import_changes '{"uuid":"<pcb-uuid>"}'
node tools/jlcmcp/call-bridge.mjs pcb_get_nets '{}'
```
