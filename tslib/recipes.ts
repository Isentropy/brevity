import { parseEther } from 'ethers'

// recipes that take brevityScript as 1st input arg modify the script
// recipes that dont brevityScript as 1st input are snippets that can be inserted
const ADDRESS_WETH = '0x1111111111111111111111111111111111111111111111111111111111111111'
export function requireERC20Increase(brevityScript: string, erc20Address: string, requiredIncrease: bigint, tmpVarName: string | null = null): string {
    const preBalVar = `bal_${erc20Address}_pre`
    const postBalVar = tmpVarName ? tmpVarName : `bal_${erc20Address}_post`
    const pre = `var ${preBalVar} = STATICCALL ${erc20Address}.balanceOf(address)(this)\n`
    let post = `${tmpVarName ? '' : 'var'}  ${postBalVar} = STATICCALL ${erc20Address}.balanceOf(address)(this)\n`
    post += `if(${postBalVar} < ${preBalVar} + ${requiredIncrease}) revert\n`
    return pre + brevityScript + post
}

export function requireEthIncrease(brevityScript: string, requiredIncrease: bigint, tmpVarName: string | null = null): string {
    const preBalVar = `bal_eth_pre`
    const postBalVar = tmpVarName ? tmpVarName : `bal_eth_post`
    const pre = `var ${preBalVar} = balance(this)\n`
    let post = `${tmpVarName ? '' : 'var'} ${postBalVar} = balance(this)\n`
    post += `if(${postBalVar} < ${preBalVar} + ${requiredIncrease}) revert\n`
    return pre + brevityScript + post
}

export function declareTmpVar(tmpVarName: string, initialValue: string = "0"): string {
    return `var ${tmpVarName} = ${initialValue}\n`
}

export function uniswap(): string {
    const s = ''
    return s
}

export function test(): string {
    const tmpVarName = 'tmp'
    let script = declareTmpVar(tmpVarName)
    script += uniswap()
    script = requireEthIncrease(script, parseEther("1"))
    script = requireERC20Increase(script, ADDRESS_WETH, parseEther("1"))
    
    return script

}