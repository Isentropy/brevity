import { BigNumberish, FunctionFragment, toBeHex } from 'ethers';

const SYMBOL_REGEX = /[a-zA-Z][a-zA-Z_0-9]*/
const NEGATIVE_INT = /^-[0-9]+$/
const COMMENT_REGEX = /\/\*[\s\S]*?\*\/|([^\\:]|^)\/\/.*$/gm

const OPCODE_STATICCALL = 0;
const OPCODE_CALL = 1;
const OPCODE_DELEGATECALL = 2;
const OPCODE_CMP_BRANCH = 3;
const OPCODE_JUMP = 4;
const OPCODE_LOG = 10;
const OPCODE_DUMPMEM = 11;

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
// const MAXINT_LITERAL = '0x7FFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFF'
//export const CONFIGFLAG_NO_DELEGATECALL = BigInt('0x0000000000000000000000000000000100000000000000000000000000000000')
const JUMPDEST_RETURN = '0xFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFF'
const JUMPDEST_REVERT = '0x0FFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFF'

// reserved keywords
const KW_CALL = 'CALL'
const KW_SEND = 'SEND'
const KW_STATICCALL = 'STATICCALL'
const KW_DELEGATECALL = 'DELEGATECALL'
const KW_VAR = 'var'
const KW_IF = 'if'
const KW_GOTO = 'goto'
const KW_REVERT = 'revert'
const KW_RETURN = 'return'
const KW_DUMPMEM = 'dumpMem'
const KW_CLEARMEMSTACK = 'clearMemStack'


// minus 1 in 32 byte 2s compliment
const BN_MINUS1 = BigInt('0xFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFF')
//const RUN_SELECTOR = BrevityInterpreter__factory.createInterface().getFunction("run").selector

const ZeroArgQuantityKWs = new Map<string, number>([
    ['this', QUANTITY_ADDRESSTHIS],
    ['block.timestamp', QUANTITY_BLOCKTIMESTAMP],
    ['msg.sender', QUANTITY_CALLER],
    ['msg.value', QUANTITY_CALLVALUE]
]);

const OneArgQuantityKWs = new Map<string, number>([
    ['balance', QUANTITY_BALANCE],
    ['!', QUANTITY_OP_NOT],
]);

const TwoArgQuantityKWs = new Map<string, number>([
    ['+', QUANTITY_OP_ADD],
    ['*', QUANTITY_OP_MUL],
    ['/', QUANTITY_OP_DIV],
    ['-', QUANTITY_OP_SUB],
    ['>', QUANTITY_OP_GT],
    ['<', QUANTITY_OP_LT],
    ['&', QUANTITY_OP_AND],
    ['|', QUANTITY_OP_OR],
    ['^', QUANTITY_OP_XOR],
    ['<<', QUANTITY_OP_SHL],
    ['>>', QUANTITY_OP_SHR],
    ['%', QUANTITY_OP_MOD],
    ['==', QUANTITY_OP_EQ]
]);


const KWS: Set<string> = new Set<string>([...ZeroArgQuantityKWs.keys()].concat([...OneArgQuantityKWs.keys()]).concat([...TwoArgQuantityKWs.keys()]).concat([KW_REVERT, KW_RETURN, KW_GOTO, KW_IF, KW_CALL, KW_SEND, KW_STATICCALL, KW_DELEGATECALL, KW_VAR, KW_DUMPMEM]))


export interface Instruction {
    opcode: number,
    args: string[]
}

export interface Quantity {
    quantityType: number,
    args: string[]
}

interface FnParams {
    value?: string
}

export function configFlagRequireVersion( v: number ) : bigint {
    return BigInt(v) << BigInt(64)
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
    maxMem: number,
    // these will be ORed with the memsize
    configFlags?: bigint
}

