import {
  mplCandyMachine,
  setCollection,
} from "@metaplex-foundation/mpl-candy-machine";
import { createUmi } from "@metaplex-foundation/umi-bundle-defaults";
import {
  keypairIdentity,
  publicKey,
} from "@metaplex-foundation/umi";
import { getFirstRpcEndpoint } from "./util/getRpcEndpoints";
import { initializeWallet } from "./util/initializeWallet";

(async () => {
  try {
    // Get wallet type from command line argument
    const useFileSystem = process.argv[2] === "--use-fs-wallet";
    const rpcUrl = getFirstRpcEndpoint();

    // Step 1: Initialize Umi with first RPC endpoint from the list
    const umi = createUmi(rpcUrl).use(mplCandyMachine());

    // Step 2: Initialize wallet based on parameter
    const wallet = await initializeWallet(umi, useFileSystem);
    umi.use(keypairIdentity(wallet));

    const candyMachine = publicKey(
      "11111111111111111111111111111111111111111111111111111111111111111"
    );

    setCollection(umi, {
      candyMachine,
      collectionMint: publicKey(
        "111111111111111111111111111111111111111111111111111111"
      ),
      newCollectionUpdateAuthority: umi.identity,
      newCollectionMint: publicKey(
        "111111111111111111111111111111111111111111111111111111"
      ),
    }).sendAndConfirm(umi, {
      confirm: {
        commitment: "finalized",
      },
    });
  } catch (e: any) {
    console.log(e);
  }
})();
