import { Metaplex,walletAdapterIdentity } from "@metaplex-foundation/js";
import { connection } from "./solana";
import { PublicKey } from "@solana/web3.js";
export const transferNFT = async(
    wallet:any,
    mintAddress:string,
    toAddress :string
)=>{
   const metaplex = Metaplex.make(connection).use(
    walletAdapterIdentity(wallet)
   );
   const nft = await metaplex.nfts().findByMint({
       mintAddress: new PublicKey(mintAddress)
   });
    await metaplex.nfts().transfer({
     nftOrSft: nft,
     fromOwner: wallet.publicKey,
     toOwner : new PublicKey(toAddress),
    });
};