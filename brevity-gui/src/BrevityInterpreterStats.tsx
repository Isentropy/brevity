import { useState } from "react";
import { BrevityInterpreter, IERC20, OwnedBrevityInterpreter } from "./brevity/typechain-types"
import BlockExplorerLink from "./BlockExplorerLink";
import { dataSlice, Filter, FunctionFragment, id, toBeHex, ZeroAddress } from "ethers";
import TokenBalance from "./TokenBalance";

function BrevityInterpreterStats(interpreter : OwnedBrevityInterpreter) {
    const [address, setAddress] = useState<string>();
    const [version, setVersion] = useState<bigint>();
    const [owner, setOwner] = useState<string>();
    const [uniqueTokens, setUniqueTokens] = useState<string[]>();

    interpreter.version().then((v)=>{
        setVersion(v)
    })
    interpreter.owner().then((o)=>{
        setOwner(o)
    })
    interpreter.getAddress().then((a)=> {
        setAddress(a)

        const filter : Filter = {
            fromBlock: 0,
            toBlock:'latest',
            topics: [id('Transfer(address,address,uint256)'), null, toBeHex(a, 32)]
        }
        console.log(`filter ${JSON.stringify(filter)}`)
        if(!uniqueTokens)
        interpreter.runner!.provider!.getLogs(filter).then((logs) => {
            console.log(`logs ${logs.length}`)
            setUniqueTokens([ZeroAddress, ...new Set(logs.map((log) => { return log.address }))])
        })
    })
    return <div>
        <h3>Brevity Interpreter Info</h3>
        {address && (
            <div>
            Address: {BlockExplorerLink(address)}
            </div>
        )}
        {version?.toString() && (
            <div>
            Brevity Version: {version.toString()}
            </div>
        )}
        {owner && (
            <div>
            Owner: {BlockExplorerLink(owner)}
            </div>
        )}
        <h5> Token Holdings </h5>
        <table>
          <tbody>
            <tr>
              <th>
                Token Name
              </th>
              <th>
                Balance
              </th>
              <th>
                Withdraw To Owner
              </th>
              <th>
                Withdraw Amount
              </th>
            </tr>
            {uniqueTokens && address && interpreter && (
            uniqueTokens.map((tokenAddress)=>{
                return <TokenBalance tokenAddress={tokenAddress} holderAddress={address} interpreter={interpreter} withdrawToAddress={owner}></TokenBalance>
            })
        )}
          </tbody>
        </table>

        
    </div>
}

export default BrevityInterpreterStats