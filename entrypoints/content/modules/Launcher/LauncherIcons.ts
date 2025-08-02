import {
  IconBoxAlignBottomRight,
  IconColorPicker,
  IconLayoutDashboard,
  IconRobot,
  IconRuler,
  IconTransformFilled,
  IconCode,
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
  title: "Convert tools",
  icon: IconTransformFilled,
  activatable: true,
  multipleView: false,
};

export const ANALYZE_PAGE = {
  id: "analyzePage",
  title: "Analyze Page UI",
  icon: IconLayoutDashboard,
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

const ICON_ITEMS_INITIAL = [INSPECTOR, RULER, PICKER, CONVERT_TOOLS, ANALYZE_PAGE, AUTOMATION, CSS_SNAPSHOT];

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
