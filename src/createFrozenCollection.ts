import { createUmi } from "@metaplex-foundation/umi-bundle-defaults";
import { mplCore } from "@metaplex-foundation/mpl-core";
import {
  generateSigner,
  keypairIdentity,
  publicKey,
  sol,
} from "@metaplex-foundation/umi";
import {
  createCollection,
  create,
  fetchCollection,
  transfer,
  fetchAssetV1,
} from "@metaplex-foundation/mpl-core";
import { base58 } from "@metaplex-foundation/umi/serializers";

// Define a dummy destination wallet for testing transfer restrictions
const DESTINATION_WALLET = publicKey("CoREENxT6tW1HoK8ypY1SxRMZTcVPm7R94rH4PZNhX7d");

(async () => {
  // Step 1: Initialize Umi with devnet RPC endpoint
  const umi = createUmi(
    "YOUR ENDPOINT"
  ).use(mplCore());

  // Step 2: Create and fund a test wallet
  const walletSigner = generateSigner(umi);
  umi.use(keypairIdentity(walletSigner));

  console.log("Funding test wallet with devnet SOL...");
  await umi.rpc.airdrop(walletSigner.publicKey, sol(0.1));
  
  // Wait for airdrop confirmation
  await new Promise(resolve => setTimeout(resolve, 15000));

  // Step 3: Create a new frozen collection
  console.log("Creating frozen collection...");
  const collectionSigner = generateSigner(umi);
  await createCollection(umi, {
    collection: collectionSigner,
    name: "Frozen Collection",
    uri: "https://example.com/my-collection.json",
    plugins: [
      {
        // The PermanentFreezeDelegate plugin permanently freezes the collection
        type: 'PermanentFreezeDelegate',
        frozen: true, // Set the collection as frozen
        authority: { type: "None" }, // No authority can unfreeze it
      },
    ],
  }).sendAndConfirm(umi);

  // Wait for collection creation confirmation
  await new Promise(resolve => setTimeout(resolve, 15000));

  // Fetch and verify the collection was created
  const collection = await fetchCollection(umi, collectionSigner.publicKey);
  console.log("Frozen collection created successfully:", collectionSigner.publicKey);

  // Step 4: Create an asset within the frozen collection
  console.log("Creating asset in frozen collection...");
  const assetSigner = generateSigner(umi);
  await create(umi, {
    asset: assetSigner,
    collection: collection,
    name: "Frozen Asset",
    uri: "https://example.com/my-asset.json",
  }).sendAndConfirm(umi);

  // Wait for asset creation confirmation
  await new Promise(resolve => setTimeout(resolve, 15000));

  // Fetch and verify the asset was created
  const asset = await fetchAssetV1(umi, assetSigner.publicKey);
  console.log("Asset created successfully in frozen collection:", assetSigner.publicKey);

  // Step 5: Demonstrate that the asset is frozen by the collection
  console.log(
    "Testing frozen property by attempting a transfer (this should fail)..."
  );
  
  // Attempt to transfer the asset (this will fail due to collection freeze)
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
