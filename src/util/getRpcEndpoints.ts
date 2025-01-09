interface RpcEndpoints {
  [key: string]: string;
}

export function getRpcEndpoints(): RpcEndpoints {
  const endpoints: RpcEndpoints = {};

  // Get all environment variables
  Object.entries(process.env).forEach(([key, value]) => {
    // Look for environment variables ending with _RPC
    if (key.endsWith("_RPC") && value) {
      // Convert SOMETHING_RPC to something
      const name = key.slice(0, -4).toLowerCase();
      endpoints[name] = value;
    }
  });

  return endpoints;
}
