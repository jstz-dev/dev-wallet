import { X } from "lucide-react";
import type { FormEvent } from "react";
import { z } from "zod/v4-mini";
import { Button } from "~/components/ui/button";
import { Input } from "~/components/ui/input";
import { cn } from "~/lib/utils";
import type { WalletType } from "~/lib/vault";

import { PasteButton } from "./PasteButton";
import { useAppForm } from "./ui/form";

interface ImportWalletFormProps {
  onSubmit: (form: WalletType) => void;
}

const importWalletSchema = z.object({
  address: z.string().check(z.length(36, "Address must be exactly 36 characters long")),
  publicKey: z.string().check(z.minLength(1,  "Public key is required")),
  privateKey: z.string().check(z.minLength(1, "Private key is required")),
})

export function ImportWalletForm({ onSubmit }: ImportWalletFormProps) {
  const form = useAppForm({
    defaultValues: {
      address: "",
      publicKey: "",
      privateKey: "",
    },

    validators: {
      onSubmit: importWalletSchema,
    },

    onSubmit: ({ value }) => onSubmit(value),
  });

  function handleSubmit(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    e.stopPropagation();
    void form.handleSubmit();
  }

  return (
    <form.AppForm>
      <form className="flex w-full max-w-96 flex-col gap-4" onSubmit={handleSubmit}>
        <form.AppField name="address">
          {(field) => (
            <field.FormItem>
              <field.FormLabel htmlFor="address" className="text-xs text-white/50 uppercase">
                Jstz account address:
              </field.FormLabel>

              <field.FormControl>
                <Input
                  id="address"
                  type="text"
                  placeholder="Type or paste address"
                  value={field.state.value}
                  onChange={(e) => field.handleChange(e.target.value)}
                  renderButton={(props) =>
                    field.state.value.length === 0 ? (
                      <PasteButton {...props} onPaste={(text) => field.setValue(text)} />
                    ) : (
                      <Button
                        {...props}
                        variant="ghost"
                        size="icon_square"
                        className={cn(props.className, "size-9")}
                        onClick={() => field.setValue("")}
                        renderIcon={(props) => <X {...props} />}
                      />
                    )
                  }
                />
              </field.FormControl>

              <field.FormMessage />
            </field.FormItem>
          )}
        </form.AppField>

        <form.AppField name="publicKey">
          {(field) => (
            <field.FormItem>
              <field.FormLabel htmlFor="privateKey" className="text-xs text-white/50 uppercase">
                Public key:
              </field.FormLabel>

              <field.FormControl>
                <Input
                  type="text"
                  id="privateKey"
                  placeholder="Type or paste key"
                  value={field.state.value}
                  onChange={(e) => field.handleChange(e.target.value)}
                  renderButton={(props) =>
                    field.state.value.length === 0 ? (
                      <PasteButton {...props} onPaste={(text) => field.setValue(text)} />
                    ) : (
                      <Button
                        {...props}
                        variant="ghost"
                        size="icon_square"
                        className={cn(props.className, "size-9")}
                        onClick={() => field.setValue("")}
                        renderIcon={(props) => <X {...props} />}
                      />
                    )
                  }
                />
              </field.FormControl>

              <field.FormMessage />
            </field.FormItem>
          )}
        </form.AppField>

        <form.AppField name="privateKey">
          {(field) => (
            <field.FormItem>
              <field.FormLabel htmlFor="publicKey" className="text-xs text-white/50 uppercase">
                Secret key:
              </field.FormLabel>

              <field.FormControl>
                <Input
                  type="text"
                  id="publicKey"
                  placeholder="Type or paste key"
                  value={field.state.value}
                  onChange={(e) => field.handleChange(e.target.value)}
                  renderButton={(props) =>
                    field.state.value.length === 0 ? (
                      <PasteButton {...props} onPaste={(text) => field.setValue(text)} />
                    ) : (
                      <Button
                        {...props}
                        variant="ghost"
                        size="icon_square"
                        className={cn(props.className, "size-9")}
                        onClick={() => field.setValue("")}
                        renderIcon={(props) => <X {...props} />}
                      />
                    )
                  }
                />
              </field.FormControl>

              <field.FormMessage />
            </field.FormItem>
          )}
        </form.AppField>

        <form.Subscribe selector={(state) => [state.isFormValid]}>
          {([isValid]) => {
            return (
              <Button disabled={!isValid} type="submit" variant="secondary" className="rounded-md">
                Add Wallet
              </Button>
            );
          }}
        </form.Subscribe>
      </form>
    </form.AppForm>
  );
}
