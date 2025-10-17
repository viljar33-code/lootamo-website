import { createContext, useContext, useState, useEffect, useCallback, ReactNode } from 'react';

interface SidebarContextType {
  isCollapsed: boolean;
  toggleCollapse: () => void;
  isMobileOpen: boolean;
  setMobileOpen: (open: boolean) => void;
}

const SidebarContext = createContext<SidebarContextType | undefined>(undefined);

export function SidebarProvider({ children }: { children: ReactNode }) {
  const [isCollapsed, setIsCollapsed] = useState(false);
  const [isMobileOpen, setIsMobileOpen] = useState(false);

  // Load sidebar state from localStorage on mount
  useEffect(() => {
    const savedCollapsedState = localStorage.getItem('sidebar-collapsed');
    if (savedCollapsedState !== null) {
      setIsCollapsed(JSON.parse(savedCollapsedState));
    }
  }, []);

  const toggleCollapse = useCallback(() => {
    const newCollapsedState = !isCollapsed;
    setIsCollapsed(newCollapsedState);
    // Save to localStorage to persist across navigation
    localStorage.setItem('sidebar-collapsed', JSON.stringify(newCollapsedState));
  }, [isCollapsed]);

  // Add keyboard shortcut for Ctrl+B to toggle sidebar
  useEffect(() => {
    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.ctrlKey && event.key === 'b') {
        event.preventDefault();
        toggleCollapse();
      }
    };

    document.addEventListener('keydown', handleKeyDown);

    return () => {
      document.removeEventListener('keydown', handleKeyDown);
    };
  }, [toggleCollapse]);

  const setMobileOpen = (open: boolean) => {
    setIsMobileOpen(open);
  };

  return (
    <SidebarContext.Provider value={{
      isCollapsed,
      toggleCollapse,
      isMobileOpen,
      setMobileOpen
    }}>
      {children}
    </SidebarContext.Provider>
  );
}

export function useSidebar() {
  const context = useContext(SidebarContext);
  if (context === undefined) {
    throw new Error('useSidebar must be used within a SidebarProvider');
  }
  return context;
}
