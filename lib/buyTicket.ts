import { SystemProgram,Transaction,sendAndConfirmTransaction,PublicKey } from "@solana/web3.js";
import { connection } from "./solana";
export const buyTicket = async(wallet:any,sellerPubkey:String,priceLamports:number)=>{
    const transaction = new Transaction().add(
        SystemProgram.transfer({
         fromPubkey: wallet.publicKey,
         toPubkey: new PublicKey(sellerPubkey),
         lamports: priceLamports,
        })
    );
     await sendAndConfirmTransaction(connection, transaction, [wallet]);
};