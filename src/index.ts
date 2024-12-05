import { createUmi } from '@metaplex-foundation/umi-bundle-defaults';
import { dasApi } from '@metaplex-foundation/digital-asset-standard-api';
import { das }  from '@metaplex-foundation/mpl-core-das';


import { publicKey } from '@metaplex-foundation/umi';

const assetId = publicKey('FgEKkVTSfLQ7a7BFuApypy4KaTLh65oeNRn2jZ6fiBav');
const collectionId = publicKey('FgEKkVTSfLQ7a7BFuApypy4KaTLh65oeNRn2jZ6fiBav');
const wallet = publicKey('AUtnbwWJQfYZjJ5Mc6go9UancufcAuyqUZzR1jSe4esx');

(async () => {
    const umi = createUmi("https://solana-devnet.rpc.extrnode.com/47b2966e-f6b5-4f8d-9c2e-c48a77f2448b").use(dasApi());
    umi.rpc.getAsset("test")

    const asset = await das.getAsset(umi, assetId, { skipDerivePlugins: true });
    das.dasAssetToCoreCollection

    console.log("on chain Asset");
    console.log(asset);

/*     const collection = await umi.rpc.getAsset(collectionId);

    console.log("on chain collection");
    console.log(collection);

    const dasAsset = await das.searchAssets(umi, {
      owner: publicKey(wallet),
      interface: 'MplCoreAsset',
    })
    console.log("dasAsset")
    console.log(dasAsset)
 */  })();
