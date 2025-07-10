import { BigNumberish, BytesLike, JsonRpcProvider, parseEther, Provider, Signer, Wallet } from "ethers"
import { BrevityParser, BrevityParserConfig } from "./brevityParser"
import { readFileSync, writeFileSync } from 'fs'
import { parse } from "path"
import { BrevityInterpreter__factory, IBrevityInterpreter__factory, OwnedBrevityInterpreter__factory } from "../typechain-types"
import { bytesMemoryObject, estimateGas, signMetaTx } from "./utils"
import { writeFile } from "fs/promises"
const defaultConfig: BrevityParserConfig = {
    maxMem: 100
}

function help() {
const msg = `Brevity CLI v1 args
___________________________

usage: cli.ts (args)* command

args
_______________
-i | --infile <script> : the input Brevity script
-o | --outfile <file> : optional output to file instead of stdout
-t | --target <address> : target Brevity Interpreter address
-r | --rpc <rpcUrl> : RPC URL
-h | --help : help

commands
_______________
build: transpile script into Breviety Interpreter instructions 
estimateGas: estimate gas only. no TX
deploy: deploy OwnedBrevityInterpreter as PRVKEY
deployMeta: deploy OwnedBrevityInterpreter owned by PRVKEY, TX paid by METATXKEY
run: run script using privateKey in PRVKEY envvar
runMeta: run script signed by PRVKEY, TX paid by METATXKEY
signMeta: sign metaTx with PRVKEY. returns "data" field of metaTx

envvars
_______________
the private keys are stored in envvars:
PRVKEY : the key that owns Brevity Interpreter (needed for all commands except "build")
METATXKEY : the key that pays for TX (need for command "runMeta")
`
    console.log(msg)
}



async function cli() {
    let inputScript: string | undefined
    let outputFile: string | undefined
    //let initalFlags: BytesLike = 0
    let provider: Provider | undefined
    let signer: Signer | undefined
    let metaTxPayer: Signer | undefined
    let targetInterpreterAddress : string | undefined
    let value : BigNumberish  = 0
    let i = 2
    for (; i < process.argv.length -1; i++) {
        if (process.argv[i] == '-i' || process.argv[i] == '--infile') {
            inputScript = readFileSync(process.argv[++i], { encoding: 'utf-8' })
        } else if (process.argv[i] == '-f' || process.argv[i] == '--flags') {
            //initalFlags = process.argv[++i]
        } else if (process.argv[i] == '-o' || process.argv[i] == '--outfile') {
            outputFile = process.argv[++i]
        } else if (process.argv[i] == '-h' || process.argv[i] == '--help') {
            help()
            process.exit(0)
        } else if (process.argv[i] == '-t' || process.argv[i] == '--target') {
            targetInterpreterAddress = process.argv[++i]
        } else if (process.argv[i] == '-r' || process.argv[i] == '--rpc') {
            provider = new JsonRpcProvider(process.argv[++i])
        } else if (process.argv[i] == '-v' || process.argv[i] == '--value') {
            value = process.argv[++i]
            if(value.toLowerCase().endsWith('eth')) value = parseEther(value.substring(0, value.length - 3))
        } else {
            break
        }
    }
    const cmd = process.argv[i]
    if(!cmd || cmd == '-h' || cmd == '--help') {
            help()
            process.exit(1)
    }
    if(process.env["PRVKEY"]) {
        signer = new Wallet(process.env["PRVKEY"], provider)
    }
    if(process.env["METATXKEY"]) {
        metaTxPayer = new Wallet(process.env["METATXKEY"], provider)
    }
    let txPayer = signer
    if(cmd.toLowerCase().endsWith('meta')) {
        if(metaTxPayer) {
            txPayer = metaTxPayer
        } else {
            console.error(`No metaTxKey specified. Put private key in METATXKEY envvar`)
            process.exit(1)
        }
    }

    if (cmd.startsWith('deploy')) {
        if(!signer) {
            console.error(`No signer specified. Put private key in PRVKEY envvar`)
            process.exit(1)
        }
        const factory = new OwnedBrevityInterpreter__factory(txPayer)
        const rslt = await factory.deploy(await signer.getAddress())
        console.log(`deployed to ${await rslt.getAddress()} in txHash ${rslt.deploymentTransaction()?.hash}`)
        process.exit(0)
    }
    const parser = new BrevityParser(defaultConfig)
    const compiled = inputScript ? parser.parseBrevityScript(inputScript) : undefined

    if (!compiled) {
        console.error(`No input script`)
        process.exit(1)
    }
    if (cmd == 'build') {
        const code = JSON.stringify(compiled, null, 2)
        if(outputFile) { 
            writeFileSync(outputFile, code)
        } else {
            console.log(code)
        }
        process.exit(0)
    }
    if (!provider) {
        console.error(`No RPC given`)
        process.exit(1)
    }
    if(!signer) {
        console.error(`No signer specified. Put private key in PRVKEY envvar`)
        process.exit(1)
    }
    if(!targetInterpreterAddress) {
        console.error(`No target interpreter given`)
        process.exit(1)
    }
    const targetInterpreter =  IBrevityInterpreter__factory.connect(targetInterpreterAddress, txPayer)
    if (cmd == 'run') {
        const resp = await targetInterpreter.run(compiled, {value})
        console.log(`Submitted run txHash ${resp.hash}`)        
    } else if (cmd == 'runMeta') {
        const network = await provider.getNetwork()
        const deadline: number = Math.floor(((new Date()).getTime()/1000) + 3600)
        const sig = await signMetaTx(signer, targetInterpreter, network.chainId, compiled, deadline)
        const resp = await targetInterpreter.runMeta(compiled, deadline, sig)
        console.log(`Submitted runMeta txHash ${resp.hash}`)        
    } else if (cmd == 'signMeta') {
        const network = await provider.getNetwork()
        const deadline: number = Math.floor(((new Date()).getTime()/1000) + 3600)
        const sig = await signMetaTx(signer, targetInterpreter, network.chainId, compiled, deadline)
        const tx = await targetInterpreter.getFunction("runMeta").populateTransaction(compiled, deadline, sig)
        console.log(tx.data)
        if(outputFile) writeFileSync(outputFile, `bytesMemoryObject := ${bytesMemoryObject(tx.data)}`)
    } else if (cmd == 'estimateGas') {
        estimateGas(targetInterpreter, compiled)
    } else {
        console.error(`Unknown cmd: ${cmd}`)
        process.exit(1)
    }
}

cli()