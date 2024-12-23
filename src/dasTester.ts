const collectionPub = publicKey("7kNL9B6vb1PUZkrkh3jbJtfRFrVYGUQfzS2D7X5CRMWj");
const assetId = publicKey("7RebhXKU59nmcsKSVNbcKp7CkApDd4FN9o7Q6RK2zHeH");

import { createUmi } from "@metaplex-foundation/umi-bundle-defaults";
import { dasApi } from "@metaplex-foundation/digital-asset-standard-api";
import { getAssetWithProof, mplBubblegum } from "@metaplex-foundation/mpl-bubblegum";

import { publicKey } from "@metaplex-foundation/umi";


async function getAssetWithProofFromUrl(url: string) {
  const umi = createUmi(url).use(mplBubblegum());
  const assetWithProof = await getAssetWithProof(umi, assetId, {
    truncateCanopy: true,
  });
  return assetWithProof;
}

interface RpcEndpoints {
  [key: string]: string;
}

const rpcEndpoints: RpcEndpoints = {
  extrnode:
    "https://solana-devnet.rpc.extrnode.com/47b2966e-f6b5-4f8d-9c2e-c48a77f2448b",
  aura: "https://aura-devnet.metaplex.com/",
  helius:
    "https://devnet.helius-rpc.com/?api-key=0aa5bfbe-0077-4414-9d87-02ffa09cc50b",
  quicknode:
    "https://alpha-damp-seed.solana-devnet.quiknode.pro/ad2b85ef8308cc664df6754f60c65e3d0819b74d",
};

(async () => {
  const results = new Map<string, any>();

  // Fetch results from each RPC endpoint
  for (const [name, url] of Object.entries(rpcEndpoints)) {
    try {
      console.log(`Fetching from ${name}...`);
      const result = await getAssetWithProofFromUrl(url);
      results.set(name, result);
    } catch (error) {
      console.error(`Error fetching from ${name}:`, error);
      results.set(name, null);
    }
  }

  // Compare results
  const entries = Array.from(results.entries());
  const firstValidResult = entries.find(([_, result]) => result !== null);

  if (!firstValidResult) {
    console.log("No valid results obtained from any endpoint");
    return;
  }

  const [baselineName, baselineResult] = firstValidResult;
  console.log(`\nUsing ${baselineName} as baseline for comparison`);

  for (const [name, result] of entries) {
    if (name === baselineName) continue;

    if (result === null) {
      console.log(`\n${name}: Failed to fetch data`);
      continue;
    }

    console.log(`\nComparing ${name} with baseline:`);

    // Deep compare objects and report differences
    const differences = findDifferences(baselineResult, result);

    if (Object.keys(differences).length === 0) {
      console.log(`No differences found between ${baselineName} and ${name}`);
    } else {
      console.log(`Differences found between ${baselineName} and ${name}:`);
      console.log(JSON.stringify(differences, null, 2));
    }
  }

  function findDifferences(
    obj1: any,
    obj2: any,
    path: string = ""
  ): Record<string, { baseline: any; compared: any }> {
    const differences: Record<string, { baseline: any; compared: any }> = {};

    if (typeof obj1 !== typeof obj2) {
      differences[path] = { baseline: obj1, compared: obj2 };
      return differences;
    }

    if (typeof obj1 !== "object" || obj1 === null) {
      if (obj1 !== obj2) {
        differences[path] = { baseline: obj1, compared: obj2 };
      }
      return differences;
    }

    const allKeys = new Set([...Object.keys(obj1), ...Object.keys(obj2)]);

    for (const key of allKeys) {
      const newPath = path ? `${path}.${key}` : key;

      if (!(key in obj1)) {
        differences[newPath] = { baseline: undefined, compared: obj2[key] };
        continue;
      }
      if (!(key in obj2)) {
        differences[newPath] = { baseline: obj1[key], compared: undefined };
        continue;
      }

      const nestedDifferences = findDifferences(obj1[key], obj2[key], newPath);
      Object.assign(differences, nestedDifferences);
    }

    return differences;
  }
})();
