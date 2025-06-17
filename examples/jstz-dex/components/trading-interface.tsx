"use client"

import { useState, useEffect } from "react"
import { useForm } from "react-hook-form"
import { zodResolver } from "@hookform/resolvers/zod"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Badge } from "@/components/ui/badge"
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form"
import { ArrowUpDown, TrendingUp } from "lucide-react"
import { DexAPI } from "@/services/dex-api"
import { buyTokenSchema, swapTokenSchema, type BuyTokenForm, type SwapTokenForm } from "@/lib/schemas"
import type { Asset, BalanceMutationResponse, UserBalance } from "@/types/dex";
import { useToast } from "@/hooks/use-toast"
import { useAssetsContext } from "@/contexts/assets.context";
import { useWalletContext } from "@/contexts/wallet.context";

interface TradingInterfaceProps {
  userAddress: string
  userBalances: UserBalance
  onBalanceUpdate: () => void
  extensionAvailable: boolean
}

export function TradingInterface({
  userAddress,
  userBalances,
  onBalanceUpdate,
  extensionAvailable,
}: TradingInterfaceProps) {
  const {assets, setAssets} = useAssetsContext()
  const {setUserBalances, setTransactions} = useWalletContext()

  const [selectedAsset, setSelectedAsset] = useState<Asset | null>(null)
  const { toast } = useToast()

  const buyForm = useForm<BuyTokenForm>({
    resolver: zodResolver(buyTokenSchema),
    defaultValues: {
      assetSymbol: "",
      amount: 1,
    },
  })

  const swapForm = useForm<SwapTokenForm>({
    resolver: zodResolver(swapTokenSchema),
    defaultValues: {
      fromSymbol: "",
      toSymbol: "",
      amount: 1,
    },
  })

  // Watch for asset selection changes
  const watchedAssetSymbol = buyForm.watch("assetSymbol")
  useEffect(() => {
    if (watchedAssetSymbol) {
      const asset = assets.find((a) => a.symbol === watchedAssetSymbol)
      setSelectedAsset(asset || null)
    }
  }, [watchedAssetSymbol, assets])

  async function updateMeta(response: BalanceMutationResponse) {
    setAssets(response.assets)
    setUserBalances(response.balances)
    setTransactions(response.transactions)
  }


  const onBuySubmit = async (data: BuyTokenForm) => {
    if (!extensionAvailable) {
      toast({
        title: "Extension Unavailable",
        description: "Cannot execute trades while the jstz signer extension is disconnected",
        variant: "destructive",
      })
      return
    }

    try {
      const result = await DexAPI.buyTokens({
        symbol: data.assetSymbol,
        amount: data.amount,
        address: userAddress,
      })

      toast({
        title: "Success",
        description: `${result.message} Cost: ${result.cost.toFixed(4)}`,
      })

      buyForm.reset()
      onBalanceUpdate()
      void updateMeta(result)
    } catch (error) {
      toast({
        title: "Error",
        description: error instanceof Error ? error.message : "Failed to buy tokens",
        variant: "destructive",
      })
    }
  }

  const onSwapSubmit = async (data: SwapTokenForm) => {
    if (!extensionAvailable) {
      toast({
        title: "Extension Unavailable",
        description: "Cannot execute swaps while the jstz signer extension is disconnected",
        variant: "destructive",
      })
      return
    }

    try {
      const result = await DexAPI.swapTokens({
        fromSymbol: data.fromSymbol,
        toSymbol: data.toSymbol,
        amount: data.amount,
        address: userAddress,
      })

      toast({
        title: "Success",
        description: result.message,
      })

      swapForm.reset()
      void updateMeta(result)

      onBalanceUpdate()
    } catch (error) {
      toast({
        title: "Error",
        description: error instanceof Error ? error.message : "Failed to swap tokens",
        variant: "destructive",
      })
    }
  }

  const calculateBuyPrice = () => {
    if (!selectedAsset || !buyForm.watch("amount")) return 0
    return DexAPI.calculateTokenPrice(selectedAsset, buyForm.watch("amount"))
  }

  // Get max swap amount for validation
  const maxSwapAmount = swapForm.watch("fromSymbol") ? userBalances[swapForm.watch("fromSymbol")] || 0 : 0

  return (
    <Card className="w-full max-w-2xl">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <TrendingUp className="h-5 w-5" />
          Trading Interface
        </CardTitle>
      </CardHeader>
      <CardContent>
        <Tabs defaultValue="buy" className="w-full">
          <TabsList className="grid w-full grid-cols-2">
            <TabsTrigger value="buy">Buy Tokens</TabsTrigger>
            <TabsTrigger value="swap">Swap Tokens</TabsTrigger>
          </TabsList>

          <TabsContent value="buy" className="space-y-4">
            <Form {...buyForm}>
              <form onSubmit={buyForm.handleSubmit(onBuySubmit)} className="space-y-4">
                <FormField
                  control={buyForm.control}
                  name="assetSymbol"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Select Asset</FormLabel>
                      <Select onValueChange={field.onChange} defaultValue={field.value}>
                        <FormControl>
                          <SelectTrigger>
                            <SelectValue placeholder="Choose an asset to buy" />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          {assets.map((asset) => (
                            <SelectItem key={asset.symbol} value={asset.symbol}>
                              <div className="flex items-center justify-between w-full">
                                <span>
                                  {asset.name} ({asset.symbol})
                                </span>
                                <Badge variant="secondary">
                                  {(asset.basePrice + asset.supply * asset.slope).toFixed(4)}
                                </Badge>
                              </div>
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                {selectedAsset && (
                  <div className="p-4 bg-muted rounded-lg space-y-2">
                    <div className="flex justify-between">
                      <span>Current Price:</span>
                      <span className="font-mono">
                        {(selectedAsset.basePrice + selectedAsset.supply * selectedAsset.slope).toFixed(4)}
                      </span>
                    </div>
                    <div className="flex justify-between">
                      <span>Supply:</span>
                      <span className="font-mono">{selectedAsset.supply}</span>
                    </div>
                    <div className="flex justify-between">
                      <span>Base Price:</span>
                      <span className="font-mono">{selectedAsset.basePrice}</span>
                    </div>
                    <div className="flex justify-between">
                      <span>Slope:</span>
                      <span className="font-mono">{selectedAsset.slope}</span>
                    </div>
                  </div>
                )}

                <FormField
                  control={buyForm.control}
                  name="amount"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Amount</FormLabel>
                      <FormControl>
                        <Input type="number" placeholder="Enter amount to buy" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                {buyForm.watch("amount") && selectedAsset && (
                  <div className="p-4 bg-muted rounded-lg">
                    <div className="flex justify-between font-semibold">
                      <span>Total Cost:</span>
                      <span className="font-mono">{calculateBuyPrice().toFixed(4)}</span>
                    </div>
                  </div>
                )}

                <Button
                  type="submit"
                  disabled={buyForm.formState.isSubmitting || !extensionAvailable}
                  className="w-full"
                >
                  {buyForm.formState.isSubmitting
                    ? "Buying..."
                    : !extensionAvailable
                      ? "Extension Unavailable"
                      : "Buy Tokens"}
                </Button>
              </form>
            </Form>
          </TabsContent>

          <TabsContent value="swap" className="space-y-4">
            <Form {...swapForm}>
              <form onSubmit={swapForm.handleSubmit(onSwapSubmit)} className="space-y-4">
                <FormField
                  control={swapForm.control}
                  name="fromSymbol"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>From</FormLabel>
                      <Select onValueChange={field.onChange} defaultValue={field.value}>
                        <FormControl>
                          <SelectTrigger>
                            <SelectValue placeholder="Select token to swap from" />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          {Object.entries(userBalances).map(([symbol, balance]) => (
                            <SelectItem key={symbol} value={symbol}>
                              <div className="flex items-center justify-between w-full">
                                <span>{symbol}</span>
                                <Badge variant="outline">Balance: {balance}</Badge>
                              </div>
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <div className="flex justify-center">
                  <ArrowUpDown className="h-4 w-4 text-muted-foreground" />
                </div>

                <FormField
                  control={swapForm.control}
                  name="toSymbol"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>To</FormLabel>
                      <Select onValueChange={field.onChange} defaultValue={field.value}>
                        <FormControl>
                          <SelectTrigger>
                            <SelectValue placeholder="Select token to receive" />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          {assets.map((asset) => (
                            <SelectItem key={asset.symbol} value={asset.symbol}>
                              {asset.name} ({asset.symbol})
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={swapForm.control}
                  name="amount"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Amount</FormLabel>
                      <FormControl>
                        <Input type="number" placeholder="Enter amount to swap" max={maxSwapAmount} {...field} />
                      </FormControl>
                      {swapForm.watch("fromSymbol") && (
                        <p className="text-sm text-muted-foreground">
                          Available: {maxSwapAmount} {swapForm.watch("fromSymbol")}
                        </p>
                      )}
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <Button
                  type="submit"
                  disabled={swapForm.formState.isSubmitting || !extensionAvailable}
                  className="w-full"
                >
                  {swapForm.formState.isSubmitting
                    ? "Swapping..."
                    : !extensionAvailable
                      ? "Extension Unavailable"
                      : "Swap Tokens"}
                </Button>
              </form>
            </Form>
          </TabsContent>
        </Tabs>
      </CardContent>
    </Card>
  )
}
