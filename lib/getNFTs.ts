import { Metaplex,walletAdapterIdentity } from "@metaplex-foundation/js";
import {connection} from "./solana";
export const getNFTs = async(wallet:any)=>{
    const metaplex  = Metaplex.make(connection).use(
        walletAdapterIdentity(wallet)
    );

    const nfts = await metaplex.nfts().findAllByOwner({
        owner : wallet.publicKey,
    });
    return nfts;
};