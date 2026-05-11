import type { CSSProperties, ReactNode } from "react";

type FrameProps = {
  canvasStyle?: CSSProperties;
  children: ReactNode;
  aspectRatio?: string;
};

export function Frame({
  canvasStyle,
  aspectRatio = "16/9",
  children,
}: FrameProps) {
  return (
    <div
      data-frame-root="true"
      className="w-full overflow-hidden rounded-[0.4vw]"
      style={{
        ...canvasStyle,
        aspectRatio,
      }}
    >
      {children}
    </div>
  );
}
