import { createUmi } from "@metaplex-foundation/umi-bundle-defaults";
import { mplCore } from "@metaplex-foundation/mpl-core";
import {
  generateSigner,
  keypairIdentity,
  publicKey,
  sol,
  some,
} from "@metaplex-foundation/umi";
import {
  createCollection,
  create,
  fetchCollection,
  transfer,
  fetchAssetV1,
} from "@metaplex-foundation/mpl-core";
import { base58 } from "@metaplex-foundation/umi/serializers";
import { createCandyMachine } from "@metaplex-foundation/mpl-core-candy-machine";
import { initializeWallet } from "./util/initializeWallet";
import { getFirstRpcEndpoint } from "./util/getRpcEndpoints";

(async () => {
  // Step 1: Initialize Umi with devnet RPC endpoint
  // Get wallet type from command line argument
  const useFileSystem = process.argv[2] === "--use-fs-wallet";
  const rpcUrl = getFirstRpcEndpoint();

  // Step 1: Initialize Umi with first RPC endpoint from the list
  const umi = createUmi(rpcUrl).use(mplCore());

  // Step 2: Initialize wallet based on parameter
  const wallet = await initializeWallet(umi, useFileSystem);
  umi.use(keypairIdentity(wallet));
  // Step 3: Create a new collection to hold our frozen asset
  console.log("Creating parent collection...");
  const collectionSigner = generateSigner(umi);
  await createCollection(umi, {
    collection: collectionSigner,
    name: "My Collection",
    uri: "https://example.com/my-collection.json",
  }).sendAndConfirm(umi);

  // Wait for transaction confirmation
  await new Promise((resolve) => setTimeout(resolve, 15000));

  // Fetch and verify the collection was created
  const collection = await fetchCollection(umi, collectionSigner.publicKey);
  console.log("Collection created successfully:", collectionSigner.publicKey);

  const revealData = [
    { name: "Nft #1", uri: "http://example.com/1.json" },
    { name: "Nft #2", uri: "http://example.com/2.json" },
    { name: "Nft #3", uri: "http://example.com/3.json" },
  ];

  const string = JSON.stringify(revealData);
  const hash = crypto.createHash("sha256").update(string).digest();

  const candyMachine = generateSigner(umi);

  const createResponse = await (
    await createCandyMachine(umi, {
      candyMachine,
      collection: publicKey("HKr4oBvnhntYpzTipAEUCutGQLiCbvmV1d4aikidNndN"), //collectionAddress.publicKey,
      collectionUpdateAuthority: umi.identity,
      itemsAvailable: 9,
      hiddenSettings: {
        name: "Hidden Asset",
        uri: "https://example.com/hidden-asset.json",
        hash,
      },
    })
  ).sendAndConfirm(umi);

  // Log the failed transfer attempt signature
  console.log(
    "Transfer attempt signature:",
    base58.deserialize(createResponse.signature)[0]
  );
})();
