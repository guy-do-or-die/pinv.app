import { generatePrivateKey, privateKeyToAccount } from 'viem/accounts';

const pk = generatePrivateKey();
const account = privateKeyToAccount(pk);

console.log("Private Key:", pk);
console.log("Address:", account.address);
