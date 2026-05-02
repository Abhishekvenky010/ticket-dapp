"use client";
import MintTicket from "@/components/MintTicket";
import WalletButton from "@/components/WalletButton";
import MyTickets from "@/components/MyTickets";
import Marketplace from "@/components/Marketplace";
export default function Home(){
  return(
    <div className="min-h-screen flex flex-col items-center justify-center bg-brown-100">
      <h1 className="text-3xl font-bold mb-6">
        🎟️ Ticket DApp
      </h1>

      <WalletButton />
      <MintTicket/>
      <MyTickets />
      <Marketplace />
    </div>
  );
  }