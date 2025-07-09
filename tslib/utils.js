"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.signMetaTx = exports.estimateGas = void 0;
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
async function estimateGas(brevityInterpreter, o, value = BigInt(0)) {
    const runGas = await brevityInterpreter.getFunction("run").estimateGas(o, { value });
    const noopGas = await brevityInterpreter.getFunction("noop").estimateGas(o, { value });
    if (!runGas || !noopGas)
        throw Error();
    console.log(`Brevity gas: total = ${runGas}, calldata = ${noopGas}, execution = ${runGas - noopGas}`);
}
exports.estimateGas = estimateGas;
async function signMetaTx(signer, brevityInterpreter, chainId, output, deadline = ((new Date()).getTime() / 1000) + 3600) {
    const bi = await brevityInterpreter.getAddress();
    const domain = {
        name: 'Brev',
        version: '1',
        chainId: chainId,
        verifyingContract: bi
    };
    const signerAddress = await signer.getAddress();
    const nonce = await brevityInterpreter.nonces(signerAddress);
    const v = {
        deadline,
        nonce,
        ...output
    };
    const sig = await signer.signTypedData(domain, METATX_TYPES, v);
    return sig;
}
exports.signMetaTx = signMetaTx;
