"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.CloneFactory__factory = void 0;
/* Autogenerated file. Do not edit manually. */
/* tslint:disable */
/* eslint-disable */
const ethers_1 = require("ethers");
const _abi = [
    {
        inputs: [],
        name: "ERC1167FailedCreateClone",
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
                name: "cloneAddress",
                type: "address",
            },
            {
                indexed: true,
                internalType: "address",
                name: "implementation",
                type: "address",
            },
        ],
        name: "NewClone",
        type: "event",
    },
    {
        inputs: [
            {
                internalType: "address",
                name: "implementation",
                type: "address",
            },
            {
                internalType: "bytes32",
                name: "salt",
                type: "bytes32",
            },
            {
                internalType: "address",
                name: "owner",
                type: "address",
            },
        ],
        name: "cloneDeterministic",
        outputs: [
            {
                internalType: "address",
                name: "",
                type: "address",
            },
        ],
        stateMutability: "nonpayable",
        type: "function",
    },
    {
        inputs: [
            {
                internalType: "address",
                name: "implementation",
                type: "address",
            },
            {
                internalType: "bytes32",
                name: "salt",
                type: "bytes32",
            },
            {
                internalType: "address",
                name: "owner",
                type: "address",
            },
            {
                components: [
                    {
                        internalType: "uint256",
                        name: "config",
                        type: "uint256",
                    },
                    {
                        components: [
                            {
                                internalType: "uint256",
                                name: "opcode",
                                type: "uint256",
                            },
                            {
                                internalType: "bytes32[]",
                                name: "args",
                                type: "bytes32[]",
                            },
                        ],
                        internalType: "struct Instruction[]",
                        name: "instructions",
                        type: "tuple[]",
                    },
                    {
                        components: [
                            {
                                internalType: "uint256",
                                name: "quantityType",
                                type: "uint256",
                            },
                            {
                                internalType: "bytes32[]",
                                name: "args",
                                type: "bytes32[]",
                            },
                        ],
                        internalType: "struct Quantity[]",
                        name: "quantities",
                        type: "tuple[]",
                    },
                ],
                internalType: "struct Program",
                name: "p",
                type: "tuple",
            },
            {
                internalType: "uint256",
                name: "deadline",
                type: "uint256",
            },
            {
                internalType: "bytes",
                name: "sig",
                type: "bytes",
            },
        ],
        name: "cloneIfNeededThenRun",
        outputs: [
            {
                internalType: "address",
                name: "",
                type: "address",
            },
        ],
        stateMutability: "nonpayable",
        type: "function",
    },
    {
        inputs: [
            {
                internalType: "address",
                name: "implementation",
                type: "address",
            },
            {
                internalType: "bytes32",
                name: "salt",
                type: "bytes32",
            },
            {
                internalType: "address",
                name: "owner",
                type: "address",
            },
        ],
        name: "predictDeterministicAddress",
        outputs: [
            {
                internalType: "address",
                name: "predicted",
                type: "address",
            },
        ],
        stateMutability: "view",
        type: "function",
    },
];
const _bytecode = "0x6080604052348015600f57600080fd5b506109288061001f6000396000f3fe608060405234801561001057600080fd5b50600436106100415760003560e01c806393a7e71114610046578063bb45c25014610075578063f14188e014610088575b600080fd5b610059610054366004610374565b61009b565b6040516001600160a01b03909116815260200160405180910390f35b6100596100833660046105f3565b6100dd565b610059610096366004610374565b61019c565b60008083836040516020016100b1929190610724565b6040516020818303038152906040528051906020012090506100d4858230610288565b95945050505050565b60008086866040516020016100f3929190610724565b6040516020818303038152906040528051906020012090506000610118898330610288565b9050803b61012d5761012b89898961019c565b505b60405163b52acf7960e01b81526001600160a01b0382169063b52acf799061015d90899089908990600401610840565b600060405180830381600087803b15801561017757600080fd5b505af115801561018b573d6000803e3d6000fd5b50929b9a5050505050505050505050565b60008083836040516020016101b2929190610724565b60405160208183030381529060405280519060200120905060006101d686836102e4565b6040516313af403560e01b81526001600160a01b038681166004830152919250908216906313af403590602401600060405180830381600087803b15801561021d57600080fd5b505af1158015610231573d6000803e3d6000fd5b50505050856001600160a01b0316816001600160a01b0316856001600160a01b03167f274b5f356634f32a865af65bdc3d8205939d9413d75e1f367652e4f3b24d0c3a60405160405180910390a495945050505050565b60405160388101919091526f5af43d82803e903d91602b57fd5bf3ff60248201526014810192909252733d602d80600a3d3981f3363d3d373d3d3d363d73825260588201526037600c8201206078820152605560439091012090565b6000763d602d80600a3d3981f3363d3d373d3d3d363d730000008360601b60e81c176000526e5af43d82803e903d91602b57fd5bf38360781b1760205281603760096000f590506001600160a01b038116610352576040516330be1a3d60e21b815260040160405180910390fd5b92915050565b80356001600160a01b038116811461036f57600080fd5b919050565b60008060006060848603121561038957600080fd5b61039284610358565b9250602084013591506103a760408501610358565b90509250925092565b634e487b7160e01b600052604160045260246000fd5b6040805190810167ffffffffffffffff811182821017156103e9576103e96103b0565b60405290565b6040516060810167ffffffffffffffff811182821017156103e9576103e96103b0565b604051601f8201601f1916810167ffffffffffffffff8111828210171561043b5761043b6103b0565b604052919050565b600067ffffffffffffffff82111561045d5761045d6103b0565b5060051b60200190565b600061047a61047584610443565b610412565b838152905060208101600584901b83018581111561049757600080fd5b835b8181101561057957803567ffffffffffffffff8111156104b857600080fd5b850160006040828a0312156104cb578081fd5b6104d36103c6565b823581529050602082013567ffffffffffffffff8111156104f357600080fd5b80830192505088601f83011261050857600080fd5b813561051661047582610443565b8082825260208201915060208360051b86010192508b83111561053857600080fd5b6020850194505b8285101561055a57843582526020948501949091019061053f565b8060208501525050508085525050602083019250602081019050610499565b5050509392505050565b600082601f83011261059457600080fd5b813567ffffffffffffffff8111156105ae576105ae6103b0565b6105c1601f8201601f1916602001610412565b8181528460208386010111156105d657600080fd5b816020850160208301376000918101602001919091529392505050565b60008060008060008060c0878903121561060c57600080fd5b61061587610358565b95506020870135945061062a60408801610358565b9350606087013567ffffffffffffffff81111561064657600080fd5b87016060818a03121561065857600080fd5b6106606103ef565b81358152602082013567ffffffffffffffff81111561067e57600080fd5b8201601f81018b1361068f57600080fd5b61069e8b823560208401610467565b602083015250604082013567ffffffffffffffff8111156106be57600080fd5b80830192505089601f8301126106d357600080fd5b6106e28a833560208501610467565b60408201529350506080870135915060a087013567ffffffffffffffff81111561070b57600080fd5b61071789828a01610583565b9150509295509295509295565b91825260601b6bffffffffffffffffffffffff1916602082015260340190565b60006040830182518452602083015160406020860152818151808452606087019150602083019350600092505b808310156107945783518252602082019150602084019350600183019250610771565b5095945050505050565b600082825180855260208501945060208160051b8301016020850160005b838110156107ee57601f198584030188526107d8838351610744565b60209889019890935091909101906001016107bc565b50909695505050505050565b6000815180845260005b8181101561082057602081850181015186830182015201610804565b506000602082860101526020601f19601f83011685010191505092915050565b60608152600060c082018551606084015260208601516060608085015281815180845260e08601915060e08160051b870101935060208301925060005b818110156108ae5760df19878603018352610899858551610744565b9450602093840193929092019160010161087d565b505050506040860151838203605f190160a08501526108cd828261079e565b91505084602084015282810360408401526108e881856107fa565b969550505050505056fea264697066735822122000aa1dc0a9a410c02976b2c3f651be149d049439f9c2e1ac549f0d85668d9f4964736f6c634300081b0033";
const isSuperArgs = (xs) => xs.length > 1;
class CloneFactory__factory extends ethers_1.ContractFactory {
    constructor(...args) {
        if (isSuperArgs(args)) {
            super(...args);
        }
        else {
            super(_abi, _bytecode, args[0]);
        }
    }
    getDeployTransaction(overrides) {
        return super.getDeployTransaction(overrides || {});
    }
    deploy(overrides) {
        return super.deploy(overrides || {});
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
exports.CloneFactory__factory = CloneFactory__factory;
CloneFactory__factory.bytecode = _bytecode;
CloneFactory__factory.abi = _abi;
