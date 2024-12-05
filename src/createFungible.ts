import { createUmi } from "@metaplex-foundation/umi-bundle-defaults";
import {
  createV1,
  mplTokenMetadata,
  TokenStandard,
} from "@metaplex-foundation/mpl-token-metadata";
import { readFileSync } from "fs";
import {
  generateSigner,
  keypairIdentity,
  percentAmount,
} from "@metaplex-foundation/umi";
import {
  mplToolbox,
} from "@metaplex-foundation/mpl-toolbox";

(async () => {
  const umi = createUmi(
    "https://solana-devnet.rpc.extrnode.com/47b2966e-f6b5-4f8d-9c2e-c48a77f2448b"
  )
    .use(mplToolbox())
    .use(mplTokenMetadata());

  const wallet =
    "/home/simon/solana/Tes1zkZkXhgTaMFqVgbgvMsVkRJpq4Y6g54SbDBeKVV.json";
  const secretKey = JSON.parse(readFileSync(wallet, "utf-8"));

  // Create a keypair from your private key
  const keypair = umi.eddsa.createKeypairFromSecretKey(
    new Uint8Array(secretKey)
  );

  umi.use(keypairIdentity(keypair));

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
