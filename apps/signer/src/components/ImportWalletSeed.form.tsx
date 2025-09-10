import { Button } from "jstz-ui/ui/button";
import { Input } from "jstz-ui/ui/input";
import { cn } from "jstz-ui/utils";
import { X } from "lucide-react";
import type { FormEvent } from "react";
import { z } from "zod/v4-mini";
import { spawn, type WalletType} from "~/lib/vault";

import { PasteButton } from "./PasteButton";
import { useAppForm } from "./ui/form";

interface ImportWalletFormProps {
  onSubmit: (form: WalletType) => void;
}

const importWalletSchema = z.object({
  name: z.string().check(z.minLength(1, "Wallet name is required")),
  mnemonic: z.string().check(z.minLength(1, "Seed is required")),
});

type ImportWalletForm = z.infer<typeof importWalletSchema>;

export function ImportWalletSeedForm({ onSubmit }: ImportWalletFormProps) {
  const form = useAppForm({
    defaultValues: {
      name: "",
      mnemonic: "",
    },

    validators: {
      onSubmit: importWalletSchema,
    },

    onSubmit: async ({ value }) => {
      const wallet = await generateWallet(value);
      onSubmit(wallet);
    },
  });

  function handleSubmit(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    e.stopPropagation();
    void form.handleSubmit();
  }

  async function generateWallet(values: ImportWalletForm) {
    const { name, mnemonic } = values;
    const { address, publicKey, privateKey } = await spawn(mnemonic);
    return {
      name,
      address,
      publicKey,
      privateKey,
    };
  }

  return (
    <form.AppForm>
      <form className="flex w-full max-w-96 flex-col gap-4" onSubmit={handleSubmit}>
        <form.AppField name="name">
          {(field) => (
            <field.FormItem>
              <field.FormLabel htmlFor="name" className="text-xs uppercase text-white/50">
                Custom name:
              </field.FormLabel>

              <field.FormControl>
                <Input
                  id="name"
                  type="text"
                  placeholder="Wallet 1"
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

        <form.AppField name="mnemonic">
          {(field) => (
            <field.FormItem>
              <field.FormLabel htmlFor="publicKey" className="text-xs uppercase text-white/50">
                Seed phrase:
              </field.FormLabel>

              <field.FormControl>
                <Input
                  type="text"
                  id="publicKey"
                  placeholder="Type or paste seed phrase"
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
