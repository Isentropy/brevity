"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.SELECTOR_IERC721_ownerOf = exports.SELECTOR_IERC20_balanceOf = void 0;
exports.erc20Approve = erc20Approve;
exports.erc20transfer = erc20transfer;
exports.requireERC20Increase = requireERC20Increase;
exports.defineFunctionFragment = defineFunctionFragment;
exports.transferAllErc20 = transferAllErc20;
exports.transferAllEth = transferAllEth;
exports.requireEthIncrease = requireEthIncrease;
const ethers_1 = require("ethers");
const brevityParser_1 = require("./brevityParser");
const SELECTOR_IERC20_approve = ethers_1.FunctionFragment.from('approve(address,uint256)').selector;
const SELECTOR_IERC20_transfer = ethers_1.FunctionFragment.from('transfer(address,uint256)').selector;
exports.SELECTOR_IERC20_balanceOf = ethers_1.FunctionFragment.from('balanceOf(address)').selector;
exports.SELECTOR_IERC721_ownerOf = ethers_1.FunctionFragment.from('ownerOf(uint256)').selector;
function genRandomHex(size) {
    return [...Array(size)].map(() => Math.floor(Math.random() * 16).toString(16)).join('');
}
// recipes that take brevityScript as 1st input arg modify the script
// recipes that dont brevityScript as 1st input are snippets that can be inserted
function erc20Approve(erc20, spender, amount) {
    return `CALL ${erc20}.${SELECTOR_IERC20_approve}(${spender}, ${amount})`;
}
function erc20transfer(erc20, to, amount) {
    return `CALL ${erc20}.${SELECTOR_IERC20_transfer}(${to}, ${amount})`;
}
function requireERC20Increase(brevityScript, erc20Address, requiredIncrease, tmpVarName = null) {
    const preBalVar = `bal_${erc20Address}_pre_${genRandomHex(6)}`;
    const postBalVar = tmpVarName ? tmpVarName : `bal_${erc20Address}_post_${genRandomHex(6)}`;
    const pre = `var ${preBalVar} = STATICCALL ${erc20Address}.balanceOf(address)(this)\n`;
    let post = `${tmpVarName ? '' : 'var'}  ${postBalVar} = STATICCALL ${erc20Address}.balanceOf(address)(this)\n`;
    post += `if(${postBalVar} < ${preBalVar} + ${requiredIncrease}) revert\n`;
    return pre + brevityScript + post;
}
function defineFunctionFragment(brevityScript, frag) {
    const pre = `${frag.name} := ${frag.selector}\n`;
    return pre + brevityScript;
}
function transferAllErc20(erc20, to) {
    const bal = `bal_${genRandomHex(6)}`;
    const noTransfer = `noTransfer_${genRandomHex(6)}`;
    let brevityScript = `var ${bal} = STATICCALL ${erc20}.balanceOf(address)(this)\n`;
    brevityScript += `if(${bal} == 0) goto ${noTransfer}\n`;
    brevityScript += `CALL ${erc20}.transfer(address,uint256)(${to}, ${bal}) \n`;
    brevityScript += `#${noTransfer}\n`;
    return brevityScript;
}
function transferAllEth(to) {
    const noTransfer = `noTransfer_${genRandomHex(6)}`;
    let brevityScript = `if(balance(this) == 0) goto ${noTransfer}\n`;
    brevityScript += `SEND {"value":"balance(this)"} ${to}\n`;
    brevityScript += `#${noTransfer}\n`;
    return brevityScript;
}
function requireEthIncrease(brevityScript, requiredIncrease, tmpVarName = null) {
    const preBalVar = `bal_eth_pre_${genRandomHex(6)}`;
    const postBalVar = tmpVarName ? tmpVarName : `bal_eth_post_${genRandomHex(6)}`;
    const pre = `var ${preBalVar} = balance(this)\n`;
    let post = `${tmpVarName ? '' : 'var'} ${postBalVar} = balance(this)\n`;
    post += `if(${postBalVar} < ${preBalVar} + ${requiredIncrease}) revert\n`;
    return pre + brevityScript + post;
}
function test() {
    let brevityScript = transferAllErc20("0x1234", "0x3456");
    brevityScript += transferAllEth("0x3456");
    const parser = new brevityParser_1.BrevityParser({ maxMem: 100 });
    const program = parser.parseBrevityScript(brevityScript);
    console.log(`${JSON.stringify(program, null, 2)}\n${brevityScript}\n`);
}
test();
/*
export function declareTmpVar(tmpVarName: string, initialValue: string = "0"): string {
    return `var ${tmpVarName} = ${initialValue}\n`
}
*/ 
