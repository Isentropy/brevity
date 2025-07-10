# Brevity, an EVM scripting language

Copyright 2024 Isentropy LLC. All Rights Reserved

Brevity is a language, similar in syntax to Solidity, that is compactly transpiled to an EVM transaction and run on a **general purpose smart contract, the Brevity Interpreter**. Because Brevity is interpreted, it doesn't need to deploy new smart contracts to implement new workflows.

#### Please Note

Brevity is **NOT YET AUDITED** and in development and alpha. Use at your own risk. We welcome code review and design comments. Note that the [LICENSE](LICENSE) limits commerical use. For commercial inquires, please email info@isentropy.com. 

THE SOFTWARE IS PROVIDED “AS IS”, WITHOUT WARRANTY OF ANY KIND, EXPRESS OR IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY, FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM, OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN THE SOFTWARE.



## A language-in-a-language!? Why?
 - **All-in-One General Purpose Contract** Users can deploy a privately controlled Brevity Interpreter  contract, which can run arbitrary workflows without deploying more code or moving tokens. Deployment using [Clone pattern](contracts/CloneFactory.sol) is supported, and costs less than 100000 gas.
 - **Guardrails**: Brevity supports a [hook to EVM CALLs](contracts/BrevityInterpreter.sol#L219C21-L219C32) that can be used to apply restrictons on which external methods are called. 
 - **Metering**: The [hook to EVM CALLs](contracts/BrevityInterpreter.sol#L219C21-L219C32) allows for metering of asset transfers. 
 - **MetaTransactions**: Brevity calls can be submitted as EIP712 metaTxs, enabling Brevity Interpreters to be controlled by wallets that hold no tokens. This functionality is built into [Brevity CLI](tslib/cli.ts)
 - **Gas Saving**: EVM contracts are expensive to deploy relative to calldata. Deploying EVM code costs around 200 gas/byte, whereas calldata costs 4-16 gas/byte. Brevity saves on deployment cost by putting code in the calldata and interpreting. For a simple arbitrage example in [Brevity](test/briefs/example.brv) and [Solidity](contracts/Arb.sol):
```
Brevity gas: total = 204504, calldata = 51443, execution = 153061
Solidity Test gas: total = 463028, deploy = 343682, calldata = 23528, execution = 95818
```
Generally Brevity saves gas on workflows that are not reused. 

## CLI Usage
```
Brevity CLI v1 args
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
build: transpile script into Breviety Interpreter instructions 
deploy: deploy OwnedBrevityInterpreter, TX paid by PRVKEY, owner = target if defined, otherwise address of PRVKEY
estimateGas: estimate gas only. no TX
run: run script using privateKey in PRVKEY envvar
runMeta: run script signed by PRVKEY, TX paid by METATXKEY
signMeta: sign metaTx with PRVKEY. returns "data" field of metaTx. no TX

envvars
_______________
the private keys are stored in envvars:
PRVKEY : the key that owns Brevity Interpreter (needed for all commands except "build")
METATXKEY : the key that pays for TX (need for command "runMeta")
```

## Script Syntax

See [example](test/briefs/uniswapAddLiquidity.brv)

### Philosophy
Brevity is deliberately bare bones.  You can CALL and STATICCALL, put variables on a memory stack, and do flow control. **Brevity has no operations to directly manipulate storage.** It can only manipulate storage via CALLs to exposed functions. Brevity has no code blocks. It does not allow direct manipulation of EVM stack registers.

### Only 1 data type: UINT256  
Like [B](https://en.wikipedia.org/wiki/B_(programming_language)), Brevity has 1 data type, the word (uint256). Arithmatic operations are all unsigned. The parser translates negative ints into their 2s compliment UINT form.

### Proprocessor Symbols
Proprocessor Symbols are like defined **string substitions**. You use them to define constants. They need not be Quantities but they often are. Instead of importing ABIs, you define the function signatures of the functions you want to call as preprocessor symbols.
```
usdc := 0xa0b86991c6218b36c1d19d4a2e9eb0ce3606eb48
// this will tell the Brevity Interpreter to evaluate "3 + 4" each time it sees
seven := 3 + 4
balanceOf := balanceOf(address)
```

### Only 1 stack: memStack
Brevity allocates a fixed size chunk of memory call the memStack. The size is calculated by the parser and sent as part of the TX data. . The following code assigns the symbol "x" to the next position on the memStack and stores the word 123, and then 456:

```
var x = 123
x = 456
```

### "Quantities" are formulas or literals that resolve to a UINT256
The Brevity Interpreter uses recursion like LISP to evaluate Quantities. Arithmatic operations on Quantities are Quantities too. Examples of Quantities are:
```123, 2*(3 + 4), msg.value / 2 , 0xa0b86991c6218b36c1d19d4a2e9eb0ce3606eb48, x + 1, seven + 2```

You can write Quantities on the memStack:

```
var y = msg.value / 2
```

### STATICCALL doesnt change state
STATICCALL calls a view function and writes the output to a contiguous block of memStack

```
var bal = STATICCALL usdc.balanceOf(this)
```

### CALL can change state
syntax is similar to STATICCALL, but CALL can change state. 

```
// assigns 4 new sequential positions on the memStack
var tokenId, liquidity, amount0, amount1 = CALL uniswapPositionManager.mint(usdc, weth, fee, tickLower, tickUpper, usdcBal, wethAmt, 0, 0, this, block.timestamp)

// if we haven't defined wrap := wrap() as preprocessor symbol, can specify full fn signature: 
CALL {"value":"123"} weth.wrap()()
```
### SEND sends native token only without data
```
SEND {"value":"123"} targetAddress
SEND {"value":"msg.value / 3 "} targetAddress
```

### Use jump points and goto for flow control

```
// infinite loop
#myJumpPoint
goto myJumpPoint
```

### Use if for conditional branching
```
if(x > 1) goto myJumpPoint
if(bal/2 > 123) return
if(msg.value == 0 ) revert
```

### Clear the memStack with clearMemStack
```
// error "x" defined!
var x = 1
var x = 2

// ok. clearMemStack wipes all memStack pointers (ie "y")
var y = 1
clearMemStack
var y = 2
```

### Dump the contents of memStack to Hardhat console for debugging with dumpMem
```
// dump memStack contents if running in Hardhat
dumpMem
```




## Under the Hood
Brevity Scripts (```.brv``` ) are transpiled into a Brevity Calldata Program that is passed to the [Interpreter](contracts/BrevityInterpreter.sol) as ```(uint config, Instruction[] calldata instructions, Quantity[] calldata quantities)```. 

- config: Specifies optional config flags and memStack size
- instructions: similar to a normal assembly instruction set, but very minimal. Some args are words that represent a ```Quantity```. Quantity evaluation does the arithmatic operations. 
- quantites: A Quantity is a formula that resolves to a uint256. It can be literal, mem pointer, or function(Quantity...) that returns a uint256 word. Function are expressed internally with the opcode as prefix, eg  ```123, (* 5 6), (+ mem[2] 5), this (ie address(this)), msg.sender```.


### Usage
See [OwnedBrevityInterpreter](contracts/OwnedBrevityInterpreter.sol) for an example of a Brevity Interpreter contract that can be used only by an owner.

