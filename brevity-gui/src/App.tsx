import { useState } from 'react';
import './App.css';
import { BrowserProvider, JsonRpcProvider, parseEther, Provider, WeiPerEther } from 'ethers';
import { OwnedBrevityInterpreter, OwnedBrevityInterpreter__factory } from './typechain-types';
import { useSDK } from '@metamask/sdk-react';
import BlockExplorerLink from './BlockExplorerLink';
import BrevityInterpreterStats from './BrevityInterpreterStats';
import Runner from './Runner';
const QUERY_PARAM_BREVITY_ADDRESS = 'b'
const DEFAULT_BREVITY_INTERPRETER = '0xD47a39886638936a1e7c091101Fca97bEFf50Ae2'

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
  
  const { sdk, connected, connecting, chainId } = useSDK();
  
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
    <div className="brevityGui">
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
      <Runner interpreter={interpreter} account={account}></Runner>
      {interpreter && BrevityInterpreterStats(interpreter)}
    </div>
  );
}

export default App;
