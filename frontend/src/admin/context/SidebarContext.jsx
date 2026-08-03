import { createContext, useContext, useState } from 'react';

export const SidebarContext = createContext(null);

export const SidebarProvider = ({ children }) => {
  const [mobileOpen, setMobileOpen] = useState(false);
  const toggle = () => setMobileOpen((prev) => !prev);
  const close = () => setMobileOpen(false);

  return (
    <SidebarContext.Provider value={{ mobileOpen, toggle, close }}>
      {children}
    </SidebarContext.Provider>
  );
};

export const useSidebar = () => {
  const ctx = useContext(SidebarContext);
  if (!ctx) throw new Error('useSidebar must be used inside SidebarProvider');
  return ctx;
};
