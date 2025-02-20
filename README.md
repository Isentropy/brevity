# Brevity, an EVM scripting language

Copyright 2024 Isentropy LLC. All Rights Reserved

NOT LICENSED

Brevity is a language, similar in syntax to Solidity, that is transpiled to an EVM transaction and run on a smart contract interpreter. Because Brevity is interpreted, it doesn't need to deploy new smart contracts to implement new workflows.  

Brevity is in development and alpha. We welcome code review and design comments.

## But Why?
 - **All-in-One General Purpose Contract** Users can deploy their own Brevity Interpreter contract that is Owned by them. The contract can run arbitrary workflows without needing to deploy more code. Deployment using [Clone pattern](https://github.com/Isentropy/brevity/blob/777be66f6ead630e099292367bb40fb3665029d0/contracts/CloneFactory.sol#L15) is supported, and costs less than 100000 gas.
 - **Guardrails**: Brevity supports a [hook to EVM CALLs](https://github.com/Isentropy/brevity/blob/0b533d446eb8a56cbf7a6e2773f6e78df921b703/contracts/BrevityInterpreter.sol#L219C21-L219C32) that can be used to apply restrictons on which external methods are called. 
 - **Metering**: Transactions can be metered by adding custom hooks.
 - **MetaTransactions**: Brevity calls can be submitted as EIP712 metaTxs, enabling Brevity Interpreters to be controlled by wallets that hold no tokens.
 - **Gas Saving**: EVM contracts are expensive to deploy relative to calldata. Deploying EVM code costs around 200 gas/byte, whereas calldata costs 4-16 gas/byte. Brevity saves on deployment cost by putting code in the calldata and interpreting. For a simple arbitrage example in [Brevity](test/briefs/example.brv) and [Solidity](contracts/Arb.sol):
```
Brevity gas: total = 204504, calldata = 51443, execution = 153061
Solidity Test gas: total = 463028, deploy = 343682, calldata = 23528, execution = 95818
```
Generally Brevity saves gas on workflows that are not reused. 

## Under the Hood
Brevity Scripts (```.brv``` ) are transpiled into a Brevity Calldata Program that is passed to the [Interpreter](contracts/LibInterpreter.sol) as ```(uint config, Instruction[] calldata instructions, Quantity[] calldata quantities)```. 

- config: Specifies optional config flags and mem size. Brevity abstracts the EVM stack and instead gives the coder access to a fixed size memory chunk of ```uint256[memSize]``` called ```mem```
- instructions: similar to a normal assembly instruction set. Some args are words that represent a ```Quantity```
- quantites: A quantity is a formula that resolves to a uint256. It can be literal, mem pointer, or function(Quantity...) that returns a uint256 word. Function are expressed internally with the opcode as prefix, eg  ```123, (* 5 6), (+ mem[2] 5), this (ie address(this)), msg.sender```.

The [Interpreter](contracts/LibInterpreter.sol) has a [minimal instruction set](contracts/LibInterpreter.sol#L13). Quantities do most of the syscalls for 0, 1, and 2 arg functions. 

### Everything is a word
Like [B](https://en.wikipedia.org/wiki/B_(programming_language)), Brevity has no data types, just words (uint256). Arithmatic operations are all unsigned. You can use 2's compliment representations of signed ints, but arithmatic doesnt yet support signed.

### Philosophy
Brevity is meant to save gas on simple workflows. It's deliberately bare bones.  You can CALL and STATICCALL, manipulate memory, and do flow control. **Brevity has no operations to directly manipulate storage.** It can only manipulate storage via CALLs to exposed functions. 

### Usage
See [OwnedBrevityInterpreter](contracts/OwnedBrevityInterpreter.sol) for an example of a Brevity Interpreter contract that can be used only by an owner.

## Version 0.1 syntax
Brevity has no code blocks. Each line exists on it's own. You can:
 - define preprocessor symbols: ``foo := foo(uint256)``
 - ``CALL, STATICCALL (ie view) target.foo(123)`` using Quantity params. Instead of importing ABIs, you define function selectors in preprocessor symbols.
 - set memory words with arithmatic: ``var x = block.timestamp + 5``, ``x += 1``
 - set jump points: ``#myJumpPoint``
 - do basic flow control: ``[if(...)]? [revert|goto myJumpPoint|return]``
 - do some basic debugging: ``dumpMem``

The basic functions are show below:
```
// := means preprocessor directive
// these are substituted in place and dont create instructions or quantities
usdc := 0xa0b86991c6218b36c1d19d4a2e9eb0ce3606eb48
exchange1 := 0x1111111111111111111111111111111111111111
userA := 0x1111111111111111111111111111111111111112
amountUsdc := 1000000
balanceOf := balanceOf(address)
swap := swap(address,uint256,address)

// static call balanceOf() and write to mem[0] (aka "balUsdc") 
// if the output is multiple words, delclare more mem slots eg var a, b = STATICCALL foo.bar()
var balUsdc = STATICCALL usdc.balanceOf(this)
if(balUsdc < 100) revert

// same syntax for DELEGATECALL and STATIC CALL
CALL usdc.approve(exchange1, balUsdc)
// SEND keyword sends native token only without calldata
SEND {"value": "msg.value/10"} userA

// simple loop
var i = 0
#lstart
if(i > 9) goto lend
i += 1
goto lstart
#lend
```
See [test examples](test/briefs/).


## Legal

THE SOFTWARE IS PROVIDED “AS IS”, WITHOUT WARRANTY OF ANY KIND, EXPRESS OR IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY, FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM, OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN THE SOFTWARE.
