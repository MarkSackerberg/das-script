import {
  createTree,
  LeafSchema,
  mintToCollectionV1,
  mplBubblegum,
  parseLeafFromMintToCollectionV1Transaction,
} from "@metaplex-foundation/mpl-bubblegum";

import {
  createNft,
  mplTokenMetadata,
} from "@metaplex-foundation/mpl-token-metadata";
import {
  createGenericFile,
  generateSigner,
  keypairIdentity,
  percentAmount,
  TransactionBuilder,
} from "@metaplex-foundation/umi";
import { createUmi } from "@metaplex-foundation/umi-bundle-defaults";
import { irysUploader } from "@metaplex-foundation/umi-uploader-irys";
import fs from "fs";
import { SendTransactionError } from "@solana/web3.js";
import { base58 } from "@metaplex-foundation/umi/serializers";
import { initializeWallet } from "./util/initializeWallet";
import { getFirstRpcEndpoint } from "./util/getRpcEndpoints";

import { dasApi } from '@metaplex-foundation/digital-asset-standard-api';

const createCnft = async () => {
  const useFileSystem = process.argv[2] === "--use-fs-wallet";

  const rpcUrl = getFirstRpcEndpoint();
  const umi = createUmi(rpcUrl)
    .use(mplBubblegum())
    .use(mplTokenMetadata())
    .use(dasApi())
    .use(irysUploader({
      address: "https://devnet.irys.xyz",
    }))


  const wallet = await initializeWallet(umi, useFileSystem);

  umi.use(keypairIdentity(wallet));
  const merkleTree = generateSigner(umi);

  console.log("merkleTree", merkleTree);
  console.log(
    "Merkle Tree Public Key:",
    merkleTree.publicKey,
    "\nStore this address as you will need it later."
  );


  try {
    (await createTree(umi, {
      merkleTree,
      maxBufferSize: 8,
      maxDepth: 5,
    })).sendAndConfirm(umi, {
      send: {
        skipPreflight: true,
      },
      confirm: {
        commitment: "finalized",
      },
    });
  } catch (error) {
    if (error instanceof SendTransactionError) {
      console.error("Transaction simulation failed:", error.message);
      console.error("Transaction logs:", error.logs);
    } else {
      console.error("An unexpected error occurred:", error);
    }
  }

  const collectionSigner = generateSigner(umi);
  console.log("collectionSigner:", collectionSigner);

  const collectionImageFile = fs.readFileSync("src/testAsset/collection.png");

  const genericCollectionImageFile = createGenericFile(
    collectionImageFile,
    "src/testAsset/collection.png"
  );

  const collectionImageUri = await umi.uploader.upload([
    genericCollectionImageFile,
  ]);

  const collectionMetadata = {
    name: "My Test cNFT Collection",
    image: collectionImageUri[0],
    externalUrl: "",
    properties: {
      files: [
        {
          uri: collectionImageUri[0],
          type: "image/png",
        },
      ],
    },
  };

  console.log("Uploading Collection Metadata...");
  const collectionMetadataUri = await umi.uploader.uploadJson(
    collectionMetadata
  );

  console.log("Creating Collection NFT...", collectionMetadataUri);

  console.log("creating nft");


  const collection_builder = 
    await createNft(umi, {
      mint: collectionSigner,
      name: "My cNFT Collection",
      uri: collectionMetadataUri,
      isCollection: true,
      sellerFeeBasisPoints: percentAmount(0),
    }).sendAndConfirm(umi, {
    send: {
      skipPreflight: true,
    },
    confirm: {
      commitment: "finalized",
    },
  });


  console.log("creating nft metadata");

  const nftImageFile = fs.readFileSync("src/testAsset/0.png");

  const genericNftImageFile = createGenericFile(nftImageFile, "src/testAsset/0.png");

  const nftImageUri = await umi.uploader.upload([genericNftImageFile]);

  const nftMetadata = {
    name: "My Test cNFT",
    image: nftImageUri[0],
    externalUrl: "",
    attributes: [
      {
        trait_type: "trait1",
        value: "value1",
      },
      {
        trait_type: "trait2",
        value: "value2",
      },
    ],
    properties: {
      files: [
        {
          uri: nftImageUri[0],
          type: "image/png",
        },
      ],
    },
  };

  console.log("Uploading cNFT metadata...");
  const nftMetadataUri = await umi.uploader.uploadJson(nftMetadata);
  console.log("nftMetadataUri:", nftMetadataUri);

  console.log("Minting Compressed NFT to Merkle Tree...");

  try {
    let mint_builder = new TransactionBuilder();

    mint_builder = mint_builder.add(
      mintToCollectionV1(umi, {
        leafOwner: umi.identity.publicKey,
        collectionMint: collectionSigner.publicKey,
        merkleTree: merkleTree.publicKey,
        metadata: {
          name: "My Test cNFT",
          uri: nftMetadataUri, // Use the uploaded NFT metadata URI
          sellerFeeBasisPoints: 500, // 5%
          collection: { key: collectionSigner.publicKey, verified: false },
          creators: [
            {
              address: umi.identity.publicKey,
              verified: true,
              share: 100,
            },
          ],
        },
      })
    );

    const { signature } = await mint_builder.sendAndConfirm(umi, {
      send: {
        skipPreflight: false,
      },
      confirm: {
        commitment: "finalized",
      },
    });

    const signatureString = base58.deserialize(signature);
    console.log("signature->", signatureString);

    const leaf: LeafSchema = await parseLeafFromMintToCollectionV1Transaction(
      umi,
      signature
    );
    console.log("Compressed NFT Minted!:", signature);
    console.log("leaf:", leaf);

    //@ts-ignore  
    const proof = await umi.rpc.getAssetProof(leaf.id)
    console.log("proof:", proof)
  } catch (error) {
    console.error("Error minting cNFT:", error);
  }
};

createCnft();
