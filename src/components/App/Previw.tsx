import { Sidebar, SidebarProvider } from "../ui/sidebar";
import { type ReactNode } from "react";
import type { FrameMeta } from "../../frameManifest";
import { SidebarList } from "./SidebarList";
import { ExportButton } from "./Export";
import { type PreviewThemeType } from "../../lib/utils";

type PreviewProps = {
  children: ReactNode;
  frames: FrameMeta[];
  activeFrameId: string;
  onFrameSelect: (slideId: string) => void;
  aspectRatio: string;
  theme?: PreviewThemeType;
};

export function Preview({
  children,
  frames,
  activeFrameId,
  onFrameSelect,
  aspectRatio,
  theme = "light",
}: PreviewProps) {
  return (
    <SidebarProvider defaultOpen>
      <div
        className={`min-h-screen bg-background text-foreground ${theme === "dark" ? "dark" : ""}`}
      >
        <header className="flex h-10 items-center justify-end border-b border-border bg-background px-5">
          <ExportButton
            framePaths={frames.map((frame) => frame.path)}
            aspectRatio={aspectRatio}
            theme={theme}
          />
        </header>
        <main className="flex h-[calc(100vh-2.5rem)]">
          <Sidebar>
            <SidebarList
              frames={frames}
              activeFrameId={activeFrameId}
              onFrameSelect={onFrameSelect}
              aspectRatio={aspectRatio}
              theme={theme}
            />
          </Sidebar>
          {children}
        </main>
      </div>
    </SidebarProvider>
  );
}
