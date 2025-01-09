import { createSignerFromKeypair, generateSigner, KeypairSigner, sol } from "@metaplex-foundation/umi";
import { Umi } from "@metaplex-foundation/umi/dist/types/Umi";
import { readFileSync } from "fs";

export async function initializeWallet(
    umi: Umi,
    useFileSystem: boolean
  ): Promise<KeypairSigner> {
    if (useFileSystem) {
      const wallet =
        "/home/simon/solana/Tes1zkZkXhgTaMFqVgbgvMsVkRJpq4Y6g54SbDBeKVV.json";
      const secretKey = JSON.parse(readFileSync(wallet, "utf-8"));
      const keypair = umi.eddsa.createKeypairFromSecretKey(
        new Uint8Array(secretKey)
      );
  
      return createSignerFromKeypair(umi, keypair);
    } else {
      const walletSigner = generateSigner(umi);
      console.log("Funding test wallet with devnet SOL...");
      await umi.rpc.airdrop(walletSigner.publicKey, sol(0.1));
      return walletSigner;
    }
  }