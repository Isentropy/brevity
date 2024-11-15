import { BigNumberish, FunctionFragment, toBeHex } from 'ethers';

const SYMBOL_REGEX = /[a-zA-Z][a-zA-Z_0-9]*/

const OPCODE_STATICCALL = 0;
const OPCODE_CALL = 1;
const OPCODE_DELEGATECALL = 2;
const OPCODE_CMP_BRANCH = 3;
const OPCODE_JUMP = 4;

const OPCODE_MSTORE_R0 = 128;
// const OPCODE_MSTORE_R1 = 129;
// ...

const QUANTITY_LITERAL = 0;
const QUANTITY_OP_ADD = 1;
const QUANTITY_OP_MUL = 2;
const QUANTITY_OP_SUB = 3;
const QUANTITY_OP_DIV = 4;
const QUANTITY_OP_MOD = 6;
const QUANTITY_OP_LT = 0x10;
const QUANTITY_OP_GT = 0x11;
const QUANTITY_OP_EQ = 0x12;
//const QUANTITY_OP_ISZERO = 0x13;

const QUANTITY_OP_AND = 0x16;
const QUANTITY_OP_OR = 0x17;
const QUANTITY_OP_XOR = 0x18;
const QUANTITY_OP_NOT = 0x19;
const QUANTITY_OP_SHL = 0x1B;
const QUANTITY_OP_SHR = 0x1C;
const QUANTITY_ADDRESSTHIS = 0x30;
const QUANTITY_BALANCE = 0x31;
const QUANTITY_CALLER = 0x33;
const QUANTITY_CALLVALUE = 0x34;

const QUANTITY_BLOCKTIMESTAMP = 0x42;

//const QUANTITY_R0 = 128;
const BIT255_NOTLITERAL = BigInt(1) << BigInt(255)
const BIT254_NOTMEM = BigInt(1) << BigInt(254)
// top bit unset
const MAXINT_LITERAL = '0x7FFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFF'

// reserved keywords
const KW_CALL = 'CALL'
const KW_STATICCALL = 'STATICCALL'
const KW_DELEGATECALL = 'DELEGATECALL'
const KW_VAR = 'var'
const KW_IF = 'if'
const KW_GOTO = 'goto'
const KW_REVERT = 'revert'

//const RUN_SELECTOR = BrevityInterpreter__factory.createInterface().getFunction("run").selector

const ZeroArgQuantityKWs = new Map<string, number>([
    ['this', QUANTITY_ADDRESSTHIS],
    ['block.timestamp', QUANTITY_BLOCKTIMESTAMP],
    ['msg.sender', QUANTITY_CALLER],
    ['msg.value', QUANTITY_CALLVALUE]
]);

const OneArgQuantityKWs = new Map<string, number>([
    ['balance', QUANTITY_BALANCE]
]);

const KWS: Set<string> = new Set<string>([... ZeroArgQuantityKWs.keys()].concat([...OneArgQuantityKWs.keys()] ).concat([KW_REVERT, KW_GOTO, KW_IF, KW_CALL, KW_STATICCALL, KW_DELEGATECALL, KW_VAR]))
const OPS: Set<string> = new Set<string>([ '!','==', '-', '/', '*', '+', '&', '|', '^', '<', '>', '<<', '>>'])


export interface Instruction {
    opcode: number,
    args: string[]
}

export interface Quantity {
    quantityType: number,
    args: string[]
}

interface FnParams {
    gasLimit? : string,
    value? : string       
}



class ParsingContext {
    preprocessorSymbols: Map<string, string> = new Map<string, string>()
    memAddressNames: Map<string, number> = new Map<string, number>()
    jumppointNames: Map<string, number> = new Map<string, number>()
    quantityEncodedToIndex: Map<string, number> = new Map<string, number>()
    quantites: Quantity[] = []
    lineNumber: number = 1
    quantityIndex(q: Quantity): bigint {
        //console.log(`quantityIndex ${JSON.stringify(q, null, 2)}`)
        const k = JSON.stringify(q)
        let idx = this.quantityEncodedToIndex.get(k)
        if (typeof idx === 'number') return BigInt(idx) | BIT254_NOTMEM | BIT255_NOTLITERAL
        //console.log(`${k} not found`)
        idx = this.quantites.length
        this.quantites.push(q)
        this.quantityEncodedToIndex.set(k, idx)
        return BigInt(idx) | BIT254_NOTMEM | BIT255_NOTLITERAL
    }
    constructor() {

    }
}

