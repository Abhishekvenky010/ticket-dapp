"use client";
import { WalletMultiButton } from "@solana/wallet-adapter-react-ui";
import { useEffect, useState } from "react";

export default function WalletButton(){
    const [mounted, setMounted] = useState(false);

    useEffect(() => {
        setMounted(true);
    }, []);

    if (!mounted) {
        return <button className="bg-purple-600 hover:bg-purple-700 text-white rounded-lg px-4 py-2 font-semibold transition-colors">Loading...</button>;
    }

     return <WalletMultiButton className="!bg-purple-600 hover:!bg-purple-700 !text-white !rounded-lg !px-4 !py-2 !font-semibold !transition-colors" />
}