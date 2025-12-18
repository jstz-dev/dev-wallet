import { Button } from "jstz-ui/ui/button";
import { Card, CardContent, CardFooter, CardHeader, CardTitle } from "jstz-ui/ui/card";
import { Separator } from "jstz-ui/ui/separator";
import { Skeleton } from "jstz-ui/ui/skeleton";
import { ArrowLeft } from "lucide-react";
import Link from "next/link";

export default function MarketPageLoading() {
  return (
    <main className="flex-1">
      <div className="p-8">
        {/* Back Button */}
        <Link href="/markets">
          <Button variant="link">
            <ArrowLeft className="size-4" />
            Back to Markets
          </Button>
        </Link>

        {/* Market Details */}
        <div className="grid gap-6 grid-cols-1 xl:grid-cols-3">
          <div className="xl:col-span-2">
            {/* Market Info Card */}
            <Card>
              <CardHeader>
                <div className="mb-4 flex items-start justify-between">
                  <Skeleton className="size-10 rounded-full" />

                  <div className="text-right">
                    <Skeleton className="w-40 h-8" />

                    <div className="text-xs text-muted-foreground">Current odds</div>
                  </div>
                </div>

                <CardTitle>
                  <Skeleton className="w-100 h-4" />
                </CardTitle>
              </CardHeader>

              {/* Probability Bar */}
              <CardContent>
                <div className="mb-2 flex items-center justify-between text-sm">
                  <span className="font-medium text-muted-foreground flex">
                    YES - <Skeleton className="ml-1 h-5 w-7.5" />
                  </span>

                  <span className="font-medium text-muted-foreground flex">
                    NO - <Skeleton className="ml-1 h-5 w-7.5" />
                  </span>
                </div>

                <Skeleton className="w-full h-2" />
              </CardContent>

              <Separator />

              <CardFooter className="w-full justify-between">
                <div>
                  <div className="text-xs text-muted-foreground">Total Volume</div>

                  <Skeleton className="mt-1 h-6 w-full" />
                </div>

                <div>
                  <div className="text-xs text-muted-foreground">End Date</div>

                  <Skeleton className="mt-1 h-6 w-22.5" />
                </div>

                <div>
                  <div className="text-xs text-muted-foreground">Status</div>

                  <Skeleton className="mt-1 h-6 w-15" />
                </div>
              </CardFooter>
            </Card>
          </div>

          <BettingPanelLoading />
        </div>
      </div>
    </main>
  );
}

function BettingPanelLoading() {
  return (
    <Card>
      <CardHeader>
        <div className="mb-4 flex items-start justify-between">
          <div className="flex items-center gap-2">
            <Skeleton className="size-10 rounded-full" />

            <Skeleton className="w-14 h-5.5" />
          </div>

          <Skeleton className="w-79 h-5.5" />
        </div>

        <CardTitle>
          <Skeleton className="w-100 h-4" />
        </CardTitle>
      </CardHeader>

      {/* Betting Side Selection */}
      <CardContent>
        <div className="mb-6">
          <label className="mb-2 block text-sm font-medium text-muted-foreground">
            Betting on:
          </label>
          <div className="grid grid-cols-2 gap-2">
            <button className="rounded-lg border-2 py-3 text-sm font-semibold transition-all border-primary bg-primary text-primary-foreground">
              YES
            </button>

            <button className="rounded-lg border-2 py-3 text-sm font-semibold transition-all border-border bg-destructive/10 text-destructive hover:border-destructive/50">
              NO
            </button>
          </div>
        </div>

        {/* Bet Amount Slider */}
        <div className="mb-4.5">
          <div className="mb-3 flex items-center justify-between">
            <label className="text-sm font-medium text-muted-foreground">Bet Amount:</label>
            <Skeleton className="h-6 w-18" />
          </div>

          <Skeleton className="mb-2 h-4 w-full" />

          <div className="flex justify-between text-xs text-muted-foreground">
            <Skeleton className="h-4 w-10" />
            <Skeleton className="h-4 w-10" />
          </div>
        </div>

        {/* Potential Returns */}
        <Skeleton className="mb-6 h-27 rounded-lg" />

        {/* Action Buttons */}
        <div className="flex gap-2">
          <Button className="flex-1 bg-secondary text-success-foreground hover:bg-secondary/90">
            Place Bet
          </Button>
        </div>
      </CardContent>

      <Separator />

      {/* Footer Info */}
      <CardFooter className="justify-between w-full">
        <Skeleton className="h-6 w-15.5" />

        <Skeleton className="h-6 w-25.5" />

        <Skeleton className="w-14 h-5.5" />
      </CardFooter>
    </Card>
  );
}
