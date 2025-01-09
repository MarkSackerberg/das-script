import { createUmi } from "@metaplex-foundation/umi-bundle-defaults";
import { mplCore } from "@metaplex-foundation/mpl-core";
import {
  keypairIdentity,
  publicKey,
} from "@metaplex-foundation/umi";
import {
  fetchAsset,
} from "@metaplex-foundation/mpl-core";
import { getFirstRpcEndpoint } from "./util/getRpcEndpoints";
import { initializeWallet } from "./util/initializeWallet";

(async () => {

  const useFileSystem = process.argv[2] === "--use-fs-wallet";
  const rpcUrl = getFirstRpcEndpoint();

  // Step 1: Initialize Umi with first RPC endpoint from the list
  const umi = createUmi(rpcUrl)
    .use(mplCore())

  // Initialize wallet based on parameter
  const wallet = await initializeWallet(umi, useFileSystem);
  umi.use(keypairIdentity(wallet)); 

  const updatedAsset = await fetchAsset(umi, publicKey("BqkndYSSBeztJqfPFugWpNGe7jBFjENNfsFS9gXjYqi4"));
  console.log("Updated Asset:", updatedAsset);

})();
