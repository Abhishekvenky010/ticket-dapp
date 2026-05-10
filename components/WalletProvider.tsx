"use client";
import {FC, ReactNode, useMemo} from "react";
import {ConnectionProvider, WalletProvider} from "@solana/wallet-adapter-react";
import { WalletModalProvider } from "@solana/wallet-adapter-react-ui";
import { PhantomWalletAdapter } from "@solana/wallet-adapter-wallets";

type Props = {
    children : ReactNode;
};
const WalletContextProvider : FC<Props> = ({children})=>{
    const endpoint  = "https://api.devnet.solana.com";
    const wallet = useMemo(()=>[new PhantomWalletAdapter()],[]);
    return (
        <ConnectionProvider endpoint={endpoint}>
            <WalletProvider wallets={wallet}>
                <WalletModalProvider>{children}</WalletModalProvider>
            </WalletProvider>
        </ConnectionProvider>
    );
};
export default WalletContextProvider;