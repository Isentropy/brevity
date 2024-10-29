import {
  loadFixture,
} from "@nomicfoundation/hardhat-toolbox/network-helpers";
import hre, { ethers } from "hardhat";
import { BrevityParser, BrevityParserOutput } from "../tslib/brevityParser";
import { dataLength, parseEther } from 'ethers'
import * as fs from 'fs'
import { BrevityInterpreter } from "../typechain-types";
import { signMetaTx } from "../tslib/utils";
//hardhat default
//const chainId = 31337

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

    const BrevityInterpreter = await hre.ethers.getContractFactory("BrevityInterpreter");
    const brevityInterpreter = await BrevityInterpreter.deploy();
    const Test = await hre.ethers.getContractFactory("Test");
    const TestToken = await hre.ethers.getContractFactory("TestToken");
    const LoopTest = await hre.ethers.getContractFactory("LoopTest");
    const loopTest = await LoopTest.deploy();
    const test = await Test.deploy();
    const tokenA = await TestToken.deploy()
    const tokenB = await TestToken.deploy()

    const brevityParser = new BrevityParser({
      maxMem: 100
    })
    return { loopTest, tokenA, tokenB, brevityParser, brevityInterpreter, owner, otherAccount, test };
  }

  async function testAndProfile(brevityInterpreter: BrevityInterpreter, o: BrevityParserOutput) {
    let tx = await brevityInterpreter.run(BigInt(o.memSize), o.instructions, o.quantities)
    let tr = await tx.wait()
    if (!tr) throw Error()
    //console.log(`${JSON.stringify(tx, null, 2)}`)
    //console.log(`${JSON.stringify(tr, null, 2)}`)
    const gasBrevityRun = tr.gasUsed
    tx = await brevityInterpreter.noop(BigInt(o.memSize), o.instructions, o.quantities)
    tr = await tx.wait()
    if (!tr) throw Error()
    const noopGas = tr.gasUsed
    //console.log('NOOP gas = ', (await tx.wait())?.gasUsed)
    if (!gasBrevityRun || !noopGas) throw Error()
    console.log(`Brevity gas: total = ${gasBrevityRun}, calldata = ${noopGas}, execution = ${gasBrevityRun - noopGas}`)
  }

  describe("Run", function () {

    it("Loop", async function () {
      const { loopTest, brevityParser, brevityInterpreter, owner, otherAccount } = await loadFixture(fixture);
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
      await testAndProfile(brevityInterpreter, o)
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
      await testAndProfile(brevityInterpreter, o)
      const Arb = await hre.ethers.getContractFactory("Arb");
      const arb = await Arb.deploy()
      const deployTx = arb.deploymentTransaction()
      if (!deployTx) throw Error("couldnt deploy Test")
      const tr = await deployTx?.wait()
      const gasTestDeploy = tr?.gasUsed
      await tokenA.mint(await arb.getAddress(), parseEther("100"))
      const minProfitA = '100000000000000000'
      let tx = await arb.arb(tokenAAddress, tokenBAddress, parseEther("1"),minProfitA, testAddress, testAddress)
      const gasTestLoop = (await tx.wait())?.gasUsed
      if (!gasTestDeploy || !gasTestLoop) throw Error("undef")
      console.log(`Solidity Test gas: total = ${gasTestDeploy + gasTestLoop}, deploy = ${gasTestDeploy}, execution = ${gasTestLoop}`)
      
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
      const sig = await signMetaTx(owner, brevityInterpreter, net.chainId, o)
      const tx=  await brevityInterpreter.runMeta(o.memSize, o.instructions, o.quantities, sig)
      const tr = await tx.wait()
      if(!tr) throw Error()
      console.log(`MetaTx gas: total = ${tr.gasUsed}`)
    })

  })
})