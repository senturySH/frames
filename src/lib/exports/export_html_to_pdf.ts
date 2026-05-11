import { toJpeg } from "html-to-image";
import { jsPDF } from "jspdf";

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

const PDF_MIME_TYPE = "application/pdf";
const DEFAULT_PAGE_SIZE = { width: 13.333, height: 7.5 };
const MAX_LONG_SIDE_IN = 13.333;
const MIN_SIDE_IN = 2;
const MAX_SIDE_IN = 40;

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

const clamp = (value: number, min: number, max: number) =>
  Math.min(max, Math.max(min, value));

const round3 = (value: number) => Math.round(value * 1000) / 1000;

const dataUriToArrayBuffer = (dataUri: string) => {
  const marker = "base64,";
  const markerIndex = dataUri.indexOf(marker);

  if (markerIndex === -1) {
    throw new Error("Invalid PDF data URI format.");
  }

  const base64 = dataUri.slice(markerIndex + marker.length);
  const binary = window.atob(base64);
  const bytes = new Uint8Array(binary.length);

  for (let i = 0; i < binary.length; i += 1) {
    bytes[i] = binary.charCodeAt(i);
  }

  return bytes.buffer;
};

const buildPdfArrayBuffer = (pdf: jsPDF) => {
  try {
    const data = pdf.output("arraybuffer") as ArrayBuffer;

    if (data.byteLength > 0) {
      return data;
    }
  } catch (error) {
    console.warn("[export.pdf] arraybuffer output failed", error);
  }

  try {
    const dataUri = pdf.output("datauristring") as string;
    const fallbackBuffer = dataUriToArrayBuffer(dataUri);

    if (fallbackBuffer.byteLength > 0) {
      return fallbackBuffer;
    }
  } catch (error) {
    throw new Error("PDF generation failed for both arraybuffer and data URI outputs.", {
      cause: error,
    });
  }

  throw new Error("Generated PDF is empty.");
};

const parseAspectRatio = (aspectRatio: string) => {
  const normalized = aspectRatio.trim().replace(":", "/");
  const parts = normalized.split("/").map((part) => Number(part.trim()));

  if (parts.length !== 2 || !Number.isFinite(parts[0]) || !Number.isFinite(parts[1])) {
    return DEFAULT_PAGE_SIZE;
  }

  const [w, h] = parts;
  if (w <= 0 || h <= 0) {
    return DEFAULT_PAGE_SIZE;
  }

  const ratio = w / h;
  if (!Number.isFinite(ratio) || ratio <= 0) {
    return DEFAULT_PAGE_SIZE;
  }

  const rawWidth = ratio >= 1 ? MAX_LONG_SIDE_IN : MAX_LONG_SIDE_IN * ratio;
  const rawHeight = ratio >= 1 ? MAX_LONG_SIDE_IN / ratio : MAX_LONG_SIDE_IN;
  const width = round3(clamp(rawWidth, MIN_SIDE_IN, MAX_SIDE_IN));
  const height = round3(clamp(rawHeight, MIN_SIDE_IN, MAX_SIDE_IN));

  return { width, height };
};

const savePdfWithNativeDialog = async (pdf: jsPDF) => {
  const suggestedName = "frame-export.pdf";
  const exportWindow = window as SavePickerWindow;
  const data = buildPdfArrayBuffer(pdf);
  const blob = new Blob([data], { type: PDF_MIME_TYPE });

  if (exportWindow.electronExport?.saveFile) {
    let result: { canceled: boolean; filePath?: string };

    try {
      result = await exportWindow.electronExport.saveFile({
        suggestedName,
        mimeType: PDF_MIME_TYPE,
        data,
      });
    } catch (error) {
      throw new Error(
        `Electron save bridge failed for PDF export. byteLength=${data.byteLength}`,
        { cause: error },
      );
    }

    if (result.canceled) {
      throw new DOMException("The user aborted a request.", "AbortError");
    }

    return;
  }

  const savePicker = exportWindow.showSaveFilePicker;

  if (savePicker) {
    const fileHandle = await savePicker({
      suggestedName,
      types: [
        {
          description: "PDF Document",
          accept: {
            [PDF_MIME_TYPE]: [".pdf"],
          },
        },
      ],
    });

    const writable = await fileHandle.createWritable();
    await writable.write(blob);
    await writable.close();
    return;
  }

  const objectUrl = URL.createObjectURL(blob);
  const anchor = document.createElement("a");
  anchor.href = objectUrl;
  anchor.download = suggestedName;
  anchor.click();
  URL.revokeObjectURL(objectUrl);
};

export const exportFramesToPdf = async (
  framePaths: string[],
  aspectRatio: string,
) => {
  if (framePaths.length === 0) {
    throw new Error("No frames available for export.");
  }

  const { width, height } = parseAspectRatio(aspectRatio);
  const orientation = width >= height ? "landscape" : "portrait";
  const pageFormat: [number, number] = [width, height];

  const pdf = new jsPDF({
    orientation,
    unit: "in",
    format: pageFormat,
  });

  for (const [index, path] of framePaths.entries()) {
    const { root, iframe } = await loadSlideRoot(path);

    const dataUrl = await toJpeg(root, {
      cacheBust: true,
      pixelRatio: 1,
      quality: 0.9,
      backgroundColor: "#0b0d12",
    });

    if (index > 0) {
      pdf.addPage(pageFormat, orientation);
    }

    pdf.addImage(dataUrl, "JPEG", 0, 0, width, height, undefined, "FAST");
    iframe.remove();
  }

  await savePdfWithNativeDialog(pdf);
};
