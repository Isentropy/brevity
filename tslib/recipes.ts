import { BigNumberish, FunctionFragment } from 'ethers'
import { BrevityParser } from './brevityParser'

const SELECTOR_IERC20_approve = FunctionFragment.from('approve(address,uint256)').selector
const SELECTOR_IERC20_transfer = FunctionFragment.from('transfer(address,uint256)').selector
export const SELECTOR_IERC20_balanceOf = FunctionFragment.from('balanceOf(address)').selector
export const SELECTOR_IERC721_ownerOf = FunctionFragment.from('ownerOf(uint256)').selector


function genRandomHex(size: number) { 
    return [...Array(size)].map(() => Math.floor(Math.random() * 16).toString(16)).join('')
}
// recipes that take brevityScript as 1st input arg modify the script
// recipes that dont brevityScript as 1st input are snippets that can be inserted

export function erc20Approve(erc20: string, spender : string, amount : BigNumberish) : string {
    return `CALL ${erc20}.${SELECTOR_IERC20_approve}(${spender}, ${amount})`
}

export function erc20transfer(erc20: string, to : string, amount : BigNumberish) : string {
    return `CALL ${erc20}.${SELECTOR_IERC20_transfer}(${to}, ${amount})`
}


export function requireERC20Increase(brevityScript: string, erc20Address: string, requiredIncrease: bigint, tmpVarName: string | null = null): string {
    const preBalVar = `bal_${erc20Address}_pre_${genRandomHex(6)}`
    const postBalVar = tmpVarName ? tmpVarName : `bal_${erc20Address}_post_${genRandomHex(6)}`
    const pre = `var ${preBalVar} = STATICCALL ${erc20Address}.balanceOf(address)(this)\n`
    let post = `${tmpVarName ? '' : 'var'}  ${postBalVar} = STATICCALL ${erc20Address}.balanceOf(address)(this)\n`
    post += `if(${postBalVar} < ${preBalVar} + ${requiredIncrease}) revert\n`
    return pre + brevityScript + post
}

export function defineFunctionFragment(brevityScript: string, frag : FunctionFragment) {
    const pre = `${frag.name} := ${frag.selector}\n`
    return pre + brevityScript
}

export function transferAllErc20(erc20: string, to: string) {
    const bal = `bal_${genRandomHex(6)}`
    const noTransfer = `noTransfer_${genRandomHex(6)}`
    let brevityScript = `var ${bal} = STATICCALL ${erc20}.balanceOf(address)(this)\n`
    brevityScript += `if(${bal} == 0) goto ${noTransfer}\n`
    brevityScript += `CALL ${erc20}.transfer(address,uint256)(${to}, ${bal}) \n`
    brevityScript += `#${noTransfer}\n`
    return brevityScript
}

export function transferAllEth(to: string) {
    const noTransfer = `noTransfer_${genRandomHex(6)}`
    let brevityScript = `if(balance(this) == 0) goto ${noTransfer}\n`
    brevityScript += `SEND {"value":"balance(this)"} ${to}\n`
    brevityScript += `#${noTransfer}\n`
    return brevityScript
}


export function requireEthIncrease(brevityScript: string, requiredIncrease: bigint, tmpVarName: string | null = null): string {
    const preBalVar = `bal_eth_pre_${genRandomHex(6)}`
    const postBalVar = tmpVarName ? tmpVarName : `bal_eth_post_${genRandomHex(6)}`
    const pre = `var ${preBalVar} = balance(this)\n`
    let post = `${tmpVarName ? '' : 'var'} ${postBalVar} = balance(this)\n`
    post += `if(${postBalVar} < ${preBalVar} + ${requiredIncrease}) revert\n`
    return pre + brevityScript + post
}


function test() {
    let brevityScript = transferAllErc20("0x1234", "0x3456")
    brevityScript += transferAllEth("0x3456")
    const parser : BrevityParser = new BrevityParser({maxMem: 100})
    const program = parser.parseBrevityScript(brevityScript)
              
    console.log(`${JSON.stringify(program, null, 2)}\n${brevityScript}\n`)

}

test()
/*
export function declareTmpVar(tmpVarName: string, initialValue: string = "0"): string {
    return `var ${tmpVarName} = ${initialValue}\n`
}
*/