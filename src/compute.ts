import { createUmi } from "@metaplex-foundation/umi-bundle-defaults";
import {
  sol,
  publicKey,
  Transaction,
  Umi,
  generateSigner,
  keypairIdentity,
  TransactionBuilder,
} from "@metaplex-foundation/umi";
import {
  transferSol,
  setComputeUnitLimit,
  setComputeUnitPrice,
  mplToolbox,
} from "@metaplex-foundation/mpl-toolbox";
import { base58, base64 } from "@metaplex-foundation/umi/serializers";

/**
 * Calculates the optimal priority fee based on recent transactions
 * This helps ensure our transaction gets processed quickly by offering an appropriate fee
 * @param umi - The Umi instance
 * @param transaction - The transaction to calculate the fee for
 * @returns The average priority fee in microLamports (1 lamport = 0.000000001 SOL)
 */
export const getPriorityFee = async (
  umi: Umi,
  transaction: TransactionBuilder
): Promise<number> => {
  // Get unique writable accounts involved in the transaction
  // We only care about writable accounts since they affect priority fees
  const distinctPublicKeys = new Set<string>();
  
  transaction.items.forEach(item => {
    item.instruction.keys.forEach(key => {
      if (key.isWritable) {
        distinctPublicKeys.add(key.pubkey.toString());
      }
    });
  });
  
  // Query recent prioritization fees for these accounts from the RPC
  const response = await fetch(umi.rpc.getEndpoint(), {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      jsonrpc: "2.0",
      id: 1,
      method: "getRecentPrioritizationFees",
      params: [Array.from(distinctPublicKeys)],
    }),
  });

  if (!response.ok) {
    throw new Error(`Failed to fetch priority fees: ${response.status}`);
  }

  const data = await response.json() as {
    result: { prioritizationFee: number; slot: number; }[];
  };

  // Calculate average of top 100 fees to get a competitive rate
  const fees = data.result?.map(entry => entry.prioritizationFee) || [];
  const topFees = fees.sort((a, b) => b - a).slice(0, 100);
  const averageFee = topFees.length > 0 ? Math.ceil(
    topFees.reduce((sum, fee) => sum + fee, 0) / topFees.length
  ) : 0;
  return averageFee;
};

/**
 * Estimates the required compute units for a transaction
 * This helps prevent compute unit allocation errors while being cost-efficient
 * @param umi - The Umi instance
 * @param transaction - The transaction to estimate compute units for
 * @returns Estimated compute units needed with 10% safety buffer
 */
export const getRequiredCU = async (
  umi: Umi,
  transaction: Transaction
): Promise<number> => {
  // Default values if estimation fails
  const DEFAULT_COMPUTE_UNITS = 800_000; // Standard safe value
  const BUFFER_FACTOR = 1.1; // Add 10% safety margin

  // Simulate the transaction to get actual compute units needed
  const response = await fetch(umi.rpc.getEndpoint(), {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      jsonrpc: "2.0",
      id: 1,
      method: "simulateTransaction",
      params: [
        base64.deserialize(umi.transactions.serialize(transaction))[0],
        {
          encoding: "base64",
          replaceRecentBlockhash: true,
          sigVerify: false,
        },
      ],
    }),
  });

  if (!response.ok) {
    throw new Error(`Failed to simulate transaction: ${response.status}`);
  }

  const data = await response.json();
  const unitsConsumed = data.result?.value?.unitsConsumed;

  // Fallback to default if simulation doesn't provide compute units
  if (!unitsConsumed) {
    console.log("Simulation didn't return compute units, using default value");
    return DEFAULT_COMPUTE_UNITS;
  }

  // Add safety buffer to estimated compute units
  return Math.ceil(unitsConsumed * BUFFER_FACTOR);
};

/**
 * Example usage: Demonstrates how to send SOL with optimized compute units and priority fees
 * This example shows a complete flow of creating and optimizing a Solana transaction
 */
const example = async () => {
  // Step 1: Initialize Umi with your RPC endpoint
  const umi = createUmi("https://devnet.helius-rpc.com/?api-key=0aa5bfbe-0077-4414-9d87-02ffa09cc50b").use(mplToolbox());
  
  // Step 2: Set up a test wallet
  const signer = generateSigner(umi);
  umi.use(keypairIdentity(signer));
  
  // Step 3: Fund the wallet (devnet only)
  console.log("Requesting airdrop for testing...");
  await umi.rpc.airdrop(signer.publicKey, sol(0.001));
  await new Promise(resolve => setTimeout(resolve, 15000)); // Wait for airdrop confirmation
  
  // Step 4: Set up the basic transfer parameters
  const destination = publicKey("BeeryDvghgcKPTUw3N3bdFDFFWhTWdWHnsLuVebgsGSD");
  const transferAmount = sol(0.00001); // 0.00001 SOL
  
  // Step 5: Create the base transaction
  console.log("Creating base transfer transaction...");
  const baseTransaction = await transferSol(umi, {
    source: signer,
    destination,
    amount: transferAmount,
  }).setLatestBlockhash(umi);

  // Step 6: Calculate optimal priority fee
  console.log("Calculating optimal priority fee...");
  const priorityFee = await getPriorityFee(umi, baseTransaction);
  
  // Step 7: Create intermediate transaction for compute unit estimation
  const withCU = baseTransaction.prepend(
    setComputeUnitPrice(umi, { microLamports: priorityFee })
  ).prepend(
    setComputeUnitLimit(umi, { units: 1400000 })
  );

  // Step 8: Calculate optimal compute unit limit
  console.log("Estimating required compute units...");
  const requiredUnits = await getRequiredCU(umi, withCU.build(umi));
  
  // Step 9: Build the final optimized transaction
  const finalTransaction = baseTransaction.prepend(
    setComputeUnitPrice(umi, { microLamports: priorityFee })
  ).prepend(
    setComputeUnitLimit(umi, { units: requiredUnits })
  );
  console.log(`Transaction optimized with Priority Fee: ${priorityFee} microLamports and ${requiredUnits} compute units`);

  // Step 10: Send and confirm the transaction
  console.log("Sending optimized transaction...");
  const signature = await finalTransaction.sendAndConfirm(umi);
  console.log("Transaction confirmed! Signature:", base58.deserialize(signature.signature)[0]);
};

// Run the example
example().catch(console.error);
