export interface Asset {
  name: string
  symbol: string
  supply: number
  basePrice: number
  slope: number
  listed: boolean
}

export interface UserBalance {
  [symbol: string]: number
}

export interface Transaction {
  type: "buy" | "swap" | "list" | "unlist"
  symbol?: string
  fromSymbol?: string
  toSymbol?: string
  amount?: number
  received?: number
  cost?: number
  basePrice?: number
  slope?: number
  time: number
}

export interface SwapResult {
  message: string
  valueUsed: number
}

export interface BuyResult {
  message: string
  cost: number
}
