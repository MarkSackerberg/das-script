import dotenv from 'dotenv';

dotenv.config();

interface RpcEndpoints {
  [key: string]: string;
}

export function getRpcEndpoints(mainnet: boolean = false): RpcEndpoints {
  const endpoints: RpcEndpoints = {};
  const networkType = mainnet ? 'mainnet' : 'devnet';

  Object.entries(process.env).forEach(([key, value]) => {
    // Look for environment variables ending with _RPC
    if (key.endsWith("_RPC") && value) {
      // If the key contains network type specification, check if it matches
      if (key.toLowerCase().includes('mainnet') || key.toLowerCase().includes('devnet')) {
        if (key.toLowerCase().includes(networkType)) {
          const name = key.slice(0, -4).toLowerCase();
          endpoints[name] = value;
        }
      } else {
        // For RPC endpoints without network specification, assume they're for devnet
        if (!mainnet) {
          const name = key.slice(0, -4).toLowerCase();
          endpoints[name] = value;
        }
      }
    }
  });
  
  return endpoints;
}

export function getFirstRpcEndpoint(mainnet: boolean = false): string {
  const rpcEndpoints = getRpcEndpoints(mainnet);
  const rpcUrl = Object.values(rpcEndpoints)[0];
  
  if (!rpcUrl) {
    const networkType = mainnet ? 'mainnet' : 'devnet';
    throw new Error(`No ${networkType} RPC endpoint available`);
  }
  console.log('Using RPC endpoint:', rpcUrl);

  return rpcUrl;
}
