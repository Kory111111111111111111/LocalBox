import { useEffect } from "react";

export const DEFAULT_DOCUMENT_TITLE = "LocalToolBox — Local tools. Your device.";

export function usePageTitle(title: string) {
  useEffect(() => {
    document.title = title;
    return () => {
      document.title = DEFAULT_DOCUMENT_TITLE;
    };
  }, [title]);
}
