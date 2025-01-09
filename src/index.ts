import { createUmi } from "@metaplex-foundation/umi-bundle-defaults";
import { dasApi } from "@metaplex-foundation/digital-asset-standard-api";
import { das } from "@metaplex-foundation/mpl-core-das";

import { keypairIdentity, publicKey } from "@metaplex-foundation/umi";
import { initializeWallet } from "./util/initializeWallet";
import { getRpcEndpoints } from "./util/getRpcEndpoints";

const assetId = publicKey("FgEKkVTSfLQ7a7BFuApypy4KaTLh65oeNRn2jZ6fiBav");
const collectionId = publicKey("FgEKkVTSfLQ7a7BFuApypy4KaTLh65oeNRn2jZ6fiBav");
const wallet = publicKey("AUtnbwWJQfYZjJ5Mc6go9UancufcAuyqUZzR1jSe4esx");

(async () => {
  const useFileSystem = process.argv[2] === "--use-fs-wallet";
  const rpcEndpoints = getRpcEndpoints();

  // Step 1: Initialize Umi with first RPC endpoint from the list
  const umi = createUmi(rpcEndpoints[0])
    .use(dasApi())

  // Initialize wallet based on parameter
  const wallet = await initializeWallet(umi, useFileSystem);
  umi.use(keypairIdentity(wallet));
  umi.rpc.getAsset("test");

  const asset = await das.getAsset(umi, assetId, { skipDerivePlugins: true });
  das.dasAssetToCoreCollection;

  console.log("on chain Asset");
  console.log(asset);

  /*     const collection = await umi.rpc.getAsset(collectionId);

    console.log("on chain collection");
    console.log(collection);

    const dasAsset = await das.searchAssets(umi, {
      owner: publicKey(wallet),
      interface: 'MplCoreAsset',
    })
    console.log("dasAsset")
    console.log(dasAsset)
 */
})();
