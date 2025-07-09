import { Clipboard, ClipboardCheck } from "lucide-react";
import { useState } from "react";
// import { usePasteFromClipboard } from "~/lib/hooks/usePasteFromClipboard";
import { cn } from "~/lib/utils";

import { Button, type ButtonProps } from "./ui/button";

interface PasteButtonProps extends Omit<ButtonProps, "children" | "onPaste"> {
  onPaste: (text: string) => void;
}

export function PasteButton({ className, onPaste, ...rest }: PasteButtonProps) {
  const [pasteButtonDisabled, setPasteButtonDisabled] = useState(false);

  async function handlePaste() {
    setPasteButtonDisabled(true);

    setTimeout(() => {
      setPasteButtonDisabled(false);
    }, 1_000);

    const text = await navigator.clipboard.readText();
    onPaste(text);
  }

  return (
    <Button
      variant="ghost"
      size="icon_square"
      disabled={pasteButtonDisabled}
      onClick={handlePaste}
      className={cn("rounded-xl disabled:cursor-not-allowed disabled:opacity-100", className)}
      renderIcon={(props) =>
        pasteButtonDisabled ? (
          <ClipboardCheck {...props} className={cn(props.className, "text-green-600")} />
        ) : (
          <Clipboard {...props} />
        )
      }
      {...rest}
    />
  );
}
