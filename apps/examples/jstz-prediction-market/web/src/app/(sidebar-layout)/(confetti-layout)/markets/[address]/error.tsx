"use client";

import { Button } from "jstz-ui/ui/button";
import { ArrowLeft, ServerCrash } from "lucide-react";
import Link from "next/link";
import { useEffect, useEffectEvent } from "react";

interface MarketDetailsErrorPageProps {
  error: Error & { digest?: string };
  reset: () => void;
}

export default function MarketDetailsErrorPage({ error }: MarketDetailsErrorPageProps) {
  const onRender = useEffectEvent(() => {
    console.error(error);
  });

  useEffect(() => {
    onRender();
  }, []);

  return (
    <main className="flex-1">
      <div className="p-8">
        <Link href="/markets">
          <Button variant="link">
            <ArrowLeft className="size-4" />
            Back to Markets
          </Button>
        </Link>

        <div className="flex flex-col items-center justify-center py-16 px-4 text-center">
          <div className="rounded-full bg-muted p-6 mb-4">
            <ServerCrash className="size-12 text-muted-foreground" />
          </div>

          <h3 className="text-xl font-semibold mb-2">We couldn&apos;t fetch market details</h3>

          <p className="text-muted-foreground max-w-md">
            We couldn&apos;t fetch the market details. This is an error on our side. We&apos;re
            probably working on resolving the issue right at this moment.
          </p>
        </div>
      </div>
    </main>
  );
}
