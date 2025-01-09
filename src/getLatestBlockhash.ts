import { createUmi } from "@metaplex-foundation/umi-bundle-defaults";
import { mplCore } from "@metaplex-foundation/mpl-core";
import {
  keypairIdentity,
} from "@metaplex-foundation/umi";

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

  const blockhash = await umi.rpc.getLatestBlockhash();
  console.log(blockhash)

})();
