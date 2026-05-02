import {Metaplex,walletAdapterIdentity} from "@metaplex-foundation/js";
import { connection } from "./solana";
export const mintNFT = async (wallet:any, name: string, description: string)=>{
    const metaplex = Metaplex.make(connection).use(
        walletAdapterIdentity(wallet)
    );
    const { nft } = await metaplex.nfts().create({
    name: name,
    symbol: "TIX",
    uri: "https://gateway.pinata.cloud/ipfs/bafkreifh3p5ncug3xtt5kl4jyjeh75ib77yopgvu6pukmjaolxunoeoiea", // metadata JSON
    sellerFeeBasisPoints:0
  });

    return nft;
}