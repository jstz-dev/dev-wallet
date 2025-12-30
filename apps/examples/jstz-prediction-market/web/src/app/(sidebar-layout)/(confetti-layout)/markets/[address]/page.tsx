import { APIError } from "@jstz-dev/jstz-client";
import { dehydrate, HydrationBoundary } from "@tanstack/react-query";
import { notFound } from "next/navigation";
import assert from "node:assert";
import { HTTPCode } from "~/lib/HTTPCode";
import { createJstzClient } from "~/lib/jstz-signer.service";
import { getQueryClient } from "~/providers/query-provider";
import { accounts } from "~/queries/account.queries";
import { smartFunctions } from "~/queries/smartFunctions.queries";
import { MarketDetails } from "./market-details";

export default async function MarketPage({ params }: PageProps<"/markets/[address]">) {
  const { address } = await params;

  const jstzClient = createJstzClient();
  const queryClient = getQueryClient();

  const kvOptions = smartFunctions.getKv(address, "root", jstzClient);

  void queryClient.prefetchQuery(accounts.balance(address + "1"));
  await queryClient.prefetchQuery(kvOptions);

  const kvState = queryClient.getQueryState<string, APIError>(kvOptions.queryKey);
  assert(
    !!kvState,
    "At this point kv query state should have been populated. If it's undefined that means query has not been resolved yet.",
  );

  const { error } = kvState;

  if (error?.status === HTTPCode.NOT_FOUND) {
    return notFound();
  }

  const errorHasStatus = error && !!error.status;

  const isServerError =
    errorHasStatus && (error.status >= HTTPCode.INTERNAL_SERVER_ERROR || error.status < 600);

  // NOTE: Trigger error boundary.
  if (isServerError) {
    throw error;
  }

  return (
    <HydrationBoundary state={dehydrate(queryClient)}>
      <MarketDetails address={address} />
    </HydrationBoundary>
  );
}
