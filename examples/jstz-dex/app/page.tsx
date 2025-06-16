"use client"

import { useState, useEffect } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { TradingInterface } from "@/components/trading-interface"
import { Portfolio } from "@/components/portfolio"
import { AssetManagement } from "@/components/asset-management"
import { DexAPI } from "@/services/dex-api"
import { requestAddress } from "@/lib/jstz-signer.service"
import type { UserBalance } from "@/types/dex"
import { Wallet, BarChart3, Settings, AlertTriangle, WifiOff, Chrome } from "lucide-react"

export default function DexApp() {
  const [userAddress, setUserAddress] = useState("")
  const [userBalances, setUserBalances] = useState<UserBalance>({})
  const [isConnected, setIsConnected] = useState(false)
  const [extensionStatus, setExtensionStatus] = useState<"checking" | "available" | "unavailable">("available")
  const [connecting, setConnecting] = useState(false)

  // useEffect(() => {
  //   checkExtensionStatus()
  // }, [])

  const checkExtensionStatus = async () => {
    setExtensionStatus("checking")
    try {
      const isAvailable = await DexAPI.checkExtensionAvailability()
      console.log(isAvailable)
      setExtensionStatus(isAvailable ? "available" : "unavailable")
    } catch (error) {
      setExtensionStatus("unavailable")
      console.error("Extension check failed:", error)
    }
  }

  const connectWallet = async () => {
    if (extensionStatus !== "available") {
      return
    }

    setConnecting(true)
    try {
      const response = await requestAddress()
      const address = response.data.accountAddress
      setUserAddress(address)
      setIsConnected(true)
      loadUserBalances(address)
    } catch (error) {
      console.error("Failed to connect wallet:", error)
    } finally {
      setConnecting(false)
    }
  }

  const disconnectWallet = () => {
    setIsConnected(false)
    setUserAddress("")
    setUserBalances({})
  }

  const loadUserBalances = async (address?: string) => {
    const targetAddress = address || userAddress
    if (!targetAddress) return

    try {
      const balances = await DexAPI.getUserBalances(targetAddress)
      setUserBalances(balances)
    } catch (error) {
      console.error("Failed to load user balances:", error)
    }
  }

  if (!isConnected) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 flex items-center justify-center p-4">
        <div className="w-full max-w-md space-y-4">
          {/* Extension Status Alert */}
          {extensionStatus !== "checking" && (
            <Alert variant={extensionStatus === "available" ? "default" : "destructive"}>
              <div className="flex items-center gap-2">
                {extensionStatus === "available" ? <Chrome className="h-4 w-4" /> : <WifiOff className="h-4 w-4" />}
                <AlertDescription>
                  {extensionStatus === "available"
                    ? "jstz Signer extension detected"
                    : "jstz Signer extension not found. Please install the extension to continue."}
                </AlertDescription>
              </div>
              {extensionStatus === "unavailable" && (
                <div className="mt-2">
                  <Button variant="outline" size="sm" onClick={checkExtensionStatus}>
                    Retry Detection
                  </Button>
                </div>
              )}
            </Alert>
          )}

          <Card>
            <CardHeader className="text-center">
              <CardTitle className="text-2xl font-bold">jstz DEX</CardTitle>
              <p className="text-muted-foreground">Decentralized Exchange on Tezos Smart Rollups</p>
            </CardHeader>
            <CardContent className="space-y-4">
              {extensionStatus === "available" ? (
                <>
                  <div className="text-center space-y-2">
                    <p className="text-sm text-muted-foreground">Connect your jstz wallet to start trading</p>
                  </div>
                  <Button
                    onClick={connectWallet}
                    className="w-full"
                    disabled={connecting || extensionStatus !== "available"}
                  >
                    <Wallet className="h-4 w-4 mr-2" />
                    {connecting ? "Connecting..." : "Connect jstz Wallet"}
                  </Button>
                </>
              ) : (
                <div className="text-center space-y-4">
                  <div className="p-4 bg-muted rounded-lg">
                    <Chrome className="h-8 w-8 mx-auto mb-2 text-muted-foreground" />
                    <p className="text-sm text-muted-foreground">
                      Please install the jstz Signer browser extension to use this DEX
                    </p>
                  </div>
                  <Button variant="outline" onClick={checkExtensionStatus} className="w-full">
                    Check Again
                  </Button>
                </div>
              )}

              {extensionStatus === "unavailable" && (
                <Alert>
                  <AlertTriangle className="h-4 w-4" />
                  <AlertDescription>
                    The jstz Signer extension is required to sign transactions and interact with the DEX.
                  </AlertDescription>
                </Alert>
              )}
            </CardContent>
          </Card>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100">
      <header className="bg-white shadow-sm border-b">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            <div>
              <h1 className="text-xl font-bold">jstz DEX</h1>
              <p className="text-sm text-muted-foreground">Bonding Curve Exchange</p>
            </div>
            <div className="flex items-center gap-4">
              {/* Extension Status Indicator */}
              <div className="flex items-center gap-2">
                {extensionStatus === "available" ? (
                  <div className="flex items-center gap-1 text-green-600">
                    <Chrome className="h-4 w-4" />
                    <span className="text-xs">Extension Ready</span>
                  </div>
                ) : (
                  <div className="flex items-center gap-1 text-red-600">
                    <WifiOff className="h-4 w-4" />
                    <span className="text-xs">Extension Error</span>
                  </div>
                )}
              </div>

              <div className="text-right">
                <p className="text-sm font-medium">Connected</p>
                <p className="text-xs text-muted-foreground">
                  {userAddress.slice(0, 6)}...{userAddress.slice(-4)}
                </p>
              </div>
              <Button variant="outline" onClick={disconnectWallet}>
                Disconnect
              </Button>
            </div>
          </div>
        </div>
      </header>

      {/* Extension Status Banner */}
      {extensionStatus === "unavailable" && (
        <div className="bg-yellow-50 border-b border-yellow-200">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-2">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2 text-yellow-800">
                <AlertTriangle className="h-4 w-4" />
                <span className="text-sm">Extension issue detected. Some features may not work properly.</span>
              </div>
              <Button variant="outline" size="sm" onClick={checkExtensionStatus}>
                Retry
              </Button>
            </div>
          </div>
        </div>
      )}

      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <Tabs defaultValue="trade" className="w-full">
          <TabsList className="grid w-full grid-cols-3">
            <TabsTrigger value="trade" className="flex items-center gap-2">
              <BarChart3 className="h-4 w-4" />
              Trade
            </TabsTrigger>
            <TabsTrigger value="portfolio" className="flex items-center gap-2">
              <Wallet className="h-4 w-4" />
              Portfolio
            </TabsTrigger>
            <TabsTrigger value="manage" className="flex items-center gap-2">
              <Settings className="h-4 w-4" />
              Manage Assets
            </TabsTrigger>
          </TabsList>

          <TabsContent value="trade" className="mt-6">
            <div className="flex justify-center">
              <TradingInterface
                userAddress={userAddress}
                userBalances={userBalances}
                onBalanceUpdate={() => loadUserBalances()}
                extensionAvailable={extensionStatus === "available"}
              />
            </div>
          </TabsContent>

          <TabsContent value="portfolio" className="mt-6">
            <Portfolio userAddress={userAddress} userBalances={userBalances} />
          </TabsContent>

          <TabsContent value="manage" className="mt-6">
            <AssetManagement userAddress={userAddress} extensionAvailable={extensionStatus === "available"} />
          </TabsContent>
        </Tabs>
      </main>
    </div>
  )
}
