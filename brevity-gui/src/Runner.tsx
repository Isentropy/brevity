import { useState } from "react";
import { BrevityParser, BrevityParserConfig, BrevityParserOutput } from "./tslib/brevityParser";
import { OwnedBrevityInterpreter } from "./typechain-types";

interface Props {
    interpreter: OwnedBrevityInterpreter
    account?: string
    initialScript?: string
}

function Runner(p: Props) {
    const [compiledProgram, setCompiledProgram] = useState<BrevityParserOutput>();
    const [gasEstimate, setGasEstimate] = useState<bigint>();

    const sendTx = async () => {
        p.interpreter.run(compiledProgram!).then((tx) => {
            //window.location.reload()
        })
    }

    const compile = async () => {
        try {
            setCompiledProgram(undefined)
            const config: BrevityParserConfig = {
                maxMem: 100
            }
            const compiler = new BrevityParser(config)
            const script = (document.getElementById("brevScript")! as HTMLTextAreaElement).value
            const compiled = compiler.parseBrevityScript(script)
            p.interpreter.run.estimateGas(compiled).then((estimate) => {
                setGasEstimate(estimate)
            })
            setCompiledProgram(compiled)
        } catch (err) {
            console.warn("Compile Error:", err);
        }
    }


    return (
    <div className="brevityRunner">
        <textarea id="brevScript" cols={80} rows={20} defaultValue={p.initialScript}></textarea>
        <br></br>
        <button style={{ padding: 10, margin: 10 }} onClick={compile}>
            Compile
        </button>
        <button disabled={p.account && compiledProgram ? false : true} style={{ padding: 10, margin: 10 }} onClick={sendTx}>
            Send TX
        </button>
        {compiledProgram ? `Gas Estimate: ${gasEstimate}` : ""}
    </div>)
}

export default Runner