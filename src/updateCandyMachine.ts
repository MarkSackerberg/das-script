import { createUmi } from "@metaplex-foundation/umi-bundle-defaults";
import {
  fetchCandyGuard,
  mplCandyMachine,
} from "@metaplex-foundation/mpl-candy-machine";

import {
  keypairIdentity,
  none,
  publicKey,
  sol,
  some,
  transactionBuilder,
} from "@metaplex-foundation/umi";
import { updateCandyGuard } from "@metaplex-foundation/mpl-candy-machine/dist/src/generated/instructions/updateCandyGuard";
import { getRpcEndpoints } from "./util/getRpcEndpoints";
import { initializeWallet } from "./util/initializeWallet";

const assetId = publicKey("FgEKkVTSfLQ7a7BFuApypy4KaTLh65oeNRn2jZ6fiBav");
const collectionId = publicKey("FgEKkVTSfLQ7a7BFuApypy4KaTLh65oeNRn2jZ6fiBav");
const wallet = publicKey("AUtnbwWJQfYZjJ5Mc6go9UancufcAuyqUZzR1jSe4esx");

(async () => {
  const useFileSystem = process.argv[2] === "--use-fs-wallet";
  const rpcEndpoints = getRpcEndpoints();

  // Step 1: Initialize Umi with first RPC endpoint from the list
  const umi = createUmi(rpcEndpoints[0]).use(mplCandyMachine());

  // Initialize wallet based on parameter
  const wallet = await initializeWallet(umi, useFileSystem);
  umi.use(keypairIdentity(wallet));

  const candyGuard = await fetchCandyGuard(umi, assetId);

  await updateCandyGuard(umi, {
    candyGuard: assetId,
    guards: {
      ...candyGuard.guards,
      botTax: none(),
      solPayment: some({ lamports: sol(3), destination: wallet }),
    },
    groups: [],
  }).sendAndConfirm(umi);

  await transactionBuilder()
    .add(
      updateCandyGuard(umi, {
        candyGuard: assetId,
        guards: {
          botTax: some({ lamports: sol(0.02), lastInstruction: false }),
        },
        groups: [
          {
            label: "NEW1",
            guards: {
              startDate: some({ date: "2022-09-15T10:00:00.000Z" }),
              solPayment: some({ lamports: sol(1), destination: assetId }),
              endDate: some({ date: "2022-09-15T12:00:00.000Z" }),
            },
          },
          {
            label: "NEW2",
            guards: {
              startDate: some({ date: "2022-09-15T12:00:00.000Z" }),
              solPayment: some({ lamports: sol(3), destination: assetId }),
            },
          },
        ],
      })
    )
    .sendAndConfirm(umi);
})();
