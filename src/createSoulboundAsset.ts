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
  CheckResult,
  transfer,
  fetchAssetV1,
} from "@metaplex-foundation/mpl-core";
import { base58 } from "@metaplex-foundation/umi/serializers";
import { initializeWallet } from "./util/initializeWallet";
import { getFirstRpcEndpoint } from "./util/getRpcEndpoints";

// Define the Oracle account that will control transfer permissions
// This is an Oracle deployed by Metaplex that always rejects tranferring
const ORACLE_ACCOUNT = publicKey(
  "GxaWxaQVeaNeFHehFQEDeKR65MnT6Nup81AGwh2EEnuq"
);

// Define a dummy destination wallet for testing transfer restrictions
const DESTINATION_WALLET = publicKey("CoREENxT6tW1HoK8ypY1SxRMZTcVPm7R94rH4PZNhX7d");

(async () => {
  const useFileSystem = process.argv[2] === "--use-fs-wallet";
  const rpcUrl = getFirstRpcEndpoint();

  // Step 1: Initialize Umi with first RPC endpoint from the list
  const umi = createUmi(rpcUrl[0])
    .use(mplCore())

  // Initialize wallet based on parameter
  const wallet = await initializeWallet(umi, useFileSystem);
  umi.use(keypairIdentity(wallet)); 

  // Step 3: Create a new collection to hold our soulbound asset
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

  // Step 4: Create a soulbound asset within the collection
  console.log("Creating soulbound asset...");
  const assetSigner = generateSigner(umi);
  
  // Create the asset with transfer restrictions using an Oracle plugin
  await create(umi, {
    asset: assetSigner,
    collection: collection,
    name: "My Soulbound Asset",
    uri: "https://example.com/my-asset.json",
    plugins: [
      {
        // The Oracle plugin allows us to control transfer permissions
        type: "Oracle",
        resultsOffset: {
          type: "Anchor",
        },
        baseAddress: ORACLE_ACCOUNT,
        lifecycleChecks: {
          // Configure the Oracle to reject all transfer attempts
          transfer: [CheckResult.CAN_REJECT],
        },
        baseAddressConfig: undefined,
      },
    ],
  }).sendAndConfirm(umi);
  
  // Wait for transaction confirmation
  await new Promise(resolve => setTimeout(resolve, 15000));

  // Fetch and verify the asset was created
  const asset = await fetchAssetV1(umi, assetSigner.publicKey);
  console.log("Soulbound asset created successfully:", assetSigner.publicKey);

  // Step 5: Demonstrate that the asset is truly soulbound
  console.log(
    "Testing soulbound property by attempting a transfer (this should fail)..."
  );
  
  // Attempt to transfer the asset (this will fail due to Oracle restrictions)
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
