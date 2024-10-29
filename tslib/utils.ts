import { BrevityInterpreter } from "../typechain-types";
import { BrevityParserOutput } from "./brevityParser";
import { Signer, BigNumberish } from 'ethers' 
const METATX_TYPES = {
    Instruction : [
        { name: 'opcode', type: 'uint8' },
        { name: 'args', type: 'bytes32[]' }
      ],
      Quantity : [
        { name: 'quantityType', type: 'uint256' },
        { name: 'args', type: 'bytes32[]' }
      ],
      Run: [
      { name: 'memSize', type: 'uint8' },
      { name: 'instructions', type: 'Instruction[]' },
      { name: 'quantities', type: 'Quantity[]' },
      { name: 'nonce', type: 'uint256' }
    ]
  }


export async function signMetaTx(signer : Signer, brevityInterpreter : BrevityInterpreter, chainId : BigNumberish, output : BrevityParserOutput) {
    const domain = {
        name: 'Brev',
        version: '1',
        chainId: chainId,
        verifyingContract: await brevityInterpreter.getAddress()
    }
    const signerAddress = await signer.getAddress()
    const nonce = await brevityInterpreter.nonces(signerAddress)
    const v = {
        nonce,
        ...output
    }
    const sig = await signer.signTypedData(domain, METATX_TYPES, v)
    return sig
}