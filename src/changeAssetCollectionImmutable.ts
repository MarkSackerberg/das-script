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
