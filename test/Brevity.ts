import {
  loadFixture,
} from "@nomicfoundation/hardhat-toolbox/network-helpers";
import hre, { ethers } from "hardhat";
import { BrevityParser, BrevityParserOutput, configFlagRequireVersion } from "../tslib/brevityParser";
import { dataLength, parseEther, BigNumberish } from 'ethers'
import * as fs from 'fs'
import { OwnedBrevityInterpreter__factory, IBrevityInterpreter, CloneFactory__factory, OwnedBrevityInterpreter, Uniswap4FlashBrevityInterpreter__factory } from "../typechain-types";
import { signMetaTx, estimateGas } from "../tslib/utils";
//hardhat default
//const chainId = 31337
const UNISWAP_POOL_MANAGER_MAINNET = '0x000000000004444c5dc75cb358380d2e3de08a90'
const ITERATIONS = 10
function brevityLoopProgram(n: number, toFoo: string): string {
  const lines: string[] = [`n := ${n - 1}`]
  lines.push('foo := foo(uint256)')
  lines.push('var i = 0')
  lines.push('#lstart')
  lines.push('if(i > n) goto lend')
  lines.push('i += 1')
  lines.push('goto lstart')
  lines.push('#lend')
  return lines.join('\n')
}

describe("Brevity", function () {
  // We define a fixture to reuse the same setup in every test.
  // We use loadFixture to run this setup once, snapshot that state,
  // and reset Hardhat Network to that snapshot in every test.
  async function fixture() {

    // Contracts are deployed using the first signer/account by default
    const [owner, otherAccount] = await hre.ethers.getSigners();

    const OwnedBrevityInterpreter = await new OwnedBrevityInterpreter__factory(owner)
    //const ubi = await hre.ethers.getContractFactory("Uniswap4FlashBrevityInterpreter");
    const ubi = new Uniswap4FlashBrevityInterpreter__factory(owner)
    let uniswapv4BrevityInterpreter = await ubi.deploy(owner.address, UNISWAP_POOL_MANAGER_MAINNET)
    let brevityInterpreter = await OwnedBrevityInterpreter.deploy(owner.address);
//    let uniswapv4BrevityInterpreter = await ubi.deploy(owner.address, UNISWAP_POOL_MANAGER_MAINNET)
    const CloneFactory = await hre.ethers.getContractFactory("CloneFactory");
    const bi = await brevityInterpreter.getAddress()
    const factory = await CloneFactory.deploy()
    const salt = "0x0000000000000000000000000000000000000000000000000000000000000001"
    const proxyAddress = await factory.predictDeterministicAddress(bi,  salt, owner.address)
    const deployTx = await factory.cloneDeterministic(bi, salt, owner.address)
    const proxy = OwnedBrevityInterpreter__factory.connect(proxyAddress, owner)
    if (!deployTx) throw Error("couldnt deploy Proxy")
    let tr = await deployTx?.wait()
    const gasProxyDeploy = tr?.gasUsed
    console.log(`proxy deploy gas = ${gasProxyDeploy}`)
    const Test = await hre.ethers.getContractFactory("Test");
    const TestToken = await hre.ethers.getContractFactory("TestTokenMultiMint");
    const LoopTest = await hre.ethers.getContractFactory("LoopTest");
    const loopTest = await LoopTest.deploy();
    const test = await Test.deploy();
    const tokenA = await TestToken.deploy()
    const tokenB = await TestToken.deploy()

    const brevityParser = new BrevityParser({
      maxMem: 100,
      configFlags: configFlagRequireVersion(1)
    })
    return { loopTest, tokenA, tokenB, brevityParser, brevityInterpreter: proxy, proxy, owner, otherAccount, test, uniswapv4BrevityInterpreter };
  }


  describe("Run", function () {
    it("Flash loan", async function () {
      const { loopTest, brevityParser, brevityInterpreter, owner, uniswapv4BrevityInterpreter, } = await loadFixture(fixture);
      //const input = 'test/briefs/example.brv'
      const inputText = fs.readFileSync('test/briefs/uniswap4ModifyLiquidity.brv', { encoding: 'utf-8' })
      const o = brevityParser.parseBrevityScript(inputText)
      await uniswapv4BrevityInterpreter.unlockAndRun(o)
    })
 

    it("Loop", async function () {
      const { loopTest, brevityParser, brevityInterpreter, owner, otherAccount, } = await loadFixture(fixture);
      //const input = 'test/briefs/example.brv'
      const inputText = brevityLoopProgram(ITERATIONS, await loopTest.getAddress())
      const o = brevityParser.parseBrevityScript(inputText)
      //console.log(`${JSON.stringify(o, null, 2)}`)
      console.log(`Test of for loop with ${ITERATIONS} iterations:`)
      // console.log('Brevity.run() gas = ', gasBrevityRun)
      const deployTx = loopTest.deploymentTransaction()
      if (!deployTx) throw Error("couldnt deploy Test")
      const tr = await deployTx?.wait()
      const gasTestDeploy = tr?.gasUsed
      console.log(`\nTest deploy. code size = ${dataLength(deployTx?.data)} gas = ${gasTestDeploy}`)
      let tx = await loopTest.loop(ITERATIONS)
      const gasTestLoop = (await tx.wait())?.gasUsed
      if (!gasTestDeploy || !gasTestLoop) throw Error("undef")
      await estimateGas(brevityInterpreter, o)
      console.log(`Solidity Test gas: total = ${gasTestDeploy + gasTestLoop}, deploy = ${gasTestDeploy}, execution = ${gasTestLoop}`)
    })


    it("Example.brv", async function () {
      const { tokenA, tokenB, test, brevityParser, brevityInterpreter, owner, otherAccount } = await loadFixture(fixture);
      const input = 'test/briefs/example.brv'
      const tokenAAddress = await tokenA.getAddress()
      const tokenBAddress = await tokenB.getAddress()
      const bi = await brevityInterpreter.getAddress()
      await owner.sendTransaction({ to: bi, value: parseEther('0.1') })
      let prepend = `tokenA := ${tokenAAddress}\ntokenB := ${tokenBAddress}\n`
      const testAddress = await test.getAddress()
      prepend += `exchange1 := ${testAddress}\nexchange2 := ${testAddress}\n`
      const inputText = prepend + fs.readFileSync(input, { encoding: 'utf-8' })
      //console.log(inputText)
      const o = brevityParser.parseBrevityScript(inputText)
      //console.log(`${JSON.stringify(o, null, 2)}`)
      await tokenA.mint(bi, parseEther("100"))
      await estimateGas(brevityInterpreter, o)
      const Arb = await hre.ethers.getContractFactory("Arb");
      const arb = await Arb.deploy()
      const deployTx = arb.deploymentTransaction()
      if (!deployTx) throw Error("couldnt deploy Test")
      let tr = await deployTx?.wait()
      const gasTestDeploy = tr?.gasUsed
      await tokenA.mint(await arb.getAddress(), parseEther("100"))
      const minProfitA = '100000000000000000'
      let tx = await arb.arb(tokenAAddress, tokenBAddress, parseEther("1"),minProfitA, testAddress, testAddress)
      const gasTestArb = (await tx.wait())?.gasUsed
      if (!gasTestDeploy || !gasTestArb) throw Error("undef")
      tx = await arb.noop(tokenAAddress, tokenBAddress, parseEther("1"),minProfitA, testAddress, testAddress)
      tr = await tx.wait()
      if (!tr) throw Error()
      const noopGas = tr.gasUsed
      console.log(`Solidity Test gas: total = ${gasTestDeploy + gasTestArb}, deploy = ${gasTestDeploy}, calldata = ${noopGas}, execution = ${gasTestArb - noopGas}`)
    })
  
    it("MetaTx", async () => {
      const { tokenA, tokenB, test, brevityParser, brevityInterpreter, owner, otherAccount } = await loadFixture(fixture);
      const input = 'test/briefs/example.brv'
      const tokenAAddress = await tokenA.getAddress()
      const tokenBAddress = await tokenB.getAddress()
      const bi = await brevityInterpreter.getAddress()
      await owner.sendTransaction({ to: bi, value: parseEther('0.1') })
      let prepend = `tokenA := ${tokenAAddress}\ntokenB := ${tokenBAddress}\n`
      const testAddress = await test.getAddress()
      prepend += `exchange1 := ${testAddress}\nexchange2 := ${testAddress}\n`
      const inputText = prepend + fs.readFileSync(input, { encoding: 'utf-8' })
      //console.log(inputText)
      const o = brevityParser.parseBrevityScript(inputText)
      //console.log(`${JSON.stringify(o, null, 2)}`)
      await tokenA.mint(bi, parseEther("100"))
      
      const net = await owner.provider.getNetwork()
      const deadline =  3600 + Math.floor(new Date().getTime()/1000)
      const sig = await signMetaTx(owner, bi, net.chainId, o, deadline)
      const tx=  await brevityInterpreter.runMeta(o, deadline, sig)
      const tr = await tx.wait()
      if(!tr) throw Error()
      console.log(`MetaTx gas: total = ${tr.gasUsed}`)
    })
    
    
    it("Uniswap.brv", async function () {
      const { tokenA, tokenB, test, brevityParser, brevityInterpreter, owner, otherAccount } = await loadFixture(fixture);
      const input = 'test/briefs/uniswapAddLiquidity.brv'
      const tokenAAddress = await tokenA.getAddress()
      const tokenBAddress = await tokenB.getAddress()
      const bi = await brevityInterpreter.getAddress()
      await owner.sendTransaction({ to: bi, value: parseEther('1') })
      let prepend = `tokenA := ${tokenAAddress}\ntokenB := ${tokenBAddress}\n`

//      const testAddress = await test.getAddress()
//      prepend += `exchange1 := ${testAddress}\nexchange2 := ${testAddress}\n`
      const inputText = prepend + fs.readFileSync(input, { encoding: 'utf-8' })
      const o = brevityParser.parseBrevityScript(inputText)
      //console.log(JSON.stringify(o, null, 2))
      await estimateGas(brevityInterpreter, o, parseEther(".001"))      
    })


  })
})
