import React, { FC, useEffect, useState } from "react";
import { useDispatch, useSelector } from "react-redux";

import { onInitAppSetting, onSyncSharedSettings } from "@entrypoints/content/store/app/saga-action/app.saga.action";
import { selectAppActive } from "@entrypoints/content/store/app/app.slice";

import Loader from "./Loader";
import { Logo } from "@entrypoints/shared/components/Logo/Logo.tsx";
import { LauncherBody, LauncherContainer } from "@entrypoints/content/modules/Launcher/Launcher.styled.ts";

const AppController: FC<{ children: React.ReactNode }> = ({ children }) => {
  const dispatch = useDispatch();
  const isAppActive = useSelector(selectAppActive);
  const [isLoaderActive, setIsLoaderActive] = useState(true);

  useEffect(() => {
    dispatch(onInitAppSetting.getPayload());

    const onVisibilityChange = () => {
      if (document.visibilityState === "visible") dispatch(onSyncSharedSettings.getPayload());
    };
    document.addEventListener("visibilitychange", onVisibilityChange);
    return () => document.removeEventListener("visibilitychange", onVisibilityChange);
  }, []);

  useEffect(() => {
    if (isAppActive) {
      const timer = setTimeout(() => setIsLoaderActive(false), 300);
      return () => clearTimeout(timer);
    }
  }, [isAppActive]);

  if (!isAppActive) {
    return null;
  }

  if (isLoaderActive) {
    return (
      <LauncherContainer>
        <LauncherBody>
          <Logo />
          <Loader />
        </LauncherBody>
      </LauncherContainer>
    );
  }

  return <>{children}</>;
};

export default AppController;