import { type VariantProps } from "cva";
import { Alert, AlertDescription } from "jstz-ui/ui/alert";
import type { ButtonProps } from "jstz-ui/ui/button";
import { cva } from "jstz-ui/utils";
import type { ReactNode } from "react";

import { CopyButton } from "./CopyButton";

export const copyContainerVariants = cva({
  base: "group relative border-0 p-2",
  variants: {
    variant: {
      default: "bg-brand-lilac-900",
      secondary: "bg-black-600 text-white/90",
    },
  },

  defaultVariants: {
    variant: "default",
  },
});

export const descriptionVariants = cva({
  variants: {
    variant: {
      default: "text-brand-blue-300",
      secondary: "text-white/90",
    },
  },

  defaultVariants: {
    variant: "default",
  },
});

const copyButtonVariants = cva({
  variants: {
    variant: {
      default: "text-brand-blue-300 hover:bg-brand-lilac-900 bg-brand-lilac-900",
      secondary: "text-white/90 bg-black-600 hover:bg-black-600",
    },
  },

  defaultVariants: {
    variant: "default",
  },
});

type CopyContainerProps = VariantProps<typeof copyContainerVariants> & {
  className?: string;
  renderAdditionalButton?: (props: ButtonProps) => ReactNode;
} & (
    | {
        text: string;
        children: string | null;
      }
    | {
        text?: string;
        children: string | null;
      }
  );

export function CopyContainer({
  children,
  text,
  variant,
  className,
  renderAdditionalButton = () => null,
}: CopyContainerProps) {
  const button = renderAdditionalButton({
    size: "xs",
    variant: "ghost",
    className: copyButtonVariants({
      variant,
      className: "border-0 p-0",
    }),
  });

  return (
    <Alert className={copyContainerVariants({ variant, className })}>
      <AlertDescription
        className={descriptionVariants({
          variant,
        })}
      >
        <p className="max-w-[36ch] truncate">{children}</p>
      </AlertDescription>

      <div className="absolute right-0 top-1/2 z-10 -translate-y-1/2 group-hover:inline-flex md:hidden">
        {button}

        <CopyButton
          text={text ?? children ?? ""}
          size="xs"
          className={copyButtonVariants({
            variant,
            className: "border-0 p-0",
          })}
        />
      </div>
    </Alert>
  );
}
