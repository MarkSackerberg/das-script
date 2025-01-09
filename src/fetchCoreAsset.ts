import { createUmi } from "@metaplex-foundation/umi-bundle-defaults";
import { mplCore } from "@metaplex-foundation/mpl-core";
import {
  generateSigner,
  keypairIdentity,
  sol,
  Signer,
  KeypairSigner,
  createSignerFromKeypair,
  publicKey,
} from "@metaplex-foundation/umi";
import {
  createCollection,
  create,
  fetchCollection,
  update,
  updateAuthority,
  fetchAsset,
} from "@metaplex-foundation/mpl-core";
import { base58 } from "@metaplex-foundation/umi/serializers";
import { readFileSync } from "fs";
import { Umi } from "@metaplex-foundation/umi/dist/types/Umi";
import { getRpcEndpoints } from "./util/getRpcEndpoints";

async function initializeWallet(
  umi: Umi,
  useFileSystem: boolean
): Promise<KeypairSigner> {
  if (useFileSystem) {
    // Use filesystem wallet
    const wallet =
      "/home/simon/solana/Tes1zkZkXhgTaMFqVgbgvMsVkRJpq4Y6g54SbDBeKVV.json";
    const secretKey = JSON.parse(readFileSync(wallet, "utf-8"));
    const keypair = umi.eddsa.createKeypairFromSecretKey(
      new Uint8Array(secretKey)
    );

    return createSignerFromKeypair(umi, keypair);
  } else {
    // Create and fund a new wallet
    const walletSigner = generateSigner(umi);
    console.log("Funding test wallet with devnet SOL...");
    await umi.rpc.airdrop(walletSigner.publicKey, sol(0.1));
    return walletSigner;
  }
}

(async () => {

  const useFileSystem = process.argv[2] === "--use-fs-wallet";
  const rpcEndpoints = getRpcEndpoints();

  // Step 1: Initialize Umi with first RPC endpoint from the list
  const umi = createUmi(rpcEndpoints[0])
    .use(mplCore())

  // Initialize wallet based on parameter
  const wallet = await initializeWallet(umi, useFileSystem);
  umi.use(keypairIdentity(wallet)); 

  const updatedAsset = await fetchAsset(umi, publicKey("BqkndYSSBeztJqfPFugWpNGe7jBFjENNfsFS9gXjYqi4"));
  console.log("Updated Asset:", updatedAsset);

})();
