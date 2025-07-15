import { BigNumberish, BytesLike, JsonRpcProvider, parseEther, Provider, Signer, toBeHex, Wallet } from "ethers"
import { BrevityParser, BrevityParserConfig } from "./brevityParser"
import { readFileSync, writeFileSync } from 'fs'
import { parse } from "path"
import { BrevityInterpreter__factory, CloneFactory__factory, IBrevityInterpreter__factory, OwnedBrevityInterpreter__factory, TestToken__factory } from "../typechain-types"
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
No transaction:
build: transpile script into Breviety Interpreter instructions 
estimateGas: estimate gas only. no TX
signMeta: sign metaTx with PRVKEY. returns "data" field of metaTx

Runs transaction:
deploy: deploy OwnedBrevityInterpreter, TX paid by PRVKEY, owner = target if defined, otherwise address of PRVKEY
run: run script using privateKey in PRVKEY envvar
runMeta: run script signed by PRVKEY, TX paid by METATXKEY

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
    let targetAddress : string | undefined
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
            targetAddress = process.argv[++i]
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
    if(cmd == 'runMeta') {
        if(metaTxPayer) {
            txPayer = metaTxPayer
        } else {
            console.error(`No metaTxKey specified. Put private key in METATXKEY envvar`)
            process.exit(1)
        }
    }

    if (cmd == 'deploy') {
        if(!signer) {
            console.error(`No signer specified. Put private key in PRVKEY envvar`)
            process.exit(1)
        }
        const factory = new OwnedBrevityInterpreter__factory(signer)
        // owner can be passed using -t target
        const owner = targetAddress ? targetAddress : await signer.getAddress()
        const rslt = await factory.deploy(owner)
        console.log(`OwnedBrevityInterpreter deployed at ${await rslt.getAddress()} , owner = ${owner}, in txHash ${rslt.deploymentTransaction()?.hash}`)
        process.exit(0)
    }
    if (cmd == 'deployFactory') {
        if(!signer) {
            console.error(`No signer specified. Put private key in PRVKEY envvar`)
            process.exit(1)
        }
        const factory = new CloneFactory__factory(signer)
        const rslt = await factory.deploy()
        console.log(`CloneFactory deployed at ${await rslt.getAddress()} , in txHash ${rslt.deploymentTransaction()?.hash}`)
        process.exit(0)
    }
    if (cmd == 'deployTestToken') {
        if(!signer) {
            console.error(`No signer specified. Put private key in PRVKEY envvar`)
            process.exit(1)
        }
        const token = new TestToken__factory(signer)
        const rslt = await token.deploy()
        console.log(`TestToken deployed at ${await rslt.getAddress()} , in txHash ${rslt.deploymentTransaction()?.hash}`)
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
    if(!targetAddress) {
        console.error(`No target interpreter given`)
        process.exit(1)
    }
    const targetInterpreter =  IBrevityInterpreter__factory.connect(targetAddress, txPayer)
    if (cmd == 'run') {
        const resp = await targetInterpreter.run(compiled, {value})
        console.log(`Submitted run txHash ${resp.hash}`)        
    } else if (cmd == 'runMeta') {
        const network = await provider.getNetwork()
        const deadline: number = Math.floor(((new Date()).getTime()/1000) + 3600)
        const sig = await signMetaTx(signer, targetAddress, network.chainId, compiled, deadline)
        const resp = await targetInterpreter.runMeta(compiled, deadline, sig)
        console.log(`Submitted runMeta txHash ${resp.hash}`)        
    } else if (cmd == 'signMeta') {
        const network = await provider.getNetwork()
        const deadline: number = Math.floor(((new Date()).getTime()/1000) + 3600)
        const sig = await signMetaTx(signer, targetAddress, network.chainId, compiled, deadline)
        const tx = await targetInterpreter.getFunction("runMeta").populateTransaction(compiled, deadline, sig)
        console.log(tx.data)
    } else if (cmd == 'signFactoryMeta') {
        // experimental, for bridging
        // target = CloneFactory
        const cloneFactory = CloneFactory__factory.connect(targetAddress, provider)
        const implementation = process.argv[++i]
        const salt = toBeHex(process.argv[++i], 32)
        const network = await provider.getNetwork()
        const deadline: number = Math.floor(((new Date()).getTime()/1000) + 3600)
        const owner = await signer.getAddress()
        const interpreterAddress = await cloneFactory.predictDeterministicAddress(implementation, salt, owner)
        const sig = await signMetaTx(signer, interpreterAddress, network.chainId, compiled, deadline)
        const tx = await cloneFactory.getFunction("cloneIfNeededThenRun").populateTransaction(implementation, salt, owner, compiled, deadline, sig)
        console.log(tx.data)
    } else if (cmd == 'estimateGas') {
        estimateGas(targetInterpreter, compiled)
    } else {
        console.error(`Unknown cmd: ${cmd}`)
        process.exit(1)
    }
}

cli()