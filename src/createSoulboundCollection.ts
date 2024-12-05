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

// Define key accounts
const ORACLE_ACCOUNT = publicKey(
  "GxaWxaQVeaNeFHehFQEDeKR65MnT6Nup81AGwh2EEnuq"
);
const DESTINATION_WALLET = publicKey(
  "AUtnbwWJQfYZjJ5Mc6go9UancufcAuyqUZzR1jSe4esx"
);

(async () => {
  // Initialize Umi with RPC endpoint
  const umi = createUmi(
    "https://devnet.helius-rpc.com/?api-key=0aa5bfbe-0077-4414-9d87-02ffa09cc50b"
  ).use(mplCore());

  // Set up a test wallet and request devnet SOL
  const walletSigner = generateSigner(umi);
  umi.use(keypairIdentity(walletSigner));

  console.log("Requesting devnet SOL for testing...");
  await umi.rpc.airdrop(walletSigner.publicKey, sol(0.1));
  await new Promise(resolve => setTimeout(resolve, 15000)); // Wait for airdrop confirmation

  // Create a new collection
  console.log("\nCreating collection with transfer oracle...");
  const collectionSigner = generateSigner(umi);
  await createCollection(umi, {
    collection: collectionSigner,
    name: "Soulbound Collection",
    uri: "https://example.com/my-collection.json",
    plugins: [
      {
        type: "Oracle",
        resultsOffset: {
          type: "Anchor",
        },
        baseAddress: ORACLE_ACCOUNT,
        lifecycleChecks: {
          transfer: [CheckResult.CAN_REJECT],
        },
        baseAddressConfig: undefined,
      },
    ],
  }).sendAndConfirm(umi);
  await new Promise(resolve => setTimeout(resolve, 15000)); // Wait for airdrop confirmation

  // Fetch the created collection
  const collection = await fetchCollection(umi, collectionSigner.publicKey);
  console.log("Collection created:", collectionSigner.publicKey);

  // Create a soulbound asset
  console.log("Creating asset...");
  const assetSigner = generateSigner(umi);
  await create(umi, {
    asset: assetSigner,
    collection: collection,
    name: "Soulbound Asset",
    uri: "https://example.com/my-asset.json",
  }).sendAndConfirm(umi);
  await new Promise(resolve => setTimeout(resolve, 15000)); // Wait for airdrop confirmation

  // Fetch the created asset
  const asset = await fetchAssetV1(umi, assetSigner.publicKey);
  console.log("Soulbound asset created:", assetSigner.publicKey);

  // Demonstrate that the asset is soulbound by attempting a transfer
  console.log(
    "Attempting to transfer the soulbound asset (this tx should show as failed)..."
  );
  const transferResponse = await transfer(umi, {
    asset: asset,
    newOwner: publicKey("CoREENxT6tW1HoK8ypY1SxRMZTcVPm7R94rH4PZNhX7d"), // Dummy public key
    collection,
  }).sendAndConfirm(umi, { send: { skipPreflight: true } });

  console.log(
    "Transfer signature:",
    base58.deserialize(transferResponse.signature)[0]
  );
})();
