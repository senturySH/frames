import { createContext, useContext, useMemo, useState } from "react";
import type { PropsWithChildren, ReactNode } from "react";

type SidebarContextValue = {
  open: boolean;
  setOpen: (open: boolean) => void;
  toggle: () => void;
};

const SidebarContext = createContext<SidebarContextValue | null>(null);

type SidebarProviderProps = PropsWithChildren<{
  defaultOpen?: boolean;
}>;

export function SidebarProvider({
  children,
  defaultOpen = true,
}: SidebarProviderProps) {
  const [open, setOpen] = useState(defaultOpen);

  const value = useMemo(
    () => ({
      open,
      setOpen,
      toggle: () => setOpen((state) => !state),
    }),
    [open],
  );

  return (
    <SidebarContext.Provider value={value}>{children}</SidebarContext.Provider>
  );
}

function useSidebar() {
  const context = useContext(SidebarContext);

  if (!context) {
    throw new Error("Sidebar components must be used inside SidebarProvider");
  }

  return context;
}

type SidebarStateProps = {
  children: (state: { open: boolean }) => ReactNode;
};

export function SidebarState({ children }: SidebarStateProps) {
  const { open } = useSidebar();
  return <>{children({ open })}</>;
}

export function Sidebar({ children }: PropsWithChildren) {
  const { open } = useSidebar();

  return (
    <aside
      className="relative h-full overflow-hidden border-r border-border bg-background transition-[width] duration-200 ease-out data-[state=collapsed]:w-9 data-[state=expanded]:w-60"
      data-state={open ? "expanded" : "collapsed"}
      aria-label="Slide thumbnails"
    >
      {children}
    </aside>
  );
}

export function SidebarTrigger() {
  const { open, toggle } = useSidebar();

  return (
    <button
      className="cursor-pointer rounded-lg border-none bg-transparent px-2 py-px text-base text-foreground hover:bg-muted focus-visible:bg-muted"
      type="button"
      title={open ? "Collapse sidebar" : "Expand sidebar"}
      aria-label={open ? "Collapse sidebar" : "Expand sidebar"}
      onClick={toggle}
    >
      {open ? "<" : ">"}
    </button>
  );
}
