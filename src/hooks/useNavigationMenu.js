import { useCallback, useEffect, useRef, useState } from "react";

export function useDesktopDropdown({ closeDelay = 140 } = {}) {
  const closeTimeoutRef = useRef(null);
  const [openItemId, setOpenItemId] = useState(null);

  const clearCloseTimer = useCallback(() => {
    if (closeTimeoutRef.current) {
      window.clearTimeout(closeTimeoutRef.current);
      closeTimeoutRef.current = null;
    }
  }, []);

  const openDropdown = useCallback(
    (itemId) => {
      clearCloseTimer();
      setOpenItemId(itemId);
    },
    [clearCloseTimer]
  );

  const closeDropdown = useCallback(() => {
    clearCloseTimer();
    setOpenItemId(null);
  }, [clearCloseTimer]);

  const scheduleClose = useCallback(() => {
    clearCloseTimer();
    closeTimeoutRef.current = window.setTimeout(() => {
      setOpenItemId(null);
    }, closeDelay);
  }, [clearCloseTimer, closeDelay]);

  useEffect(() => clearCloseTimer, [clearCloseTimer]);

  return {
    openItemId,
    openDropdown,
    closeDropdown,
    scheduleClose,
  };
}

export function useMobileDrawerMenu() {
  const [isOpen, setIsOpen] = useState(false);
  const [openAccordionId, setOpenAccordionId] = useState(null);

  useEffect(() => {
    document.body.style.overflow = isOpen ? "hidden" : "";
    return () => {
      document.body.style.overflow = "";
    };
  }, [isOpen]);

  const closeMenu = useCallback(() => {
    setIsOpen(false);
    setOpenAccordionId(null);
  }, []);

  const toggleMenu = useCallback(() => {
    setIsOpen((prev) => !prev);
  }, []);

  const toggleAccordion = useCallback((itemId) => {
    setOpenAccordionId((current) => (current === itemId ? null : itemId));
  }, []);

  return {
    isOpen,
    openAccordionId,
    closeMenu,
    toggleMenu,
    toggleAccordion,
  };
}
