import { toPng } from "html-to-image";
import PptxGenJS from "pptxgenjs";

type SavePickerWindow = Window & {
  showSaveFilePicker?: (options?: {
    suggestedName?: string;
    types?: Array<{
      description?: string;
      accept: Record<string, string[]>;
    }>;
  }) => Promise<{
    createWritable: () => Promise<{
      write: (data: Blob) => Promise<void>;
      close: () => Promise<void>;
    }>;
  }>;
  electronExport?: {
    saveFile: (options: {
      suggestedName: string;
      mimeType: string;
      data: ArrayBuffer;
    }) => Promise<{ canceled: boolean; filePath?: string }>;
  };
};

const PPTX_MIME_TYPE =
  "application/vnd.openxmlformats-officedocument.presentationml.presentation";

const isElectronLikeRuntime = () => {
  const ua = navigator.userAgent || "";
  return ua.includes("Electron");
};

const loadSlideRoot = (path: string) =>
  new Promise<{ root: HTMLElement; iframe: HTMLIFrameElement }>(
    (resolve, reject) => {
      const iframe = document.createElement("iframe");
      const frameUrl = new URL(path, window.location.origin);
      frameUrl.searchParams.set("thumbnail", "1");
      iframe.src = frameUrl.toString();
      iframe.style.position = "absolute";
      iframe.style.left = "-99999px";
      iframe.style.top = "0";
      iframe.style.width = "1920px";
      iframe.style.height = "1080px";
      iframe.style.opacity = "0";
      iframe.setAttribute("data-export-slide-loader", "true");

      iframe.onload = () => {
        const start = Date.now();
        const timeoutMs = 10000;

        const waitForSlide = () => {
          const root = iframe.contentDocument?.querySelector<HTMLElement>(
            '[data-frame-root="true"]',
          );

          if (root) {
            resolve({ root, iframe });
            return;
          }

          if (Date.now() - start > timeoutMs) {
            reject(new Error(`Could not find slide root for ${path}`));
            return;
          }

          window.setTimeout(waitForSlide, 50);
        };

        waitForSlide();
      };

      iframe.onerror = () => reject(new Error(`Could not load ${path}`));
      document.body.appendChild(iframe);
    },
  );

const saveWithNativeDialog = async (pptx: PptxGenJS) => {
  const suggestedName = "frame-export.pptx";
  const exportWindow = window as SavePickerWindow;
  const data = (await pptx.write({ outputType: "arraybuffer" })) as ArrayBuffer;

  if (exportWindow.electronExport?.saveFile) {
    const result = await exportWindow.electronExport.saveFile({
      suggestedName,
      mimeType: PPTX_MIME_TYPE,
      data,
    });

    if (result.canceled) {
      throw new DOMException("The user aborted a request.", "AbortError");
    }

    return;
  }

  if (isElectronLikeRuntime()) {
    throw new Error(
      "Electron export bridge is not available. Configure window.electronExport.saveFile in preload/main process.",
    );
  }

  const savePicker = exportWindow.showSaveFilePicker;
  const blob = new Blob([data], { type: PPTX_MIME_TYPE });

  if (savePicker) {
    try {
      const fileHandle = await savePicker({
        suggestedName,
        types: [
          {
            description: "PowerPoint Presentation",
            accept: {
              [PPTX_MIME_TYPE]: [".pptx"],
            },
          },
        ],
      });

      const writable = await fileHandle.createWritable();
      await writable.write(blob);
      await writable.close();
      return;
    } catch (error) {
      if (error instanceof DOMException && error.name === "AbortError") {
        throw error;
      }

      if (isElectronLikeRuntime()) {
        throw new Error(
          "File picker write is blocked in this Electron context. Use the Electron export bridge for saving.",
          { cause: error },
        );
      }
    }
  }

  const objectUrl = URL.createObjectURL(blob);
  const anchor = document.createElement("a");
  anchor.href = objectUrl;
  anchor.download = suggestedName;
  anchor.click();
  URL.revokeObjectURL(objectUrl);
};

export const cleanupSlideExportLoaders = () => {
  document
    .querySelectorAll('iframe[data-export-slide-loader="true"]')
    .forEach((node) => node.remove());
};

export const exportFramesToPptx = async (framePaths: string[]) => {
  const pptx = new PptxGenJS();
  pptx.layout = "LAYOUT_WIDE";

  for (const path of framePaths) {
    const { root, iframe } = await loadSlideRoot(path);

    const dataUrl = await toPng(root, {
      cacheBust: true,
      pixelRatio: 2,
      backgroundColor: "#0b0d12",
    });

    const slide = pptx.addSlide();
    slide.addImage({ data: dataUrl, x: 0, y: 0, w: 13.333, h: 7.5 });
    iframe.remove();
  }

  await saveWithNativeDialog(pptx);
};
