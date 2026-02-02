"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const ethers_1 = require("ethers");
const typechain_types_1 = require("../typechain-types");
if (!process.env.PRVKEY)
    throw Error("Must set PRVKEY envvar");
const provider = new ethers_1.JsonRpcProvider('https://0xrpc.io/eth');
//const provider = new JsonRpcProvider('https://rpc.gnosischain.com/');
//const provider = new JsonRpcProvider('http://localhost:8545/');
//const provider = new JsonRpcProvider('https://api.avax.network/ext/bc/C/rpc');
const deployPrvKey = process.env.PRVKEY;
const wallet = new ethers_1.Wallet(deployPrvKey, provider);
const UNISWAP_POOL_MANAGER_MAINNET = '0x000000000004444c5dc75cb358380d2e3de08a90';
async function deployOwnedBrevityInterpreter() {
    console.log(`Deploying OwnedBrevityInterpreter from ${wallet.address}`);
    const factory = new typechain_types_1.OwnedBrevityInterpreter__factory(wallet);
    const interpreter = await factory.deploy(wallet.address);
    await interpreter.deploymentTransaction()?.wait();
    console.log(`Deployed OwnedBrevityInterpreter to ${await interpreter.getAddress()}`);
}
async function deployUniswap4BrevityInterpreter() {
    console.log(`Deploying Uniswap4FlashBrevityInterpreter from ${wallet.address}`);
    const factory = new typechain_types_1.Uniswap4FlashBrevityInterpreter__factory(wallet);
    const interpreter = await factory.deploy(wallet.address, UNISWAP_POOL_MANAGER_MAINNET);
    await interpreter.deploymentTransaction()?.wait();
    console.log(`Deployed Uniswap4FlashBrevityInterpreter to ${await interpreter.getAddress()}`);
}
async function main() {
    try {
        await deployUniswap4BrevityInterpreter();
        //await deployOwnedBrevityInterpreter()
    }
    catch (err) {
        console.error(err);
    }
}
main();
