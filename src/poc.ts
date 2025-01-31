import { createUmi } from "@metaplex-foundation/umi-bundle-defaults";
import { publicKey } from "@metaplex-foundation/umi";

(async () => {
  const rpcUrl =
    "";

  const umi = createUmi(rpcUrl);

  const assetIds = [
    publicKey("GGRbPQhwmo3dXBkJSAjMFc1QYTKGBt8qc11tTp3LkEKA"),
    publicKey("ELDjRRs5Wb478K4h3B5bMPEhqFD8FvoET5ctHku5uiYi"),
    publicKey("4WYe6EUjVbwDD3YyPXJcW1CrS1HwL5ttXcLAQDFYqLEn"),
  ];

  // When we fetch the proofs of the assets using their IDs.
  await umi.rpc.call("getAssetProofs", [assetIds]).then((res) => {
    // Then we receive nulls for all except one
    console.log("incorrect result", res);
  });

  // When we fetch the proof of the asset using its ID one by one.
  for (const assetId of assetIds) {
    await umi.rpc.call("getAssetProof", [assetId]).then((res) => {
      // Then we receive the proof for all assets one by one
      console.log("correct result for", assetId, res);
    });
  }

  fetch(rpcUrl, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      jsonrpc: "2.0",
      id: 1,
      method: "getAssetProofs",
      params: {
        ids: [
          "GGRbPQhwmo3dXBkJSAjMFc1QYTKGBt8qc11tTp3LkEKA",
          "ELDjRRs5Wb478K4h3B5bMPEhqFD8FvoET5ctHku5uiYi",
          "4WYe6EUjVbwDD3YyPXJcW1CrS1HwL5ttXcLAQDFYqLEn",
        ],
      },
    }),
  })
    .then((response) => response.json())
    .then((data) => console.log(data));
})();
