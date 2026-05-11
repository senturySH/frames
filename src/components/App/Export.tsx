import { useState } from "react";
import { ChevronDown, Download, FileText, Loader2, Presentation } from "lucide-react";
import { Button } from "../ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "../ui/dropdown-menu";
import {
  cleanupSlideExportLoaders,
  exportFramesToPptx,
} from "../../lib/exports/export_html_to_pptx";
import { exportFramesToPdf } from "../../lib/exports/export_html_to_pdf";
import { type PreviewThemeType } from "../../lib/utils";

type ExportButtonProps = {
  framePaths: string[];
  aspectRatio: string;
  theme?: PreviewThemeType;
};

const formatErrorDetails = (error: unknown) => {
  if (error instanceof Error) {
    const causeText =
      error.cause instanceof Error
        ? `${error.cause.name}: ${error.cause.message}`
        : typeof error.cause === "string"
          ? error.cause
          : "";

    const stackText = error.stack ? `\n\nStack:\n${error.stack}` : "";
    const causeBlock = causeText ? `\nCause: ${causeText}` : "";
    return `${error.name}: ${error.message}${causeBlock}${stackText}`;
  }

  if (typeof error === "string") {
    return error;
  }

  try {
    return JSON.stringify(error, null, 2);
  } catch {
    return String(error);
  }
};

const isWidePptAspectRatio = (aspectRatio: string) => {
  const normalized = aspectRatio.replace(":", "/").trim();
  return normalized === "16/9";
};

export function ExportButton({
  framePaths,
  aspectRatio,
  theme = "light",
}: ExportButtonProps) {
  const [isExporting, setIsExporting] = useState(false);
  const canExportPptx = isWidePptAspectRatio(aspectRatio);
  const themedFramePaths = framePaths.map((framePath) => {
    const frameUrl = new URL(framePath, window.location.origin);
    frameUrl.searchParams.set("theme", theme);
    return `${frameUrl.pathname}${frameUrl.search}`;
  });

  const runExport = async (type: "pptx" | "pdf") => {
    if (isExporting) {
      return;
    }

    setIsExporting(true);

    try {
      if (type === "pptx") {
        await exportFramesToPptx(themedFramePaths);
      } else {
        await exportFramesToPdf(themedFramePaths, aspectRatio);
      }
    } catch (error) {
      if (error instanceof DOMException && error.name === "AbortError") {
        return;
      }

      const details = formatErrorDetails(error);
      console.error("Failed to export slides", {
        error,
        type,
        aspectRatio,
        frameCount: themedFramePaths.length,
        details,
      });
      alert(`Failed to export slides:\n${details}`);
    } finally {
      setIsExporting(false);
      cleanupSlideExportLoaders();
    }
  };

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button
          size="xs"
          variant="export"
          disabled={isExporting}
        >
          {isExporting ? (
            <Loader2 className="size-4 animate-spin" />
          ) : (
            <Download className="size-4" />
          )}
          Export
          <ChevronDown className="size-4" />
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent
        align="end"
        className="min-w-36 rounded-md border border-border bg-popover p-0.5 text-[12px] text-popover-foreground shadow-xl"
      >
        <DropdownMenuItem
          className="rounded-sm px-2 py-1.5 text-[12px] text-popover-foreground focus:bg-accent focus:text-accent-foreground"
          onClick={() => {
            void runExport("pptx");
          }}
          disabled={!canExportPptx || isExporting}
          title={
            canExportPptx
              ? "Export slide deck as PowerPoint (.pptx)"
              : "PowerPoint export is available only for 16/9 decks"
          }
        >
          <Presentation className="size-3.5" />
          PowerPoint
        </DropdownMenuItem>
        <DropdownMenuItem
          className="rounded-sm px-2 py-1.5 text-[12px] text-popover-foreground focus:bg-accent focus:text-accent-foreground"
          onClick={() => {
            void runExport("pdf");
          }}
          disabled={isExporting}
        >
          <FileText className="size-3.5" />
          PDF
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
