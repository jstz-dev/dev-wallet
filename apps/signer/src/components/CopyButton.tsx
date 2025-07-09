import { useCopyToClipboard } from "@uidotdev/usehooks";

import { Button, type ButtonProps } from "jstz-ui/ui/button";
import { cn } from "jstz-ui/utils";
import { Clipboard, ClipboardCheck } from "lucide-react";
import { useState } from "react";

interface CopyButtonProps extends Omit<ButtonProps, "children"> {
  text: string;
}

export function CopyButton({ text, className, ...props }: CopyButtonProps) {
  const [_, copyToClipboard] = useCopyToClipboard();
  const [copyButtonDisabled, setCopyButtonDisabled] = useState(false);

  async function handleCopy() {
    setCopyButtonDisabled(true);

    setTimeout(() => {
      setCopyButtonDisabled(false);
    }, 1_000);

    await copyToClipboard(text);
  }

  return (
    <Button
      variant="ghost"
      size="icon_square"
      disabled={copyButtonDisabled}
      onClick={handleCopy}
      className={cn("rounded-xl disabled:cursor-not-allowed disabled:opacity-100", className)}
      renderIcon={(props) =>
        copyButtonDisabled ? (
          <ClipboardCheck {...props} className={cn(props.className, "text-green-600")} />
        ) : (
          <Clipboard {...props} />
        )
      }
      {...props}
    />
  );
}
