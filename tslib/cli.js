"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const ethers_1 = require("ethers");
const brevityParser_1 = require("./brevityParser");
const fs_1 = require("fs");
const typechain_types_1 = require("typechain-types");
const utils_1 = require("./utils");
const defaultConfig = {
    maxMem: 100
};
function help() {
}
async function cli() {
    let inputScript;
    let outputFile;
    //let initalFlags: BytesLike = 0
    let provider;
    let signer;
    let metaTxPayer;
    let targetInterpreterAddress;
    let value = 0;
    let i = 2;
    for (; i < process.argv.length; i++) {
        if (process.argv[i] == '-i' || process.argv[i] == '--infile') {
            inputScript = (0, fs_1.readFileSync)(process.argv[++i], { encoding: 'utf-8' });
        }
        else if (process.argv[i] == '-f' || process.argv[i] == '--flags') {
            //initalFlags = process.argv[++i]
        }
        else if (process.argv[i] == '-o' || process.argv[i] == '--outfile') {
            outputFile = process.argv[++i];
        }
        else if (process.argv[i] == '-h' || process.argv[i] == '--help') {
            help();
            process.exit(0);
        }
        else if (process.argv[i] == '-t' || process.argv[i] == '--target') {
            targetInterpreterAddress = process.argv[++i];
        }
        else if (process.argv[i] == '-r' || process.argv[i] == '--rpc') {
            provider = new ethers_1.JsonRpcProvider(process.argv[++i]);
        }
        else {
            break;
        }
    }
    ++i;
    if (i == process.argv.length) {
        help();
        process.exit(0);
    }
    const cmd = process.argv[i];
    const parser = new brevityParser_1.BrevityParser(defaultConfig);
    const compiled = inputScript ? parser.parseBrevityScript(inputScript) : undefined;
    if (!compiled) {
        console.error(`No input script`);
        process.exit(1);
    }
    if (cmd == 'compile') {
        if (outputFile)
            (0, fs_1.writeFileSync)(outputFile, JSON.stringify(compiled, null, 2));
        process.exit(0);
    }
    if (!provider) {
        console.error(`No RPC given`);
        process.exit(1);
    }
    if (process.env["PRVKEY"]) {
        signer = new ethers_1.Wallet(process.env["PRVKEY"], provider);
    }
    else {
        console.error(`No signer specified. Put private key in PRVKEY envvar`);
        process.exit(1);
    }
    if (process.env["METATXKEY"] && cmd.toLowerCase().endsWith("meta")) {
        metaTxPayer = new ethers_1.Wallet(process.env["METATXKEY"], provider);
    }
    else { }
    if (!targetInterpreterAddress) {
        console.error(`No target interpreter given`);
        process.exit(1);
    }
    const targetInterpreter = typechain_types_1.IBrevityInterpreter__factory.connect(targetInterpreterAddress, metaTxPayer ? metaTxPayer : signer);
    if (cmd == 'run') {
        const resp = await targetInterpreter.run(compiled, { value });
        console.log(`Submitted run txHash ${resp.hash}`);
    }
    else if (cmd == 'runMeta') {
        const network = await provider.getNetwork();
        const deadline = ((new Date()).getTime() / 1000) + 3600;
        const sig = await (0, utils_1.signMetaTx)(signer, targetInterpreter, network.chainId, compiled, deadline);
        const resp = await targetInterpreter.runMeta(compiled, deadline, sig);
        console.log(`Submitted runMeta txHash ${resp.hash}`);
    }
    else if (cmd == 'estimateGas') {
        (0, utils_1.estimateGas)(targetInterpreter, compiled);
    }
    else {
        console.error(`Unknown cmd: ${cmd}`);
        process.exit(1);
    }
    if (!inputScript)
        throw Error("must specify input text");
    const output = parser.parseBrevityScript(inputScript);
    console.log(`${JSON.stringify(output, null, 2)}`);
}
cli();
