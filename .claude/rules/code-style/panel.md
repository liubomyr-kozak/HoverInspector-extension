---
paths:
  - "entrypoints/content/modules/PopupContainer/**"
  - "entrypoints/content/modules/Launcher/**"
---

# Code style: the tool panel (header, body, footer)

## Header

Every tool puts its title and header actions into the shared header portal.

1. Add the tool's id to `HeaderPortalId` in
   `entrypoints/content/modules/PopupContainer/AutomationScenarios/components/ScenarioPortalHeaderButtons.tsx`.
   Use a unique string such as `MY_TOOL = "my-tool-header"`.
2. Render `PortalModalHeader` with that enum value.
3. Inside it render `FeatureTitle`, `FeatureIcon` and `FeatureTitleText`.
4. Use the tool's title from `LauncherIcons.ts` as both visible text and the title attribute.
5. Put header actions inside `PortalModalHeaderButtons`; use `IconButton` at its default 28px size,
   with 18px icons.

Imports and JSX fragment (replace `TOOL` and `MY_TOOL` with your registered tool):

```tsx
import {
  HeaderPortalId,
  PortalModalHeader,
  PortalModalHeaderButtons,
} from "@entrypoints/content/modules/PopupContainer/AutomationScenarios/components/ScenarioPortalHeaderButtons";
import { FeatureTitle, FeatureTitleText } from "@entrypoints/content/modules/PopupContainer/PopupContainer.styled";
import { FeatureIcon } from "@entrypoints/shared/components/FeatureIcon";

<PortalModalHeader portalId={HeaderPortalId.MY_TOOL}>
  <FeatureTitle>
    <FeatureIcon icon={TOOL.icon} />
    <FeatureTitleText title={TOOL.title}>{TOOL.title}</FeatureTitleText>
    <PortalModalHeaderButtons>{/* Tool action buttons */}</PortalModalHeaderButtons>
  </FeatureTitle>
</PortalModalHeader>;
```

`FeatureTitleText` handles truncation. `PortalModalHeaderButtons` supplies the class used for narrow
headers. Do not replace either with raw title text or an arbitrary wrapper.
Use `PortalModalHeader`, not its old alias `ScenarioPortalHeaderButtons`.
Set `FeatureIcon`'s `isBetta` only when the owner designates the tool as beta.

## Footer and size

Use `ScenarioPortalFooterButtons` from the sibling `ScenarioPortalFooterButtons.tsx` file for view
actions such as Save or Compare. Reuse your tool's `HeaderPortalId` value as `portalId`; never borrow
another tool's id. Leave `containerId` unset to target the shared footer. Render only when actions apply.

The panel minimum is 320 × 260px; default is 440 × 560px. Check the tool at widths 320px and 440px.
Use `min-w-0`, truncation for single-line text and wrapping rows to prevent overflow or clipped controls.
