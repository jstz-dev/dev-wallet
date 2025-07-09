import { Slot } from "@radix-ui/react-slot";
import { createFormHook, createFormHookContexts, useStore } from "@tanstack/react-form";

import { createContext, useContext, useId, type ComponentPropsWithRef } from "react";
import { Label } from "~/components/ui/label";
import { cn } from "~/lib/utils";

const {
  fieldContext,
  formContext,
  useFieldContext: useTanstackFieldContext,
  useFormContext,
} = createFormHookContexts();

const { useAppForm, withForm } = createFormHook({
  fieldContext,
  formContext,
  fieldComponents: {
    FormLabel,
    FormControl,
    FormDescription,
    FormMessage,
    FormItem,
  },
  formComponents: {},
});

type FormItemContextValue = {
  id: string;
};

const FormItemContext = createContext<FormItemContextValue>({} as FormItemContextValue);

function FormItem({ className, ...props }: ComponentPropsWithRef<"div">) {
  const id = useId();

  return (
    <FormItemContext.Provider value={{ id }}>
      <div data-slot="form-item" className={cn("grid gap-2", className)} {...props} />
    </FormItemContext.Provider>
  );
}

function useFieldContext() {
  const { id } = useContext(FormItemContext);
  const ctx = useTanstackFieldContext();

  const errors = useStore(ctx.store, (state): unknown[] => state.meta.errors);
  // eslint-disable-next-line @typescript-eslint/no-unnecessary-condition
  if (!ctx) {
    throw new Error("useFieldContext should be used within <FormItem>");
  }

  return {
    id,
    formItemId: `${id}-form-item`,
    formDescriptionId: `${id}-form-item-description`,
    formMessageId: `${id}-form-item-message`,
    errors,
    ...ctx, // eslint-disable-line @typescript-eslint/no-misused-spread
  };
}

function FormLabel({ className, ...props }: ComponentPropsWithRef<typeof Label>) {
  const { formItemId, errors } = useFieldContext();

  return (
    <Label
      data-slot="form-label"
      data-error={!!errors.length}
      className={cn("data-[error=true]:text-destructive", className)}
      htmlFor={formItemId}
      {...props}
    />
  );
}

function FormControl({ ...props }: ComponentPropsWithRef<typeof Slot>) {
  const { errors, formItemId, formDescriptionId, formMessageId } = useFieldContext();

  return (
    <Slot
      data-slot="form-control"
      id={formItemId}
      aria-describedby={
        !errors.length ? formDescriptionId : `${formDescriptionId} ${formMessageId}`
      }
      aria-invalid={!!errors.length}
      {...props}
    />
  );
}

function FormDescription({ className, ...props }: ComponentPropsWithRef<"p">) {
  const { formDescriptionId } = useFieldContext();

  return (
    <p
      data-slot="form-description"
      id={formDescriptionId}
      className={cn("text-muted-foreground text-sm", className)}
      {...props}
    />
  );
}

function FormMessage({ className, ...props }: ComponentPropsWithRef<"p">) {
  const { errors, formMessageId } = useFieldContext();
  // @ts-expect-error There is a message property on the error object
  const body = errors.length ? String(errors.at(0)?.message ?? "") : props.children;
  if (!body) return null;

  return (
    <p
      data-slot="form-message"
      id={formMessageId}
      className={cn("text-destructive text-sm", className)}
      {...props}
    >
      {body}
    </p>
  );
}

export { useAppForm, useFormContext, useFieldContext, withForm };
