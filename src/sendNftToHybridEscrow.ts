import { keypairIdentity, publicKey } from "@metaplex-foundation/umi";
import {
  MPL_HYBRID_PROGRAM_ID,
  mplHybrid,
} from "@metaplex-foundation/mpl-hybrid";
import { mplTokenMetadata } from "@metaplex-foundation/mpl-token-metadata";
import { createUmi } from "@metaplex-foundation/umi-bundle-defaults";
import {
  string,
  publicKey as publicKeySerializer,
} from "@metaplex-foundation/umi/serializers";
import {
  transfer,
  fetchAsset,
  fetchCollection,
} from "@metaplex-foundation/mpl-core";
import { getRpcEndpoints } from "./util/getRpcEndpoints";
import { initializeWallet } from "./util/initializeWallet";

(async () => {
  const collectionId = publicKey("<COLLECTION>"); // The collection we are swapping to/from
  const assetId = publicKey("<NFT MINT>"); // Mint Address of the NFT you want to send

  const useFileSystem = process.argv[2] === "--use-fs-wallet";
  const rpcEndpoints = getRpcEndpoints();

  // Step 1: Initialize Umi with first RPC endpoint from the list
  const umi = createUmi(rpcEndpoints[0])
    .use(mplHybrid())
    .use(mplTokenMetadata());

  // Initialize wallet based on parameter
  const wallet = await initializeWallet(umi, useFileSystem);
  umi.use(keypairIdentity(wallet));
  // Derive the Escrow
  const escrow = umi.eddsa.findPda(MPL_HYBRID_PROGRAM_ID, [
    string({ size: "variable" }).serialize("escrow"),
    publicKeySerializer().serialize(collectionId),
  ])[0];

  const collection = await fetchCollection(umi, collectionId);
  const asset = await fetchAsset(umi, assetId);
  // Transfer Asset to it
  const transferAssetTx = await transfer(umi, {
    asset,
    collection,
    newOwner: escrow,
  }).sendAndConfirm(umi);
})();
