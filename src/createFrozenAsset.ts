import { createUmi } from "@metaplex-foundation/umi-bundle-defaults";
import { mplCore } from "@metaplex-foundation/mpl-core";
import {
  generateSigner,
  keypairIdentity,
  publicKey,
} from "@metaplex-foundation/umi";
import {
  createCollection,
  create,
  fetchCollection,
  transfer,
  fetchAssetV1,
} from "@metaplex-foundation/mpl-core";
import { base58 } from "@metaplex-foundation/umi/serializers";
import { getFirstRpcEndpoint, getRpcEndpoints } from "./util/getRpcEndpoints";
import { initializeWallet } from "./util/initializeWallet";

// Define a dummy destination wallet for testing transfer restrictions
const DESTINATION_WALLET = publicKey("CoREENxT6tW1HoK8ypY1SxRMZTcVPm7R94rH4PZNhX7d");

(async () => {
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
  await new Promise(resolve => setTimeout(resolve, 15000));

  // Fetch and verify the collection was created
  const collection = await fetchCollection(umi, collectionSigner.publicKey);
  console.log("Collection created successfully:", collectionSigner.publicKey);

  // Step 4: Create a frozen asset within the collection
  console.log("Creating frozen asset...");
  const assetSigner = generateSigner(umi);
  
  // Create the asset with permanent freeze using the PermanentFreezeDelegate plugin
  await create(umi, {
    asset: assetSigner,
    collection: collection,
    name: "My Frozen Asset",
    uri: "https://example.com/my-asset.json",
    plugins: [
      {
        // The PermanentFreezeDelegate plugin permanently freezes the asset
        type: 'PermanentFreezeDelegate',
        frozen: true, // Set the asset as frozen
        authority: { type: "None" }, // No authority can unfreeze it
      },
    ],
  }).sendAndConfirm(umi);
  
  // Wait for transaction confirmation
  await new Promise(resolve => setTimeout(resolve, 15000));

  // Fetch and verify the asset was created
  const asset = await fetchAssetV1(umi, assetSigner.publicKey);
  console.log("Frozen asset created successfully:", assetSigner.publicKey);

  // Step 5: Demonstrate that the asset is truly frozen
  console.log(
    "Testing frozen property by attempting a transfer (this should fail)..."
  );
  
  // Attempt to transfer the asset (this will fail due to freeze)
  const transferResponse = await transfer(umi, {
    asset: asset,
    newOwner: DESTINATION_WALLET,
    collection,
  }).sendAndConfirm(umi, { send: { skipPreflight: true } });

  // Log the failed transfer attempt signature
  console.log(
    "Transfer attempt signature:",
    base58.deserialize(transferResponse.signature)[0]
  );
})();
