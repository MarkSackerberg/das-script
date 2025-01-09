import {
  addConfigLines,
  create,
  mintV2,
  mplCandyMachine,
} from "@metaplex-foundation/mpl-candy-machine";
import { createUmi } from "@metaplex-foundation/umi-bundle-defaults";
import {
  createSignerFromKeypair,
  generateSigner,
  keypairIdentity,
  percentAmount,
  publicKey,
  signerIdentity,
  some,
  transactionBuilder,
} from "@metaplex-foundation/umi";
import {
  createNft,
  TokenStandard,
} from "@metaplex-foundation/mpl-token-metadata";
import { base58 } from "@metaplex-foundation/umi-serializers";
import {
  createMintWithAssociatedToken,
  setComputeUnitLimit,
} from "@metaplex-foundation/mpl-toolbox";
import { initializeWallet } from "./util/initializeWallet";
import { getRpcEndpoints } from "./util/getRpcEndpoints";

(async () => {
  try {
    // Get wallet type from command line argument
    const useFileSystem = process.argv[2] === "--use-fs-wallet";
    const rpcEndpoints = getRpcEndpoints();

    // Step 1: Initialize Umi with first RPC endpoint from the list
    const umi = createUmi(rpcEndpoints[0]).use(mplCandyMachine());

    // Step 2: Initialize wallet based on parameter
    const wallet = await initializeWallet(umi, useFileSystem);
    umi.use(keypairIdentity(wallet));

    const collectionMint = generateSigner(umi);
    console.log("Collection", collectionMint.publicKey);

    const createNftTx = await createNft(umi, {
      mint: collectionMint,
      authority: umi.identity,
      name: "My Collection NFT",
      uri: "https://example.com/path/to/some/json/metadata.json",
      sellerFeeBasisPoints: percentAmount(9.99, 2), // 9.99%
      isCollection: true,
    }).sendAndConfirm(umi, {
      confirm: {
        commitment: "finalized",
      },
    });

    console.log("Collection Tx", base58.deserialize(createNftTx.signature));

    const candyMachine = generateSigner(umi);
    console.log("CM", candyMachine.publicKey);

    const txCm = await create(umi, {
      candyMachine,
      collectionMint: collectionMint.publicKey,
      collectionUpdateAuthority: umi.identity,
      tokenStandard: TokenStandard.NonFungible,
      sellerFeeBasisPoints: percentAmount(9.99, 2), // 9.99%
      itemsAvailable: 2,
      creators: [
        {
          address: umi.identity.publicKey,
          verified: true,
          percentageShare: 100,
        },
      ],
      guards: {
        mintLimit: some({
          id: 1,
          limit: 2,
        }),
      },
      configLineSettings: some({
        prefixName: "",
        nameLength: 32,
        prefixUri: "",
        uriLength: 200,
        isSequential: false,
      }),
    });
    const txSigCm = await txCm.sendAndConfirm(umi, {
      confirm: {
        commitment: "finalized",
      },
    });
    console.log("CM Tx", base58.deserialize(txSigCm.signature));

    const insertTx = await addConfigLines(umi, {
      candyMachine: candyMachine.publicKey,
      index: 0,
      configLines: [
        { name: "My NFT #1", uri: "https://example.com/nft1.json" },
        { name: "My NFT #2", uri: "https://example.com/nft2.json" },
      ],
    }).sendAndConfirm(umi, {
      confirm: {
        commitment: "finalized",
      },
    });

    console.log("Insert items Tx", base58.deserialize(insertTx.signature));

    const nftMint = generateSigner(umi);
    const mintTx = await transactionBuilder()
      .add(setComputeUnitLimit(umi, { units: 800_000 }))
      .add(
        createMintWithAssociatedToken(umi, {
          mint: nftMint,
          owner: umi.identity.publicKey,
        })
      )
      .add(
        mintV2(umi, {
          candyMachine: candyMachine.publicKey,
          nftMint,
          collectionMint: collectionMint.publicKey,
          collectionUpdateAuthority: umi.identity.publicKey,
          tokenStandard: TokenStandard.NonFungible,
          mintArgs: {
            mintLimit: some({
              id: 1,
            }),
          },
        })
      )
      .sendAndConfirm(umi, {
        confirm: {
          commitment: "finalized",
        },
      });

    console.log("NFT Mint", nftMint.publicKey);
    console.log("Mint Tx", base58.deserialize(mintTx.signature));
  } catch (e: any) {
    console.log(e);
  }
})();
