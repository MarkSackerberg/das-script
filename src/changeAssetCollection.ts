import { createUmi } from "@metaplex-foundation/umi-bundle-defaults";
import { mplCore } from "@metaplex-foundation/mpl-core";
import {
  generateSigner,
  keypairIdentity,
} from "@metaplex-foundation/umi";
import {
  createCollection,
  create,
  fetchCollection,
  update,
  updateAuthority,
  fetchAssetV1,
} from "@metaplex-foundation/mpl-core";
import { base58 } from "@metaplex-foundation/umi/serializers";
import { initializeWallet } from "./util/initializeWallet";
import { getRpcEndpoints } from "./util/getRpcEndpoints";



(async () => {
  // Get wallet type from command line argument
  const useFileSystem = process.argv[2] === "--use-fs-wallet";
  const rpcEndpoints = getRpcEndpoints();

  // Step 1: Initialize Umi with first RPC endpoint from the list
  const umi = createUmi(rpcEndpoints[0]).use(mplCore());

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
  console.log("Creating asset in first collection...");
  const assetSigner = generateSigner(umi);

  await create(umi, {
    asset: assetSigner,
    collection: collection,
    name: "My Asset",
    uri: "https://example.com/my-asset.json",
    plugins: [],
  }).sendAndConfirm(umi);

  // Wait for transaction confirmation
  await new Promise((resolve) => setTimeout(resolve, 15000));

  // Fetch and verify the asset was created
  const asset = await fetchAssetV1(umi, assetSigner.publicKey);
  console.log("Asset created successfully:", asset);

  // Step 5: Create the second collection that we'll move the asset to
  console.log("Creating second collection...");
  const secondCollectionSigner = generateSigner(umi);
  await createCollection(umi, {
    collection: secondCollectionSigner,
    name: "Second Collection",
    uri: "https://example.com/my-collection.json",
  }).sendAndConfirm(umi);

  console.log("Updating Asset")
  // Step 6: Update the asset to change its collection
  const updateTx = await update(umi, {
    asset,
    name: "Updated Asset",
    collection,
    newUpdateAuthority: updateAuthority("Collection", [
      secondCollectionSigner.publicKey,
    ]),
  }).sendAndConfirm(umi);

  console.log(
    "Update transaction signature:",
    base58.deserialize(updateTx.signature)[0]
  );

  const updatedAsset = await fetchAssetV1(umi, assetSigner.publicKey);
  console.log("Updated Asset:", updatedAsset);
})();
