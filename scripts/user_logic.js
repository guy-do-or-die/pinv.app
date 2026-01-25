const main = async (jsParams) => {
    console.log("Starting Sim API fetch with params:", jsParams);
    const { address, sim_api_key } = jsParams;

    const result = {
        tx_found: false,
        address: address,
        chain_name: "Base",
        status: "Unknown",
        is_error: false
    };

    if (!address || !sim_api_key) {
        result.status = "Missing Parameters";
        return result;
    }

    try {
        // Base chain ID is 8453
        const url = `https://api.sim.dune.com/v1/evm/transactions/${address}?chain_ids=8453&limit=1&decode=true`;
        console.log("Fetching from SIM API:", url);
        // console.log("Using API Key:", sim_api_key); // BE CAREFUL LOGGING SECRETS

        const response = await fetch(url, {
            method: "GET",
            headers: {
                "X-Sim-Api-Key": sim_api_key,
                "Accept": "application/json"
            }
        });

        if (!response.ok) {
            const errorText = await response.text();
            console.error("API Error:", response.status, errorText);
            result.status = `API Error: ${response.status}`;
            result.is_error = true;
            return result;
        }

        const data = await response.json();

        if (data && data.transactions && data.transactions.length > 0) {
            const tx = data.transactions[0];
            const txValue = BigInt(tx.value || "0x0");
            const readableValue = (Number(txValue) / 1e18).toFixed(4);

            const date = new Date(tx.block_time);
            const formattedDate = date.toLocaleString('en-US', {
                month: 'short',
                day: 'numeric',
                hour: '2-digit',
                minute: '2-digit'
            });

            return {
                tx_found: true,
                tx_hash: tx.hash,
                block_time: formattedDate,
                value_readable: `${readableValue} ETH`,
                method_name: tx.decoded ? tx.decoded.name : (tx.to ? "Contract Call" : "Deployment"),
                from_addr: tx.from,
                to_addr: tx.to || "0x0000...",
                chain_name: "Base",
                status: "Confirmed",
                is_error: false,
                address: address
            };
        } else {
            result.status = "No Activity found";
            return result;
        }
    } catch (e) {
        console.error("Lit Action Error:", e);
        result.status = "Fetch Failed";
        result.is_error = true;
        return result;
    }
};
