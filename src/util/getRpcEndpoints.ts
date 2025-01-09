import dotenv from 'dotenv';

// Load environment variables from .env file
dotenv.config();

interface RpcEndpoints {
  [key: string]: string;
}

export function getRpcEndpoints(): RpcEndpoints {
  const endpoints: RpcEndpoints = {};

  // Get all environment variables
  console.log('Available env variables:', Object.keys(process.env));
  
  Object.entries(process.env).forEach(([key, value]) => {
    // Look for environment variables ending with _RPC
    if (key.endsWith("_RPC") && value) {
      // Convert SOMETHING_RPC to something
      const name = key.slice(0, -4).toLowerCase();
      endpoints[name] = value;
      console.log(`Added endpoint: ${name} = ${value}`);
    }
  });

  console.log('Final endpoints:', endpoints);
  return endpoints;
}

export function getFirstRpcEndpoint(): string {
  const rpcEndpoints = getRpcEndpoints();
  const rpcUrl = Object.values(rpcEndpoints)[0];
  
  if (!rpcUrl) {
    throw new Error('No RPC endpoint available');
  }
  console.log('Using RPC endpoint:', rpcUrl);

  return rpcUrl;
}