export interface BrevityParserOutput {
    config: BigNumberish,
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
            if (c === '(') {
                parentheses++
                continue;
            }
            if (c === ')') {
                parentheses--
                if (parentheses < 0) throw Error(`Error parsing quantity "${s}: ')' without '('`)
                continue;
            }
            //TODO: only works for 1-2 char ops. consider trie if needed
            if (parentheses === 0) {
                if (prevChar && TwoArgQuantityKWs.has(prevChar + c)) return [i - 1, prevChar + c]
                if (TwoArgQuantityKWs.has(c)) return [i, c];
            }
            prevChar = c
        }
        return [-1, ''];
    }

    private encodeJump(dest: BigNumberish): Instruction {
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
        if(val < BigInt(0)) {
            val = BN_MINUS1 + val + BigInt(1)
            //console.log(`2s compliment val ${toBytes32(val)}`)
        }
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
        if (q.length === 0) throw Error(`${parsingContext.lineNumber}: Error parsing quantity "${q}"`)
        if(NEGATIVE_INT.test(q)) {
            return this.encodeLiteral(q, parsingContext)
        }
        const [opPos, op] = this.findFirstValidOpCharacter(q)
        if (opPos !== -1) {
            const twoArg: Quantity = {
                quantityType: TwoArgQuantityKWs.get(op)!,
                args: [toBytes32(this.parseQuantity(q.substring(0, opPos), parsingContext)), toBytes32(this.parseQuantity(q.substring(opPos + op.length, q.length), parsingContext))]
            }
            return parsingContext.quantityIndex(twoArg)
        }
        /*
         oneArg should go after 2 arg to enforce order of op
         for ex
         !a === b => (=== (! a) b)
         !(a === b) => (! (=== a b)
          findFirstValidOpCharacter checks for first 2arg op outside parens
        */
        for (let op of OneArgQuantityKWs.keys()) {
            if (!q.startsWith(op)) continue
            const oneArg: Quantity = {
                quantityType: OneArgQuantityKWs.get(op)!,
                args: [toBytes32(this.parseQuantity(q.substring(op.length), parsingContext))]
            }
            return parsingContext.quantityIndex(oneArg)
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
        if (firstParen >= 0) {
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



    private parseFunctionCall(fn: string, parsingContext: ParsingContext, memWriteInfo: string = toBytes32(0), value: string = "0"): Instruction {
        fn = fn.trim()
        const firstSpace = fn.indexOf(' ')
        if (firstSpace < 0) throw Error(`${parsingContext.lineNumber}: cant parse fn ${fn}`)
        const cmd = fn.substring(0, firstSpace)
        let opcode: number

        if (cmd === KW_CALL) opcode = OPCODE_CALL
        else if (cmd === KW_SEND) opcode = OPCODE_CALL
        else if (cmd === KW_DELEGATECALL) opcode = OPCODE_DELEGATECALL
        else if (cmd === KW_STATICCALL) opcode = OPCODE_STATICCALL
        else throw Error(`${parsingContext.lineNumber}: Unknown fn cmd ${cmd}`)

        let right = fn.substring(firstSpace).trim()
        // value, gas, etc
        let callParams: FnParams = {}
        if (right.startsWith('{')) {
            const lastBrace = right.indexOf('}')
            callParams = JSON.parse(right.substring(0, lastBrace + 1))
            if (callParams.value) value = callParams.value
            //console.log(`callParams: ${JSON.stringify(callParams)}`)
            right = right.substring(lastBrace + 1)
        }

        let address
        let fnSelector: string | undefined
        let fnArgs: string[] | undefined
        if(cmd === KW_SEND) {
            address = this.parseQuantity(right.substring(0, right.length), parsingContext)
        } else {
            const firstPeriod = right.indexOf('.')
            address = this.parseQuantity(right.substring(0, firstPeriod), parsingContext)
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
            fnArgs = args.trim().length === 0 ? [] : args.split(',').map((arg) => { return toBytes32(this.parseQuantity(arg, parsingContext)) })
        }

        let callArgs = [memWriteInfo, toBytes32(address)]
        if(opcode === OPCODE_CALL) callArgs.push(toBytes32(this.parseQuantity(value, parsingContext)))
        if(fnSelector) {
            callArgs.push(toBytes32(fnSelector))
            if(fnArgs) {
                callArgs = callArgs.concat(fnArgs)
            }
        }   
        return {
            opcode,
            args: callArgs
        }
    }


    private isFunctionCall(s: string) {
        return s.startsWith(KW_CALL) || s.startsWith(KW_DELEGATECALL) || s.startsWith(KW_STATICCALL) || s.startsWith(KW_SEND)
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
        if (s.length === 0) return undefined
        if (s.length === 2 && TwoArgQuantityKWs.has(s)) return s
        const lc = s.charAt(s.length - 1)
        if (TwoArgQuantityKWs.has(lc)) return lc
        return undefined
    }

    // returns Solidity call data
    parseBrevityScript(script: string): BrevityParserOutput {
        const woComments = script.replace(COMMENT_REGEX,'\n')
        //console.log(`woComments ${woComments}`)
        const lines = woComments.split(/\n/)
        const parsingContext: ParsingContext = new ParsingContext()
        let memSize = 0
        let maxMemSize = 0
        const instructions: (Instruction | LazyEncodeInstuction)[] = []
        // lineNumber starts at 1 to align w editors
        for (; parsingContext.lineNumber <= lines.length; parsingContext.lineNumber++) {
            const line = lines[parsingContext.lineNumber - 1].trim()
            //comment
            if (line.startsWith('//') || line === '') continue;
            const pp = line.split(':=')
            //preprocessor directive
            if (pp.length > 1) {
                const k = pp[0].trim()
                this.checkNewSymbolName(k, parsingContext)
                const symbol = pp[1].trim()
                // check if symbol is a defined preprocessor symbol 
                const symbolResolved = parsingContext.preprocessorSymbols.get(symbol)
                parsingContext.preprocessorSymbols.set(k, symbolResolved ? symbolResolved : symbol)
                continue
            }
            //jump point #name
            if (line.startsWith('#')) {
                const sym = line.substring(1)
                this.checkNewSymbolName(sym, parsingContext)
                parsingContext.jumppointNames.set(sym, instructions.length)
                continue;
            }
            if (line.startsWith(KW_DUMPMEM)) {
                instructions.push({
                    opcode: OPCODE_DUMPMEM,
                    args: []
                })
                continue
            }
            if (line.startsWith(KW_CLEARMEMSTACK)) {
                parsingContext.memAddressNames.clear()
                memSize = 0
                continue
            }
            if (line.startsWith(KW_IF)) {
                const lastBackParen = line.lastIndexOf(')')
                //rm ()
                const qWord = this.parseQuantity(line.substring(KW_IF.length + 1, lastBackParen), parsingContext)
                let right = line.substring(lastBackParen + 1).trim()


                if (right.startsWith(KW_REVERT)) {
                    instructions.push(this.encodeBranchIfNonzero(qWord, JUMPDEST_REVERT))
                    continue
                }

                if (right.startsWith(KW_RETURN)) {
                    instructions.push(this.encodeBranchIfNonzero(qWord, JUMPDEST_RETURN))
                    continue
                }
                if (!right.startsWith(KW_GOTO)) {
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

            if (line.startsWith(KW_REVERT)) {
                instructions.push(this.encodeJump(JUMPDEST_REVERT))
                continue
            }

            if (line.startsWith(KW_RETURN)) {
                instructions.push(this.encodeJump(JUMPDEST_RETURN))
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
                continue
            }
            if (this.isFunctionCall(line)) {
                instructions.push(this.parseFunctionCall(line, parsingContext))
                continue
            }
            const assignment = line.split('=')
            if (assignment.length < 2) throw Error(`${parsingContext.lineNumber}: unknown line format:\n${line}`)

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
                    if(memSize > maxMemSize) maxMemSize = memSize
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
                    if (offset === -1) {
                        offset = regnum
                    } else if (regnum !== offset + i) {
                        throw Error(`${parsingContext.lineNumber}: mem address ${v} = ${regnum} expected to be in position ${offset + i}`)
                    }
                }
            }
            //shouldnt happen
            if (offset === -1) throw Error(`${parsingContext.lineNumber}: offset unknown`)
            if (offset + length > this.config.maxMem) throw Error(`${parsingContext.lineNumber}: maxMem ${this.config.maxMem} exceeded`)
            const right = assignment[1].trim()
            if (this.isFunctionCall(right)) {
                // right side of = is function call
                const storeDirective = (BigInt(offset) << BigInt(128)) + BigInt(length)
                instructions.push(this.parseFunctionCall(right, parsingContext, toBytes32(storeDirective)))

            } else {
                // right side of = is Quantity
                if (length !== 1) throw Error(`${parsingContext.lineNumber}: can only assign Quantity to 1 word`)
                let quantityEncoded = this.parseQuantity(right, parsingContext)
                if (unaryOp) {
                    quantityEncoded = parsingContext.quantityIndex({
                        quantityType: TwoArgQuantityKWs.get(unaryOp)!,
                        args: [toBytes32(BigInt(offset) | BIT255_NOTLITERAL), toBytes32(quantityEncoded)]
                    })
                }
                instructions.push({
                    opcode: (OPCODE_MSTORE_R0 + offset),
                    args: [toBytes32(quantityEncoded)]
                })
            }

        }
        const resolved: Instruction[] = instructions.map((inst) => {
            if (inst instanceof Function) {
                return inst(parsingContext)
            }
            return inst
        })
        const config = toBytes32(BigInt(maxMemSize) | (this.config.configFlags ? this.config.configFlags : BigInt(0)))
        return { config, instructions: resolved, quantities: parsingContext.quantites }
    }


}