// these test require forked mainnet (slower)


import {
  loadFixture,
} from "@nomicfoundation/hardhat-toolbox/network-helpers";
import hre, { ethers } from "hardhat";
import { BrevityParser, BrevityParserOutput, CONFIGFLAG_UNISWAP4UNLOCK } from "../tslib/brevityParser";
import { parseEther } from 'ethers'
import * as fs from 'fs'
import { OwnedBrevityInterpreter__factory, Uniswap4FlashBrevityInterpreter__factory } from "../typechain-types";
import { estimateGas } from "../tslib/utils";

const UNISWAP_POOL_MANAGER_MAINNET = '0x000000000004444c5dc75cb358380d2e3de08a90'
const FORK_URL = 'https://eth-mainnet.public.blastapi.io'
const FORK_BLOCK = 24385097

describe("Brevity (fork)", function () {
  before(async function () {
    await hre.network.provider.request({
      method: "hardhat_reset",
      params: [{
        forking: {
          jsonRpcUrl: FORK_URL,
          blockNumber: FORK_BLOCK,
        },
      }],
    });
  });

  after(async function () {
    await hre.network.provider.request({
      method: "hardhat_reset",
      params: [],
    });
  });

  async function fixture() {
    const [owner, otherAccount] = await hre.ethers.getSigners();

    const OwnedBrevityInterpreter = await new OwnedBrevityInterpreter__factory(owner)
    const ubi = new Uniswap4FlashBrevityInterpreter__factory(owner)
    let uniswapv4BrevityInterpreter = await ubi.deploy(owner.address, UNISWAP_POOL_MANAGER_MAINNET)
    let brevityInterpreter = await OwnedBrevityInterpreter.deploy(owner.address);
    const CloneFactory = await hre.ethers.getContractFactory("CloneFactory");
    const bi = await brevityInterpreter.getAddress()
    const factory = await CloneFactory.deploy()
    const salt = "0x0000000000000000000000000000000000000000000000000000000000000001"
    const proxyAddress = await factory.predictDeterministicAddress(bi, salt, owner.address)
    const deployTx = await factory.cloneDeterministic(bi, salt, owner.address)
    const proxy = OwnedBrevityInterpreter__factory.connect(proxyAddress, owner)
    if (!deployTx) throw Error("couldnt deploy Proxy")
    let tr = await deployTx?.wait()
    const gasProxyDeploy = tr?.gasUsed
    console.log(`proxy deploy gas = ${gasProxyDeploy}`)
    const TestToken = await hre.ethers.getContractFactory("TestTokenMultiMint");
    const tokenA = await TestToken.deploy()
    const tokenB = await TestToken.deploy()

    const brevityParser = new BrevityParser({
      maxMem: 100,
      requiredBrevityVersion: 1
    })
    return { tokenA, tokenB, brevityParser, brevityInterpreter: proxy, proxy, owner, otherAccount, uniswapv4BrevityInterpreter };
  }

  describe("Run", function () {
    it("Flash loan", async function () {
      const { brevityParser, uniswapv4BrevityInterpreter } = await loadFixture(fixture);
      const inputText = fs.readFileSync('test/briefs/Uniswapv4FlashLoan.brv', { encoding: 'utf-8' })
      const o = brevityParser.parseBrevityScript(inputText)
      await uniswapv4BrevityInterpreter.run(o)
    })

    it("Uniswap.brv", async function () {
      const { tokenA, tokenB, brevityParser, brevityInterpreter, owner } = await loadFixture(fixture);
      const input = 'test/briefs/uniswapAddLiquidity.brv'
      const tokenAAddress = await tokenA.getAddress()
      const tokenBAddress = await tokenB.getAddress()
      const bi = await brevityInterpreter.getAddress()
      await owner.sendTransaction({ to: bi, value: parseEther('1') })
      let prepend = `tokenA := ${tokenAAddress}\ntokenB := ${tokenBAddress}\n`
      const inputText = prepend + fs.readFileSync(input, { encoding: 'utf-8' })
      const o = brevityParser.parseBrevityScript(inputText)
      await estimateGas(brevityInterpreter, o, owner.address, parseEther(".001"))
    })
  })
})
