import { createUmi } from "@metaplex-foundation/umi-bundle-defaults";
import { keypairIdentity, publicKey } from "@metaplex-foundation/umi";
import { getFirstRpcEndpoint } from "./util/getRpcEndpoints";
import { initializeWallet } from "./util/initializeWallet";
import { dasApi } from "@metaplex-foundation/digital-asset-standard-api";

(async () => {
  const args = process.argv.slice(2);
  const useFileSystem = args.includes("-fs");
  const isMainnet = args.includes("-m");

  const rpcUrl = getFirstRpcEndpoint(isMainnet);

  // Step 1: Initialize Umi with first RPC endpoint from the list
  const umi = createUmi(rpcUrl).use(dasApi());

  // Initialize wallet based on parameter
  const wallet = await initializeWallet(umi, useFileSystem);
  umi.use(keypairIdentity(wallet));

/*   const assetId = publicKey("ELDjRRs5Wb478K4h3B5bMPEhqFD8FvoET5ctHku5uiYi");

  const fetchedAsset = await umi.rpc.call("getAsset", [assetId]);
  console.log("fetched Asset:", fetchedAsset);

  const firstFetchedAsset = await fetch(rpcUrl, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      jsonrpc: "2.0",
      id: 1,
      method: "getAsset",
      params: {
        id: assetId,
      },
    }), 
  })
  .then((response) => response.json())
  .then((data) => console.log(data));

  const firstFetchedSignatures = await fetch(rpcUrl, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      jsonrpc: "2.0",
      id: 1,
      method: "getAssetSignaturesV2",
      params: {
        id: assetId,
      },
    }),
  })
    .then((response) => response.json())
    .then((data) => console.log(data.result.items));

  const fetchedSignatures = await umi.rpc
    .call("getAssetSignaturesV2", [{
      id: assetId,
    }])
    .then((res) => {
      console.log(res);
    }) */

    const assetIds = [
      publicKey('GGRbPQhwmo3dXBkJSAjMFc1QYTKGBt8qc11tTp3LkEKA'),
      publicKey('5RT4e9uHUgG9h13cSc3L4YvkDc9qXSznoLaX4Tx8cpWS'),
      publicKey('ELDjRRs5Wb478K4h3B5bMPEhqFD8FvoET5ctHku5uiYi'),
      publicKey('4WYe6EUjVbwDD3YyPXJcW1CrS1HwL5ttXcLAQDFYqLEn'),
      publicKey('JDforNYS5Bop4VdZyGCjcUyy1mYZKR4eDveqjZnRYXzy')
    ];

    // When we fetch the proof of the asset using its ID.
    const assets = await umi.rpc.call("getAssetProofs", [assetIds] ).then((res) => {
      console.log(res);
    })  ;
/*    umi.rpc.getAssetsByOwner({
      owner: umi.identity.publicKey,
      limit: 100,
    }).then((res) => {
      console.log(res);
    }) */
    // When we fetch the proof of the asset using its ID.
     for (const assetId of assetIds) {
       await umi.rpc.call("getAssetProof", [assetId] ).then((res) => {
         console.log(res);
       });
     }
})();
