// ... imports
import { ensureLitCompatibleCid } from './cid';

// We embed the template here to ensure it's available client-side without FS access
const LIT_ACTION_TEMPLATE = `
/**
 * This is a template for the Lit Action that will be pinned to IPFS.
 * The build system should inject the user's code where indicated.
 */

const main = async () => {
  console.log("Lit Action Started. Params keys:", Object.keys(jsParams));

  // 1. Detect Encrypted Params
  const decryptedParams = { ...jsParams };

  for (const [key, val] of Object.entries(jsParams)) {
    if (val && typeof val === 'object' && val.ciphertext && val.dataToEncryptHash && val.accessControlConditions) {
      console.log(\`Attempting to decrypt param: \${key}\`);
      console.log(\`ACC: \`, JSON.stringify(val.accessControlConditions));
      
      try {
        // We use decryptAndCombine which automatically provides the Action Security Context (proof of code identity)
        // when running inside a Lit Action. No manual AuthSig is required for this.
        const decrypted = await Lit.Actions.decryptAndCombine({
          accessControlConditions: val.accessControlConditions,
          ciphertext: val.ciphertext,
          dataToEncryptHash: val.dataToEncryptHash,
          chain: 'ethereum',
          authSig: null 
        });
        
        console.log(\`Decryption successful for \${key}\`);
        decryptedParams[key] = decrypted;
      } catch (e) {
        console.error(\`Failed to decrypt param \${key}: \${e.message}\`);
        // Keep original value to allow graceful failure in user code if possible
      }
    }
  }

  // 2. Wrap User Logic in runOnce
  // We use runOnce to ensure the API call (or state change) happens exactly once across the network.
  console.log("TEMPLATE_DEBUG_VERSION: W/ RunOnce");
  
  return await Lit.Actions.runOnce({
    waitForResponse: true,
    name: "UserCodeExecution", 
    function: async () => {
      console.log("Inside runOnce environment");
      try {
         // We create a scoped execution to pass decryptedParams
         const runUserLogic = async (jsParams) => {
            // USER_CODE_START
            // [INJECTED CODE will be placed here by the pinner]
            USER_CODE_INJECTION_POINT
            // USER_CODE_END
            
            // AUTOMATICALLY CALL MAIN IF DEFINED
            console.log("Type of main:", typeof main);
            if (typeof main === 'function') {
              console.log("Calling user main function...");
              const res = await main(jsParams);
              console.log("User main returned:", JSON.stringify(res));
              return res;
            } else {
              console.error("User main function not found!");
              return { error: "User main function not found" };
            }
         };
         
         const result = await runUserLogic(decryptedParams);
         return result;
      } catch (e) {
        console.error("Error in runOnce execution:", e.message);
        return { error: e.message };
      }
    }
  });
};

// Execute
main()
  .then((result) => {
    Lit.Actions.setResponse({ response: JSON.stringify(result) });
  })
  .catch((e) => {
    Lit.Actions.setResponse({ response: JSON.stringify({ error: e.message }) });
  });
`;

// We defined the function to accept an uploader callback to avoid dependency on web-specific actions
// in shared library code.
export async function prepareAndPinLitAction(
  userCode: string,
  uploader: (code: string) => Promise<string>
): Promise<string> {
  // 1. Injection
  // We replace the placeholder with the user code
  const fullCode = LIT_ACTION_TEMPLATE.replace('USER_CODE_INJECTION_POINT', userCode);

  // 2. Upload to IPFS via provided uploader (server action wrapper)
  // This allows us to enforce CIDv0 on the server side where we have full SDK control.
  const rawCid = await uploader(fullCode);

  if (!rawCid) throw new Error("Failed to upload Lit Action to IPFS");

  // 3. Robustness: Ensure compatibility
  // Even if the uploader returns v1 (e.g. if we switch backing services), 
  // we try to convert to v0 for Lit.
  return ensureLitCompatibleCid(rawCid);
}
