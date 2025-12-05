import { useSyncExternalStore } from "react";

function getServerSnapshot() {
  return null;
}

export function useMediaQuery(query: string) {
  function subscribe(callback: () => void) {
    const matchMedia = window.matchMedia(query);
    matchMedia.addEventListener("change", callback);

    return () => {
      matchMedia.removeEventListener("change", callback);
    };
  }

  function getSnapshot() {
    return window.matchMedia(query).matches;
  }

  return useSyncExternalStore(subscribe, getSnapshot, getServerSnapshot);
}
