import React, { useEffect, useMemo, useState } from "react";
import { IconBrandSlack, IconDotsVertical, IconExternalLink, IconMailFilled } from "@tabler/icons-react";
import { Popover } from "antd";
import { useDispatch, useSelector } from "react-redux";
import { closestCenter, DndContext, PointerSensor, useSensor, useSensors } from "@dnd-kit/core";
import { arrayMove, SortableContext, verticalListSortingStrategy } from "@dnd-kit/sortable";

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
import { ICON_ITEMS, POPUP_SUPPORT_TOOLS } from "./LauncherIcons";
import SortableItem from "@entrypoints/content/modules/Launcher/SortableItem/SortableItem";
import { Logo } from "@entrypoints/shared/components/Logo/Logo";

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
  const { iconOrder = POPUP_SUPPORT_TOOLS, activeIcons = [] } = useSelector((state: any) => state?.app.launcher);
  const { visibleFeatures = [] } = useSelector((state: any) => state?.app);

  const normalizedIconOrder = useMemo(() => {
    return iconOrder.length ? iconOrder : ICON_ITEMS.map((i) => i.id);
  }, [iconOrder]);

  // Function to toggle feature visibility using saga callback
  const handleToggleFeatureVisibility = (id: string) => {
    dispatch(onToggleFeatureVisibility.getPayload(id));
  };

  const toggleFeature = (id: string) => {
    const item = ICON_ITEMS.find((i) => i.id === id);
    if (!item?.activatable) return;

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
    if (!activeIcons.includes(id)) {
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
    };
    window.addEventListener("keydown", onKeyDown, true);
    return () => window.removeEventListener("keydown", onKeyDown, true);
  }, [menuOpen]);

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
    <MenuContainer>
      <MenuWrapper>
        <LeftColumn>
          <SectionTitle>Features List</SectionTitle>
          <DndContext sensors={sensors} collisionDetection={closestCenter} onDragEnd={handleDragEnd}>
            {/*//@ts-ignore*/}
            <SortableContext items={normalizedIconOrder} strategy={verticalListSortingStrategy}>
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
                      isActive={activeIcons.includes(id)}
                      onToggleVisibility={handleToggleFeatureVisibility}
                      onOpen={handleOpenFromMenu}
                    />
                  );
                })}
              </FeaturesGrid>
            </SortableContext>
          </DndContext>

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
                <Tooltip placement="top" title="Support / Labolatory Channel">
                  <a
                    target="_blank"
                    href="https://join.slack.com/t/browserextensionshq/shared_invite/zt-34o10eynr-Fof1vlJyx6PxpqjspCLKaw"
                  >
                    <IconBrandSlack />
                  </a>
                </Tooltip>
              </span>
              <Tooltip placement="top" title="Email">
                <a target="_blank" href="https://forms.gle/kaZFbYjP9zd4x6Re6">
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
            const isActive = activeIcons.includes(id);

            return (
              <Tooltip key={id} placement="top" title={item.title}>
                <IconButton
                  key={id}
                  $active={isActive}
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
          trigger="click"
          open={menuOpen}
          onOpenChange={setMenuOpen}
          // @ts-ignore
          getPopupContainer={() => document.querySelector("hover-inspector")!.shadowRoot as HTMLElement}
        >
          <IconButton $active={false} onClick={(e) => e.stopPropagation()}>
            <IconDotsVertical />
          </IconButton>
        </Popover>
      </LauncherBody>
    </LauncherContainer>
  );
};

export default Launcher;
