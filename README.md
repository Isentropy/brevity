# Brevity, an interpreted EVM scripting language for workflows

Copyright 2024 -2026 Isentropy LLC

Brevity is a language, similar in syntax to Solidity, that is compactly transpiled to an EVM transaction and **run with 1 click** on a general purpose smart contract, the Brevity Interpreter. Brevity scripts live in **calldata**, so it's the perfect instruction format to pass to callbacks like [UniswapV4's unlock()](https://docs.uniswap.org/contracts/v4/guides/unlock-callback) (eg for flash loans). Because Brevity is interpreted, it doesn't need to deploy new smart contracts to implement new workflows.

#### Please Note

Brevity is **NOT YET AUDITED** and in development and alpha. Use at your own risk. We welcome code review and design comments. Note that the [LICENSE](LICENSE) limits commerical use. For commercial inquires, please email info@isentropy.com. 

THE SOFTWARE IS PROVIDED “AS IS”, WITHOUT WARRANTY OF ANY KIND, EXPRESS OR IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY, FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM, OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN THE SOFTWARE.

## A language-in-a-language!? Why?


Imagine you want to run a multi-step DeFi workflow that does some DeFi actions (swap, liquid stake, flash loan, etc) according to a program, and reverts if some conditions aren't met. Let's compare writing this in a custom Solidity smart contract vs running a Brevity script on a Brevity Interpreter smart contract:


### Run ANY workflow
If your workflow was reused many times and never changed, a custom Solidity smart contract would be the easy solution. But what if the workflow needs code changes? This is trivial with Brevity, but tricky with a smart contract that is not general-purpose. You'd have to vet and deploy new smart contract code, and reconfigure a proxy if the smart contract held tokens.
 
### [Composable GUI](https://github.com/Isentropy/brevity-gui)
With Brevity, end users can run ANY DeFi workflow in 1 click in an easy [GUI](https://github.com/Isentropy/brevity-gui). Steps can be **composed graphically** without specific knowledge of Brevity language. The GUI doesnt change with the workflow and users can easily see what they're running. A custom Solidity smart contract requires a custom GUI. 

### Guardrails
Brevity supports a [hook to EVM CALLs](https://github.com/Isentropy/brevity/blob/7c30196bd119d7d91d99469c9ec88dc7dd5a219e/contracts/BrevityInterpreter.sol#L117) that can be used to apply restrictons on which external methods are called. So you  can **whitelist** particular DeFi operations. In Solidity you'd have to write your own hook to external calls and vet the code to ensure it's always used.

### Flash Loan Integration
Super easy in Brevity, difficult to write your own. [UniswapV4FlashBrevityInterpreter](contracts/uniswap4/Uniswap4FlashBrevityInterpreter.sol) allows you pass in a Brevity script to be run as callback to IPoolManager.unlock(). See [Uniswapv4FlashLoan.brv](test/briefs/Uniswapv4FlashLoan.brv) for an example Brevity script that takes out a flash loan:

```
// take out flash loan
CALL poolManager.take(flashLoanToken, this, flashLoanAmount)

// do stuff
var bal = STATICCALL flashLoanToken.balanceOf(this)

// repay flash loan
CALL poolManager.sync(flashLoanToken)
CALL flashLoanToken.transfer(poolManager, flashLoanAmount)
var paid0 = CALL poolManager.settle()()
```


### MetaTransactions
Brevity calls can be submitted as EIP712 metaTxs, enabling Brevity Interpreters to be controlled by wallets that hold no tokens. This functionality is built into [Brevity CLI](tslib/cli.ts). A custom smart contract requires tricky code changes if the Workflow instruction changes. Brevity can even send metaTransactions **across bridges**.

 ### Metering
 The [hook to EVM CALLs](https://github.com/Isentropy/brevity/blob/7c30196bd119d7d91d99469c9ec88dc7dd5a219e/contracts/BrevityInterpreter.sol#L117) allows for metering of asset transfers in and out of a BrevityInterpreter. This is also difficult to enforce in Solidity without a hook.

### Gas
Deployment of an OwnedBrevityInterperter using [Clone pattern](contracts/CloneFactory.sol) is supported, and costs less than 100000 gas.

If the workflow is not reused often, you'll save gas with Brevity. This is because EVM code is expensive to deploy relative to calldata. Deploying EVM code costs around 200 gas/byte, whereas calldata costs 4-16 gas/byte. Brevity saves on deployment cost by putting code in the calldata and interpreting. For a simple arbitrage example in [Brevity](test/briefs/example.brv) and [Solidity](contracts/Arb.sol):
```
Brevity gas: total = 204504, calldata = 51443, execution = 153061
Solidity Test gas: total = 463028, deploy = 343682, calldata = 23528, execution = 95818
```
If the workflow is reused often, you may save gas with a custom smart contract. Also consider that the Brevity interperter holds tokens itself. A custom smart contract that sends the tokens back to msg.sender each run incurs gas fees. A custom smart contract that holds tokens has security risks by upgrades.
 

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

### Preprocessor Symbols
Preprocessor Symbols are like defined **string substitions**. You use them to define constants. They need not be Quantities but they often are. Instead of importing ABIs, you define the function signatures of the functions you want to call as preprocessor symbols.
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
Internally, quantities are encoded as a word (called qWord in code) that can represent:
 - a literal (if bit 255 NOTLITERAL is unset)
 - a memStack pointer (if bit 255 NOTLITERAL is set, bit 254 NOTMEM is unset)
 - otherwise a pointer to Quantities array. Quantities are just an operand + args:

 ```
 struct Quantity {
    uint quantityType;
    // qWords
    bytes32[] args;
}
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
CALL {value: 123} weth.wrap()()
```
### SEND sends native token only without data
```
SEND {value: 123} targetAddress
SEND {value: msg.value / 3 } targetAddress
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

### 0 and 1 arg builtin Quantities:
```
// address(this)
this
//native balance
balance(someAddress)
block.timestamp
```

### Variable length types
Brevity v1 has basic support for multi-word types like ```string``` and ```bytes``` with preprocessor symbols. These Solidity types are stored in EVM memory and calldata as a list of 32 bytes words: ```length, bytes0_31, bytes32_64, etc```. Brevity v1 translates preprocessor symbols of strings (eg ```"hello"```) and 32+ length bytes  (eg 0x{32+ bytes hex}) into a list of length + data words when used in function calls. The Solidity ABI specifies that these these multi-word types are presented in function calls as an **offset** to the object. So this is how to invoke functions of ```string``` and ```bytes``` in Brevity v1:
```
foo := foo(string)
s := "hello"
CALL target.foo(32, s)
// same as CALL target.foo(32, 5, 0x68656C6C6F)
```
The 32 above means the first arg is an offset and the data comes after 1st arg (1*32). This becomes messy with multiple offsets. We hope to offer easier multi-word support in v2.


## Under the Hood
Brevity Scripts (```.brv``` ) are transpiled into a Brevity Calldata Program that is passed to the [Interpreter](contracts/BrevityInterpreter.sol) as ```(uint config, Instruction[] calldata instructions, Quantity[] calldata quantities)```.

- config: Specifies optional config flags and memStack size
- instructions: Brevity has a [minimal instructon set](https://github.com/Isentropy/brevity/blob/5770fdd99f716b74944f6565b92a97deaed6b4a0/contracts/Constants.sol#L9). The instruction operands are words that represent ```Quantities```. Quantity evaluation does the arithmatic operations. 
- quantites: A Quantity is a formula that resolves to a uint256. It can be literal, mem pointer, or function(Quantity...) that returns a uint256 word. They are expressed internally with the opcode as prefix, eg  ```123, (* 5 6), (+ mem[2] 5), this (ie address(this)), msg.sender```. Quantities are LISP-like and evaulated recursively. 

### Usage
See [OwnedBrevityInterpreter](contracts/OwnedBrevityInterpreter.sol) for an example of a Brevity Interpreter contract that can be used only by an owner.

