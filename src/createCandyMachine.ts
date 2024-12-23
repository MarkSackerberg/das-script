import { addConfigLines, create, mintV2, mplCandyMachine } from '@metaplex-foundation/mpl-candy-machine';
import { createUmi } from '@metaplex-foundation/umi-bundle-defaults';
import {
    createSignerFromKeypair,
    generateSigner,
    percentAmount,
    publicKey,
    signerIdentity,
    some,
    transactionBuilder,
} from '@metaplex-foundation/umi';
import { createNft, TokenStandard } from '@metaplex-foundation/mpl-token-metadata';
import { base58 } from '@metaplex-foundation/umi-serializers';
import { createMintWithAssociatedToken, setComputeUnitLimit } from '@metaplex-foundation/mpl-toolbox';

(async () => {
    try {   
        const umi = createUmi('https://api.devnet.solana.com').use(mplCandyMachine());

        // Generated wallet & topped with devnet SOL
        // EFJM1buMinQCDRuVTcnxYC6xyq2foZpVGB6h9FkCZtJG
        const walletKeypair = umi.eddsa.createKeypairFromSecretKey(
            new Uint8Array([
                55, 146, 120, 193, 131, 215, 1, 110, 149, 69, 77, 71, 247, 165, 143, 25, 230, 133, 120, 205, 225, 114,
                210, 206, 145, 87, 15, 224, 184, 125, 47, 206, 196, 209, 172, 101, 248, 230, 128, 17, 101, 141, 12, 108,
                163, 207, 38, 50, 255, 17, 121, 80, 162, 207, 69, 147, 174, 253, 151, 90, 213, 131, 46, 37,
            ]),
        );

        const signer = createSignerFromKeypair(umi, walletKeypair);

        umi.use(signerIdentity(signer));

        const collectionMint = generateSigner(umi);
        console.log('Collection', collectionMint.publicKey);

        const createNftTx = await createNft(umi, {
            mint: collectionMint,
            authority: umi.identity,
            name: 'My Collection NFT',
            uri: 'https://example.com/path/to/some/json/metadata.json',
            sellerFeeBasisPoints: percentAmount(9.99, 2), // 9.99%
            isCollection: true,
        }).sendAndConfirm(umi, {
            confirm: {
                commitment: 'finalized',
            },
        });

        console.log('Collection Tx', base58.deserialize(createNftTx.signature));

        const candyMachine = generateSigner(umi);
        console.log('CM', candyMachine.publicKey);

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
            configLineSettings: some({
                prefixName: '',
                nameLength: 32,
                prefixUri: '',
                uriLength: 200,
                isSequential: false,
            }),
        });
        const txSigCm = await txCm.sendAndConfirm(umi, {
            confirm: {
                commitment: 'finalized',
            },
        });
        console.log('CM Tx', base58.deserialize(txSigCm.signature));

        const insertTx = await addConfigLines(umi, {
            candyMachine: candyMachine.publicKey,
            index: 0,
            configLines: [
                { name: 'My NFT #1', uri: 'https://example.com/nft1.json' },
                { name: 'My NFT #2', uri: 'https://example.com/nft2.json' },
            ],
        }).sendAndConfirm(umi, {
            confirm: {
                commitment: 'finalized',
            },
        });

        console.log('Insert items Tx', base58.deserialize(insertTx.signature));

        const nftMint = generateSigner(umi);
        const mintTx = await transactionBuilder()
            .add(setComputeUnitLimit(umi, { units: 800_000 }))
            .add(createMintWithAssociatedToken(umi, { mint: nftMint, owner: umi.identity.publicKey }))
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
                }),
            )
            .sendAndConfirm(umi, {
                confirm: {
                    commitment: 'finalized',
                },
            });

        console.log('NFT Mint', nftMint.publicKey);
        console.log('Mint Tx', base58.deserialize(mintTx.signature));
    } catch (e: any) {
        console.log(e);
    }
})();
