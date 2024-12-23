import { useState } from "react";
import { OwnedBrevityInterpreter } from "./typechain-types/contracts/OwnedBrevityInterpreter";
import BlockExplorerLink from "./BlockExplorerLink";

interface Props {
    holderAddress: string,
    tokenAddress: string,
    interpreter: OwnedBrevityInterpreter,
    withdrawToAddress?: string
}

function TokenBalance(p: Props) {
    //const provider = p.interpreter.runner!.provider!
    const [balance, setBalance] = useState<bigint>();

    p.interpreter.withdrawableBalance(p.tokenAddress).then((bal) => {
        setBalance(bal)
    })

    const withdraw = async () => {
        const amount = (document.getElementById("withdrawAmount") as HTMLInputElement).value
        p.interpreter.withdraw(p.tokenAddress, amount).then((tx) => {
            tx.wait().then((tr)=> {
                window.location.reload()
            })
        })
    }

    return <tr>
        <td>{BlockExplorerLink(p.tokenAddress)}</td>
        <td style={{ textAlign: "right" }}>{balance?.toString() && (balance?.toString())}</td>
        <td>{p.withdrawToAddress && (<button onClick={withdraw}>Withdraw to Owner</button>)}</td>
        <td>{p.withdrawToAddress && (<input id="withdrawAmount" defaultValue={balance?.toString()}></input>)}</td>
    </tr>
}


export default TokenBalance