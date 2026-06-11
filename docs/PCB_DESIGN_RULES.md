# PCB and Schematic Design Rules for AI Workflows

This document captures practical rules used by this fork when generating or reviewing
ESP32-S3 + USB-C minimum-system designs in 嘉立创 EDA.

## Source Baseline

- EasyEDA Pro extension APIs are exposed through the runtime `eda` object. Relevant
  families include `pcb_Document`, `pcb_Drc`, `pcb_Net`, `pcb_PrimitiveLine`,
  `pcb_PrimitivePad`, `pcb_PrimitivePour`, and `pcb_PrimitiveComponent`.
- Official EasyEDA Pro API docs list `pcb_Drc` methods for rule configurations,
  net classes, differential pairs, equal-length groups, and net rules:
  https://prodocs.easyeda.com/en/api/reference/pro-api.pcb_drc.html
- Official EasyEDA Pro API docs expose AutoRouter JSON import through
  `pcb_Document.importAutoRouteJsonFile(autoRouteFile: File)`:
  https://prodocs.easyeda.com/en/api/reference/pro-api.pcb_document.importautoroutejsonfile.html
- Espressif ESP32-S3 hardware design guidelines recommend a complete ground plane,
  short power paths, proper decoupling, and correct module antenna placement:
  https://docs.espressif.com/projects/esp-hardware-design-guidelines/en/latest/esp32s3/pcb-layout-design.html

## AI PCB Workflow

1. Read project and board state before editing.
2. Read component pin coordinates, not only component centers.
3. Delete stale tracks before major placement changes.
4. Rebuild board outline around actual component coordinates.
5. Place by functional blocks:
   - USB-C connector at board edge.
   - CC pull-down resistors close to connector.
   - USB series resistors close to ESP32-S3 USB pins unless connector fanout requires otherwise.
   - Regulator and bulk caps near power entry.
   - ESP32-S3 module antenna at board edge with keepout.
6. Create net classes and constraints before routing.
7. Route short and high-priority nets first: VBUS, 3V3, USB D+/D-, EN, BOOT.
8. Add GND pour and keepouts.
9. Run DRC summary after every routing pass.
10. Do not call a PCB "finished" while any clearance or netlist errors remain.

## ESP32-S3 Layout Rules

- Prefer four layers. For two-layer prototypes, keep bottom as continuous GND as much
  as possible and minimize bottom signal routing.
- Keep the ESP32-S3 module antenna at the board edge. Do not place copper, traces,
  components, or enclosure metal in the antenna keepout region.
- Use short 3V3 paths. For ESP32-S3 power, use a main rail around 25 mil when space
  permits; keep chip power pin branches at least around 20 mil; smaller auxiliary
  branches can use around 10 mil.
- Put bulk and decoupling capacitors close to the regulator and ESP32-S3 power pins.
- Keep high-current/power paths away from the antenna area.

## USB-C and USB 2.0 Rules

- For a USB-C sink/UFP device, connect CC1 and CC2 each through an independent
  5.1 kOhm pull-down to GND.
- Do not short CC1 and CC2 together.
- Tie duplicated Type-C USB2 D+ pins together on the connector side, then route
  through the D+ series resistor; do the same for D-.
- Keep D+ and D- adjacent and similar length. Avoid unnecessary vias and stubs.
- Route D+/D- away from VBUS and switching/power nodes.
- If using ESP32-S3 native USB, map GPIO20 to D+ and GPIO19 to D- unless the selected
  module/schematic intentionally differs.

## Tooling Rules

- Use `pcb_run_drc_summary` before inspecting raw DRC. Raw DRC is large and noisy.
- Use `pcb_get_component_pins` for exact pad coordinates before routing.
- Use `pcb_delete_tracks_by_filter` for cleanup instead of `pcb_clear_routing` when
  the latter is slow or too broad.
- Use `pcb_set_board_outline_rect` after placement changes.
- Use `pcb_get_drc_rules`, `pcb_create_net_class`, `pcb_create_diff_pair`, and
  `pcb_create_equal_length` to encode constraints in the board.
- Use `eda_introspect_api` before adding new bridge capabilities, because many
  EasyEDA methods are on prototypes and are not visible through `Object.keys()`.

## Known Current Gaps

- Copper pour creation is exposed, but automatic repour/recalculation has not been
  identified in the current runtime API. If GND remains disconnected in DRC after
  creating a pour, manually repour in the editor or keep explicit GND tracks/vias.
- AutoRouter import is now exposed, but generating valid EasyEDA AutoRoute JSON still
  needs a tested file schema.
- Schematic-to-PCB netlist sync is not fully reliable yet. Treat direct PCB pad-net
  edits as a workaround, not the final source of truth.
