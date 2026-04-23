"use strict";
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __importStar = (this && this.__importStar) || function (mod) {
    if (mod && mod.__esModule) return mod;
    var result = {};
    if (mod != null) for (var k in mod) if (k !== "default" && Object.prototype.hasOwnProperty.call(mod, k)) __createBinding(result, mod, k);
    __setModuleDefault(result, mod);
    return result;
};
Object.defineProperty(exports, "__esModule", { value: true });
const ethers_1 = require("ethers");
const http = __importStar(require("http"));
const https = __importStar(require("https"));
const brevityParser_1 = require("./brevityParser");
const fs_1 = require("fs");
const typechain_types_1 = require("../typechain-types");
const utils_1 = require("./utils");
const defaultConfig = {
    maxMem: 100
};
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
-p | --prepend <script text> : prepend script text lines. multiple prepends appended in order
--proxy <socks://host:port> : SOCKS proxy for RPC connections
-h | --help : help

commands
_______________
No transaction:
build: transpile script into Breviety Interpreter instructions 
estimateGas [from?]: estimate gas only. no TX. default 'from' is PRVKEY address
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
`;
    console.log(msg);
}
async function makeProxiedProvider(rpcUrl, proxyUrl) {
    // @ts-ignore - socks-proxy-agent uses package.json "exports" which needs moduleResolution node16/bundler
    const { SocksProxyAgent } = await Promise.resolve().then(() => __importStar(require("socks-proxy-agent")));
    const agent = new SocksProxyAgent(proxyUrl);
    const fetchReq = new ethers_1.FetchRequest(rpcUrl);
    fetchReq.getUrlFunc = (req) => {
        return new Promise((resolve, reject) => {
            const url = new URL(req.url);
            const mod = url.protocol === 'https:' ? https : http;
            const postData = req.body ? Buffer.from(req.body) : undefined;
            const options = {
                hostname: url.hostname,
                port: url.port || (url.protocol === 'https:' ? 443 : 80),
                path: url.pathname + url.search,
                method: req.method || 'POST',
                headers: { 'content-type': 'application/json' },
                agent,
            };
            const r = mod.request(options, (res) => {
                const chunks = [];
                res.on('data', (chunk) => chunks.push(chunk));
                res.on('end', () => {
                    const body = Buffer.concat(chunks);
                    resolve({
                        statusCode: res.statusCode || 0,
                        statusMessage: res.statusMessage || '',
                        headers: res.headers,
                        body,
                    });
                });
            });
            r.on('error', reject);
            if (postData)
                r.write(postData);
            r.end();
        });
    };
    return new ethers_1.JsonRpcProvider(fetchReq);
}
async function cli() {
    let inputScript;
    let outputFile;
    let infile;
    //let initalFlags: BytesLike = 0
    let provider;
    let signer;
    let metaTxPayer;
    let targetAddress;
    let proxyUrl;
    let rpcUrl;
    let value = 0;
    let i = 2;
    let prepend = '';
    for (; i < process.argv.length - 1; i++) {
        if (process.argv[i] == '-i' || process.argv[i] == '--infile') {
            infile = process.argv[++i];
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
            targetAddress = process.argv[++i];
        }
        else if (process.argv[i] == '-r' || process.argv[i] == '--rpc') {
            rpcUrl = process.argv[++i];
        }
        else if (process.argv[i] == '--proxy') {
            proxyUrl = process.argv[++i];
        }
        else if (process.argv[i] == '-v' || process.argv[i] == '--value') {
            value = process.argv[++i];
            if (value.toLowerCase().endsWith('eth'))
                value = (0, ethers_1.parseEther)(value.substring(0, value.length - 3));
        }
        else if (process.argv[i] == '-p' || process.argv[i] == '--prepend') {
            prepend += process.argv[++i] + '\n';
        }
        else {
            break;
        }
    }
    inputScript = prepend + (infile ? (0, fs_1.readFileSync)(infile, { encoding: 'utf-8' }) : '');
    if (rpcUrl) {
        provider = proxyUrl ? await makeProxiedProvider(rpcUrl, proxyUrl) : new ethers_1.JsonRpcProvider(rpcUrl);
    }
    const cmd = process.argv[i];
    if (!cmd || cmd == '-h' || cmd == '--help') {
        help();
        process.exit(1);
    }
    if (process.env["PRVKEY"]) {
        signer = new ethers_1.Wallet(process.env["PRVKEY"], provider);
    }
    if (process.env["METATXKEY"]) {
        metaTxPayer = new ethers_1.Wallet(process.env["METATXKEY"], provider);
    }
    let txPayer = signer;
    if (cmd == 'runMeta') {
        if (metaTxPayer) {
            txPayer = metaTxPayer;
        }
        else {
            console.error(`No metaTxKey specified. Put private key in METATXKEY envvar`);
            process.exit(1);
        }
    }
    if (cmd == 'deploy') {
        if (!signer) {
            console.error(`No signer specified. Put private key in PRVKEY envvar`);
            process.exit(1);
        }
        // Monad
        const poolManager = "0x188d586ddcf52439676ca21a244753fa19f9ea8e";
        //const factory = new OwnedBrevityInterpreter__factory(signer)
        const factory = new typechain_types_1.Uniswap4FlashBrevityInterpreter__factory(signer);
        // owner can be passed using -t target
        const owner = targetAddress ? targetAddress : await signer.getAddress();
        const rslt = await factory.deploy(owner, poolManager);
        console.log(`OwnedBrevityInterpreter deployed at ${await rslt.getAddress()} , owner = ${owner}, in txHash ${rslt.deploymentTransaction()?.hash}`);
        process.exit(0);
    }
    if (cmd == 'deployFactory') {
        if (!signer) {
            console.error(`No signer specified. Put private key in PRVKEY envvar`);
            process.exit(1);
        }
        const factory = new typechain_types_1.CloneFactory__factory(signer);
        const rslt = await factory.deploy();
        console.log(`CloneFactory deployed at ${await rslt.getAddress()} , in txHash ${rslt.deploymentTransaction()?.hash}`);
        process.exit(0);
    }
    if (cmd == 'deployTestToken') {
        if (!signer) {
            console.error(`No signer specified. Put private key in PRVKEY envvar`);
            process.exit(1);
        }
        const token = new typechain_types_1.TestToken__factory(signer);
        const rslt = await token.deploy();
        console.log(`TestToken deployed at ${await rslt.getAddress()} , in txHash ${rslt.deploymentTransaction()?.hash}`);
        process.exit(0);
    }
    const parser = new brevityParser_1.BrevityParser(defaultConfig);
    const compiled = inputScript ? parser.parseBrevityScript(inputScript) : undefined;
    if (!compiled) {
        console.error(`No input script`);
        process.exit(1);
    }
    if (cmd == 'build') {
        const code = JSON.stringify(compiled, null, 2);
        if (outputFile) {
            (0, fs_1.writeFileSync)(outputFile, code);
        }
        else {
            console.log(code);
        }
        process.exit(0);
    }
    if (!provider) {
        console.error(`No RPC given`);
        process.exit(1);
    }
    if (!targetAddress) {
        console.error(`No target interpreter given`);
        process.exit(1);
    }
    if (cmd == 'estimateGas') {
        let from;
        if (process.argv.length == i + 1) {
            if (!signer)
                throw Error("if no PRVKEY, must pass from to estimateGas");
            from = await signer.getAddress();
        }
        else {
            from = process.argv[++i];
        }
        await (0, utils_1.estimateGas)(typechain_types_1.IBrevityInterpreter__factory.connect(targetAddress, provider), compiled, from);
        process.exit(0);
    }
    if (!signer) {
        console.error(`No signer specified. Put private key in PRVKEY envvar`);
        process.exit(1);
    }
    const signerAddress = await signer.getAddress();
    const targetInterpreter = typechain_types_1.IBrevityInterpreter__factory.connect(targetAddress, txPayer);
    if (cmd == 'run') {
        const resp = await targetInterpreter.run(compiled, { value });
        console.log(`Submitted run txHash ${resp.hash}`);
    }
    else if (cmd == 'runMeta') {
        const network = await provider.getNetwork();
        const deadline = Math.floor(((new Date()).getTime() / 1000) + 3600);
        const sig = await (0, utils_1.signMetaTx)(signer, targetAddress, network.chainId, compiled, deadline);
        const resp = await targetInterpreter.runMeta(compiled, deadline, signerAddress, sig);
        console.log(`Submitted runMeta txHash ${resp.hash}`);
    }
    else if (cmd == 'signMeta') {
        const network = await provider.getNetwork();
        const deadline = Math.floor(((new Date()).getTime() / 1000) + 3600);
        const sig = await (0, utils_1.signMetaTx)(signer, targetAddress, network.chainId, compiled, deadline);
        const tx = await targetInterpreter.getFunction("runMeta").populateTransaction(compiled, deadline, signerAddress, sig);
        console.log(tx.data);
    }
    else if (cmd == 'signFactoryMeta') {
        // experimental, for bridging
        // target = CloneFactory
        const cloneFactory = typechain_types_1.CloneFactory__factory.connect(targetAddress, provider);
        const implementation = process.argv[++i];
        const salt = (0, ethers_1.toBeHex)(process.argv[++i], 32);
        const network = await provider.getNetwork();
        const deadline = Math.floor(((new Date()).getTime() / 1000) + 3600);
        const owner = await signer.getAddress();
        const interpreterAddress = await cloneFactory.predictDeterministicAddress(implementation, salt, owner);
        const sig = await (0, utils_1.signMetaTx)(signer, interpreterAddress, network.chainId, compiled, deadline);
        const tx = await cloneFactory.getFunction("cloneIfNeededThenRun").populateTransaction(implementation, salt, owner, compiled, deadline, sig);
        console.log(tx.data);
    }
    else {
        console.error(`Unknown cmd: ${cmd}`);
        process.exit(1);
    }
}
cli();
