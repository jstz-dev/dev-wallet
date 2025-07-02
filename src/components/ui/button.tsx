import { Slot } from "@radix-ui/react-slot";

import { type VariantProps } from "cva";
import type { LucideProps } from "lucide-react";
import type { ComponentPropsWithRef, ReactNode } from "react";
import { cva, cn } from "~/lib/utils";

export const buttonVariants = cva({
  base: "inline-flex items-center justify-center gap-2 whitespace-nowrap rounded-full text-base transition-all disabled:pointer-events-none disabled:opacity-50 [&_svg]:pointer-events-none [&_svg:not([class*='size-'])]:size-4 shrink-0 [&_svg]:shrink-0 focus-visible:outline-blue-300 focus-visible:outline-[1.5px] focus-visible:outline-offset-2 aria-invalid:ring-destructive/20 dark:aria-invalid:ring-destructive/40 aria-invalid:border-destructive hover:cursor-pointer",
  variants: {
    variant: {
      default: "bg-white/70 text-black-900 hover:bg-white border",
      outline: "hover:bg-white/5 border border-white/70",
      ghost: "hover:bg-white/5 border-white/70 border border-none",
      secondary: "bg-brand-lilac-600 text-white hover:bg-brand-lilac-600/80",

      destructive:
        "bg-destructive text-white shadow-xs hover:bg-destructive/90 focus-visible:ring-destructive/20 dark:focus-visible:ring-destructive/40 dark:bg-destructive/60",
      link: "text-primary underline-offset-4 hover:underline",
    },
    size: {
      lg: "h-14 px-7 has-[>svg]:px-6",
      default: "h-10 px-5 has-[>svg]:px-4",
      sm: "h-10 px-3 has-[>svg]:px-2.5",
      xs: "h-8 px-3 has-[>svg]:px-2.5",
      icon: "size-9",
      icon_square: "size-9 rounded-md",
    },
  },
  defaultVariants: {
    variant: "default",
    size: "default",
  },
});

export interface ButtonProps
  extends ComponentPropsWithRef<"button">,
    VariantProps<typeof buttonVariants> {
  asChild?: boolean;
  iconPosition?: "left" | "right";
  renderIcon?: (props: LucideProps) => ReactNode;
}

export function Button({
  className,
  variant,
  size,
  asChild = false,
  iconPosition = "left",
  renderIcon = () => null,
  children,
  ...props
}: ButtonProps) {
  const Comp = asChild ? Slot : "button";

  const iconProps: LucideProps = {
    className: "size-4",
  };

  const icon = renderIcon(iconProps);

  return (
    <Comp
      data-slot="button"
      className={cn(buttonVariants({ variant, size, className }))}
      {...props}
    >
      <>
        {iconPosition === "left" && icon}
        {children}
        {iconPosition === "right" && icon}
      </>
    </Comp>
  );
}
