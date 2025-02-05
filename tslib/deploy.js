"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const ethers_1 = require("ethers");
const typechain_types_1 = require("../typechain-types");
if (!process.env.PRVKEY)
    throw Error("Must set PRVKEY envvar");
//const provider = new JsonRpcProvider('https://rpc.ankr.com/eth');
const provider = new ethers_1.JsonRpcProvider('https://rpc.gnosischain.com/');
//const provider = new JsonRpcProvider('http://localhost:8545/');
//const provider = new JsonRpcProvider('https://api.avax.network/ext/bc/C/rpc');
const deployPrvKey = process.env.PRVKEY;
const wallet = new ethers_1.Wallet(deployPrvKey, provider);
async function deployOwnedBrevityInterpreter() {
    console.log(`Deploying OwnedBrevityInterpreter from ${wallet.address}`);
    const factory = new typechain_types_1.OwnedBrevityInterpreter__factory(wallet);
    const interpreter = await factory.deploy(wallet.address);
    await interpreter.deploymentTransaction()?.wait();
    console.log(`Deployed OwnedBrevityInterpreter to ${await interpreter.getAddress()}`);
}
async function deployTestCoin(name, symbol, amount) {
    console.log(`Deploying ${amount} TestCoin ${name} ${symbol} from ${wallet.address}`);
    const factory = new typechain_types_1.TestCoin__factory(wallet);
    const tc = await factory.deploy(name, symbol, amount);
    await tc.deploymentTransaction()?.wait();
    console.log(`Deployed TestCoin to ${await tc.getAddress()}`);
}
async function main() {
    try {
        await deployTestCoin("test", "b1", (0, ethers_1.parseEther)("1000000000"));
        //await deployOwnedBrevityInterpreter()
    }
    catch (err) {
        console.error(err);
    }
}
main();
