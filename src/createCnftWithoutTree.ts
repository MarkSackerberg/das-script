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
  publicKey,
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
  const useFileSystem = process.argv[2] === "-fs";

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
  let mint_builder = new TransactionBuilder();

  mint_builder = mint_builder.add(
    mintToCollectionV1(umi, {
      leafOwner: umi.identity.publicKey,
      collectionMint: publicKey("Dm1TRVw82roqpfqpzsFxSsWg6a4z3dku6ebVHSHuVo1c"),
      merkleTree: publicKey("J1imb8C8SPzofrtgCxkN4nsKwHevzxgvHGeYBKFEDEmE"),
      metadata: {
        name: "Chiaki Azure 55",
        uri: "https://arweave.net/c9aGs5fOk7gD4wWnSvmzeqgtfxAGRgtI1jYzvl8-IVs/chiaki-violet-azure-common.json",
        sellerFeeBasisPoints: 500, // 5%
        collection: { key: publicKey("Dm1TRVw82roqpfqpzsFxSsWg6a4z3dku6ebVHSHuVo1c"), verified: true },
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

};

createCnft();
