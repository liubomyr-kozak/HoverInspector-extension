import React, { useEffect, useMemo, useRef, useState } from "react";
import { IconBrandSlack, IconDotsVertical, IconExternalLink, IconMailFilled } from "@tabler/icons-react";
import { Popover } from "antd";
import { useDispatch, useSelector } from "react-redux";
import { closestCenter, DndContext, PointerSensor, useSensor, useSensors } from "@dnd-kit/core";
import { arrayMove, rectSortingStrategy, SortableContext } from "@dnd-kit/sortable";

import { Tooltip } from "@entrypoints/shared/components/Tooltip";
import {
  onChangeLauncherActiveFeature,
  onChangeLauncherIconOrder,
} from "@entrypoints/content/store/app/saga-action/app.saga.action.ts";
import { onToggleFeatureVisibility } from "@entrypoints/content/store/app/saga-action/app.saga.action.ts";

import {
  Divider,
  FeaturesGrid,
  IconButton,
  LauncherBody,
  LauncherContainer,
  LeftColumn,
  MenuContainer,
  MenuItem,
  MenuItemText,
  MenuWrapper,
  SectionTitle,
} from "./Launcher.styled";
import { ICON_ITEMS, LIVE_WATCH, POPUP_SUPPORT_TOOLS } from "./LauncherIcons";
import SortableItem from "@entrypoints/content/modules/Launcher/SortableItem/SortableItem";
import { Logo } from "@entrypoints/shared/components/Logo/Logo";
import { McpBridgeSetting } from "./McpBridgeSetting";
import { toggleLiveWatch, useLiveWatchSettings } from "@entrypoints/content/modules/PopupContainer/LiveWatch/store";

const UsefulLinks = ({ category }: { category?: string }) => {
  const links = [
    { label: "Open Source Design", url: "https://opensourcedesign.net/" },
    { label: "Frontend Checklist", url: "https://frontendchecklist.io/" },
    { label: "Non-Commercial AI Tools", url: "https://thereisafuckingtoolforeverything.com/" },
    { label: "GitHub Trending", url: "https://github.com/trending" },
  ];

  return (
    <ul style={{ padding: "0 16px", listStyle: "none" }}>
      {links.map((link, index) => (
        <li key={index} style={{ marginBottom: 8 }}>
          <a href={link.url} target="_blank" rel="noopener noreferrer">
            🔗 {link.label}
          </a>
        </li>
      ))}
    </ul>
  );
};

