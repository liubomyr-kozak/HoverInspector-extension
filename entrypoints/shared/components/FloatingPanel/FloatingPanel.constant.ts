// Base visual tokens
const HANDLE_COLOR = "#3b82f6"; // tailwind blue-500
const HANDLE_TRANSITION = "opacity 0.2s ease-in-out";

// Helper to build shared style object
const circular = (pos: Partial<CSSStyleDeclaration>) => ({
  width: "20px",
  height: "20px",
  backgroundColor: HANDLE_COLOR,
  border: "2px solid white",
  borderRadius: "50%",
  zIndex: 1000,
  opacity: 0,
  transition: HANDLE_TRANSITION,
  ...pos,
});

const bar = (pos: Partial<CSSStyleDeclaration>) => ({
  backgroundColor: HANDLE_COLOR,
  border: "1px solid white",
  borderRadius: "5px",
  zIndex: 1000,
  opacity: 0,
  transition: HANDLE_TRANSITION,
  ...pos,
});

// Export with loose typing to satisfy react-rnd expectations without verbose per-key style typing.
export const RESIZE_HANDLE_STYLES: any = {
  topLeft: circular({ left: "-10px", top: "-10px" }),
  topRight: circular({ right: "-10px", top: "-10px" }),
  bottomLeft: circular({ left: "-10px", bottom: "-10px" }),
  bottomRight: circular({ right: "-10px", bottom: "-10px" }),
  top: bar({ width: "85%", height: "10px", left: "50%", transform: "translateX(-50%)", top: "-5px" }),
  right: bar({ width: "10px", height: "85%", right: "-5px", top: "50%", transform: "translateY(-50%)" }),
  bottom: bar({ width: "85%", height: "10px", left: "50%", transform: "translateX(-50%)", bottom: "-5px" }),
  left: bar({ width: "10px", height: "85%", left: "-5px", top: "50%", transform: "translateY(-50%)" }),
};

export type ResizeHandleStyles = typeof RESIZE_HANDLE_STYLES;
