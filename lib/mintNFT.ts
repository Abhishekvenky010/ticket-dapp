import {Metaplex,walletAdapterIdentity} from "@metaplex-foundation/js";
import { connection } from "./solana";
export const mintNFT = async (wallet:any)=>{
    const metaplex = Metaplex.make(connection).use(
        walletAdapterIdentity(wallet)
    );
    const { nft } = await metaplex.nfts().create({
    name: "Concert Ticket 🎟️",
    symbol: "TIX",
    uri: "https://arweave.net/your-metadata-link", // placeholder
    sellerFeeBasisPoints:0
  });

    return nft;
}