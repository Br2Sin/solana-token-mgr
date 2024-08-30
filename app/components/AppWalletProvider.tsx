"use client";

import React, { useMemo } from "react";
import {
  ConnectionProvider,
  WalletProvider,
} from "@solana/wallet-adapter-react";
import {
  LedgerWalletAdapter,
  PhantomWalletAdapter,
  SolflareWalletAdapter,
  TorusWalletAdapter,
} from "@solana/wallet-adapter-wallets";
import { WalletAdapterNetwork } from "@solana/wallet-adapter-base";
import { WalletModalProvider } from "@solana/wallet-adapter-react-ui";
import { clusterApiUrl } from "@solana/web3.js";
// import { UnsafeBurnerWalletAdapter } from "@solana/wallet-adapter-wallets";

// Default styles that can be overridden by your app
require("@solana/wallet-adapter-react-ui/styles.css");

// imports here

export default function AppWalletProvider({
  children,
}: {
  children: React.ReactNode;
}) {
  const network = WalletAdapterNetwork.Mainnet;
  const endpoint = useMemo(() => clusterApiUrl(network), [network]);
  const wallets = useMemo(
    () => [
      // manually add any legacy wallet adapters here
      // new UnsafeBurnerWalletAdapter(),
      new PhantomWalletAdapter(),
      new SolflareWalletAdapter({ network }),
      new TorusWalletAdapter(),
      new LedgerWalletAdapter(),
    ],
    [network]
  );

  return (
    <ConnectionProvider endpoint={endpoint}>
      <WalletProvider wallets={wallets} autoConnect>
        <WalletModalProvider>{children}</WalletModalProvider>
      </WalletProvider>
    </ConnectionProvider>
  );
}
