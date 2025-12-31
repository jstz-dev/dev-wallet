"use client";

import { ConfettiProvider } from "~/providers/confetti-provider";

export default function ConfettiLayout({ children }: LayoutProps<"/">) {
  return <ConfettiProvider>{children}</ConfettiProvider>;
}
