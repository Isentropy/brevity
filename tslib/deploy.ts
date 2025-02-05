import {
    ContractFactory,
    Wallet,
    JsonRpcProvider,
    parseEther
} from "ethers"
import { OwnedBrevityInterpreter__factory, TestCoin__factory } from "../typechain-types";
import { BigNumberish } from "ethers";

if (!process.env.PRVKEY) throw Error("Must set PRVKEY envvar")
//const provider = new JsonRpcProvider('https://rpc.ankr.com/eth');
const provider = new JsonRpcProvider('https://rpc.gnosischain.com/');
//const provider = new JsonRpcProvider('http://localhost:8545/');
//const provider = new JsonRpcProvider('https://api.avax.network/ext/bc/C/rpc');
const deployPrvKey = process.env.PRVKEY
const wallet = new Wallet(deployPrvKey, provider)

async function deployOwnedBrevityInterpreter() {
    console.log(`Deploying OwnedBrevityInterpreter from ${wallet.address}`)
    const factory = new OwnedBrevityInterpreter__factory(wallet)
    const interpreter = await factory.deploy(wallet.address)
    await interpreter.deploymentTransaction()?.wait()
    console.log(`Deployed OwnedBrevityInterpreter to ${await interpreter.getAddress()}`)
}

async function deployTestCoin(name: string, symbol: string, amount: BigNumberish) {
    console.log(`Deploying ${amount} TestCoin ${name} ${symbol} from ${wallet.address}`)
    const factory = new TestCoin__factory(wallet)
    const tc = await factory.deploy(name, symbol, amount)
    await tc.deploymentTransaction()?.wait()
    console.log(`Deployed TestCoin to ${await tc.getAddress()}`)
}

async function main() {
    try {
        await deployTestCoin("test", "b1", parseEther("1000000000"))
        //await deployOwnedBrevityInterpreter()
    }
    catch (err) {
        console.error(err)
    }
}
main()
