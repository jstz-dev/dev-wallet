import type { ComponentPropsWithRef } from "react";

import { cn } from "../lib/utils";

export default function Button(props: ComponentPropsWithRef<"button">) {
  return (
    <button
      {...props}
      className={cn(
        "max-w-min rounded-sm border border-black bg-slate-600 px-2 py-1 text-slate-100 hover:bg-slate-500",
        props.className,
      )}
    />
  );
}
