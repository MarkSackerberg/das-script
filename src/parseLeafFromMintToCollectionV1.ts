import { createUmi } from "@metaplex-foundation/umi-bundle-defaults";
import {mplBubblegum, parseLeafFromMintToCollectionV1Transaction } from "@metaplex-foundation/mpl-bubblegum";
import { base58 } from "@metaplex-foundation/umi/serializers";
import { keypairIdentity } from "@metaplex-foundation/umi";
import { initializeWallet } from "./util/initializeWallet";
import { getRpcEndpoints } from "./util/getRpcEndpoints";


(async () => {
  const useFileSystem = process.argv[2] === "--use-fs-wallet";
  const rpcEndpoints = getRpcEndpoints();

  // Step 1: Initialize Umi with first RPC endpoint from the list
  const umi = createUmi(rpcEndpoints[0])
    .use(mplBubblegum())

  // Initialize wallet based on parameter
  const wallet = await initializeWallet(umi, useFileSystem);
  umi.use(keypairIdentity(wallet)); 
  
  const transaction: Uint8Array = base58.serialize("4NJhR8zm3G7hU1uhPZaBiTMBCERh4CWp2cF1x2Ly9yCvenrY6oS9hF2PAGfT26odWvb49BktkWkoBPGoXMYUVqkY")
  console.log(transaction)
  const leaf = await parseLeafFromMintToCollectionV1Transaction(umi, transaction )
  console.log(leaf)
})();
