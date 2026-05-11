import { SidebarState, SidebarTrigger } from "../ui/sidebar";
import type { FrameMeta } from "../../frameManifest";

type FrameListProps = {
  frames: FrameMeta[];
  activeFrameId: string;
  onFrameSelect: (slideId: string) => void;
  aspectRatio?: string;
  theme?: "light" | "dark";
};

export function SidebarList({
  frames,
  activeFrameId,
  onFrameSelect,
  aspectRatio = "16/9",
  theme = "light",
}: FrameListProps) {
  const thumbnailBackgroundColor = theme === "dark" ? "#0d0d0d" : "#f8f7f6";

  return (
    <SidebarState>
      {({ open }) => (
        <div className="h-full overflow-y-auto pr-2 pt-4 pb-2 [scrollbar-width:none] [-ms-overflow-style:none] [&::-webkit-scrollbar]:hidden">
          <div className="mb-2 flex justify-end">
            <SidebarTrigger />
          </div>
          <ol className="m-0 list-none space-y-4 p-0">
            {frames.map((frame, index) => {
              const isActive = frame.id === activeFrameId;

              return (
                <li key={frame.id}>
                  <button
                    type="button"
                    onClick={() => onFrameSelect(frame.id)}
                    className="group flex w-full items-center rounded-md border-none bg-transparent p-0 text-left"
                    aria-label={`Open ${frame.name}`}
                  >
                    <span
                      className={`w-6 shrink-0 text-center text-[12px] ${
                        isActive ? "text-foreground" : "text-muted-foreground"
                      }`}
                    >
                      {index + 1}
                    </span>
                    {open ? (
                      <span
                        className={`block flex-1 overflow-hidden rounded-lg border bg-card p-0.5 transition-colors ${
                          isActive
                            ? "border-primary"
                            : "border-border group-hover:border-ring"
                        }`}
                      >
                        <iframe
                          title={`${frame.name} thumbnail`}
                          src={`${frame.path}?thumbnail=1&theme=${theme}`}
                          className="pointer-events-none block w-full overflow-hidden rounded-md border-none bg-background"
                          style={{
                            aspectRatio,
                            backgroundColor: thumbnailBackgroundColor,
                            colorScheme: theme,
                          }}
                          loading="lazy"
                        />
                      </span>
                    ) : null}
                  </button>
                </li>
              );
            })}
          </ol>
        </div>
      )}
    </SidebarState>
  );
}
