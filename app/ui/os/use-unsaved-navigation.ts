"use client";

import { useEffect } from "react";

export function useUnsavedNavigation(getState: () => { writing: boolean; warning: string }) {
  useEffect(() => {
    const beforeUnload = (event: BeforeUnloadEvent) => {
      const { writing, warning } = getState();
      if (writing || warning) event.preventDefault();
    };

    const guard = (event: Event) => {
      if (event.defaultPrevented) return;
      const { writing, warning } = getState();
      if (!writing && (!warning || window.confirm(warning))) return;
      event.preventDefault();
      event.stopPropagation();
    };

    const linkClick = (event: MouseEvent) => {
      if (!(event.target instanceof Element) || event.button !== 0 || event.ctrlKey || event.metaKey || event.shiftKey || event.altKey) return;
      const link = event.target.closest<HTMLAnchorElement>("a[href]");
      if (!link || (link.target && link.target !== "_self") || link.hasAttribute("download") || link.origin !== location.origin) return;
      if (link.pathname === location.pathname && link.search === location.search) return;
      guard(event);
    };

    const leaveForm = (event: SubmitEvent) => {
      if (event.target instanceof HTMLFormElement && event.target.hasAttribute("data-os-leaves-editor")) guard(event);
    };

    window.addEventListener("beforeunload", beforeUnload);
    window.addEventListener("click", linkClick, true);
    window.addEventListener("submit", leaveForm, true);
    return () => {
      window.removeEventListener("beforeunload", beforeUnload);
      window.removeEventListener("click", linkClick, true);
      window.removeEventListener("submit", leaveForm, true);
    };
  }, [getState]);
}
