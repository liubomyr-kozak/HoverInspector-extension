import type { Breakpoint, FrameworkBreakpoints } from "../types";

/** Builds the ranges from each breakpoint's start, so a range always ends 1px before the next one starts */
const fromStarts = (starts: Array<[name: string, min: number]>): Breakpoint[] =>
  starts.map(([name, min], index) => {
    const next = starts[index + 1];
    return next ? { name, min, max: next[1] - 1 } : { name, min };
  });

/** Default breakpoints of popular CSS frameworks and design systems (current major versions) */
export const FRAMEWORK_BREAKPOINTS: FrameworkBreakpoints[] = [
  {
    id: "bootstrap",
    name: "Bootstrap 5",
    source: "https://getbootstrap.com/docs/5.3/layout/breakpoints/",
    breakpoints: fromStarts([
      ["xs", 0],
      ["sm", 576],
      ["md", 768],
      ["lg", 992],
      ["xl", 1200],
      ["xxl", 1400],
    ]),
  },
  {
    id: "tailwind",
    name: "Tailwind CSS",
    source: "https://tailwindcss.com/docs/responsive-design",
    breakpoints: fromStarts([
      ["base", 0],
      ["sm", 640],
      ["md", 768],
      ["lg", 1024],
      ["xl", 1280],
      ["2xl", 1536],
    ]),
  },
  {
    id: "material-ui",
    name: "Material UI",
    source: "https://mui.com/material-ui/customization/breakpoints/",
    breakpoints: fromStarts([
      ["xs", 0],
      ["sm", 600],
      ["md", 900],
      ["lg", 1200],
      ["xl", 1536],
    ]),
  },
  {
    id: "material-3",
    name: "Material Design 3",
    source: "https://m3.material.io/foundations/layout/applying-layout/window-size-classes",
    breakpoints: fromStarts([
      ["compact", 0],
      ["medium", 600],
      ["expanded", 840],
      ["large", 1200],
      ["extra-large", 1600],
    ]),
  },
  {
    id: "antd",
    name: "Ant Design",
    source: "https://ant.design/components/grid#col",
    breakpoints: fromStarts([
      ["xs", 0],
      ["sm", 576],
      ["md", 768],
      ["lg", 992],
      ["xl", 1200],
      ["xxl", 1600],
    ]),
  },
  {
    id: "chakra",
    name: "Chakra UI",
    source: "https://v2.chakra-ui.com/docs/styled-system/responsive-styles",
    breakpoints: fromStarts([
      ["base", 0],
      ["sm", 480],
      ["md", 768],
      ["lg", 992],
      ["xl", 1280],
      ["2xl", 1536],
    ]),
  },
  {
    id: "vuetify",
    name: "Vuetify 3",
    source: "https://vuetifyjs.com/en/features/display-and-platform/",
    breakpoints: fromStarts([
      ["xs", 0],
      ["sm", 600],
      ["md", 960],
      ["lg", 1280],
      ["xl", 1920],
      ["xxl", 2560],
    ]),
  },
  {
    id: "foundation",
    name: "Foundation 6",
    source: "https://get.foundation/sites/docs/media-queries.html",
    breakpoints: fromStarts([
      ["small", 0],
      ["medium", 640],
      ["large", 1024],
      ["xlarge", 1200],
      ["xxlarge", 1440],
    ]),
  },
];
