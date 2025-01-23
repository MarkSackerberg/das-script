import { createUmi } from "@metaplex-foundation/umi-bundle-defaults";
import {
  keypairIdentity,
  publicKey,
} from "@metaplex-foundation/umi";
import { getFirstRpcEndpoint } from "./util/getRpcEndpoints";
import { initializeWallet } from "./util/initializeWallet";
import { dasApi } from "@metaplex-foundation/digital-asset-standard-api";

(async () => {
  const args = process.argv.slice(2);
  const useFileSystem = args.includes("-fs");
  const isMainnet = args.includes("-m");

  const rpcUrl = getFirstRpcEndpoint(isMainnet);

  // Step 1: Initialize Umi with first RPC endpoint from the list
  const umi = createUmi(rpcUrl)
    .use(dasApi())

  // Initialize wallet based on parameter
  const wallet = await initializeWallet(umi, useFileSystem);
  umi.use(keypairIdentity(wallet)); 

  const fetchedAsset = await umi.rpc.getAsset(publicKey("HeWdnJqjmmFbs6ACUHuPTR8diasBjNRiyKumFvyypump"))
  console.log("fetched Asset:", fetchedAsset);
  //@ts-ignore
  console.log(fetchedAsset.token_info)

})();
