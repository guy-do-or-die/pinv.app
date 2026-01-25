
import { toV0 } from "../lib/cid";
import Hash from 'ipfs-only-hash';

// A real Raw CID from logs/screenshot (approximate format)
const RAW_CID = "bafkreigpsrve252ay2f662zewbtb5mg2pjt4spfkcbiswagtogdezayc6m";

async function run() {
    console.log("Testing toV0 conversion...");
    const result = toV0(RAW_CID);
    console.log(`Input: ${RAW_CID}`);
    console.log(`Output: ${result}`);

    if (result === RAW_CID) {
        console.error("FAIL: toV0 could not convert Raw CID. It returned input.");
    } else {
        console.log("SUCCESS: Converted to v0:", result);
    }
}

run();