const Launcher: React.FC = () => {
  const dispatch = useDispatch();
  const [menuOpen, setMenuOpen] = useState(false);
  const menuTriggerRef = useRef<HTMLButtonElement>(null);
  const menuRef = useRef<HTMLDivElement>(null);
  const { iconOrder = POPUP_SUPPORT_TOOLS, activeIcons = [] } = useSelector((state: any) => state?.app.launcher);
  const { visibleFeatures = [] } = useSelector((state: any) => state?.app);
  const liveWatch = useLiveWatchSettings();

  // A saved order from before a tool was added lacks it: the new tool goes at the end
  const normalizedIconOrder = useMemo(() => {
    const order: string[] = iconOrder.length ? iconOrder : ICON_ITEMS.map((i) => i.id);
    return [...order, ...ICON_ITEMS.map((i) => i.id).filter((id) => !order.includes(id))];
  }, [iconOrder]);

  // Live watching is on in its own settings, not in activeIcons: it keeps watching across pages and tabs
  const isToolActive = (id: string) => (id === LIVE_WATCH.id ? liveWatch.enabled : activeIcons.includes(id));

  // Function to toggle feature visibility using saga callback
  const handleToggleFeatureVisibility = (id: string) => {
    dispatch(onToggleFeatureVisibility.getPayload(id));
  };

  const toggleFeature = (id: string) => {
    const item = ICON_ITEMS.find((i) => i.id === id);
    if (!item?.activatable) return;
    if (id === LIVE_WATCH.id) {
      toggleLiveWatch();
      return;
    }

    dispatch(
      onChangeLauncherActiveFeature.getPayload({
        id: item.id,
        title: item.title,
        activatable: item.activatable,
        multipleView: item.multipleView,
        isActive: activeIcons.includes(id),
      }),
    );
  };

  // Clicking a tool in the menu opens it, and pins it to the toolbar so it can be closed again there
  const handleOpenFromMenu = (id: string) => {
    if (!visibleFeatures.includes(id)) {
      dispatch(onToggleFeatureVisibility.getPayload(id));
    }
    if (id === LIVE_WATCH.id) {
      // Opening from the menu never turns watching off; it shows the log if it was hidden
      if (!liveWatch.enabled || !liveWatch.panel.open) toggleLiveWatch();
    } else if (!activeIcons.includes(id)) {
      toggleFeature(id);
    }
    setMenuOpen(false);
  };

  // Esc closes the open menu first; marking the event handled keeps the global Esc shortcut from
  // switching the whole extension off at the same time
  useEffect(() => {
    if (!menuOpen) return;
    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key !== "Escape") return;
      event.preventDefault();
      setMenuOpen(false);
      menuTriggerRef.current?.focus();
    };
    window.addEventListener("keydown", onKeyDown, true);
    return () => window.removeEventListener("keydown", onKeyDown, true);
  }, [menuOpen]);

  // The menu renders at the end of the shadow root, far from its trigger in tab order: move focus into
  // it when it opens, so keyboard users can reach the tool list
  useEffect(() => {
    if (!menuOpen) return;
    const frame = requestAnimationFrame(() => {
      menuRef.current?.querySelector<HTMLElement>("button, a[href], [tabindex]:not([tabindex='-1'])")?.focus();
    });
    return () => cancelAnimationFrame(frame);
  }, [menuOpen]);

  // Tabbing out of the menu closes it, so it never stays open behind the focus
  const handleMenuBlur = (event: React.FocusEvent<HTMLDivElement>) => {
    const next = event.relatedTarget as Node | null;
    if (!next || menuRef.current?.contains(next) || menuTriggerRef.current?.contains(next)) return;
    setMenuOpen(false);
  };

  const sensors = useSensors(
    useSensor(PointerSensor, {
      activationConstraint: {
        distance: 5, // мінімізує випадкові перетягування
      },
    }),
  );

  const handleDragEnd = (event: any) => {
    const { active, over } = event;
    if (active.id !== over?.id) {
      const oldIndex = normalizedIconOrder.indexOf(active.id);
      const newIndex = normalizedIconOrder.indexOf(over.id);

      const reordered = arrayMove(normalizedIconOrder, oldIndex, newIndex);

      dispatch(onChangeLauncherIconOrder.getPayload(reordered as string[]));
    }
  };

  const content = (
    <MenuContainer ref={menuRef} onBlur={handleMenuBlur} role="dialog" aria-label="Tools and settings">
      <MenuWrapper>
        <LeftColumn>
          <SectionTitle>Tools</SectionTitle>
          <DndContext sensors={sensors} collisionDetection={closestCenter} onDragEnd={handleDragEnd}>
            {/*//@ts-ignore*/}
            <SortableContext items={normalizedIconOrder} strategy={rectSortingStrategy}>
              <FeaturesGrid>
                {normalizedIconOrder.map((id) => {
                  const item = ICON_ITEMS.find((i) => i.id === id);
                  if (!item) return null;
                  const isVisible = visibleFeatures.includes(id);

                  return (
                    <SortableItem
                      key={id}
                      id={id}
                      title={item.title}
                      icon={item.icon}
                      isVisible={isVisible}
                      isActive={isToolActive(id)}
                      onToggleVisibility={handleToggleFeatureVisibility}
                      onOpen={handleOpenFromMenu}
                    />
                  );
                })}
              </FeaturesGrid>
            </SortableContext>
          </DndContext>

          <Divider />

          {/* Extension-wide settings (not tied to one tool) */}
          <SectionTitle>Settings</SectionTitle>
          <McpBridgeSetting />

          <Divider />

          <MenuItem>
            <a
              target="_blank"
              href="https://liubomyr-kozak.github.io/hover-inspector/blog/"
              className="flex items-center gap-1 group"
            >
              Blog / News
              <IconExternalLink className="h-[20px] opacity-0 group-hover:opacity-100 transition-opacity duration-200 ml-auto" />
            </a>
          </MenuItem>
          <MenuItemText className="flex">
            Feedback
            <span className="flex ml-auto">
              <span className="mr-2">
                <Tooltip placement="top" title="Support / Laboratory channel on Slack">
                  <a
                    target="_blank"
                    aria-label="Support channel on Slack"
                    href="https://join.slack.com/t/browserextensionshq/shared_invite/zt-34o10eynr-Fof1vlJyx6PxpqjspCLKaw"
                  >
                    <IconBrandSlack />
                  </a>
                </Tooltip>
              </span>
              <Tooltip placement="top" title="Send feedback">
                <a target="_blank" aria-label="Send feedback" href="https://forms.gle/kaZFbYjP9zd4x6Re6">
                  <IconMailFilled />
                </a>
              </Tooltip>
            </span>
          </MenuItemText>
        </LeftColumn>
        {/*<RightColumn>*/}
        {/*    <Tabs tabPosition="left" style={{height: '100%'}}>*/}
        {/*        <TabPane tab="🔗 Resources" key="1">*/}
        {/*            <UsefulLinks/>*/}
        {/*        </TabPane>*/}
        {/*        <TabPane tab="🧪 Labs" key="2">*/}
        {/*            <UsefulLinks category="labs"/>*/}
        {/*        </TabPane>*/}
        {/*        <TabPane tab="🌍 Non-Commercial" key="3">*/}
        {/*            <UsefulLinks category="non-commercial"/>*/}
        {/*        </TabPane>*/}
        {/*    </Tabs>*/}
        {/*</RightColumn>*/}
      </MenuWrapper>
    </MenuContainer>
  );

  return (
    <LauncherContainer>
      <LauncherBody>
        <Logo />

        {normalizedIconOrder
          .filter((id) => visibleFeatures.includes(id)) // Only show visible features
          .map((id) => {
            const item = ICON_ITEMS.find((i) => i.id === id);
            if (!item) return null;

            const Icon = item.icon;
            const isActive = isToolActive(id);

            return (
              <Tooltip key={id} placement="top" title={item.title}>
                <IconButton
                  key={id}
                  $active={isActive}
                  aria-label={item.title}
                  aria-pressed={isActive}
                  onClick={() => toggleFeature(id)}
                >
                  <Icon />
                </IconButton>
              </Tooltip>
            );
          })}
        <Popover
          content={content}
          zIndex={1150}
          placement="topRight"
          // Shift the menu sideways to keep it inside narrow windows
          align={{ overflow: { adjustY: true, shiftX: true } }}
          trigger="click"
          open={menuOpen}
          onOpenChange={setMenuOpen}
          // @ts-ignore
          getPopupContainer={() => document.querySelector("hover-inspector")!.shadowRoot as HTMLElement}
        >
          <IconButton
            ref={menuTriggerRef}
            $active={false}
            aria-label="More tools and settings"
            aria-haspopup="dialog"
            aria-expanded={menuOpen}
            onClick={(e) => e.stopPropagation()}
          >
            <IconDotsVertical />
          </IconButton>
        </Popover>
      </LauncherBody>
    </LauncherContainer>
  );
};

export default Launcher;
