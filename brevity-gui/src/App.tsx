import React, { useState } from 'react';
import logo from './logo.svg';
import './App.css';
import { BrowserProvider, JsonRpcProvider, parseEther, Provider, WeiPerEther } from 'ethers';
import { OwnedBrevityInterpreter, OwnedBrevityInterpreter__factory } from './brevity/typechain-types';
import { useSDK } from '@metamask/sdk-react';
import { BrevityParser, BrevityParserConfig, BrevityParserOutput } from './brevity/tslib/brevityParser';
import BlockExplorerLink from './BlockExplorerLink';
import BrevityInterpreterStats from './BrevityInterpreterStats';
const QUERY_PARAM_BREVITY_ADDRESS = 'b'
const DEFAULT_BREVITY_INTERPRETER = '0xD47a39886638936a1e7c091101Fca97bEFf50Ae2'
// 0xD47a39886638936a1e7c091101Fca97bEFf50Ae2
interface Window {
  ethereum: any
  location: any
}
declare var window: Window

function App() {
  const urlParams = new URLSearchParams(window.location.search);
  let interpreterAddress = urlParams.get(QUERY_PARAM_BREVITY_ADDRESS);
  if (!interpreterAddress) interpreterAddress = DEFAULT_BREVITY_INTERPRETER
  const defaultProvider = new JsonRpcProvider('https://rpc.gnosischain.com/');
  const [interpreter, setInterpreter] = useState<OwnedBrevityInterpreter>(OwnedBrevityInterpreter__factory.connect(interpreterAddress, defaultProvider));
  const [account, setAccount] = useState<string>();
  const [compiledProgram, setCompiledProgram] = useState<BrevityParserOutput>();
  const [gasEstimate, setGasEstimate] = useState<bigint>();
  
  const { sdk, connected, connecting, chainId } = useSDK();
  
  const sendTx = async () => {
    interpreter.run(compiledProgram!).then((tx) => {
        //window.location.reload()
    })
  }

  const compile = async () => {
    try {
      setCompiledProgram(undefined)
      const config : BrevityParserConfig = {
        maxMem: 100
      }
      const compiler = new BrevityParser(config)
      const script = (document.getElementById("brevScript")! as HTMLTextAreaElement).value
      const compiled = compiler.parseBrevityScript(script)
      interpreter.run.estimateGas(compiled).then((estimate) => {
        setGasEstimate(estimate)
      })
      setCompiledProgram(compiled)
    } catch (err) {
      console.warn("Compile Error:", err);
    }
  }
  const connect = async () => {
    try {
      //const accounts = await sdk?.connect();
      //console.log(`accounts ${accounts}`)
      const provider_Metamask = new BrowserProvider(window.ethereum,  {name: "gnosis", chainId: 100});
      provider_Metamask.getSigner().then((signer)=> {
        setInterpreter(OwnedBrevityInterpreter__factory.connect(interpreterAddress!, signer))
      })
      const accounts2 = await provider_Metamask.send("eth_requestAccounts", []);

      setAccount(accounts2?.[0]);
    } catch (err) {
      console.warn("failed to connect..", err);
    }
  };
  return (
    <div className="BrevityGui">
      <h3> DEMO ONLY. UNAUTHORIZED USE PROHIBITED </h3>
      <button style={{ padding: 10, margin: 10 }} onClick={connect}>
        Connect MetaMask
      </button> 
      <br></br>
      Connected to Brevity interpreter {BlockExplorerLink(interpreterAddress)} on chain {chainId}
      {account && (
        <div>
            <p></p>
            Connected to MetaMask with wallet: {BlockExplorerLink(account)}
        </div>
      )}
      <br></br>
      <textarea id="brevScript" cols={80} rows={20}></textarea>
      <br></br>
      <button style={{ padding: 10, margin: 10 }} onClick={compile}>
        Compile
      </button>
      <button disabled={account && compiledProgram ? false : true} style={{ padding: 10, margin: 10 }} onClick={sendTx}>
        Send TX
      </button> 
      {compiledProgram ? `Gas Estimate: ${gasEstimate}` : ""}
      {interpreter && BrevityInterpreterStats(interpreter)}

    </div>
  );
}

export default App;
