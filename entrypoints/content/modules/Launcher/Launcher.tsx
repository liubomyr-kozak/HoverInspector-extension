import React, { useEffect, useMemo, useState } from "react";
import {
  IconBrandSlack,
  IconDotsVertical,
  IconExternalLink,
  IconLayoutNavbarFilled,
  IconMailFilled,
} from "@tabler/icons-react";
import { Popover } from "antd";
import { useDispatch, useSelector } from "react-redux";
import { closestCenter, DndContext, PointerSensor, useSensor, useSensors } from "@dnd-kit/core";
import { arrayMove, SortableContext, verticalListSortingStrategy } from "@dnd-kit/sortable";

import { Tooltip } from "@entrypoints/shared/components/Tooltip";
import {
  onChangeLauncherActiveFeature,
  onChangeLauncherIconOrder,
  onMinimizedFeaturePopup,
} from "@entrypoints/content/store/app/saga-action/app.saga.action";

import {
  Divider,
  FeaturesGrid,
  IconButton,
  LauncherBody,
  LauncherContainer,
  LauncherMiniModal,
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
  const { iconOrder = POPUP_SUPPORT_TOOLS, activeIcons = [] } = useSelector((state: any) => state?.app.launcher);

  const featurePopupIsMinimized = useSelector((state: any) => state?.app.featurePopupIsMinimized);

  // State to track visible features
  const [visibleFeatures, setVisibleFeatures] = useState<string[]>([]);

  // Initialize visible features on component mount
  useEffect(() => {
    // Initially all features are visible
    setVisibleFeatures(ICON_ITEMS.map((item) => item.id));
  }, []);

  const normalizedIconOrder = useMemo(() => {
    return iconOrder.length ? iconOrder : ICON_ITEMS.map((i) => i.id);
  }, [iconOrder]);

  console.log("🌟🌟🌟 ::Launcher -> normalizedIconOrder", normalizedIconOrder);

  // Function to toggle feature visibility
  const toggleFeatureVisibility = (id: string) => {
    setVisibleFeatures((prev) => {
      if (prev.includes(id)) {
        return prev.filter((featureId) => featureId !== id);
      } else {
        return [...prev, id];
      }
    });
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

  const onDisplayFeaturePopup = () => {
    dispatch(onMinimizedFeaturePopup.getPayload(false));
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
                      onToggleVisibility={toggleFeatureVisibility}
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
                  onClick={() => {
                    const payload = {
                      id: item.id,
                      title: item.title,
                      activatable: item.activatable,
                      multipleView: item.multipleView,
                      isActive,
                    };

                    // якщо не мінімізований попап, тоді викликаємо звичайну функцію активації фічі
                    if (!featurePopupIsMinimized) {
                      item.activatable && dispatch(onChangeLauncherActiveFeature.getPayload(payload));

                      return;
                    }

                    // якщо мінімізований попап, тоді відкриваємо його
                    onDisplayFeaturePopup();

                    // якщо клікнута фіча не активна, тоді активуємо її,
                    // далі в залежності від логіки вона може деактиувавти попередню або добавтись
                    if (!isActive) {
                      item.activatable && dispatch(onChangeLauncherActiveFeature.getPayload(payload));
                    }
                  }}
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
          // @ts-ignore
          getPopupContainer={() => document.querySelector("hover-inspector")!.shadowRoot as HTMLElement}
        >
          <IconButton $active={false} onClick={(e) => e.stopPropagation()}>
            <IconDotsVertical />
          </IconButton>
        </Popover>
      </LauncherBody>

      {featurePopupIsMinimized && (
        <LauncherMiniModal onClick={onDisplayFeaturePopup}>
          <Tooltip placement="top" title={"Open Inspector Modal"}>
            <IconButton $active={false}>
              <IconLayoutNavbarFilled />
            </IconButton>
          </Tooltip>
        </LauncherMiniModal>
      )}
    </LauncherContainer>
  );
};

export default Launcher;
