import {
    ContractFactory,
    Wallet,
    JsonRpcProvider,
    parseEther
} from "ethers"
import { OwnedBrevityInterpreter__factory, Uniswap4FlashBrevityInterpreter__factory } from "../typechain-types";
import { BigNumberish } from "ethers";

if (!process.env.PRVKEY) throw Error("Must set PRVKEY envvar")
const provider = new JsonRpcProvider('https://0xrpc.io/eth');
//const provider = new JsonRpcProvider('https://rpc.gnosischain.com/');
//const provider = new JsonRpcProvider('http://localhost:8545/');
//const provider = new JsonRpcProvider('https://api.avax.network/ext/bc/C/rpc');
const deployPrvKey = process.env.PRVKEY
const wallet = new Wallet(deployPrvKey, provider)
const UNISWAP_POOL_MANAGER_MAINNET = '0x000000000004444c5dc75cb358380d2e3de08a90'

async function deployOwnedBrevityInterpreter() {
    console.log(`Deploying OwnedBrevityInterpreter from ${wallet.address}`)
    const factory = new OwnedBrevityInterpreter__factory(wallet)
    const interpreter = await factory.deploy(wallet.address)
    await interpreter.deploymentTransaction()?.wait()
    console.log(`Deployed OwnedBrevityInterpreter to ${await interpreter.getAddress()}`)
}
async function deployUniswap4BrevityInterpreter() {
    console.log(`Deploying Uniswap4FlashBrevityInterpreter from ${wallet.address}`)
    const factory = new Uniswap4FlashBrevityInterpreter__factory(wallet)
    const interpreter = await factory.deploy(wallet.address, UNISWAP_POOL_MANAGER_MAINNET)
    await interpreter.deploymentTransaction()?.wait()
    console.log(`Deployed Uniswap4FlashBrevityInterpreter to ${await interpreter.getAddress()}`)
}

async function main() {
    try {
        await deployUniswap4BrevityInterpreter()
        //await deployOwnedBrevityInterpreter()
    }
    catch (err) {
        console.error(err)
    }
}
main()
