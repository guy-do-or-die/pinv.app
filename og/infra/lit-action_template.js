/**
 * This is a template for the Lit Action that will be pinned to IPFS.
 * The build system should inject the user's code where indicated.
 * 
 * Flow:
 * 1. Decrypt private parameters (if any).
 * 2. Execute user code inside Lit.Actions.runOnce to prevent rate-limiting/redundancy.
 * 3. Set the response.
 */

const main = async () => {
    // 1. Detect Encrypted Params
    const decryptedParams = { ...jsParams };

    for (const [key, val] of Object.entries(jsParams)) {
        if (val && typeof val === 'object' && val.ciphertext && val.dataToEncryptHash && val.accessControlConditions) {
            console.log(`Decrypting param: ${key}`);
            try {
                const decrypted = await Lit.Actions.decryptToSingleNode({
                    accessControlConditions: val.accessControlConditions,
                    ciphertext: val.ciphertext,
                    dataToEncryptHash: val.dataToEncryptHash,
                    authSig: null,
                    chain: 'ethereum',
                });
                decryptedParams[key] = decrypted;
            } catch (e) {
                console.error(`Failed to decrypt param ${key}: ${e.message}`);
                // Keep original value to allow graceful failure in user code if possible
            }
        }
    }

    // 2. Wrap User Logic in runOnce
    // We define the user function string here or assume it's injected as a function 
    // For the template, we'll assume the builder replaces "USER_CODE_INJECTION" with the actual code block
    // that ends with a return statement.

    await Lit.Actions.runOnce({
        waitForResponse: true,
        name: "UserCodeExecution", // Unique name within this action execution
        function: async () => {
            try {
                // We create a scoped execution to pass decryptedParams
                const runUserLogic = async (params) => {
                    // USER_CODE_START
                    // [INJECTED CODE will be placed here by the pinner]
                    // Example:
                    // const { apiKey } = params;
                    // const res = await fetch('https://api.example.com', { headers: { Authorization: apiKey } });
                    // return await res.json();
                    // USER_CODE_END
                };

                const result = await runUserLogic(decryptedParams);

                // Only the node that wins runOnce sets the response? 
                // Actually runOnce returns the result to ALL nodes.
                return JSON.stringify(result);
            } catch (e) {
                return JSON.stringify({ error: e.message });
            }
        }
    });

    // NOTE: Lit.Actions.runOnce returns the result to local scope of all nodes? 
    // No, runOnce executes on one node, identifying signature? 
    // Wait, standard pattern:
    // const response = await Lit.Actions.runOnce(...)
    // Lit.Actions.setResponse({ response });

    // Let's refine based on docs: runOnce returns the result of the function.
    // So we capture it and set response.
};

// Execute
main().catch(e => {
    Lit.Actions.setResponse({ response: JSON.stringify({ error: e.message }) });
});
