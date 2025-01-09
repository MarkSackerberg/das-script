import {
  keypairIdentity,
  publicKey,
  transactionBuilder,
} from "@metaplex-foundation/umi";
import {
  createTokenIfMissing,
  findAssociatedTokenPda,
  transferTokens,
} from "@metaplex-foundation/mpl-toolbox";
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
import { getRpcEndpoints } from "./util/getRpcEndpoints";
import { initializeWallet } from "./util/initializeWallet";

(async () => {
  const collection = publicKey("<COLLECTION>"); // The collection we are swapping to/from
  const token = publicKey("<TOKEN MINT>"); // The token we are swapping to/from

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
    publicKeySerializer().serialize(collection),
  ])[0];

  // Transfer Fungible Tokens to it (after creating the ATA if needed)
  const transferTokenTx = await transactionBuilder()
    .add(
      createTokenIfMissing(umi, {
        mint: token,
        owner: escrow,
      })
    )
    .add(
      transferTokens(umi, {
        source: findAssociatedTokenPda(umi, {
          mint: token,
          owner: umi.identity.publicKey,
        }),
        destination: findAssociatedTokenPda(umi, {
          mint: token,
          owner: escrow,
        }),
        amount: 300000000,
      })
    )
    .sendAndConfirm(umi);
})();