// some instructions encoded at end if they require input defined later
type LazyEncodeInstuction = (context: ParsingContext) => Instruction


function toBytes32(n: BigNumberish): string {
    const hex = toBeHex(n, 32)
    //onsole.log(`toBytes32 ${n} ${hex}`)
    return hex
}

export interface BrevityParserConfig {
    maxMem: number
}

export interface BrevityParserOutput {
    memSize: number,
    instructions: Instruction[],
    quantities: Quantity[]
}

export class BrevityParser {
    private config: BrevityParserConfig

    constructor(config: BrevityParserConfig) {
        this.config = config
    }


    // searches infix returns [opStartingPos, op]
    private findFirstValidOpCharacter(s: string): [number, string] {
        let parentheses = 0
        let prevChar
        for (let i = 0; i < s.length; i++) {
            const c = s.charAt(i)
            if (c == '(') {
                parentheses++
                continue;
            }
            if (c == ')') {
                parentheses--
                if (parentheses < 0) throw Error(`Error parsing quantity "${s}: ')' without '('`)
                continue;
            }
            //TODO: only works for 1-2 char ops. consider trie if needed
            if (parentheses == 0) {
                if (prevChar && OPS.has(prevChar + c)) return [i - 1, prevChar + c]
                if (OPS.has(c)) return [i, c];
            }
            prevChar = c
        }
        return [-1, ''];
    }


    //TODO
    private opCharToQuantityCode(q: string): number {
        if (!OPS.has(q)) throw Error(`invalid op ${q}`)
        switch (q) {
            case '+': return QUANTITY_OP_ADD;
            case '*': return QUANTITY_OP_MUL;
            case '/': return QUANTITY_OP_DIV;
            case '-': return QUANTITY_OP_SUB;
            case '>': return QUANTITY_OP_GT;
            case '<': return QUANTITY_OP_LT;
            case '&': return QUANTITY_OP_AND;
            case '|': return QUANTITY_OP_OR;
            case '^': return QUANTITY_OP_XOR;
            case '<<': return QUANTITY_OP_SHL;
            case '>>': return QUANTITY_OP_SHR;
            case '%': return QUANTITY_OP_MOD;
            case '==': return QUANTITY_OP_EQ;
        }
        throw Error(`unknown op ${q}`)
    }

    private encodeJump(dest: number): Instruction {
        return {
            opcode: OPCODE_JUMP,
            args: [toBytes32(dest)]
        }
    }
    private encodeBranchIfNonzero(qWord: bigint, pcIfNonzero: BigNumberish): Instruction {
        return {
            opcode: OPCODE_CMP_BRANCH,
            args: [toBytes32(qWord), toBytes32(pcIfNonzero)]
        }
    }

    private encodeLiteral(val: BigNumberish, parsingContext: ParsingContext): bigint {
        val = BigInt(val)
        // uints less than 2^255 sent unaltered
        if (val < BIT255_NOTLITERAL) return val;
        const parsed: Quantity = {
            quantityType: QUANTITY_LITERAL,
            args: [toBytes32(val)]
        }
        return parsingContext.quantityIndex(parsed)
    }

