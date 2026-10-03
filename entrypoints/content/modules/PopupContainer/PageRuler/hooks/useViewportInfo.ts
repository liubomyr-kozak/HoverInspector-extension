import { useEffect, useState } from "react";
import { MEDIA_FEATURE_QUERIES, readMediaFeatures, readViewportInfo } from "../utils/viewport";
import type { MediaFeatureValue, ViewportInfo } from "../types";

/** Live viewport values; a burst of resize events costs one read per animation frame */
export const useViewportInfo = (): ViewportInfo => {
  const [info, setInfo] = useState<ViewportInfo>(() => readViewportInfo());

  useEffect(() => {
    let frame = 0;
    const schedule = () => {
      if (frame) return;
      frame = requestAnimationFrame(() => {
        frame = 0;
        setInfo(readViewportInfo());
      });
    };
    window.addEventListener("resize", schedule);
    window.visualViewport?.addEventListener("resize", schedule);
    return () => {
      cancelAnimationFrame(frame);
      window.removeEventListener("resize", schedule);
      window.visualViewport?.removeEventListener("resize", schedule);
    };
  }, []);

  return info;
};

const matches = (query: string) => window.matchMedia(query).matches;

/** Live media feature values: re-read only when one of the queries changes (theme switch, mouse plugged in) */
export const useMediaFeatures = (): MediaFeatureValue[] => {
  const [features, setFeatures] = useState<MediaFeatureValue[]>(() => readMediaFeatures(matches));

  useEffect(() => {
    const update = () => setFeatures(readMediaFeatures(matches));
    const lists = MEDIA_FEATURE_QUERIES.map((query) => window.matchMedia(query));
    lists.forEach((list) => list.addEventListener("change", update));
    return () => lists.forEach((list) => list.removeEventListener("change", update));
  }, []);

  return features;
};
