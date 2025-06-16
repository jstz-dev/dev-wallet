import { callSmartFunction, checkExtensionAvailability } from "@/lib/jstz-signer.service"
import type { Asset, UserBalance, Transaction, SwapResult, BuyResult } from "@/types/dex"

const encoder = new TextEncoder()
const decoder = new TextDecoder()

export class DexAPI {
  private static async makeSmartFunctionCall<T>(method: string, uri: string, body?: any, gasLimit = 55000): Promise<T> {
    return new Promise((resolve, reject) => {
      callSmartFunction({
        smartFunctionRequest: {
          _type: "RunFunction",
          body: body ? Array.from(encoder.encode(JSON.stringify(body))) : [],
          gasLimit,
          headers: {},
          method,
          uri,
        },
        onSignatureReceived: async (response, jstzClient) => {
          const { operation, signature } = response.data

          try {
            const {
              result: { inner },
            } = await jstzClient.operations.injectAndPoll({
              inner: operation,
              signature,
            })

            let returnedMessage: any = "No message."

            if (typeof inner === "object" && "body" in inner && inner.body) {
              try {
                returnedMessage = JSON.parse(decoder.decode(new Uint8Array(inner.body)))
              } catch {
                returnedMessage = decoder.decode(new Uint8Array(inner.body))
              }
            }

            if (typeof inner === "string") {
              returnedMessage = inner
            }

            console.info(`Completed call to ${uri}. Response:`, returnedMessage)
            resolve(returnedMessage)
          } catch (err) {
            console.error("Error in smart function call:", err)
            reject(err)
          }
        },
      }).catch(reject)
    })
  }

  static async getAssets(): Promise<Asset[]> {
    try {
      const result = await this.makeSmartFunctionCall<Asset[]>("GET", "jstz://KT19xdvwdZgWEHUDbAgMBcNBBhEtgT8rgJRR/assets")
      console.log("assets", result)
      return Array.isArray(result) ? result : []
    } catch (error) {
      console.error("Failed to fetch assets:", error)
      // Return mock data for development
      return [
        {
          name: "Demo Token A",
          symbol: "DTA",
          supply: 100,
          basePrice: 0.1,
          slope: 0.001,
          listed: true,
        },
        {
          name: "Demo Token B",
          symbol: "DTB",
          supply: 50,
          basePrice: 0.2,
          slope: 0.002,
          listed: true,
        },
      ]
    }
  }

  static async getAsset(symbol: string): Promise<Asset> {
    return this.makeSmartFunctionCall<Asset>("GET", `jstz://KT19xdvwdZgWEHUDbAgMBcNBBhEtgT8rgJRR/assets/${symbol}`)
  }

  static async mintAsset(data: {
    name: string
    symbol: string
    initialSupply: number
    basePrice: number
    slope: number
  }): Promise<{ message: string }> {
    return this.makeSmartFunctionCall<{ message: string }>("POST", "jstz://KT19xdvwdZgWEHUDbAgMBcNBBhEtgT8rgJRR/assets/mint", data, 60000)
  }

  static async listAsset(data: {
    symbol: string
    address: string
    basePrice: number
    slope: number
  }): Promise<{ message: string }> {
    return this.makeSmartFunctionCall<{ message: string }>("POST", "jstz://KT19xdvwdZgWEHUDbAgMBcNBBhEtgT8rgJRR/assets/list", data, 55000)
  }

  static async unlistAsset(symbol: string, address: string): Promise<{ message: string }> {
    return this.makeSmartFunctionCall<{ message: string }>(
      "POST",
      "jstz://KT19xdvwdZgWEHUDbAgMBcNBBhEtgT8rgJRR/assets/unlist",
      { symbol, address },
      55000,
    )
  }

  static async getUserBalances(address: string): Promise<UserBalance> {
    try {
      const result = await this.makeSmartFunctionCall<UserBalance>("GET", `jstz://KT19xdvwdZgWEHUDbAgMBcNBBhEtgT8rgJRR/user/${address}/balances`)
      return result || {}
    } catch (error) {
      console.error("Failed to fetch user balances:", error)
      return {}
    }
  }

  static async getUserTransactions(address: string): Promise<Transaction[]> {
    try {
      const result = await this.makeSmartFunctionCall<Transaction[]>("GET", `jstz://KT19xdvwdZgWEHUDbAgMBcNBBhEtgT8rgJRR/user/${address}/txs`)
      return Array.isArray(result) ? result : []
    } catch (error) {
      console.error("Failed to fetch transactions:", error)
      return []
    }
  }

  static async buyTokens(data: {
    symbol: string
    amount: number
    address: string
  }): Promise<BuyResult> {
    return this.makeSmartFunctionCall<BuyResult>("POST", "jstz://KT19xdvwdZgWEHUDbAgMBcNBBhEtgT8rgJRR/buy", data, 70000)
  }

  static async swapTokens(data: {
    fromSymbol: string
    toSymbol: string
    amount: number
    address: string
  }): Promise<SwapResult> {
    return this.makeSmartFunctionCall<SwapResult>("POST", "jstz://KT19xdvwdZgWEHUDbAgMBcNBBhEtgT8rgJRR/swap", data, 80000)
  }

  static calculateTokenPrice(asset: Asset, quantity = 1): number {
    let totalCost = 0
    for (let i = 0; i < quantity; i++) {
      totalCost += asset.basePrice + (asset.supply + i) * asset.slope
    }
    return totalCost
  }

  static async checkExtensionAvailability(): Promise<boolean> {
    try {
      const response = await checkExtensionAvailability()
      return response.data.success
    } catch (error) {
      console.error("Extension not available:", error)
      return false
    }
  }
}
