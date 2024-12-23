import { createUmi } from '@metaplex-foundation/umi-bundle-defaults'
import { publicKey, signerIdentity, generateSigner, sol, keypairIdentity } from '@metaplex-foundation/umi'
import { mplHybrid, MPL_HYBRID_PROGRAM_ID, initEscrowV1 } from '@metaplex-foundation/mpl-hybrid'
import { mplTokenMetadata } from '@metaplex-foundation/mpl-token-metadata'
import { string, base58, publicKey as publicKeySerializer } from '@metaplex-foundation/umi/serializers'
import { readFileSync } from 'fs'

(async () => {
  /// Step 1: Setup Umi
  const umi = createUmi('https://alpha-damp-seed.solana-devnet.quiknode.pro/ad2b85ef8308cc664df6754f60c65e3d0819b74d')
    .use(mplHybrid())
    .use(mplTokenMetadata())

    const wallet =
    "/home/simon/solana/Tes1zkZkXhgTaMFqVgbgvMsVkRJpq4Y6g54SbDBeKVV.json";
  const secretKey = JSON.parse(readFileSync(wallet, "utf-8"));

  // Create a keypair from your private key
  const keypair = umi.eddsa.createKeypairFromSecretKey(
    new Uint8Array(secretKey)
  );

  umi.use(keypairIdentity(keypair));

  /// Step 2: Setup the Escrow

  // Escrow Settings - Change these to your needs
  const name = "MPL-404 Hybrid Escrow";                       // The name of the escrow
  const uri = "https://arweave.net/manifestId";               // The base URI of the collection
  const max = 15;                                             // The max URI
  const min = 0;                                              // The min URI
  const path = 1;                                             // 0: Update Nft on Swap, 1: Do not update Nft on Swap

  // Escrow Accounts - Change these to your needs
  const collection = publicKey('2awhCfABp9iFC9KuLZqGZvkVFRpAX631XbrPA9A9D9kW');  // The collection we are swapping to/from
  const token = publicKey('AP2Aj3WFJrZZMJimMNNG9J1oz1yn7itMjg2iRpim9xgK');            // The token we are swapping to/from
  const feeLocation = publicKey('Tes1zkZkXhgTaMFqVgbgvMsVkRJpq4Y6g54SbDBeKVV');        // The address where the fees will be sent
  const escrow = umi.eddsa.findPda(MPL_HYBRID_PROGRAM_ID, [
    string({ size: 'variable' }).serialize('escrow'),
    publicKeySerializer().serialize(collection),
  ]);                                                         // The derived escrow account

  // Token Swap Settings - Change these to your needs
  const tokenDecimals = 3;                                    // The decimals of the token
  const amount = addZeros(100, tokenDecimals);                // The amount the user will receive when swapping
  const feeAmount = addZeros(1, tokenDecimals);               // The amount the user will pay as fee when swapping to NFT
  const solFeeAmount = addZeros(0, 9);                        // Additional fee to pay when swapping to NFTs (Sol has 9 decimals)

  /// Step 3: Create the Escrow
  const initEscrowTx = await initEscrowV1(umi, {
    name,
    uri,
    max,
    min,
    path,
    escrow,
    collection,
    token,
    feeLocation,
    amount,
    feeAmount,
    solFeeAmount,
  }).sendAndConfirm(umi);

  const signature = base58.deserialize(initEscrowTx.signature)[0]
  console.log(`Escrow ${escrow} created! https://explorer.solana.com/tx/${signature}?cluster=devnet`)
})()

// Function that adds zeros to a number, needed for adding the correct amount of decimals
function addZeros(num: number, numZeros: number): number {
  return num * Math.pow(10, numZeros)
}