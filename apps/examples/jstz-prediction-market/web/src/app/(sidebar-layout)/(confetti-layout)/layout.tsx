"use client";
import { ConfettiProvider } from "~/providers/realistic-confetti-provider";

export default function ConfettiLayout({ children }: LayoutProps<"/">) {
  return <ConfettiProvider>{children}</ConfettiProvider>;
}
