import { percentAmount, generateSigner } from "@metaplex-foundation/umi";
import {
  collectionToggle,
  createNft,
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
  const isMainnet = args.includes("-m");

  const rpcUrl = getFirstRpcEndpoint(isMainnet);

  // Step 1: Initialize Umi with first RPC endpoint from the list
  const umi = createUmi(rpcUrl).use(mplTokenMetadata());

  // Initialize wallet based on parameter
  const wallet = await initializeWallet(umi, useFileSystem);
  umi.use(keypairIdentity(wallet));

  const mint = generateSigner(umi);
  await createNft(umi, {
    mint,
    name: "My NFT",
    uri: "https://example.com/my-nft.json",
    sellerFeeBasisPoints: percentAmount(5.5),
  }).sendAndConfirm(umi, {
    confirm: { commitment: "finalized" },
    send: { commitment: "finalized" },
  });

  console.log("NFT Created:", mint.publicKey);

  const collectionMint = generateSigner(umi);
  await createNft(umi, {
    mint: collectionMint,
    name: "My Collection",
    uri: "https://example.com/my-collection.json",
    sellerFeeBasisPoints: percentAmount(5.5), // 5.5%
    isCollection: true,
  }).sendAndConfirm(umi, {
    confirm: { commitment: "finalized" },
    send: { commitment: "finalized" },
  });

  console.log("Collection Mint:", collectionMint.publicKey);

  const metadata = findMetadataPda(umi, {
    mint: mint.publicKey,
  });

  await updateV1(umi, {
    mint: mint.publicKey,
    authority: umi.identity,
    collection: collectionToggle("Set", [
      {
        key: collectionMint.publicKey,
        verified: false,
      },
    ]),
  }).add(verifyCollectionV1(umi, {
    metadata,
    collectionMint: collectionMint.publicKey,
    authority: umi.identity,
    })
  ).sendAndConfirm(umi, {
    confirm: { commitment: "finalized" },
    send: { commitment: "finalized" },
  });


  const updatedAsset2 = await fetchDigitalAsset(umi, mint.publicKey);
  console.log("Updated Asset:", updatedAsset2);
})();
