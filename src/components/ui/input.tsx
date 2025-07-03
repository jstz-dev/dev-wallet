import type { LucideProps } from "lucide-react";
import type { ComponentProps, ReactNode } from "react";
import { cn } from "~/lib/utils";

import type { ButtonProps } from "./button";

interface InputProps extends Omit<ComponentProps<"input">, "children"> {
  renderIcon?: (props: LucideProps) => ReactNode;
  renderButton?: (props: ButtonProps) => ReactNode;
  classNames?: {
    container?: string;
  };
}

export function Input({
  className,
  type,
  renderIcon = () => null,
  renderButton = () => null,
  classNames = {},
  ...props
}: InputProps) {
  const icon = renderIcon({
    className: "size-5 absolute top-1/2 -translate-y-1/2 left-5 text-muted-foreground",
  });
  const button = renderButton({
    className:
      "absolute right-4 top-1/2 -translate-y-1/2 rounded-[calc(var(--input-radius)-var(--input-y-padding))]",
    type: "button",
  });

  return (
    <div
      className={cn(
        "relative [--input-radius:var(--radius-xl)] [--input-y-padding:--spacing(1)]",
        classNames.container,
      )}
    >
      {icon}

      <input
        type={type}
        data-slot="input"
        className={cn(
          "file:text-foreground placeholder:text-muted-foreground selection:bg-primary selection:text-primary-foreground dark:bg-input/30 border-input aria-invalid:outline-destructive/20 dark:aria-invalid:outline-destructive/40 aria-invalid:border-destructive focus-visible:outline-brand-blue-300 flex h-12 w-full min-w-0 rounded-2xl border bg-transparent p-(--input-y-padding) px-5 text-lg shadow-xs transition-[color,box-shadow] file:inline-flex file:h-9 file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-base focus-visible:outline-[1.5px] focus-visible:outline-offset-2 disabled:pointer-events-none disabled:cursor-not-allowed disabled:opacity-50 md:text-base",
          icon && "pl-12",
          button && "h-14 rounded-(--input-radius) pr-12",
          className,
        )}
        {...props}
      />

      {button}
    </div>
  );
}
