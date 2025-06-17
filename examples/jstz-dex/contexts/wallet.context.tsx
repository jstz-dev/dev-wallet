"use client";
import { createContext, useContext, useState, type PropsWithChildren } from "react";

import { useToast } from "@/hooks/use-toast";
import { DexAPI } from "@/services/dex-api";
import type { Asset, UserBalance } from "@/types/dex";
import { requestAddress } from "@/lib/jstz-signer.service";

interface WalletContext {
  userAddress: string;
  userBalances: UserBalance;
  setUserBalances: (balances: UserBalance) => void;
  isConnected: boolean;
  checkExtensionStatus: () => Promise<void>;
  extensionStatus: "checking" | "available" | "unavailable";
  connecting: boolean;
  connectWallet: () => Promise<void>;
  disconnectWallet: () => void;
  loadUserBalances: (address?: string) => Promise<void>;
}

const WalletContext = createContext<WalletContext>({} as WalletContext);

interface WalletProps extends PropsWithChildren {}

export function WalletContextProvider({ children }: WalletProps) {
  const [userAddress, setUserAddress] = useState("")
  const [userBalances, setUserBalances] = useState<UserBalance>({})
  const [isConnected, setIsConnected] = useState(false)
  const [extensionStatus, setExtensionStatus] = useState<"checking" | "available" | "unavailable">("available")
  const [connecting, setConnecting] = useState(false)

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

  return (
    <WalletContext
      value={{
        userAddress,
        userBalances,
        setUserBalances,
        isConnected,
        extensionStatus,
        connecting,
        checkExtensionStatus,
        connectWallet,
        disconnectWallet,
        loadUserBalances
      }}
    >
      {children}
    </WalletContext>
  );
}

export function useWalletContext() {
  return useContext(WalletContext);
}
