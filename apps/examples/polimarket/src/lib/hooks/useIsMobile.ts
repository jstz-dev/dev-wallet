import { useMediaQuery } from "./useMediaQuery";

const MOBILE_BREAKPOINT = 768;

export function useIsMobile() {
  const isMobile = useMediaQuery(`(max-width: ${MOBILE_BREAKPOINT - 1}px)`);

  return !!isMobile;
}
