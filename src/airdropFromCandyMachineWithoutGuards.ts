import {
  addConfigLines,
  createCandyMachineV2,
  fetchCandyMachine,
  mintFromCandyMachineV2,
  mplCandyMachine,
} from "@metaplex-foundation/mpl-candy-machine";
import { createUmi } from "@metaplex-foundation/umi-bundle-defaults";
import {
  generateSigner,
  keypairIdentity,
  percentAmount,
  publicKey,
  sol,
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

/**
 * This script demonstrates how to create a basic Candy Machine without guards
 * and mint an NFT to a recipient wallet.
 */

// Configuration
const RECIPIENT_ADDRESS = "Tes1zkZkXhgTaMFqVgbgvMsVkRJpq4Y6g54SbDBeKVV";

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
    
    const recipient = publicKey(RECIPIENT_ADDRESS);

    // --- Create Collection NFT ---
    
    const collectionMint = generateSigner(umi);
    console.log("Creating collection NFT...");
    console.log("Collection Address:", collectionMint.publicKey);

    const createNftTx = await createNft(umi, {
      mint: collectionMint,
      authority: umi.identity,
      name: "My Collection NFT",
      uri: "https://example.com/path/to/some/json/metadata.json",
      sellerFeeBasisPoints: percentAmount(9.99, 2),
      isCollection: true,
    }).sendAndConfirm(umi, {
      confirm: { commitment: "finalized" },
    });
    console.log("Collection Created:", base58.deserialize(createNftTx.signature)[0]);

    // --- Create Candy Machine ---

    console.log("Creating basic Candy Machine...");
    const candyMachine = generateSigner(umi);
    
    const createCandyMachineV2Tx = await (
      await createCandyMachineV2(umi, {
        candyMachine,
        tokenStandard: TokenStandard.NonFungible,
        collectionMint: collectionMint.publicKey,
        collectionUpdateAuthority: umi.identity,
        itemsAvailable: 2,
        sellerFeeBasisPoints: percentAmount(1.23),
        creators: [
          {
            address: umi.identity.publicKey,
            verified: false,
            percentageShare: 100,
          },
        ],
        configLineSettings: some({
          prefixName: "My NFT #",
          nameLength: 3,
          prefixUri: "https://example.com/",
          uriLength: 29,
          isSequential: false,
        }),
      })
    )
      .add(
        addConfigLines(umi, {
          candyMachine: candyMachine.publicKey,
          index: 0,
          configLines: [
            { name: "1", uri: "https://example.com/nft1.json" },
            { name: "2", uri: "https://example.com/nft2.json" },
          ],
        })
      )
      .sendAndConfirm(umi, { confirm: { commitment: "finalized" } });
      
    console.log("Candy Machine Created:", base58.deserialize(createCandyMachineV2Tx.signature)[0]);

    // --- Mint NFT ---

    console.log("Minting NFT to recipient...");
    
    // Get latest Candy Machine state
    const candyMachineAccount = await fetchCandyMachine(umi, candyMachine.publicKey);

    // Create mint transaction
    const nftMint = generateSigner(umi);
    const mintTx = await transactionBuilder()
      .add(setComputeUnitLimit(umi, { units: 800_000 }))
      .add(
        createMintWithAssociatedToken(umi, { mint: nftMint, owner: recipient })
      )
      .add(
        mintFromCandyMachineV2(umi, {
          candyMachine: candyMachine.publicKey,
          mintAuthority: umi.identity,
          nftOwner: recipient,
          nftMint,
          collectionMint: candyMachineAccount.collectionMint,
          collectionUpdateAuthority: candyMachineAccount.authority,
        })
      )
      .sendAndConfirm(umi, {
        confirm: { commitment: "finalized" },
      });

    console.log("NFT Minted Successfully!");  
    console.log("Mint Transaction:", base58.deserialize(mintTx.signature)[0]);

  } catch (error) {
    console.error("Failed to execute:", error);
  }
})();