    // parse Q, add to parsingContent, return  quantityIndex
    private parseQuantity(q: string, parsingContext: ParsingContext, dealias = true): bigint {
        //console.log(`parseQuantity: ${q}`)
        q = q.trim()
        if(q.length == 0) throw Error(`${parsingContext.lineNumber}: Error parsing quantity "${q}"`)
        const [opPos, op] = this.findFirstValidOpCharacter(q)
        if (opPos != -1) {
            const twoArg: Quantity = {
                quantityType: this.opCharToQuantityCode(op),
                args: [toBytes32(this.parseQuantity(q.substring(0, opPos), parsingContext)), toBytes32(this.parseQuantity(q.substring(opPos + op.length, q.length), parsingContext))]
            }
            return parsingContext.quantityIndex(twoArg)
        }

        // strip parentheses from arg
        if (q.startsWith('(')) {
            if (!q.endsWith(')')) throw Error(`${parsingContext.lineNumber}: Error parsing quantity "${q}: '(' without ending ')'`)
            return this.parseQuantity(q.substring(1, q.length - 1), parsingContext)
        }

        if (/^[0-9]+$/.test(q)) return this.encodeLiteral(q, parsingContext)
        const regnum = parsingContext.memAddressNames.get(q)
        if ((typeof regnum !== 'undefined')) {
            // mem
            return BigInt(regnum) | BIT255_NOTLITERAL
        }
        if (dealias) {
            const alias = parsingContext.preprocessorSymbols.get(q)
            if (typeof alias !== 'undefined') {
                // substitute the alias only once
                return this.parseQuantity(alias, parsingContext, false)
            }
        }
        // 0 arg fns
        if (ZeroArgQuantityKWs.has(q)) {
            return parsingContext.quantityIndex({
                quantityType: ZeroArgQuantityKWs.get(q)!,
                args: []
            })
        }
        // 1 arg fns
        const firstParen = q.indexOf('(')
        if(firstParen >= 0) {
            const fnName = q.substring(0, firstParen)
            if (OneArgQuantityKWs.has(fnName)) {
                // rm ()
                return parsingContext.quantityIndex({
                    quantityType: OneArgQuantityKWs.get(fnName)!,
                    args: [toBytes32(this.parseQuantity(q.substring(fnName.length + 1, q.length - 1), parsingContext))]
                })
            } else throw Error(`${parsingContext.lineNumber}: function ${fnName} unknown`)
        }
        // maybe it's raw hex
        return this.encodeLiteral(q, parsingContext)
    }



    private parseFunctionCall(fn: string, parsingContext: ParsingContext, memWriteInfo: string = toBytes32(0), gasLimit : BigNumberish = toBytes32(300000), value: string = "0"): Instruction {
        fn = fn.trim()
        const firstSpace = fn.indexOf(' ')
        if (firstSpace < 0) throw Error(`${parsingContext.lineNumber}: cant parse fn ${fn}`)
        const cmd = fn.substring(0, firstSpace)
        let opcode: number

        if (cmd == KW_CALL) opcode = OPCODE_CALL
        else if (cmd == KW_DELEGATECALL) opcode = OPCODE_DELEGATECALL
        else if (cmd == KW_STATICCALL) opcode = OPCODE_STATICCALL
        else throw Error(`${parsingContext.lineNumber}: Unknown fn cmd ${cmd}`)

        let right = fn.substring(firstSpace).trim()
        // value, gas, etc
        let callParams : FnParams = {}
        if(right.startsWith('{')) {
            const lastBrace = right.indexOf('}')
            callParams = JSON.parse(right.substring(0, lastBrace + 1))
            if(callParams.value) value = callParams.value
            if(callParams.gasLimit) gasLimit = callParams.gasLimit
            
            //console.log(`callParams: ${JSON.stringify(callParams)}`)
            right = right.substring(lastBrace + 1)
        }
        const firstPeriod = right.indexOf('.')
        let address = this.parseQuantity(right.substring(0, firstPeriod), parsingContext)
        let fnSelector: string
        let args
        right = right.substring(firstPeriod + 1)
        if (right.startsWith('0x')) {
            //eg address.0x12345678(arg1, arg2)
            fnSelector = right.substring(0, 10)
            // rm ()
            args = right.substring(11, right.length - 1)
        } else {
            const dp = right.indexOf(')(')
            if (dp >= 0) {
                // function sig isnt aliased
                const fnSig = right.substring(0, dp + 1)
                fnSelector = FunctionFragment.from(fnSig).selector
                //rm ()
                args = right.substring(dp + 2, right.length - 1)
            } else {
                
                // it is aliased address eg fooAlias := foo(arg1, arg2)
                const firstParen = right.indexOf('(')
                const alias = right.substring(0, firstParen)
                const fnSig = parsingContext.preprocessorSymbols.get(alias)
                if (typeof fnSig === 'undefined') throw Error(`${parsingContext.lineNumber}: Cant decipher fnSig ${alias}. must define string with full signature`)
                fnSelector = FunctionFragment.from(fnSig).selector
                //rm ()
                args = right.substring(firstParen + 1, right.length - 1)
            }
        }
        // args contains a comma separated string of unparsed Quantities
        const fnArgs = args.trim().length == 0 ? [] : args.split(',').map((arg) => { return toBytes32(this.parseQuantity(arg, parsingContext)) })
        // takes: memWriteInfo(offset: uint128, len: uint128):uint, address: *Quantity, gas: uint, 
        // set memWriteInfo to 0 to not write to mem
        console.log(`gasLimit ${gasLimit}`)
        let callArgs = [memWriteInfo, toBytes32(address), toBytes32(gasLimit), toBytes32(fnSelector)]
        switch (opcode) {
            case OPCODE_STATICCALL: break;
            case OPCODE_DELEGATECALL: break;
            case OPCODE_CALL:
                callArgs.push(toBytes32(this.parseQuantity(value, parsingContext)));
                break;
            default: throw Error("unsupported")
        }
        const allArgs = callArgs.concat(fnArgs)
        return {
            opcode,
            args: allArgs
        }
    }


