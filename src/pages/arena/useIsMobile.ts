import { useEffect, useState } from "react";

const QUERY = "(max-width: 700px)";

export function useIsMobile(): boolean {
  const [mobile, setMobile] = useState(
    () => window.matchMedia(QUERY).matches,
  );

  useEffect(() => {
    const media = window.matchMedia(QUERY);
    const onChange = (event: MediaQueryListEvent) => setMobile(event.matches);
    media.addEventListener("change", onChange);
    return () => media.removeEventListener("change", onChange);
  }, []);

  return mobile;
}
