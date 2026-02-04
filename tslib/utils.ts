import { IBrevityInterpreter, IBrevityInterpreter__factory, OwnedBrevityInterpreter } from "../typechain-types";
import { BrevityParserOutput } from "./brevityParser";
import { Signer, BigNumberish, BytesLike, dataLength, toUtf8Bytes, toBeArray, AbiCoder, toBeHex, zeroPadBytes, AddressLike, TransactionReceipt } from 'ethers'

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
}

export function bytesMemoryObject(data : string) : string {
  const len = dataLength(data)
  const words = Math.ceil(len / 32)
  data = zeroPadBytes(data, words*32)
  if(data.startsWith('0x')) data = data.substring(2)  
  //console.log(`data padded ${data}`)
  let rslt = toBeHex(len, 32) 
  for(let i=0; i < words; i++) {
    rslt += ",0x" + data.substring((64*i), (64*(i+1)))
  }
  return rslt
}

export function getKeyValues(receipt: TransactionReceipt, interpreter: IBrevityInterpreter): Map<bigint, bigint> {
    const events = new Map<bigint, bigint>()
    const addr = (interpreter.target as string).toLowerCase()
    for (const log of receipt.logs) {
      if (log.address.toLowerCase() !== addr) continue
      try {
        const parsed = interpreter.interface.parseLog(log)
        if (parsed?.name === 'KeyValue') events.set(parsed.args[0], parsed.args[1])
      } catch {}
    }
    return events
  }

export async function estimateGas(brevityInterpreter: IBrevityInterpreter, o: BrevityParserOutput, from: AddressLike, value: BigNumberish = BigInt(0)) {
  const runGas = await brevityInterpreter.getFunction("run").estimateGas(o, {from, value})
  const noopGas = await brevityInterpreter.getFunction("noop").estimateGas(o, {from, value})
  if (!runGas || !noopGas) throw Error()
  console.log(`Brevity gas: total = ${runGas}, calldata = ${noopGas}, execution = ${runGas - noopGas}`)
}

export async function signMetaTx(signer: Signer, brevityInterpreterAddress: string, chainId: BigNumberish, output: BrevityParserOutput, deadline: number) {
  const domain = {
    name: 'Brev',
    version: '1',
    chainId: chainId,
    verifyingContract: brevityInterpreterAddress
  }
  const signerAddress = await signer.getAddress()
  const code = await signer.provider?.getCode(brevityInterpreterAddress)
  // if not deployed, use 0 for nonce
  const nonce = (!code || dataLength(code) == 0 )? 0 : await IBrevityInterpreter__factory.connect(brevityInterpreterAddress, signer.provider).nonces(signerAddress)
  const v = {
    deadline,
    nonce,
    ...output
  }
  const sig = await signer.signTypedData(domain, METATX_TYPES, v)
  return sig
}