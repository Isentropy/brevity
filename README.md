# Brevity, an EVM scripting language

Copyright 2024 Isentropy LLC. All Rights Reserved

NOT LICENSED



Brevity is a language, similar in syntax to Solidity, that is transpiled to an EVM transaction and run on a smart contract interpreter. Because Brevity is interpreted, it doesn't need to deploy new smart contracts to implement new workflows. This can result in substantial **gas savings** vs writing and deploying new EVM contracts. Deploying EVM code costs around 200 gas/byte, whereas calldata costs 4-16 gas/byte. Brevity calls can also be submitted as EIP712 metaTxs.

Brevity is in development and alpha. We welcome code review and design comments.

## But Why??
EVM contracts are expensive to deploy. Brevity saves on deployment cost by putting code in the calldata and interpreting. **Brevity costs less to deploy, but more to run.** It's especially useful for simple workflows. For a simple arbitrage example in [Brevity](test/briefs/example.brv) and [Solidity](contracts/Arb.sol):
```
Brevity gas: total = 240638, calldata = 46156, execution = 194482
Solidity Test gas: total = 612735, deploy = 483672, execution = 129063
```

## Under the Hood
Brevity Scripts (```.brv``` ) are transpiled into a Brevity Calldata Program that is passed to the [Interpreter](contracts/LibInterpreter.sol) as ```(uint8 memSize, Instruction[] memory instructions, Quantity[] memory quantities)```. 

- memSize: Brevity abstracts the EVM stack and instead gives the coder access to a fixed size memory chunk of ```bytes32[memSize]``` called ```mem```
- instructions: similar to a normal assembly instruction set. Some args are words that represent a ```Quantity```
- quantites: LISP-like repsentations of byte32 words that can be computed. eg  ```123, (* 5 6), (+ mem[2] 5), address(this), msg.sender```. Literals, memory words, EVM readonly internal calls. 

The [Interpreter](contracts/LibInterpreter.sol) has a [minimal instruction set](contracts/LibInterpreter.sol#L13). Quantities do most of the syscalls for 0, 1, and 2 arg functions. 



## Version 0.1 syntax

```
// := means preprocessor directive
// these are substituted in place and dont create instructions or quantities
amountA := 1000000000000000000
minProfitA := 100000000000000000
approve := approve(address,uint256)
balanceOf := balanceOf(address)
swap := swap(address,uint256,address)

// assign a new word in memory called balABefore
var balABefore = STATICCALL tokenA.balanceOf(this)
CALL tokenA.approve(exchange1, amountA)
var balBBefore = STATICCALL tokenB.balanceOf(this)
CALL exchange1.swap(tokenA, amountA, tokenB)
var receiveB = STATICCALL tokenB.balanceOf(this)
// reverts on overflow
receiveB -= balBBefore
CALL tokenB.approve(exchange2, receiveB)
CALL exchange2.swap(tokenB, receiveB, tokenA)
var balAAfter = STATICCALL tokenA.balanceOf(this)
if(balAAfter < minProfitA + balABefore) revert
```

## Legal

THE SOFTWARE IS PROVIDED “AS IS”, WITHOUT WARRANTY OF ANY KIND, EXPRESS OR IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY, FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM, OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN THE SOFTWARE.