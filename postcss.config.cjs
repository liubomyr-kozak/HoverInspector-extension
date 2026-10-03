/**
 * The extension UI lives in a shadow root on someone else's page, where `rem` means the *page's* root
 * font size. Sites with `html { font-size: 62.5% }` (or 20px) would shrink or blow up every Tailwind
 * spacing and text size in our panels, so rem values are turned into px (1rem = 16px) at build time.
 */
const REM_IN_VALUE = /(-?\d*\.?\d+)rem\b/g;

const remToPx = () => ({
  postcssPlugin: "hover-inspector-rem-to-px",
  Declaration(decl) {
    if (!decl.value.includes("rem") || decl.value.includes("url(")) return;
    decl.value = decl.value.replace(REM_IN_VALUE, (_, num) => `${parseFloat((parseFloat(num) * 16).toFixed(4))}px`);
  },
});
remToPx.postcss = true;

module.exports = {
  plugins: [require("tailwindcss"), require("autoprefixer"), remToPx()],
};
