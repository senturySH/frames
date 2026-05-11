import type { ReactNode } from "react";

type PageProps = {
  children: ReactNode;
};

export function Page({ children }: PageProps) {
  const searchParams =
    typeof window !== "undefined"
      ? new URLSearchParams(window.location.search)
      : null;

  const isThumbnail = searchParams?.get("thumbnail") === "1";
  const isDarkTheme = searchParams?.get("theme") === "dark";
  const themeClass = isDarkTheme ? "dark" : "";

  if (isThumbnail) {
    return (
      <div className={`h-screen overflow-hidden bg-background ${themeClass}`}>
        {children}
      </div>
    );
  }

  return (
    <main
      className={`flex min-h-screen items-center bg-background px-[8%] ${themeClass}`}
    >
      {children}
    </main>
  );
}
