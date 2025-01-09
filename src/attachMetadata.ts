import { createUmi } from "@metaplex-foundation/umi-bundle-defaults";
import {
  createFungible,
  createV1,
  mplTokenMetadata,
  TokenStandard,
} from "@metaplex-foundation/mpl-token-metadata";
import {
  createAmountFromDecimals,
  generateSigner,
  keypairIdentity,
  percentAmount,
  publicKey,
} from "@metaplex-foundation/umi";
import {
  createTokenIfMissing,
  findAssociatedTokenPda,
  getSplAssociatedTokenProgramId,
  mintTokensTo,
  mplToolbox,
} from "@metaplex-foundation/mpl-toolbox";
import { initializeWallet } from "./util/initializeWallet";
import { getFirstRpcEndpoint } from "./util/getRpcEndpoints";

const assetId = publicKey("FgEKkVTSfLQ7a7BFuApypy4KaTLh65oeNRn2jZ6fiBav");
const collectionId = publicKey("FgEKkVTSfLQ7a7BFuApypy4KaTLh65oeNRn2jZ6fiBav");
const wallet = publicKey("AUtnbwWJQfYZjJ5Mc6go9UancufcAuyqUZzR1jSe4esx");

(async () => {
      // Get wallet type from command line argument
      const useFileSystem = process.argv[2] === "--use-fs-wallet";
      const rpcUrl = getFirstRpcEndpoint();
  
      // Step 1: Initialize Umi with first RPC endpoint from the list
      const umi = createUmi(rpcUrl).use(mplToolbox()).use(mplTokenMetadata());
  
      // Step 2: Initialize wallet based on parameter
      const wallet = await initializeWallet(umi, useFileSystem);
      umi.use(keypairIdentity(wallet));


  const tokenAmount = createAmountFromDecimals(123, "myToken", 5);
  const mint = generateSigner(umi);
  await /* createMint(umi, {
    mint,
    decimals: tokenAmount.decimals,
    mintAuthority: umi.identity.publicKey, //or another mint authority.
    freezeAuthority: umi.identity.publicKey,
  })
    .add(
      createAssociatedToken(umi, {
        mint: mint.publicKey,
        owner: umi.identity.publicKey,
      })
    )
    .add(
      mintTokensTo(umi, {
        mintAuthority: umi.identity,
        mint: mint.publicKey,
        token: findAssociatedTokenPda(umi, {
          mint: mint.publicKey,
          owner: umi.identity.publicKey,
        }),
        amount: tokenAmount.basisPoints,
      })
    ) */
/*     .add(
      createMetadataAccountV3(umi, {
        mint: mint.publicKey,
        mintAuthority: umi.identity,
        isMutable: true,
        collectionDetails: none(),
        data: {
          name: "myToken",
          uri: "https://arweave.net/7BzVsHRrEH0ldNOCCM4_E00BiAYuJP_EQiqvcEYz3YY",
          symbol: "MT",
          sellerFeeBasisPoints: 0,
          creators: none(),
          collection: none(),
          uses: none(),
        },
      })
    ) */
/*     .add(
 */      createV1(umi, {
        mint,
        authority: umi.identity,
        name: "My NFT",
        uri: "https://arweave.net/7BzVsHRrEH0ldNOCCM4_E00BiAYuJP_EQiqvcEYz3YY",
        sellerFeeBasisPoints: percentAmount(5.5),
        tokenStandard: TokenStandard.Fungible,
      })
   // )
    .sendAndConfirm(umi, {
      send: { skipPreflight: true, commitment: "finalized" },
      confirm: { commitment: "processed" },
    });
  console.log(mint.publicKey);

  const mint2 = generateSigner(umi);
  const createFungibleIx = createFungible(umi, {
    mint: mint2,
    name: "The Kitten Coin",
    uri: "https://arweave.net/7BzVsHRrEH0ldNOCCM4_E00BiAYuJP_EQiqvcEYz3YY", // we use the `metadataUri` variable we created earlier that is storing our uri.
    sellerFeeBasisPoints: percentAmount(0),
    decimals: 9, // set the amount of decimals you want your token to have.
  });
  const createTokenIx = createTokenIfMissing(umi, {
    mint: mint2.publicKey,
    owner: umi.identity.publicKey,
    ataProgram: getSplAssociatedTokenProgramId(umi),
  });
  const mintTokensIx = mintTokensTo(umi, {
    mint: mint2.publicKey,
    token: findAssociatedTokenPda(umi, {
      mint: mint2.publicKey,
      owner: umi.identity.publicKey,
    }),
    amount: BigInt(1000),
  });
  const tx = await createFungibleIx
    .add(createTokenIx)
    .add(mintTokensIx)
    .sendAndConfirm(umi);

  // const token = await fetchDigitalAsset(umi, mint.publicKey);
  console.log(mint2.publicKey);

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