    private isFunctionCall(s: string) {
        return s.startsWith(KW_CALL) || s.startsWith(KW_DELEGATECALL) || s.startsWith(KW_STATICCALL)
    }

    private checkNewSymbolName(sym: string, parsingContext: ParsingContext) {
        if (!SYMBOL_REGEX.test(sym)) throw Error(`${parsingContext.lineNumber}: bad symbol name ${sym}`)
        if (parsingContext.preprocessorSymbols.has(sym)) throw Error(`${parsingContext.lineNumber}: symbol ${sym} already defined in preprocessor`)
        if (parsingContext.memAddressNames.has(sym)) throw Error(`${parsingContext.lineNumber}: symbol name ${sym} already defined as memory address`)
        if (parsingContext.jumppointNames.has(sym)) throw Error(`${parsingContext.lineNumber}: symbol name ${sym} already defined as jump point`)
        if (KWS.has(sym)) throw Error(`${parsingContext.lineNumber}: ${sym} is reserved keyword`)
    }

    // pull op off the end of string
    private getEndingOp(s: string): string | undefined {
        if (s.length == 0) return undefined
        if (s.length == 2 && OPS.has(s)) return s
        const lc = s.charAt(s.length - 1)
        if (OPS.has(lc)) return lc
        return undefined
    }

