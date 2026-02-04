"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.BrevityParser = exports.CONFIGFLAG_UNISWAP4UNLOCK = void 0;
const ethers_1 = require("ethers");
const utils_1 = require("./utils");
const buffer_1 = require("buffer");
exports.CONFIGFLAG_UNISWAP4UNLOCK = BigInt(1);
const SYMBOL_REGEX = /[a-zA-Z][a-zA-Z_0-9]*/;
const NEGATIVE_INT = /^-[0-9]+$/;
const COMMENT_REGEX = /\/\*[\s\S]*?\*\/|([^\\:]|^)\/\/.*$/gm;
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
const BIT255_NOTLITERAL = BigInt(1) << BigInt(255);
const BIT254_NOTMEM = BigInt(1) << BigInt(254);
const BIT128_UNCHECKED = BigInt(1) << BigInt(128);
// top bit unset
// const MAXINT_LITERAL = '0x7FFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFF'
//export const CONFIGFLAG_NO_DELEGATECALL = BigInt('0x0000000000000000000000000000000100000000000000000000000000000000')
const JUMPDEST_RETURN = '0xFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFF';
const JUMPDEST_REVERT = '0x0FFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFF';
// reserved keywords
const KW_CALL = 'CALL';
const KW_SEND = 'SEND';
const KW_STATICCALL = 'STATICCALL';
const KW_DELEGATECALL = 'DELEGATECALL';
const KW_VAR = 'var';
const KW_IF = 'if';
const KW_GOTO = 'goto';
const KW_REVERT = 'revert';
const KW_RETURN = 'return';
const KW_DUMPMEM = 'dumpMem';
const KW_CLEARMEMSTACK = 'clearMemStack';
// clears all preprocessor symbols that are not all uppercase
const KW_CLEARPARAMS = 'clearParams';
const KW_UNCHECKED = 'uncheckedArithmatic';
const KW_CHECKED = 'checkedArithmatic';
const PREPROC_ADDITIONAL_CONFIGFLAGS = 'ADDITIONAL_CONFIGFLAGS';
// minus 1 in 32 byte 2s compliment
const BN_MINUS1 = BigInt('0xFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFF');
//const RUN_SELECTOR = BrevityInterpreter__factory.createInterface().getFunction("run").selector
const ZeroArgQuantityKWs = new Map([
    ['this', QUANTITY_ADDRESSTHIS],
    ['block.timestamp', QUANTITY_BLOCKTIMESTAMP],
    ['msg.sender', QUANTITY_CALLER],
    ['msg.value', QUANTITY_CALLVALUE]
]);
const OneArgQuantityKWs = new Map([
    ['balance', QUANTITY_BALANCE],
    ['!', QUANTITY_OP_NOT],
]);
const TwoArgQuantityKWs = new Map([
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
const TwoArgKwsRegex = new RegExp(Array.from(TwoArgQuantityKWs.keys())
    .sort((a, b) => b.length - a.length)
    .map(s => s.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'))
    .join('|'));
const SOLO_KWS = [KW_CHECKED, KW_UNCHECKED, KW_REVERT, KW_RETURN, KW_GOTO, KW_IF, KW_CALL, KW_SEND, KW_STATICCALL, KW_DELEGATECALL, KW_VAR, KW_DUMPMEM];
const KWS = new Set([...ZeroArgQuantityKWs.keys()].concat([...OneArgQuantityKWs.keys()]).concat([...TwoArgQuantityKWs.keys()]).concat(SOLO_KWS));
/*
like JSON.parse for maps but allows k/v wo "
*/
function parseMap(map) {
    map = map.trim();
    if (map.startsWith("{") && map.endsWith("}"))
        map = map.substring(1, map.length - 1);
    const rslt = new Map();
    map.split(',').forEach((kv) => {
        kv = kv.trim();
        const parsed = kv.split(':').map((e) => {
            e = e.trim();
            if (e.startsWith("\"") && e.endsWith("\""))
                e = e.substring(1, e.length - 1);
            return e;
        });
        rslt.set(parsed[0], parsed[1]);
    });
    return rslt;
}
class ParsingContext {
    quantityIndex(q) {
        //console.log(`quantityIndex ${JSON.stringify(q, null, 2)}`)
        const k = JSON.stringify(q);
        let idx = this.quantityEncodedToIndex.get(k);
        if (typeof idx === 'number')
            return BigInt(idx) | BIT254_NOTMEM | BIT255_NOTLITERAL;
        //console.log(`${k} not found`)
        idx = this.quantites.length;
        this.quantites.push(q);
        this.quantityEncodedToIndex.set(k, idx);
        return BigInt(idx) | BIT254_NOTMEM | BIT255_NOTLITERAL;
    }
    constructor() {
        this.preprocessorSymbols = new Map();
        this.memAddressNames = new Map();
        this.jumppointNames = new Map();
        this.quantityEncodedToIndex = new Map();
        this.quantites = [];
        this.lineNumber = 1;
        this.uncheckedArithmatic = false;
    }
}
function toBytes32(n) {
    const hex = (0, ethers_1.toBeHex)(n, 32);
    //onsole.log(`toBytes32 ${n} ${hex}`)
    return hex;
}
class BrevityParser {
    constructor(config) {
        this.config = config;
    }
    // searches infix returns [opStartingPos, op]
    findFirstValidOpCharacter(s) {
        //console.log(`findFirstValidOpCharacter: ${s}`)
        let parentheses = 0;
        //let prevChar
        for (let i = 0; i < s.length; i++) {
            const c = s.charAt(i);
            if (c === '(') {
                parentheses++;
                continue;
            }
            if (c === ')') {
                parentheses--;
                if (parentheses < 0)
                    throw Error(`Error parsing quantity "${s}: ')' without '('`);
                continue;
            }
            if (parentheses === 0) {
                const nextParen = s.substring(i).indexOf('(');
                const match = TwoArgKwsRegex.exec(s.substring(i, nextParen == -1 ?
                    s.length : nextParen));
                if (match) {
                    //console.log(`match ${JSON.stringify(match)} ${match.}`)
                    return [i + match.index, match[0]];
                }
            }
            //prevChar = c
        }
        return [-1, ''];
    }
    encodeJump(dest) {
        return {
            opcode: OPCODE_JUMP,
            args: [toBytes32(dest)]
        };
    }
    encodeBranchIfNonzero(qWord, pcIfNonzero) {
        return {
            opcode: OPCODE_CMP_BRANCH,
            args: [toBytes32(qWord), toBytes32(pcIfNonzero)]
        };
    }
    encodeLiteral(val, parsingContext) {
        val = BigInt(val);
        if (val < BigInt(0)) {
            val = BN_MINUS1 + val + BigInt(1);
            //console.log(`2s compliment val ${toBytes32(val)}`)
        }
        // uints less than 2^255 sent unaltered
        if (val < BIT255_NOTLITERAL)
            return val;
        const parsed = {
            quantityType: QUANTITY_LITERAL,
            args: [toBytes32(val)]
        };
        return parsingContext.quantityIndex(parsed);
    }
    // parse Q, add to parsingContent, return  quantityIndex
    parseQuantity(q, parsingContext, dealias = true) {
        //console.log(`parseQuantity: ${q}`)
        q = q.trim();
        if (q.length === 0)
            throw Error(`${parsingContext.lineNumber}: Error parsing quantity "${q}"`);
        if (NEGATIVE_INT.test(q)) {
            return this.encodeLiteral(q, parsingContext);
        }
        const [opPos, op] = this.findFirstValidOpCharacter(q);
        if (opPos !== -1) {
            const twoArg = {
                quantityType: parsingContext.uncheckedArithmatic ? BIT128_UNCHECKED | BigInt(TwoArgQuantityKWs.get(op)) : TwoArgQuantityKWs.get(op),
                args: [toBytes32(this.parseQuantity(q.substring(0, opPos), parsingContext)), toBytes32(this.parseQuantity(q.substring(opPos + op.length, q.length), parsingContext))]
            };
            return parsingContext.quantityIndex(twoArg);
        }
        /*
         oneArg should go after 2 arg to enforce order of op
         for ex
         !a === b => (=== (! a) b)
         !(a === b) => (! (=== a b)
          findFirstValidOpCharacter checks for first 2arg op outside parens
        */
        for (let op of OneArgQuantityKWs.keys()) {
            if (!q.startsWith(op))
                continue;
            // For word-based operators like 'balance', require parentheses
            // (handled below in "1 arg fns" section). Only use prefix matching for symbol operators like '!'
            if (/^[a-zA-Z]/.test(op))
                continue;
            const oneArg = {
                quantityType: OneArgQuantityKWs.get(op),
                args: [toBytes32(this.parseQuantity(q.substring(op.length), parsingContext))]
            };
            return parsingContext.quantityIndex(oneArg);
        }
        // strip parentheses from arg
        if (q.startsWith('(')) {
            if (!q.endsWith(')'))
                throw Error(`${parsingContext.lineNumber}: Error parsing quantity "${q}: '(' without ending ')'`);
            return this.parseQuantity(q.substring(1, q.length - 1), parsingContext);
        }
        if (/^[0-9]+$/.test(q))
            return this.encodeLiteral(q, parsingContext);
        const regnum = parsingContext.memAddressNames.get(q);
        if ((typeof regnum !== 'undefined')) {
            // mem
            return BigInt(regnum) | BIT255_NOTLITERAL;
        }
        if (dealias) {
            const alias = parsingContext.preprocessorSymbols.get(q);
            if (typeof alias !== 'undefined') {
                // substitute the alias only once
                return this.parseQuantity(alias, parsingContext, false);
            }
        }
        // 0 arg fns
        if (ZeroArgQuantityKWs.has(q)) {
            return parsingContext.quantityIndex({
                quantityType: ZeroArgQuantityKWs.get(q),
                args: []
            });
        }
        // 1 arg fns
        const firstParen = q.indexOf('(');
        if (firstParen >= 0) {
            const fnName = q.substring(0, firstParen);
            if (OneArgQuantityKWs.has(fnName)) {
                // rm ()
                return parsingContext.quantityIndex({
                    quantityType: OneArgQuantityKWs.get(fnName),
                    args: [toBytes32(this.parseQuantity(q.substring(fnName.length + 1, q.length - 1), parsingContext))]
                });
            }
            else
                throw Error(`${parsingContext.lineNumber}: function ${fnName} unknown`);
        }
        // maybe it's raw hex
        return this.encodeLiteral(q, parsingContext);
    }
    parseFunctionCall(fn, parsingContext, memWriteInfo = toBytes32(0), value = "0") {
        fn = fn.trim();
        const firstSpace = fn.indexOf(' ');
        if (firstSpace < 0)
            throw Error(`${parsingContext.lineNumber}: cant parse fn ${fn}`);
        const cmd = fn.substring(0, firstSpace);
        let opcode;
        if (cmd === KW_CALL)
            opcode = OPCODE_CALL;
        else if (cmd === KW_SEND)
            opcode = OPCODE_CALL;
        else if (cmd === KW_DELEGATECALL)
            opcode = OPCODE_DELEGATECALL;
        else if (cmd === KW_STATICCALL)
            opcode = OPCODE_STATICCALL;
        else
            throw Error(`${parsingContext.lineNumber}: Unknown fn cmd ${cmd}`);
        let right = fn.substring(firstSpace).trim();
        // value, gas, etc
        if (right.startsWith('{')) {
            const lastBrace = right.indexOf('}');
            const callParams = parseMap(right.substring(0, lastBrace + 1));
            if (callParams.has("value"))
                value = callParams.get("value");
            //console.log(`callParams: ${callParams.size}`)
            right = right.substring(lastBrace + 1);
        }
        let address;
        let fnSelector;
        let fnArgs;
        if (cmd === KW_SEND) {
            address = this.parseQuantity(right.substring(0, right.length), parsingContext);
        }
        else {
            const firstPeriod = right.indexOf('.');
            address = this.parseQuantity(right.substring(0, firstPeriod), parsingContext);
            let args;
            right = right.substring(firstPeriod + 1);
            if (right.startsWith('0x')) {
                //eg address.0x12345678(arg1, arg2)
                fnSelector = right.substring(0, 10);
                // rm ()
                args = right.substring(11, right.length - 1);
            }
            else {
                const dp = right.indexOf(')(');
                if (dp >= 0) {
                    // function sig isnt aliased
                    const fnSig = right.substring(0, dp + 1);
                    fnSelector = ethers_1.FunctionFragment.from(fnSig).selector;
                    //rm ()
                    args = right.substring(dp + 2, right.length - 1);
                }
                else {
                    // it is aliased address eg fooAlias := foo(arg1, arg2)
                    const firstParen = right.indexOf('(');
                    const alias = right.substring(0, firstParen);
                    const fnSig = parsingContext.preprocessorSymbols.get(alias);
                    if (typeof fnSig === 'undefined')
                        throw Error(`${parsingContext.lineNumber}: Cant decipher fnSig ${alias}. must define string with full signature`);
                    if (fnSig.startsWith('0x'))
                        fnSelector = fnSig;
                    else
                        fnSelector = ethers_1.FunctionFragment.from(fnSig).selector;
                    //rm ()
                    args = right.substring(firstParen + 1, right.length - 1);
                }
            }
            // first dealias the proprocessor symbols so that can represent multibyte args eg "4,2,5"            
            const dealiasedArgs = args.split(',').map((aliased) => {
                aliased = aliased.trim();
                let dealiased = parsingContext.preprocessorSymbols.get(aliased);
                if (!dealiased)
                    return aliased;
                // translate "strings" and bytes > 32 to bytes/string EVM mem representation
                // so they can be used in fn calls
                if (dealiased.startsWith("\"") && dealiased.endsWith("\"")) {
                    // pp symbol is a string. translate to list of words: "length, word1, word2, ..."
                    dealiased = (0, utils_1.bytesMemoryObject)((0, ethers_1.hexlify)(buffer_1.Buffer.from(dealiased.substring(1, dealiased.length - 1), 'utf8')));
                }
                else if (dealiased.startsWith('0x') &&
                    dealiased.indexOf(',') == -1 &&
                    (0, ethers_1.dataLength)(dealiased) > 32) {
                    // pp symbol is literal hex bytes. translate to list of words                     
                    dealiased = (0, utils_1.bytesMemoryObject)(dealiased);
                }
                else {
                }
                // if it's a list of "," separated hex words, it works fine as is
                return dealiased;
            }).join(',');
            //console.log(`dealiased args ${dealiasedArgs}`)
            fnArgs = dealiasedArgs.trim().length === 0 ? [] : dealiasedArgs.split(',').map((arg) => { return toBytes32(this.parseQuantity(arg, parsingContext)); });
        }
        let callArgs = [memWriteInfo, toBytes32(address)];
        if (opcode === OPCODE_CALL)
            callArgs.push(toBytes32(this.parseQuantity(value, parsingContext)));
        if (fnSelector) {
            callArgs.push(toBytes32(fnSelector));
            if (fnArgs) {
                callArgs = callArgs.concat(fnArgs);
            }
        }
        return {
            opcode,
            args: callArgs
        };
    }
    isFunctionCall(s) {
        return s.startsWith(KW_CALL) || s.startsWith(KW_DELEGATECALL) || s.startsWith(KW_STATICCALL) || s.startsWith(KW_SEND);
    }
    checkNewSymbolName(sym, parsingContext) {
        if (!SYMBOL_REGEX.test(sym))
            throw Error(`${parsingContext.lineNumber}: bad symbol name ${sym}`);
        if (parsingContext.preprocessorSymbols.has(sym))
            throw Error(`${parsingContext.lineNumber}: symbol ${sym} already defined in preprocessor`);
        if (parsingContext.memAddressNames.has(sym))
            throw Error(`${parsingContext.lineNumber}: symbol name ${sym} already defined as memory address`);
        if (parsingContext.jumppointNames.has(sym))
            throw Error(`${parsingContext.lineNumber}: symbol name ${sym} already defined as jump point`);
        if (KWS.has(sym))
            throw Error(`${parsingContext.lineNumber}: ${sym} is reserved keyword`);
    }
    // pull op off the end of string
    getEndingOp(s) {
        if (s.length === 0)
            return undefined;
        if (s.length === 2 && TwoArgQuantityKWs.has(s))
            return s;
        const lc = s.charAt(s.length - 1);
        if (TwoArgQuantityKWs.has(lc))
            return lc;
        return undefined;
    }
    // returns Solidity call data
    parseBrevityScript(script) {
        const woComments = script.replace(COMMENT_REGEX, '\n');
        //console.log(`woComments ${woComments}`)
        const lines = woComments.split(/\n/);
        const parsingContext = new ParsingContext();
        let memSize = 0;
        let maxMemSize = 0;
        const instructions = [];
        // lineNumber starts at 1 to align w editors
        for (; parsingContext.lineNumber <= lines.length; parsingContext.lineNumber++) {
            const line = lines[parsingContext.lineNumber - 1].trim();
            //comment
            if (line.startsWith('//') || line === '')
                continue;
            const pp = line.split(':=');
            if (pp.length > 1) {
                //preprocessor directive
                const k = pp[0].trim();
                this.checkNewSymbolName(k, parsingContext);
                const symbol = pp[1].trim();
                const resolvedParts = symbol.split(',').map((part) => {
                    // check if part is a defined preprocessor symbol 
                    part = part.trim();
                    const partResolved = parsingContext.preprocessorSymbols.get(part);
                    return partResolved ?? part;
                }).join(',');
                //console.log(`key ${k} resolvedParts ${resolvedParts}`)
                parsingContext.preprocessorSymbols.set(k, resolvedParts);
                continue;
            }
            if (line.startsWith('#')) {
                //jump point #name
                const sym = line.substring(1);
                this.checkNewSymbolName(sym, parsingContext);
                parsingContext.jumppointNames.set(sym, instructions.length);
                continue;
            }
            if (line.startsWith(KW_CHECKED)) {
                parsingContext.uncheckedArithmatic = false;
                continue;
            }
            if (line.startsWith(KW_UNCHECKED)) {
                parsingContext.uncheckedArithmatic = true;
                continue;
            }
            if (line.startsWith(KW_DUMPMEM)) {
                instructions.push({
                    opcode: OPCODE_DUMPMEM,
                    args: []
                });
                continue;
            }
            if (line.startsWith(KW_CLEARMEMSTACK)) {
                parsingContext.memAddressNames.clear();
                memSize = 0;
                continue;
            }
            if (line.startsWith(KW_CLEARPARAMS)) {
                for (let k of parsingContext.preprocessorSymbols.keys()) {
                    if (k != k.toUpperCase())
                        parsingContext.preprocessorSymbols.delete(k);
                }
                //parsingContext.preprocessorSymbols = parsingContext.preprocessorSymbols
                continue;
            }
            if (line.startsWith(KW_IF)) {
                const lastBackParen = line.lastIndexOf(')');
                //rm ()
                const qWord = this.parseQuantity(line.substring(KW_IF.length + 1, lastBackParen), parsingContext);
                let right = line.substring(lastBackParen + 1).trim();
                if (right.startsWith(KW_REVERT)) {
                    instructions.push(this.encodeBranchIfNonzero(qWord, JUMPDEST_REVERT));
                    continue;
                }
                if (right.startsWith(KW_RETURN)) {
                    instructions.push(this.encodeBranchIfNonzero(qWord, JUMPDEST_RETURN));
                    continue;
                }
                if (!right.startsWith(KW_GOTO)) {
                    throw Error(`${parsingContext.lineNumber}: missing 'goto' after 'if' `);
                }
                right = right.substring(KW_GOTO.length + 1).trim();
                if (!SYMBOL_REGEX.test(right))
                    throw Error(`${parsingContext.lineNumber}: nonSymbol ${right}`);
                const instLazy = (endContext) => {
                    const pcIfNonzero = endContext.jumppointNames.get(right);
                    if (typeof pcIfNonzero === 'undefined')
                        throw Error(`${parsingContext.lineNumber}: unrecognized jumppoint name ${right}`);
                    return this.encodeBranchIfNonzero(qWord, pcIfNonzero);
                };
                instructions.push(instLazy);
                continue;
            }
            if (line.startsWith(KW_REVERT)) {
                instructions.push(this.encodeJump(JUMPDEST_REVERT));
                continue;
            }
            if (line.startsWith(KW_RETURN)) {
                instructions.push(this.encodeJump(JUMPDEST_RETURN));
                continue;
            }
            if (line.startsWith(KW_GOTO)) {
                const jumppoint = line.substring(KW_GOTO.length).trim();
                const instLazy = (endContext) => {
                    const dest = endContext.jumppointNames.get(jumppoint);
                    if (typeof dest === 'undefined')
                        throw Error(`${parsingContext.lineNumber}: unrecognized jumppoint name ${jumppoint}`);
                    return this.encodeJump(dest);
                };
                instructions.push(instLazy);
                continue;
            }
            if (this.isFunctionCall(line)) {
                instructions.push(this.parseFunctionCall(line, parsingContext));
                continue;
            }
            const assignment = line.split('=');
            if (assignment.length < 2)
                throw Error(`${parsingContext.lineNumber}: unknown line format:\n${line}`);
            //assignment
            let left = assignment[0].trim();
            let offset = -1;
            let length = undefined;
            // something like +=
            let unaryOp;
            if (left.startsWith(KW_VAR)) {
                //new vars
                const varsToDefine = left.substring(KW_VAR.length).trim().split(',');
                length = varsToDefine.length;
                offset = memSize;
                for (let i = 0; i < varsToDefine.length; i++) {
                    const v = varsToDefine[i].trim();
                    this.checkNewSymbolName(v, parsingContext);
                    parsingContext.memAddressNames.set(v, memSize++);
                    if (memSize > maxMemSize)
                        maxMemSize = memSize;
                }
            }
            else {
                // see if left ends with op as in x += 1
                unaryOp = this.getEndingOp(left);
                if (unaryOp)
                    left = left.substring(0, left.length - unaryOp.length);
                // should already be defined and in incremental order
                const vars = left.trim().split(',');
                length = vars.length;
                for (let i = 0; i < vars.length; i++) {
                    const v = vars[i].trim();
                    if (!parsingContext.memAddressNames.has(v))
                        throw Error(`${parsingContext.lineNumber}: mem address alias ${v} unknown `);
                    const regnum = parsingContext.memAddressNames.get(v);
                    if (typeof regnum === 'undefined')
                        throw Error('huh');
                    if (offset === -1) {
                        offset = regnum;
                    }
                    else if (regnum !== offset + i) {
                        throw Error(`${parsingContext.lineNumber}: mem address ${v} = ${regnum} expected to be in position ${offset + i}`);
                    }
                }
            }
            //shouldnt happen
            if (offset === -1)
                throw Error(`${parsingContext.lineNumber}: offset unknown`);
            if (offset + length > this.config.maxMem)
                throw Error(`${parsingContext.lineNumber}: maxMem ${this.config.maxMem} exceeded`);
            const right = assignment[1].trim();
            if (this.isFunctionCall(right)) {
                // right side of = is function call
                const storeDirective = (BigInt(offset) << BigInt(128)) + BigInt(length);
                instructions.push(this.parseFunctionCall(right, parsingContext, toBytes32(storeDirective)));
            }
            else {
                // right side of = is Quantity
                if (length !== 1)
                    throw Error(`${parsingContext.lineNumber}: can only assign Quantity to 1 word`);
                let quantityEncoded = this.parseQuantity(right, parsingContext);
                if (unaryOp) {
                    quantityEncoded = parsingContext.quantityIndex({
                        quantityType: TwoArgQuantityKWs.get(unaryOp),
                        args: [toBytes32(BigInt(offset) | BIT255_NOTLITERAL), toBytes32(quantityEncoded)]
                    });
                }
                instructions.push({
                    opcode: (OPCODE_MSTORE_R0 + offset),
                    args: [toBytes32(quantityEncoded)]
                });
            }
        }
        const resolved = instructions.map((inst) => {
            if (inst instanceof Function) {
                return inst(parsingContext);
            }
            return inst;
        });
        const additionalConfigFlags = parsingContext.preprocessorSymbols.get(PREPROC_ADDITIONAL_CONFIGFLAGS);
        // config is a u256 of : [configFlags u128 : requiredBrevityVersion u64 : maxMemSize u64]
        let configBigint = ((this.config.configFlags ?? BigInt(0)) | (additionalConfigFlags ? BigInt(additionalConfigFlags) : BigInt(0))) * (BigInt(2) ** BigInt(128));
        configBigint |= BigInt(this.config.requiredBrevityVersion ?? 0) * (BigInt(2) ** BigInt(64));
        configBigint |= BigInt(maxMemSize);
        const config = toBytes32(configBigint);
        return { config, instructions: resolved, quantities: parsingContext.quantites };
    }
}
exports.BrevityParser = BrevityParser;
