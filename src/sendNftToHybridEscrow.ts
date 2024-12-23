import { keypairIdentity, publicKey } from "@metaplex-foundation/umi";
import {
  MPL_HYBRID_PROGRAM_ID,
  mplHybrid,
} from "@metaplex-foundation/mpl-hybrid";
import { readFileSync } from "fs";
import { mplTokenMetadata } from "@metaplex-foundation/mpl-token-metadata";
import { createUmi } from "@metaplex-foundation/umi-bundle-defaults";
import {
  string,
  publicKey as publicKeySerializer,
} from "@metaplex-foundation/umi/serializers";
import { transfer } from "@metaplex-foundation/mpl-core";

(async () => {
  const collection = publicKey("<COLLECTION>"); // The collection we are swapping to/from
  const asset = publicKey("<NFT MINT>"); // Mint Address of the NFT you want to send

  const umi = createUmi("<ENDPOINT>").use(mplHybrid()).use(mplTokenMetadata());

  const wallet = "<path to wallet>"; // The path to your filesystem Wallet
  const secretKey = JSON.parse(readFileSync(wallet, "utf-8"));

  // Create a keypair from your private key
  const keypair = umi.eddsa.createKeypairFromSecretKey(
    new Uint8Array(secretKey)
  );
  umi.use(keypairIdentity(keypair));

  // Derive the Escrow
  const escrow = umi.eddsa.findPda(MPL_HYBRID_PROGRAM_ID, [
    string({ size: "variable" }).serialize("escrow"),
    publicKeySerializer().serialize(collection),
  ])[0];

  // Transfer Asset to it
  const transferAssetTx = await transfer(umi, {
    asset,
    collection,
    newOwner: escrow,
  }).sendAndConfirm(umi);
})();
