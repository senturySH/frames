import { createFileRoute } from "@tanstack/react-router";
import { Preview } from "../components/App/Previw";
import { FRAME_LIST } from "../frameManifest";
import { useState } from "react";
import { ASPECT_RATIO } from "../frameManifest";
import type { PreviewThemeType } from "../lib/utils";

export const Route = createFileRoute("/")({
  validateSearch: (search): { theme?: PreviewThemeType } => ({
    theme: search.theme === "dark" || search.theme === "light" ? search.theme : undefined,
  }),
  component: Index,
});

function Index() {
  const { theme } = Route.useSearch();
  const previewTheme: PreviewThemeType = theme ?? "light";

  const [activeFrameId, setActiveFrameId] = useState(
    FRAME_LIST[0]?.id ?? "slide-1",
  );
  const activeFrame =
    FRAME_LIST.find((frame) => frame.id === activeFrameId) ?? FRAME_LIST[0];

  return (
    <Preview
      frames={FRAME_LIST}
      activeFrameId={activeFrameId}
      onFrameSelect={setActiveFrameId}
      aspectRatio={ASPECT_RATIO}
      theme={previewTheme}
    >
      <section
        className="flex w-full items-center justify-center bg-background"
        aria-label="Slide canvas preview"
      >
        <iframe
          title={`${activeFrameId} preview`}
          src={`${activeFrame.path}?theme=${previewTheme}`}
          className="h-full w-full overflow-hidden"
        />
      </section>
    </Preview>
  );
}
