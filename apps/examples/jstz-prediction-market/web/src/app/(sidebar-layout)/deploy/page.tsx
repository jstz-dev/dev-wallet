"use client";

import Jstz from "@jstz-dev/jstz-client";
import { Updater } from "@tanstack/react-form";
import { useMutation } from "@tanstack/react-query";
import { useIsClient } from "@uidotdev/usehooks";
import { addDays, setSeconds } from "date-fns";
import { Alert, AlertDescription, AlertTitle } from "jstz-ui/ui/alert";
import { Button } from "jstz-ui/ui/button";
import { Calendar } from "jstz-ui/ui/calendar";
import { Card, CardContent, CardFooter, CardHeader, CardTitle } from "jstz-ui/ui/card";
import { Input } from "jstz-ui/ui/input";
import { Popover, PopoverContent, PopoverTrigger } from "jstz-ui/ui/popover";
import { Spinner } from "jstz-ui/ui/spinner";
import { ChevronDown, TriangleAlert } from "lucide-react";
import { useRouter } from "next/navigation";
import { FormEvent, Suspense, use, useEffect, useEffectEvent, useState } from "react";
import { z } from "zod/mini";
import { useAppForm } from "~/components/ui/form";
import { env } from "~/env";
import { textDecode, textEncode } from "~/lib/encoder";
import { useJstzSignerExtension } from "~/lib/hooks/useJstzSigner";
import { type CreateMarket, MarketForm, marketFormSchema } from "~/lib/validators/market";
import { type Token } from "~/lib/validators/token";
import { useJstzClient } from "~/providers/jstz-client.context";

export const responseSchema = z.union([
  z.object({
    address: z.string(),
  }),
  z.object({
    message: z.string(),
  }),
]);

export default function DeployPage() {
  const { signWithJstzExtension } = useJstzSignerExtension();
  const { getJstzClient } = useJstzClient();
  const router = useRouter();

  const { mutateAsync: deployMarket } = useMutation({
    mutationFn: async (market: CreateMarket) => {
      const payload = {
        content: {
          _type: "RunFunction",
          uri: `jstz://${env.NEXT_PUBLIC_PARENT_SF_ADDRESS}/market`,
          headers: {},
          method: "POST",
          body: textEncode(market),
          gasLimit: 55_000,
        } satisfies Jstz.Operation.RunFunction,
      };

      const { operation, signature, verifier } = await signWithJstzExtension(payload);
      const jstzClient = getJstzClient();

      const {
        result: { inner },
      } = (await jstzClient.operations.injectAndPoll(
        {
          inner: operation,
          signature,
          verifier: verifier ?? null,
        },
        {
          timeout: 10 * 1_000,
        },
        // HACK: This is a workaround for the current version of `jstz-client`.
        // There's an open PR that adds proper inference for the return type of `injectAndPoll`
        // so it returns concrete Receipt based on provided `content._type` instead of a union
        // of all possible Receipts
      )) as { result: { inner: Jstz.Receipt.Success.RunFunction } };

      try {
        const { data: response, error } = responseSchema.safeParse(textDecode(inner.body));

        if (error) {
          console.error("Invalid response was given.");
          return;
        } else if ("message" in response) {
          console.info(`Completed call. Response: ${response.message}`);
          return;
        }

        router.push(`/markets/${response.address}`);
        return;
      } catch (e) {
        console.info(`Completed call. Couldn't parse it to JSON.`);

        if (typeof inner !== "string") {
          console.dir(textDecode(inner.body));
        }
      }
    },
  });

  const form = useAppForm({
    defaultValues: {
      admins: [] as string[],
      question: "",
      resolutionDate: setSeconds(addDays(new Date(), 1), 0),
      pool: 0,
      tokens: [
        {
          token: "yes" as Token["token"],
          amount: 500,
          price: 500_000,
        },
        {
          token: "no" as Token["token"],
          amount: 500,
          price: 500_000,
        },
      ],
    },

    validators: {
      onSubmit: marketFormSchema,
    },

    onSubmit: async ({ value }) => {
      const newMarket = { ...value, resolutionDate: value.resolutionDate.toISOString() };
      await deployMarket(newMarket);
    },
  });

  function onSubmit(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    e.stopPropagation();
    void form.handleSubmit();
  }

  return (
    <main className="flex-1">
      <div className="p-8">
        <Card className="max-w-240 mx-auto">
          <CardHeader>
            <CardTitle>Deploy Page</CardTitle>
          </CardHeader>
          <form.AppForm>
            <form onSubmit={onSubmit}>
              <CardContent className="gap-4 flex-col flex">
                <form.AppField name="question">
                  {(field) => (
                    <field.FormItem>
                      <field.FormLabel htmlFor="question">Question</field.FormLabel>

                      <field.FormControl>
                        <Input
                          type="text"
                          name="question"
                          placeholder="Will Jstz be released to the mainnet by the end of Q2 2026?"
                          value={field.state.value}
                          onChange={(e) => field.handleChange(e.target.value)}
                          onBlur={field.handleBlur}
                        />
                      </field.FormControl>

                      <field.FormMessage />
                    </field.FormItem>
                  )}
                </form.AppField>

                <form.AppField name="resolutionDate">
                  {(field) => (
                    <div className="flex gap-4 w-full">
                      <field.FormItem className="flex-1">
                        <field.FormLabel htmlFor="resolutionDate">Resolution Date</field.FormLabel>

                        <DatePicker date={field.state.value} onChange={field.handleChange} />
                      </field.FormItem>

                      <field.FormItem className="flex-1">
                        <field.FormLabel htmlFor="time">Resolution Time</field.FormLabel>

                        <field.FormControl>
                          <Input
                            type="time"
                            name="time"
                            id="time-picker"
                            step="60"
                            defaultValue={getCurrentTime()}
                            className="bg-background appearance-none [&::-webkit-calendar-picker-indicator]:hidden [&::-webkit-calendar-picker-indicator]:appearance-none"
                            onChange={(e) => {
                              const current = field.state.value;
                              const [hours, minutes] = e.target.value.split(":").map(Number);

                              current.setHours(hours);
                              current.setMinutes(minutes);

                              field.handleChange(current);
                            }}
                          />
                        </field.FormControl>
                      </field.FormItem>
                    </div>
                  )}
                </form.AppField>
              </CardContent>

              <CardFooter className="flex-col items-start gap-4 mt-4">
                <form.Subscribe selector={(state) => [state.canSubmit, state.isSubmitting]}>
                  {([canSubmit, isSubmitting]) => (
                    <Suspense
                      fallback={
                        <Button type="submit" disabled iconPosition="right">
                          Deploy
                        </Button>
                      }
                    >
                      <DeployButton isSubmitting={isSubmitting} canSubmit={canSubmit} />
                    </Suspense>
                  )}
                </form.Subscribe>
              </CardFooter>
            </form>
          </form.AppForm>
        </Card>
      </div>
    </main>
  );
}

