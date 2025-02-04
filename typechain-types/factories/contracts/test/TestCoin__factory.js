"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.TestCoin__factory = void 0;
/* Autogenerated file. Do not edit manually. */
/* tslint:disable */
/* eslint-disable */
const ethers_1 = require("ethers");
const _abi = [
    {
        inputs: [
            {
                internalType: "string",
                name: "name",
                type: "string",
            },
            {
                internalType: "string",
                name: "symbol",
                type: "string",
            },
            {
                internalType: "uint256",
                name: "amount",
                type: "uint256",
            },
        ],
        stateMutability: "nonpayable",
        type: "constructor",
    },
    {
        inputs: [
            {
                internalType: "address",
                name: "spender",
                type: "address",
            },
            {
                internalType: "uint256",
                name: "allowance",
                type: "uint256",
            },
            {
                internalType: "uint256",
                name: "needed",
                type: "uint256",
            },
        ],
        name: "ERC20InsufficientAllowance",
        type: "error",
    },
    {
        inputs: [
            {
                internalType: "address",
                name: "sender",
                type: "address",
            },
            {
                internalType: "uint256",
                name: "balance",
                type: "uint256",
            },
            {
                internalType: "uint256",
                name: "needed",
                type: "uint256",
            },
        ],
        name: "ERC20InsufficientBalance",
        type: "error",
    },
    {
        inputs: [
            {
                internalType: "address",
                name: "approver",
                type: "address",
            },
        ],
        name: "ERC20InvalidApprover",
        type: "error",
    },
    {
        inputs: [
            {
                internalType: "address",
                name: "receiver",
                type: "address",
            },
        ],
        name: "ERC20InvalidReceiver",
        type: "error",
    },
    {
        inputs: [
            {
                internalType: "address",
                name: "sender",
                type: "address",
            },
        ],
        name: "ERC20InvalidSender",
        type: "error",
    },
    {
        inputs: [
            {
                internalType: "address",
                name: "spender",
                type: "address",
            },
        ],
        name: "ERC20InvalidSpender",
        type: "error",
    },
    {
        inputs: [
            {
                internalType: "address",
                name: "owner",
                type: "address",
            },
        ],
        name: "OwnableInvalidOwner",
        type: "error",
    },
    {
        inputs: [
            {
                internalType: "address",
                name: "account",
                type: "address",
            },
        ],
        name: "OwnableUnauthorizedAccount",
        type: "error",
    },
    {
        anonymous: false,
        inputs: [
            {
                indexed: true,
                internalType: "address",
                name: "owner",
                type: "address",
            },
            {
                indexed: true,
                internalType: "address",
                name: "spender",
                type: "address",
            },
            {
                indexed: false,
                internalType: "uint256",
                name: "value",
                type: "uint256",
            },
        ],
        name: "Approval",
        type: "event",
    },
    {
        anonymous: false,
        inputs: [
            {
                indexed: true,
                internalType: "address",
                name: "previousOwner",
                type: "address",
            },
            {
                indexed: true,
                internalType: "address",
                name: "newOwner",
                type: "address",
            },
        ],
        name: "OwnershipTransferred",
        type: "event",
    },
    {
        anonymous: false,
        inputs: [
            {
                indexed: true,
                internalType: "address",
                name: "from",
                type: "address",
            },
            {
                indexed: true,
                internalType: "address",
                name: "to",
                type: "address",
            },
            {
                indexed: false,
                internalType: "uint256",
                name: "value",
                type: "uint256",
            },
        ],
        name: "Transfer",
        type: "event",
    },
    {
        inputs: [
            {
                internalType: "address",
                name: "owner",
                type: "address",
            },
            {
                internalType: "address",
                name: "spender",
                type: "address",
            },
        ],
        name: "allowance",
        outputs: [
            {
                internalType: "uint256",
                name: "",
                type: "uint256",
            },
        ],
        stateMutability: "view",
        type: "function",
    },
    {
        inputs: [
            {
                internalType: "address",
                name: "spender",
                type: "address",
            },
            {
                internalType: "uint256",
                name: "value",
                type: "uint256",
            },
        ],
        name: "approve",
        outputs: [
            {
                internalType: "bool",
                name: "",
                type: "bool",
            },
        ],
        stateMutability: "nonpayable",
        type: "function",
    },
    {
        inputs: [
            {
                internalType: "address",
                name: "account",
                type: "address",
            },
        ],
        name: "balanceOf",
        outputs: [
            {
                internalType: "uint256",
                name: "",
                type: "uint256",
            },
        ],
        stateMutability: "view",
        type: "function",
    },
    {
        inputs: [
            {
                internalType: "uint256",
                name: "value",
                type: "uint256",
            },
        ],
        name: "burn",
        outputs: [],
        stateMutability: "nonpayable",
        type: "function",
    },
    {
        inputs: [
            {
                internalType: "address",
                name: "account",
                type: "address",
            },
            {
                internalType: "uint256",
                name: "value",
                type: "uint256",
            },
        ],
        name: "burnFrom",
        outputs: [],
        stateMutability: "nonpayable",
        type: "function",
    },
    {
        inputs: [],
        name: "decimals",
        outputs: [
            {
                internalType: "uint8",
                name: "",
                type: "uint8",
            },
        ],
        stateMutability: "view",
        type: "function",
    },
    {
        inputs: [
            {
                internalType: "uint256",
                name: "amount",
                type: "uint256",
            },
        ],
        name: "mint",
        outputs: [],
        stateMutability: "nonpayable",
        type: "function",
    },
    {
        inputs: [],
        name: "name",
        outputs: [
            {
                internalType: "string",
                name: "",
                type: "string",
            },
        ],
        stateMutability: "view",
        type: "function",
    },
    {
        inputs: [],
        name: "owner",
        outputs: [
            {
                internalType: "address",
                name: "",
                type: "address",
            },
        ],
        stateMutability: "view",
        type: "function",
    },
    {
        inputs: [],
        name: "renounceOwnership",
        outputs: [],
        stateMutability: "nonpayable",
        type: "function",
    },
    {
        inputs: [],
        name: "symbol",
        outputs: [
            {
                internalType: "string",
                name: "",
                type: "string",
            },
        ],
        stateMutability: "view",
        type: "function",
    },
    {
        inputs: [],
        name: "totalSupply",
        outputs: [
            {
                internalType: "uint256",
                name: "",
                type: "uint256",
            },
        ],
        stateMutability: "view",
        type: "function",
    },
    {
        inputs: [
            {
                internalType: "address",
                name: "to",
                type: "address",
            },
            {
                internalType: "uint256",
                name: "value",
                type: "uint256",
            },
        ],
        name: "transfer",
        outputs: [
            {
                internalType: "bool",
                name: "",
                type: "bool",
            },
        ],
        stateMutability: "nonpayable",
        type: "function",
    },
    {
        inputs: [
            {
                internalType: "address",
                name: "from",
                type: "address",
            },
            {
                internalType: "address",
                name: "to",
                type: "address",
            },
            {
                internalType: "uint256",
                name: "value",
                type: "uint256",
            },
        ],
        name: "transferFrom",
        outputs: [
            {
                internalType: "bool",
                name: "",
                type: "bool",
            },
        ],
        stateMutability: "nonpayable",
        type: "function",
    },
    {
        inputs: [
            {
                internalType: "address",
                name: "newOwner",
                type: "address",
            },
        ],
        name: "transferOwnership",
        outputs: [],
        stateMutability: "nonpayable",
        type: "function",
    },
];
const _bytecode = "0x608060405234801561001057600080fd5b50604051610eb9380380610eb983398101604081905261002f9161034b565b338383600361003e8382610446565b50600461004b8282610446565b5050506001600160a01b03811661007d57604051631e4fbdf760e01b8152600060048201526024015b60405180910390fd5b61008681610098565b50610090816100ea565b50505061052b565b600580546001600160a01b038381166001600160a01b0319831681179093556040519116919082907f8be0079c531659141344cd1fd0a4f28419497f9722a3daafe3b4186f6b6457e090600090a35050565b6100f26100ff565b6100fc338261012e565b50565b6005546001600160a01b0316331461012c5760405163118cdaa760e01b8152336004820152602401610074565b565b6001600160a01b0382166101585760405163ec442f0560e01b815260006004820152602401610074565b61016460008383610168565b5050565b6001600160a01b0383166101935780600260008282546101889190610504565b909155506102059050565b6001600160a01b038316600090815260208190526040902054818110156101e65760405163391434e360e21b81526001600160a01b03851660048201526024810182905260448101839052606401610074565b6001600160a01b03841660009081526020819052604090209082900390555b6001600160a01b03821661022157600280548290039055610240565b6001600160a01b03821660009081526020819052604090208054820190555b816001600160a01b0316836001600160a01b03167fddf252ad1be2c89b69c2b068fc378daa952ba7f163c4a11628f55a4df523b3ef8360405161028591815260200190565b60405180910390a3505050565b634e487b7160e01b600052604160045260246000fd5b600082601f8301126102b957600080fd5b81516001600160401b038111156102d2576102d2610292565b604051601f8201601f19908116603f011681016001600160401b038111828210171561030057610300610292565b60405281815283820160200185101561031857600080fd5b60005b828110156103375760208186018101518383018201520161031b565b506000918101602001919091529392505050565b60008060006060848603121561036057600080fd5b83516001600160401b0381111561037657600080fd5b610382868287016102a8565b602086015190945090506001600160401b038111156103a057600080fd5b6103ac868287016102a8565b925050604084015190509250925092565b600181811c908216806103d157607f821691505b6020821081036103f157634e487b7160e01b600052602260045260246000fd5b50919050565b601f82111561044157806000526020600020601f840160051c8101602085101561041e5750805b601f840160051c820191505b8181101561043e576000815560010161042a565b50505b505050565b81516001600160401b0381111561045f5761045f610292565b6104738161046d84546103bd565b846103f7565b6020601f8211600181146104a7576000831561048f5750848201515b600019600385901b1c1916600184901b17845561043e565b600084815260208120601f198516915b828110156104d757878501518255602094850194600190920191016104b7565b50848210156104f55786840151600019600387901b60f8161c191681555b50505050600190811b01905550565b8082018082111561052557634e487b7160e01b600052601160045260246000fd5b92915050565b61097f8061053a6000396000f3fe608060405234801561001057600080fd5b50600436106100f55760003560e01c8063715018a611610097578063a0712d6811610066578063a0712d68146101eb578063a9059cbb146101fe578063dd62ed3e14610211578063f2fde38b1461024a57600080fd5b8063715018a6146101ad57806379cc6790146101b55780638da5cb5b146101c857806395d89b41146101e357600080fd5b806323b872dd116100d357806323b872dd1461014d578063313ce5671461016057806342966c681461016f57806370a082311461018457600080fd5b806306fdde03146100fa578063095ea7b31461011857806318160ddd1461013b575b600080fd5b61010261025d565b60405161010f91906107af565b60405180910390f35b61012b610126366004610819565b6102ef565b604051901515815260200161010f565b6002545b60405190815260200161010f565b61012b61015b366004610843565b610309565b6040516012815260200161010f565b61018261017d366004610880565b61032d565b005b61013f610192366004610899565b6001600160a01b031660009081526020819052604090205490565b61018261033a565b6101826101c3366004610819565b61034e565b6005546040516001600160a01b03909116815260200161010f565b610102610367565b6101826101f9366004610880565b610376565b61012b61020c366004610819565b610388565b61013f61021f3660046108bb565b6001600160a01b03918216600090815260016020908152604080832093909416825291909152205490565b610182610258366004610899565b610396565b60606003805461026c906108ee565b80601f0160208091040260200160405190810160405280929190818152602001828054610298906108ee565b80156102e55780601f106102ba576101008083540402835291602001916102e5565b820191906000526020600020905b8154815290600101906020018083116102c857829003601f168201915b5050505050905090565b6000336102fd8185856103d6565b60019150505b92915050565b6000336103178582856103e8565b610322858585610466565b506001949350505050565b61033733826104c5565b50565b6103426104fb565b61034c6000610528565b565b6103598233836103e8565b61036382826104c5565b5050565b60606004805461026c906108ee565b61037e6104fb565b610337338261057a565b6000336102fd818585610466565b61039e6104fb565b6001600160a01b0381166103cd57604051631e4fbdf760e01b8152600060048201526024015b60405180910390fd5b61033781610528565b6103e383838360016105b0565b505050565b6001600160a01b038381166000908152600160209081526040808320938616835292905220546000198114610460578181101561045157604051637dc7a0d960e11b81526001600160a01b038416600482015260248101829052604481018390526064016103c4565b610460848484840360006105b0565b50505050565b6001600160a01b03831661049057604051634b637e8f60e11b8152600060048201526024016103c4565b6001600160a01b0382166104ba5760405163ec442f0560e01b8152600060048201526024016103c4565b6103e3838383610685565b6001600160a01b0382166104ef57604051634b637e8f60e11b8152600060048201526024016103c4565b61036382600083610685565b6005546001600160a01b0316331461034c5760405163118cdaa760e01b81523360048201526024016103c4565b600580546001600160a01b038381166001600160a01b0319831681179093556040519116919082907f8be0079c531659141344cd1fd0a4f28419497f9722a3daafe3b4186f6b6457e090600090a35050565b6001600160a01b0382166105a45760405163ec442f0560e01b8152600060048201526024016103c4565b61036360008383610685565b6001600160a01b0384166105da5760405163e602df0560e01b8152600060048201526024016103c4565b6001600160a01b03831661060457604051634a1406b160e11b8152600060048201526024016103c4565b6001600160a01b038085166000908152600160209081526040808320938716835292905220829055801561046057826001600160a01b0316846001600160a01b03167f8c5be1e5ebec7d5bd14f71427d1e84f3dd0314c0f7b2291e5b200ac8c7c3b9258460405161067791815260200190565b60405180910390a350505050565b6001600160a01b0383166106b05780600260008282546106a59190610928565b909155506107229050565b6001600160a01b038316600090815260208190526040902054818110156107035760405163391434e360e21b81526001600160a01b038516600482015260248101829052604481018390526064016103c4565b6001600160a01b03841660009081526020819052604090209082900390555b6001600160a01b03821661073e5760028054829003905561075d565b6001600160a01b03821660009081526020819052604090208054820190555b816001600160a01b0316836001600160a01b03167fddf252ad1be2c89b69c2b068fc378daa952ba7f163c4a11628f55a4df523b3ef836040516107a291815260200190565b60405180910390a3505050565b602081526000825180602084015260005b818110156107dd57602081860181015160408684010152016107c0565b506000604082850101526040601f19601f83011684010191505092915050565b80356001600160a01b038116811461081457600080fd5b919050565b6000806040838503121561082c57600080fd5b610835836107fd565b946020939093013593505050565b60008060006060848603121561085857600080fd5b610861846107fd565b925061086f602085016107fd565b929592945050506040919091013590565b60006020828403121561089257600080fd5b5035919050565b6000602082840312156108ab57600080fd5b6108b4826107fd565b9392505050565b600080604083850312156108ce57600080fd5b6108d7836107fd565b91506108e5602084016107fd565b90509250929050565b600181811c9082168061090257607f821691505b60208210810361092257634e487b7160e01b600052602260045260246000fd5b50919050565b8082018082111561030357634e487b7160e01b600052601160045260246000fdfea2646970667358221220b774f86af59718219ae848eca65065ceb162c2be7a9916ae64526daf8255c04364736f6c634300081b0033";
const isSuperArgs = (xs) => xs.length > 1;
class TestCoin__factory extends ethers_1.ContractFactory {
    constructor(...args) {
        if (isSuperArgs(args)) {
            super(...args);
        }
        else {
            super(_abi, _bytecode, args[0]);
        }
    }
    getDeployTransaction(name, symbol, amount, overrides) {
        return super.getDeployTransaction(name, symbol, amount, overrides || {});
    }
    deploy(name, symbol, amount, overrides) {
        return super.deploy(name, symbol, amount, overrides || {});
    }
    connect(runner) {
        return super.connect(runner);
    }
    static createInterface() {
        return new ethers_1.Interface(_abi);
    }
    static connect(address, runner) {
        return new ethers_1.Contract(address, _abi, runner);
    }
}
exports.TestCoin__factory = TestCoin__factory;
TestCoin__factory.bytecode = _bytecode;
TestCoin__factory.abi = _abi;
