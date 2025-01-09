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
  transfer
} from "@metaplex-foundation/mpl-core";
import { base58 } from "@metaplex-foundation/umi/serializers";
import { getFirstRpcEndpoint } from "./util/getRpcEndpoints";
import { initializeWallet } from "./util/initializeWallet";


(async () => {
  // Get wallet type from command line argument
  const useFileSystem = process.argv[2] === "--use-fs-wallet";
  const rpcUrl = getFirstRpcEndpoint();

  // Step 1: Initialize Umi with first RPC endpoint from the list
  const umi = createUmi(rpcUrl).use(mplCore());

  // Step 2: Initialize wallet based on parameter
  const wallet = await initializeWallet(umi, useFileSystem);
  umi.use(keypairIdentity(wallet));

  // Step 3: Create the first collection
  console.log("Creating first collection...");
  const collectionSigner = generateSigner(umi);
  await createCollection(umi, {
    collection: collectionSigner,
    name: "First Collection",
    uri: "https://example.com/my-collection.json",
  }).sendAndConfirm(umi);

  // Wait for transaction confirmation
  await new Promise((resolve) => setTimeout(resolve, 15000));

  // Fetch and verify the collection was created
  const collection = await fetchCollection(umi, collectionSigner.publicKey);
  console.log(
    "First collection created successfully:",
    collectionSigner.publicKey
  );

  // Step 4: Create an asset in the first collection
  console.log("Creating asset in collection...");
  const assetSigner = generateSigner(umi);

  await create(umi, {
    asset: assetSigner,
    collection,
    name: "My Asset",
    uri: "https://example.com/my-asset.json",
    plugins: [],
  }).sendAndConfirm(umi);

  // Wait for transaction confirmation
  await new Promise((resolve) => setTimeout(resolve, 15000));

  // Fetch and verify the asset was created
  const asset = await fetchAsset(umi, assetSigner.publicKey);
  console.log("Asset created successfully:", asset);

  console.log("Updating Asset")
  // Step 6: Make the asset immutable
  const updateTx = await update(umi, {
    asset,
    collection,
    newUpdateAuthority: updateAuthority('None'),
  }).sendAndConfirm(umi);

  console.log(
    "Update transaction signature:",
    base58.deserialize(updateTx.signature)[0]
  );
  await new Promise((resolve) => setTimeout(resolve, 15000));

//  const updatedAsset = await fetchAsset(umi, assetSigner.publicKey);
  //console.log("Updated Asset:", updatedAsset);

  const transferTx = await transfer(umi, {
    asset,
    newOwner: publicKey("5EYHtxqqGhtJ2AKmhW4jY3roFT2n4BK77CxDYFEdHkbz")
  }
  ).sendAndConfirm(umi, { send: {skipPreflight: true}});

  console.log(
    "Transfer transaction signature:",
    base58.deserialize(transferTx.signature)[0]
  );

})();
