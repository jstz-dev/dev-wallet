"use client";

import { Badge } from "jstz-ui/ui/badge";
import { Card } from "jstz-ui/ui/card";
import { cn } from "jstz-ui/utils";
import { Clock, TrendingDown, TrendingUp } from "lucide-react";

export interface Market {
  id: string;
  title: string;
  category: string;
  yesPrice: number;
  noPrice: number;
  priceChange: number;
  totalVolume: string;
  endDate: string;
  status: "active" | "resolved";
  winningOutcome?: "yes" | "no";
  userPosition?: {
    side: "yes" | "no";
    amount: string;
  };
}

interface MarketCardProps {
  market: Market;
  onClick?: () => void;
}

export function MarketCard({ market, onClick }: MarketCardProps) {
  const isResolved = market.status === "resolved";
  const changeColor = market.priceChange >= 0 ? "text-success" : "text-destructive";
  const ChangeIcon = market.priceChange >= 0 ? TrendingUp : TrendingDown;

  return (
    <Card
      className={cn(
        "group cursor-pointer overflow-hidden border-border bg-card transition-all hover:border-primary/50",
        onClick && "hover:shadow-lg hover:shadow-primary/10",
      )}
      onClick={onClick}
    >
      <div className="p-5">
        {/* Header */}
        <div className="mb-4 flex items-start justify-between gap-3">
          <div className="flex items-center gap-2">
            <div className="flex h-8 w-8 items-center justify-center rounded-full bg-primary">
              <span className="text-xs font-bold text-primary-foreground">XTZ</span>
            </div>

            <Badge variant="secondary" className="text-xs">
              {market.category}
            </Badge>
          </div>

          <div className="flex flex-col items-end gap-1">
            <div className={cn("flex items-center gap-1 text-sm font-semibold", changeColor)}>
              <ChangeIcon className="size-3" />
              {market.priceChange > 0 ? "+" : ""}
              {market.priceChange}%
            </div>
          </div>
        </div>

        {/* Title */}
        <h3 className="mb-4 text-base font-semibold leading-snug text-card-foreground group-hover:text-primary transition-colors">
          {market.title}
        </h3>

        {/* Probability Display */}
        {!isResolved && (
          <>
            <div className="mb-3 flex items-center justify-between text-sm">
              <span className="font-medium text-muted-foreground">YES {market.yesPrice}%</span>
              <span className="font-medium text-muted-foreground">NO {market.noPrice}%</span>
            </div>

            {/* Probability Bar */}
            <div className="mb-4 h-2 overflow-hidden rounded-full bg-secondary">
              <div
                className="h-full rounded-full bg-linear-to-r from-success to-destructive transition-all"
                style={{ width: `${market.yesPrice}%` }}
              />
            </div>

            {/* Action Buttons */}
            <div className="grid grid-cols-2 gap-2">
              <button className="rounded-lg bg-success/20 py-2 text-sm font-semibold text-success transition-colors hover:bg-success/30">
                YES
              </button>

              <button className="rounded-lg bg-destructive/20 py-2 text-sm font-semibold text-destructive transition-colors hover:bg-destructive/30">
                NO
              </button>
            </div>
          </>
        )}

        {/* Resolved State */}
        {isResolved && (
          <div className="rounded-lg bg-success/20 border border-success/30 p-4">
            <div className="flex items-center justify-between">
              <div>
                <div className="flex items-center gap-2 text-success">
                  <span className="text-sm font-semibold">Market Resolved</span>
                </div>

                <p className="mt-1 text-sm text-success/80">
                  Winning side: {market.winningOutcome?.toUpperCase()}
                </p>
              </div>
            </div>

            {market.userPosition && (
              <button className="mt-3 w-full rounded-lg bg-primary py-2 text-sm font-semibold text-primary-foreground transition-colors hover:bg-primary/90">
                Claim winnings
              </button>
            )}
          </div>
        )}

        {/* Footer */}
        <div className="mt-4 flex items-center justify-between border-t border-border pt-4 text-xs text-muted-foreground">
          <div className="flex items-center gap-1">
            <DollarSign className="h-3 w-3" />
            <span>{market.totalVolume}</span>
          </div>

          <div className="flex items-center gap-1">
            <Clock className="h-3 w-3" />
            <span>{market.endDate}</span>
          </div>

          {isResolved && (
            <Badge variant="destructive" className="text-xs">
              Resolved
            </Badge>
          )}

          {!isResolved && market.userPosition && (
            <Badge variant="default" className="bg-primary text-xs">
              Active
            </Badge>
          )}
        </div>
      </div>
    </Card>
  );
}

function DollarSign({ className }: { className?: string }) {
  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
      className={className}
    >
      <line x1="12" y1="1" x2="12" y2="23" />
      <path d="M17 5H9.5a3.5 3.5 0 0 0 0 7h5a3.5 3.5 0 0 1 0 7H6" />
    </svg>
  );
}
