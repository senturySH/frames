# Skill: Local Setup and Add PPT Slides in `frames`

Use this guide when an LLM (or any contributor) needs to work locally in this repository and add new presentation slides that can be exported to PowerPoint.

## 1) Local setup (no push/pull workflow)

This workflow is local-only. Do not push to GitHub and do not require contributors to pull via SSH.

### If cloning is allowed (read-only)

```bash
git clone https://github.com/senturySH/frames.git
cd frames
npm install
npm run dev
```

### If repo is already on disk (preferred)

```bash
cd frames
npm install
npm run dev
```

## 2) How to add a new slide frame

In this project, each slide is a route file in `src/routes/frames/` and is registered in `src/frameManifest.ts`.

Important: existing files like `frame1.tsx`, `frame2.tsx`, etc. are optional examples and may be removed.
The skill must work even if there are zero existing frame files.

Slide-to-file mapping rule:
- Slide 1 -> `frame1.tsx`
- Slide 2 -> `frame2.tsx`
- Slide 3 -> `frame3.tsx`
- and so on

This numbering is created from the user prompt at generation time.
If the prompt asks for 5 slides, create `frame1.tsx` through `frame5.tsx` and register all 5 in the manifest.

Required component/template structure for every `frameN.tsx`:
1. Wrap slide content with `<Page>` as the outer container.
2. Inside `<Page>`, render `<Frame ...>`.
3. Pass both:
   - `canvasStyle={{ ... }}` (background/colors for the slide canvas)
   - `aspectRatio={ASPECT_RATIO}` (imported from `src/frameManifest.ts`)
4. Place slide content inside `<Frame>`.
5. Use responsive `vw`-based sizing for visual consistency in exported slides.
   - Use `vw` for `fontSize`, `padding`, `gap`, `margin`, `borderRadius`, `top/left`, etc.

Styling note:
- `canvasStyle` is fully customizable and should follow user taste/prompt.
- The gradient/colors in examples are only sample values.
- `ASPECT_RATIO` is the constant global setting for this PPT skill and must remain `16/9`.

### Step A: Create a new frame file
1. Add file(s) in `src/routes/frames/` using sequential numbering (`frame1.tsx`, `frame2.tsx`, ...).
2. If other frame files exist, continue numbering from the next slide index. If none exist, start at `frame1.tsx`.
3. Import and use `ASPECT_RATIO` from `src/frameManifest.ts`.
4. Pass it to `<Frame aspectRatio={ASPECT_RATIO} />`.

Minimal template:

```tsx
import { createFileRoute } from "@tanstack/react-router";
import { Frame } from "../../components/molecules/Frame";
import { Page } from "../../components/molecules/Page";
import { ASPECT_RATIO } from "../../frameManifest";

export const Route = createFileRoute("/frames/frame1")({
  component: RouteComponent,
});

function RouteComponent() {
  return (
    <Page>
      <Frame
        canvasStyle={{
          background: "linear-gradient(135deg, #0f172a 0%, #111827 55%, #1f2937 100%)",
          color: "#e5e7eb",
        }}
        aspectRatio={ASPECT_RATIO}
      >
        <div style={{ height: "100%", padding: "2.2vw" }}>
          <h1 style={{ margin: 0, fontSize: "3.2vw" }}>Slide 1</h1>
        </div>
      </Frame>
    </Page>
  );
}
```

### Step B: Register the frame in the manifest
Edit `src/frameManifest.ts` and add the new frame entry to `FRAME_LIST`:

```ts
{ id: "frame-1", name: "Slide 1", path: "/frames/frame1" }
```

Rules for manifest entries:
- `id` must be unique.
- `path` must exactly match the route path used in `createFileRoute(...)`.
- `name` should be human-readable for the slide picker/export flow.

Keep `ASPECT_RATIO` as:

```ts
export const ASPECT_RATIO = "16/9";
```

## 3) 16:9 ratio rule (required for PowerPoint)

- PowerPoint export in this repo is enabled only when aspect ratio is `16/9`.
- Do not change `ASPECT_RATIO` to another ratio if `.pptx` export is required.
- Always wire frames to `ASPECT_RATIO` from `frameManifest.ts` instead of hardcoding a different value.

To change slide aspect ratio globally, edit only this variable in `src/frameManifest.ts`:

```ts
export const ASPECT_RATIO = "16/9";
```

For this PPT skill, keep `ASPECT_RATIO` fixed to `"16/9"` only.
Do not switch to any other ratio.

## 4) LLM workflow checklist

When an LLM is asked to add slides, it should:
1. Create the exact number of slide files requested in the prompt.
2. Use sequential names: `frame1.tsx`, `frame2.tsx`, `frame3.tsx`, ...
3. Keep route path and manifest path aligned (`/frames/frame1`, `/frames/frame2`, ...).
4. In each frame, follow `Page` -> `Frame` structure and pass `canvasStyle` + `aspectRatio={ASPECT_RATIO}`.
5. Use `vw`-based sizing for typography and spacing so scaling stays consistent.
3. Ensure `<Frame aspectRatio={ASPECT_RATIO}>` is used.
4. Add matching metadata in `src/frameManifest.ts` (`id`, `name`, `path`).
5. Run:

```bash
npm run build
```

6. Confirm the new frame appears in preview and exports correctly.

## 5) Quick validation

```bash
npm run dev
```

- Open the app and verify the new frame is visible.
- Use the Export menu and verify PowerPoint option is available (it should be enabled for `16/9`).
