import dotenv from 'dotenv';

// Load environment variables from .env file
dotenv.config();

interface RpcEndpoints {
  [key: string]: string;
}

export function getRpcEndpoints(mainnet: boolean = false): RpcEndpoints {
  const endpoints: RpcEndpoints = {};
  const networkType = mainnet ? 'mainnet' : 'devnet';
    
  Object.entries(process.env).forEach(([key, value]) => {
    // Look for environment variables ending with _RPC and matching network type
    if (key.endsWith("_RPC") && value && key.toLowerCase().includes(networkType)) {
      // Convert SOMETHING_MAINNET_RPC or SOMETHING_DEVNET_RPC to something
      const name = key.slice(0, -4).toLowerCase();
      endpoints[name] = value;
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
