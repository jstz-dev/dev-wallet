import { cn } from "jstz-ui/utils";
import type { ComponentPropsWithRef } from "react";
import { Link } from "react-router";

type LogoProps = Omit<ComponentPropsWithRef<"h1">, "children">;

export default function Logo({ className, ...props }: LogoProps) {
  return (
    <Link to="/">
      <h1
        className={cn("font-roboto-mono text-2xl font-light tracking-[0.2em]", className)}
        {...props}
      >
        <span className="text-brand-lilac-900">&#123;</span>
        <span className="text-brand-blue-300">jstz</span>
        <span className="text-brand-lilac-900">&#125;</span>
      </h1>
    </Link>
  );
}
