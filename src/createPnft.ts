import { percentAmount, generateSigner, some } from "@metaplex-foundation/umi";
import {
  collectionToggle,
  createNft,
  createProgrammableNft,
  fetchDigitalAsset,
  findMetadataPda,
  mplTokenMetadata,
  updateV1,
  verifyCollectionV1,
} from "@metaplex-foundation/mpl-token-metadata";

import { createUmi } from "@metaplex-foundation/umi-bundle-defaults";
import { keypairIdentity } from "@metaplex-foundation/umi";
import { getFirstRpcEndpoint } from "./util/getRpcEndpoints";
import { initializeWallet } from "./util/initializeWallet";

(async () => {
  const args = process.argv.slice(2);
  const useFileSystem = args.includes("-fs");
  const isMainnet = args.includes("--m");

  const rpcUrl = getFirstRpcEndpoint(isMainnet);

  // Step 1: Initialize Umi with first RPC endpoint from the list
  const umi = createUmi(rpcUrl).use(mplTokenMetadata());

  // Initialize wallet based on parameter
  const wallet = await initializeWallet(umi, useFileSystem);
  umi.use(keypairIdentity(wallet));

  const collectionMint = generateSigner(umi);
  await createNft(umi, {
    mint: collectionMint,
    name: "Chiaki Azure 55 Collection",
    uri: "https://arweave.net/c9aGs5fOk7gD4wWnSvmzeqgtfxAGRgtI1jYzvl8-IVs/chiaki-violet-azure-common.json",
    sellerFeeBasisPoints: percentAmount(5.5), // 5.5%
    isCollection: true,
  }).sendAndConfirm(umi, {
    confirm: { commitment: "finalized" },
    send: { commitment: "finalized" },
  });
  console.log("Collection Mint:", collectionMint.publicKey);

  const mint = generateSigner(umi);
  await createProgrammableNft(umi, {
    mint,
    name: "Chiaki Azure 55",
    uri: "https://arweave.net/c9aGs5fOk7gD4wWnSvmzeqgtfxAGRgtI1jYzvl8-IVs/chiaki-violet-azure-common.json",
    sellerFeeBasisPoints: percentAmount(5.5),
    collection: some({ key: collectionMint.publicKey, verified: false }),
  }).sendAndConfirm(umi, {
    confirm: { commitment: "finalized" },
    send: { commitment: "finalized" },
  });

  console.log("NFT Created:", mint.publicKey);
})();
