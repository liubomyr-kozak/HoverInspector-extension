import {
  IconBoxAlignBottomRight,
  IconColorPicker,
  IconLayoutDashboard,
  IconRobot,
  IconRuler,
  IconTransformFilled,
  IconCode,
  IconBrush,
  IconNotes,
  IconNotebook,
  IconRadar,
} from "@tabler/icons-react";

export const INSPECTOR = {
  id: "inspector",
  title: "Element Inspector",
  icon: IconBoxAlignBottomRight,
  activatable: true,
  multipleView: true,
};

export const RULER = {
  id: "ruler",
  title: "Page Ruler",
  icon: IconRuler,
  activatable: true,
  multipleView: false,
};

export const PICKER = {
  id: "picker",
  title: "Color Picker",
  icon: IconColorPicker,
  activatable: true,
  multipleView: true,
};

export const CONVERT_TOOLS = {
  id: "convertTools",
  title: "Unit Converter",
  icon: IconTransformFilled,
  activatable: true,
  multipleView: false,
};

export const ANALYZE_PAGE = {
  id: "analyzePage",
  title: "Color Palette & Typography",
  icon: IconBrush,
  activatable: true,
  multipleView: false,
};

export const AUTOMATION = {
  id: "automation",
  title: "Automation Scenarios",
  icon: IconRobot,
  activatable: true,
  multipleView: false,
};

export const CSS_SNAPSHOT = {
  id: "cssSnapshot",
  title: "CSS Snapshot Inspector",
  icon: IconCode,
  activatable: true,
  multipleView: false,
};

export const PAGE_NOTES = {
  id: "pageNotes",
  title: "Page Notes",
  icon: IconNotes,
  activatable: true,
  multipleView: false,
};

export const NOTE_TAKING_TOOLS = {
  id: "noteTakingTools",
  title: "Note Taking Tools",
  icon: IconNotebook,
  activatable: true,
  multipleView: false,
};

/**
 * Not a panel tool: it has no entry in POPUP_SUPPORT_TOOLS or COMPONENT_MAP. It is switched on in its own
 * settings (LiveWatch/store.ts, shared by every tab) and shows its own floating watch log.
 */
export const LIVE_WATCH = {
  id: "liveWatch",
  title: "Live Watching",
  icon: IconRadar,
  activatable: true,
  multipleView: true,
};

// Page Notes and Note Taking Tools are no longer offered (owner's request); their code stays for now
const ICON_ITEMS_INITIAL = [INSPECTOR, RULER, PICKER, CONVERT_TOOLS, ANALYZE_PAGE, AUTOMATION, CSS_SNAPSHOT, LIVE_WATCH];

export const POPUP_SUPPORT_TOOLS = [
  INSPECTOR.id,
  RULER.id,
  PICKER.id,
  CONVERT_TOOLS.id,
  ANALYZE_PAGE.id,
  AUTOMATION.id,
  CSS_SNAPSHOT.id,
];

export const ICON_ITEMS = ICON_ITEMS_INITIAL.filter((item) => item.activatable);
