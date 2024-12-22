import { Provider, ZeroAddress } from "ethers";
import { useState } from "react";
import { IERC20__factory } from "./typechain-types";
import { OwnedBrevityInterpreter } from "./typechain-types/contracts/OwnedBrevityInterpreter";

interface Props {
    holderAddress: string,
    tokenAddress: string,
    interpreter: OwnedBrevityInterpreter,
    withdrawToAddress?: string
}

function TokenBalance(p: Props) {
    const provider = p.interpreter.runner!.provider!
    const [balance, setBalance] = useState<bigint>();
    const [tokenName, setTokenName] = useState<string>();

    if (!tokenName) {
        if (p.tokenAddress == ZeroAddress) {
            setTokenName("Native Token")
            provider.getBalance(p.holderAddress).then((bal) => {
                setBalance(bal)
            })
        } else {
            setTokenName(p.tokenAddress)
            //console.log(`p ${JSON.stringify(p)}`)
            IERC20__factory.connect(p.tokenAddress, provider).balanceOf(p.holderAddress).then((bal) => {
                setBalance(bal)
            })
        }
    }

    const withdraw = async () => {
        const amount = (document.getElementById("withdrawAmount") as HTMLInputElement).value
        p.interpreter.withdraw(p.tokenAddress, amount).then((tx) => {
            tx.wait().then((tr)=> {
                window.location.reload()
            })
        })
    }

    return <tr>
        <td>{tokenName && (tokenName)}</td>
        <td style={{ textAlign: "right" }}>{balance?.toString() && (balance?.toString())}</td>
        <td>{p.withdrawToAddress && (<button onClick={withdraw}>Withdraw to Owner</button>)}</td>
        <td>{p.withdrawToAddress && (<input id="withdrawAmount" defaultValue={balance?.toString()}></input>)}</td>
    </tr>
}


export default TokenBalance