interface DeployButtonProps {
  canSubmit: boolean;
  isSubmitting: boolean;
}

function DeployButton({ canSubmit, isSubmitting }: DeployButtonProps) {
  const isClient = useIsClient();

  const { checkExtensionAvailability } = useJstzSignerExtension();
  const [availabilityPromise, setAvailabilityPromise] = useState(Promise.resolve(false));

  const onRender = useEffectEvent(() => {
    setAvailabilityPromise(checkExtensionAvailability());
  });

  useEffect(() => {
    onRender();
  }, []);

  const isSignerAvailable = use(availabilityPromise);

  return (
    <>
      <Button
        type="submit"
        disabled={!isSignerAvailable || !canSubmit || isSubmitting}
        className="max-w-min"
        iconPosition="right"
        renderIcon={(props) => isSubmitting && <Spinner {...props} />}
      >
        Deploy
      </Button>

      {isClient && !isSignerAvailable && (
        <Alert variant="warning">
          <TriangleAlert />

          <AlertTitle>Extension is unavailable.</AlertTitle>

          <AlertDescription>
            To use this form you need to sign the operation with a dev-wallet.
          </AlertDescription>
        </Alert>
      )}
    </>
  );
}

const localeTime = new Intl.DateTimeFormat("en-UK", {
  hour: "2-digit",
  minute: "2-digit",
  hour12: false,
});

function getCurrentTime() {
  return localeTime.format(new Date());
}

const localeDate = new Intl.DateTimeFormat("en-UK");

interface DatePickerProps {
  date: MarketForm["resolutionDate"];
  onChange: (value: Updater<MarketForm["resolutionDate"]>) => void;
}

function DatePicker({ date, onChange }: DatePickerProps) {
  const [open, setOpen] = useState(false);

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <Button
          className="rounded-xl p-5.5"
          variant="outline"
          iconPosition="right"
          renderIcon={(props) => <ChevronDown {...props} />}
        >
          {localeDate.format(date)}
        </Button>
      </PopoverTrigger>

      <PopoverContent className="w-auto overflow-hidden p-0" align="start">
        <Calendar
          mode="single"
          captionLayout="dropdown"
          selected={date}
          startMonth={new Date()}
          endMonth={new Date(2030, 11)}
          disabled={{ before: addDays(new Date(), 1) }}
          weekStartsOn={1}
          onSelect={(newDate) => {
            if (!newDate) return;

            newDate.setHours(date.getHours());
            newDate.setMinutes(date.getMinutes());

            onChange(newDate);
            setOpen(false);
          }}
        />
      </PopoverContent>
    </Popover>
  );
}
