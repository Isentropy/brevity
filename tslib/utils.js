"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.bytesMemoryObject = bytesMemoryObject;
exports.getKeyValues = getKeyValues;
exports.estimateGas = estimateGas;
exports.signMetaTx = signMetaTx;
const typechain_types_1 = require("../typechain-types");
const ethers_1 = require("ethers");
const METATX_TYPES = {
    Instruction: [
        { name: 'opcode', type: 'uint256' },
        { name: 'args', type: 'bytes32[]' }
    ],
    Quantity: [
        { name: 'quantityType', type: 'uint256' },
        { name: 'args', type: 'bytes32[]' }
    ],
    Program: [
        { name: 'config', type: 'uint256' },
        { name: 'instructions', type: 'Instruction[]' },
        { name: 'quantities', type: 'Quantity[]' },
        { name: 'nonce', type: 'uint256' },
        { name: 'deadline', type: 'uint256' }
    ]
};
function bytesMemoryObject(data) {
    const len = (0, ethers_1.dataLength)(data);
    const words = Math.ceil(len / 32);
    data = (0, ethers_1.zeroPadBytes)(data, words * 32);
    if (data.startsWith('0x'))
        data = data.substring(2);
    //console.log(`data padded ${data}`)
    let rslt = (0, ethers_1.toBeHex)(len, 32);
    for (let i = 0; i < words; i++) {
        rslt += ",0x" + data.substring((64 * i), (64 * (i + 1)));
    }
    return rslt;
}
function getKeyValues(receipt, interpreter) {
    const events = new Map();
    const addr = interpreter.target.toLowerCase();
    for (const log of receipt.logs) {
        if (log.address.toLowerCase() !== addr)
            continue;
        try {
            const parsed = interpreter.interface.parseLog(log);
            if (parsed?.name === 'KeyValue')
                events.set(parsed.args[0], parsed.args[1]);
        }
        catch { }
    }
    return events;
}
async function estimateGas(brevityInterpreter, o, from, value = BigInt(0)) {
    const runGas = await brevityInterpreter.getFunction("run").estimateGas(o, { from, value });
    const noopGas = await brevityInterpreter.getFunction("noop").estimateGas(o, { from, value });
    if (!runGas || !noopGas)
        throw Error();
    console.log(`Brevity gas: total = ${runGas}, calldata = ${noopGas}, execution = ${runGas - noopGas}`);
}
async function signMetaTx(signer, brevityInterpreterAddress, chainId, output, deadline) {
    const domain = {
        name: 'Brev',
        version: '1',
        chainId: chainId,
        verifyingContract: brevityInterpreterAddress
    };
    const signerAddress = await signer.getAddress();
    const code = await signer.provider?.getCode(brevityInterpreterAddress);
    // if not deployed, use 0 for nonce
    const nonce = (!code || (0, ethers_1.dataLength)(code) == 0) ? 0 : await typechain_types_1.IBrevityInterpreter__factory.connect(brevityInterpreterAddress, signer.provider).nonces(signerAddress);
    const v = {
        deadline,
        nonce,
        ...output
    };
    const sig = await signer.signTypedData(domain, METATX_TYPES, v);
    return sig;
}
