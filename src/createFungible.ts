import { createUmi } from "@metaplex-foundation/umi-bundle-defaults";
import {
  createV1,
  mplTokenMetadata,
  TokenStandard,
} from "@metaplex-foundation/mpl-token-metadata";
import {
  generateSigner,
  keypairIdentity,
  percentAmount,
} from "@metaplex-foundation/umi";
import { mplToolbox } from "@metaplex-foundation/mpl-toolbox";
import { getRpcEndpoints } from "./util/getRpcEndpoints";
import { initializeWallet } from "./util/initializeWallet";

(async () => {
  // Get wallet type from command line argument
  const useFileSystem = process.argv[2] === "--use-fs-wallet";
  const rpcEndpoints = getRpcEndpoints();

  // Step 1: Initialize Umi with first RPC endpoint from the list
  const umi = createUmi(rpcEndpoints[0])
    .use(mplToolbox())
    .use(mplTokenMetadata());

  // Step 2: Initialize wallet based on parameter
  const wallet = await initializeWallet(umi, useFileSystem);
  umi.use(keypairIdentity(wallet)); // Wait for airdrop confirmation

  const mint3 = generateSigner(umi);
  await createV1(umi, {
    mint: mint3,
    authority: umi.identity,
    name: "My NFT",
    uri: "https://arweave.net/7BzVsHRrEH0ldNOCCM4_E00BiAYuJP_EQiqvcEYz3YY",
    sellerFeeBasisPoints: percentAmount(0),
    tokenStandard: TokenStandard.Fungible,
  }).sendAndConfirm(umi);
  console.log(mint3);
})();