    // returns Solidity call data
    parseBrevityScript(script: string): BrevityParserOutput {
        const lines = script.split(/\n/)
        const parsingContext: ParsingContext = new ParsingContext()
        let memSize = 0
        const instructions: (Instruction | LazyEncodeInstuction)[] = []
        // lineNumber starts at 1 to align w editors
        for (; parsingContext.lineNumber <= lines.length; parsingContext.lineNumber++) {
            const line = lines[parsingContext.lineNumber - 1].trim()
            //comment
            if (line.startsWith('//') || line == '') continue;
            const pp = line.split(':=')
            //preprocessor directive
            if (pp.length > 1) {
                const k = pp[0].trim()
                this.checkNewSymbolName(k, parsingContext)
                parsingContext.preprocessorSymbols.set(k, pp[1].trim())
                continue
            }
            //jump point #name
            if (line.startsWith('#')) {
                const sym = line.substring(1)
                this.checkNewSymbolName(sym, parsingContext)
                parsingContext.jumppointNames.set(sym, instructions.length)
                continue;
            }
            if (line.startsWith(KW_IF)) {
                const lastBackParen = line.lastIndexOf(')')
                //rm ()
                const qWord = this.parseQuantity(line.substring(KW_IF.length + 1, lastBackParen), parsingContext)
                let right = line.substring(lastBackParen + 1).trim()
                if (right.startsWith(KW_REVERT)) {
                    instructions.push(this.encodeBranchIfNonzero(qWord, MAXINT_LITERAL))
                    continue
                }
                if (!right.startsWith(KW_GOTO)) {
                    const y = 1
                    throw Error(`${parsingContext.lineNumber}: missing 'goto' after 'if' `)
                }
                right = right.substring(KW_GOTO.length + 1).trim()
                if (!SYMBOL_REGEX.test(right)) throw Error(`${parsingContext.lineNumber}: nonSymbol ${right}`)
                const instLazy: LazyEncodeInstuction = (endContext: ParsingContext) => {
                    const pcIfNonzero = endContext.jumppointNames.get(right)
                    if (typeof pcIfNonzero === 'undefined') throw Error(`${parsingContext.lineNumber}: unrecognized jumppoint name ${right}`)
                    return this.encodeBranchIfNonzero(qWord, pcIfNonzero)
                }
                instructions.push(instLazy)
                continue
            }
            if (line.startsWith(KW_GOTO)) {
                const jumppoint = line.substring(KW_GOTO.length).trim()
                const instLazy: LazyEncodeInstuction = (endContext: ParsingContext) => {
                    const dest = endContext.jumppointNames.get(jumppoint)
                    if (typeof dest === 'undefined') throw Error(`${parsingContext.lineNumber}: unrecognized jumppoint name ${jumppoint}`)
                    return this.encodeJump(dest)
                }
                instructions.push(instLazy)
            }
            if (this.isFunctionCall(line)) {
                instructions.push(this.parseFunctionCall(line, parsingContext))
            }
            const assignment = line.split('=')
            if (assignment.length > 1) {
                //assignment
                let left = assignment[0].trim()
                let offset = -1
                let length = undefined
                // something like +=
                let unaryOp
                if (left.startsWith(KW_VAR)) {
                    //new vars
                    const varsToDefine = left.substring(KW_VAR.length).trim().split(',')
                    length = varsToDefine.length
                    offset = memSize
                    for (let i = 0; i < varsToDefine.length; i++) {
                        const v = varsToDefine[i].trim()
                        this.checkNewSymbolName(v, parsingContext)
                        parsingContext.memAddressNames.set(v, memSize++)
                    }
                } else {
                    // see if left ends with op as in x += 1
                    unaryOp = this.getEndingOp(left)
                    if (unaryOp) left = left.substring(0, left.length - unaryOp.length)
                    // should already be defined and in incremental order
                    const vars = left.trim().split(',')
                    length = vars.length
                    for (let i = 0; i < vars.length; i++) {
                        const v = vars[i].trim()
                        if (!parsingContext.memAddressNames.has(v)) throw Error(`${parsingContext.lineNumber}: mem address alias ${v} unknown `)
                        const regnum = parsingContext.memAddressNames.get(v)
                        if (typeof regnum === 'undefined') throw Error('huh')
                        if (offset == -1) {
                            offset = regnum
                        } else if (regnum != offset + i) {
                            throw Error(`${parsingContext.lineNumber}: mem address ${v} = ${regnum} expected to be in position ${offset + i}`)
                        }
                    }
                }
                //shouldnt happen
                if (offset == -1) throw Error(`${parsingContext.lineNumber}: offset unknown`)
                if (offset + length > this.config.maxMem) throw Error(`${parsingContext.lineNumber}: maxMem ${this.config.maxMem} exceeded`)
                const right = assignment[1].trim()
                if (this.isFunctionCall(right)) {
                    // right side of = is function call
                    const storeDirective = (BigInt(offset) << BigInt(128)) + BigInt(length)
                    instructions.push(this.parseFunctionCall(right, parsingContext, toBytes32(storeDirective)))

                } else {
                    // right side of = is Quantity
                    if (length != 1) throw Error(`${parsingContext.lineNumber}: can only assign Quantity to 1 word`)
                    let quantityEncoded = this.parseQuantity(right, parsingContext)
                    if (unaryOp) {
                        quantityEncoded = parsingContext.quantityIndex({
                            quantityType: this.opCharToQuantityCode(unaryOp),
                            args: [toBytes32(BigInt(offset) | BIT255_NOTLITERAL), toBytes32(quantityEncoded)]
                        })
                    }
                    instructions.push({
                        opcode: (OPCODE_MSTORE_R0 + offset),
                        args: [toBytes32(quantityEncoded)]
                    })
                }
            }
        }
        const resolved: Instruction[] = instructions.map((inst) => {
            if (inst instanceof Function) {
                return inst(parsingContext)
            }
            return inst
        })
        return { memSize: memSize, instructions: resolved, quantities: parsingContext.quantites }
    }


}