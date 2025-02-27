/* Autogenerated file. Do not edit manually. */
/* tslint:disable */
/* eslint-disable */

import { ethers } from "ethers";
import {
  DeployContractOptions,
  FactoryOptions,
  HardhatEthersHelpers as HardhatEthersHelpersBase,
} from "@nomicfoundation/hardhat-ethers/types";

import * as Contracts from ".";

declare module "hardhat/types/runtime" {
  interface HardhatEthersHelpers extends HardhatEthersHelpersBase {
    getContractFactory(
      name: "Ownable",
      signerOrOptions?: ethers.Signer | FactoryOptions
    ): Promise<Contracts.Ownable__factory>;
    getContractFactory(
      name: "IERC1155Errors",
      signerOrOptions?: ethers.Signer | FactoryOptions
    ): Promise<Contracts.IERC1155Errors__factory>;
    getContractFactory(
      name: "IERC20Errors",
      signerOrOptions?: ethers.Signer | FactoryOptions
    ): Promise<Contracts.IERC20Errors__factory>;
    getContractFactory(
      name: "IERC721Errors",
      signerOrOptions?: ethers.Signer | FactoryOptions
    ): Promise<Contracts.IERC721Errors__factory>;
    getContractFactory(
      name: "IERC5267",
      signerOrOptions?: ethers.Signer | FactoryOptions
    ): Promise<Contracts.IERC5267__factory>;
    getContractFactory(
      name: "Clones",
      signerOrOptions?: ethers.Signer | FactoryOptions
    ): Promise<Contracts.Clones__factory>;
    getContractFactory(
      name: "ERC20",
      signerOrOptions?: ethers.Signer | FactoryOptions
    ): Promise<Contracts.ERC20__factory>;
    getContractFactory(
      name: "ERC20Burnable",
      signerOrOptions?: ethers.Signer | FactoryOptions
    ): Promise<Contracts.ERC20Burnable__factory>;
    getContractFactory(
      name: "IERC20Metadata",
      signerOrOptions?: ethers.Signer | FactoryOptions
    ): Promise<Contracts.IERC20Metadata__factory>;
    getContractFactory(
      name: "IERC20",
      signerOrOptions?: ethers.Signer | FactoryOptions
    ): Promise<Contracts.IERC20__factory>;
    getContractFactory(
      name: "ECDSA",
      signerOrOptions?: ethers.Signer | FactoryOptions
    ): Promise<Contracts.ECDSA__factory>;
    getContractFactory(
      name: "EIP712",
      signerOrOptions?: ethers.Signer | FactoryOptions
    ): Promise<Contracts.EIP712__factory>;
    getContractFactory(
      name: "Math",
      signerOrOptions?: ethers.Signer | FactoryOptions
    ): Promise<Contracts.Math__factory>;
    getContractFactory(
      name: "Nonces",
      signerOrOptions?: ethers.Signer | FactoryOptions
    ): Promise<Contracts.Nonces__factory>;
    getContractFactory(
      name: "ShortStrings",
      signerOrOptions?: ethers.Signer | FactoryOptions
    ): Promise<Contracts.ShortStrings__factory>;
    getContractFactory(
      name: "Strings",
      signerOrOptions?: ethers.Signer | FactoryOptions
    ): Promise<Contracts.Strings__factory>;
    getContractFactory(
      name: "BrevityInterpreter",
      signerOrOptions?: ethers.Signer | FactoryOptions
    ): Promise<Contracts.BrevityInterpreter__factory>;
    getContractFactory(
      name: "CloneFactory",
      signerOrOptions?: ethers.Signer | FactoryOptions
    ): Promise<Contracts.CloneFactory__factory>;
    getContractFactory(
      name: "SetOwner",
      signerOrOptions?: ethers.Signer | FactoryOptions
    ): Promise<Contracts.SetOwner__factory>;
    getContractFactory(
      name: "IBrevityInterpreter",
      signerOrOptions?: ethers.Signer | FactoryOptions
    ): Promise<Contracts.IBrevityInterpreter__factory>;
    getContractFactory(
      name: "OwnedBrevityInterpreter",
      signerOrOptions?: ethers.Signer | FactoryOptions
    ): Promise<Contracts.OwnedBrevityInterpreter__factory>;
    getContractFactory(
      name: "Arb",
      signerOrOptions?: ethers.Signer | FactoryOptions
    ): Promise<Contracts.Arb__factory>;
    getContractFactory(
      name: "ISwap",
      signerOrOptions?: ethers.Signer | FactoryOptions
    ): Promise<Contracts.ISwap__factory>;
    getContractFactory(
      name: "LoopTest",
      signerOrOptions?: ethers.Signer | FactoryOptions
    ): Promise<Contracts.LoopTest__factory>;
    getContractFactory(
      name: "MintableERC20",
      signerOrOptions?: ethers.Signer | FactoryOptions
    ): Promise<Contracts.MintableERC20__factory>;
    getContractFactory(
      name: "Test",
      signerOrOptions?: ethers.Signer | FactoryOptions
    ): Promise<Contracts.Test__factory>;
    getContractFactory(
      name: "TestCoin",
      signerOrOptions?: ethers.Signer | FactoryOptions
    ): Promise<Contracts.TestCoin__factory>;
    getContractFactory(
      name: "TestToken",
      signerOrOptions?: ethers.Signer | FactoryOptions
    ): Promise<Contracts.TestToken__factory>;

    getContractAt(
      name: "Ownable",
      address: string | ethers.Addressable,
      signer?: ethers.Signer
    ): Promise<Contracts.Ownable>;
    getContractAt(
      name: "IERC1155Errors",
      address: string | ethers.Addressable,
      signer?: ethers.Signer
    ): Promise<Contracts.IERC1155Errors>;
    getContractAt(
      name: "IERC20Errors",
      address: string | ethers.Addressable,
      signer?: ethers.Signer
    ): Promise<Contracts.IERC20Errors>;
    getContractAt(
      name: "IERC721Errors",
      address: string | ethers.Addressable,
      signer?: ethers.Signer
    ): Promise<Contracts.IERC721Errors>;
    getContractAt(
      name: "IERC5267",
      address: string | ethers.Addressable,
      signer?: ethers.Signer
    ): Promise<Contracts.IERC5267>;
    getContractAt(
      name: "Clones",
      address: string | ethers.Addressable,
      signer?: ethers.Signer
    ): Promise<Contracts.Clones>;
    getContractAt(
      name: "ERC20",
      address: string | ethers.Addressable,
      signer?: ethers.Signer
    ): Promise<Contracts.ERC20>;
    getContractAt(
      name: "ERC20Burnable",
      address: string | ethers.Addressable,
      signer?: ethers.Signer
    ): Promise<Contracts.ERC20Burnable>;
    getContractAt(
      name: "IERC20Metadata",
      address: string | ethers.Addressable,
      signer?: ethers.Signer
    ): Promise<Contracts.IERC20Metadata>;
    getContractAt(
      name: "IERC20",
      address: string | ethers.Addressable,
      signer?: ethers.Signer
    ): Promise<Contracts.IERC20>;
    getContractAt(
      name: "ECDSA",
      address: string | ethers.Addressable,
      signer?: ethers.Signer
    ): Promise<Contracts.ECDSA>;
    getContractAt(
      name: "EIP712",
      address: string | ethers.Addressable,
      signer?: ethers.Signer
    ): Promise<Contracts.EIP712>;
    getContractAt(
      name: "Math",
      address: string | ethers.Addressable,
      signer?: ethers.Signer
    ): Promise<Contracts.Math>;
    getContractAt(
      name: "Nonces",
      address: string | ethers.Addressable,
      signer?: ethers.Signer
    ): Promise<Contracts.Nonces>;
    getContractAt(
      name: "ShortStrings",
      address: string | ethers.Addressable,
      signer?: ethers.Signer
    ): Promise<Contracts.ShortStrings>;
    getContractAt(
      name: "Strings",
      address: string | ethers.Addressable,
      signer?: ethers.Signer
    ): Promise<Contracts.Strings>;
    getContractAt(
      name: "BrevityInterpreter",
      address: string | ethers.Addressable,
      signer?: ethers.Signer
    ): Promise<Contracts.BrevityInterpreter>;
    getContractAt(
      name: "CloneFactory",
      address: string | ethers.Addressable,
      signer?: ethers.Signer
    ): Promise<Contracts.CloneFactory>;
    getContractAt(
      name: "SetOwner",
      address: string | ethers.Addressable,
      signer?: ethers.Signer
    ): Promise<Contracts.SetOwner>;
    getContractAt(
      name: "IBrevityInterpreter",
      address: string | ethers.Addressable,
      signer?: ethers.Signer
    ): Promise<Contracts.IBrevityInterpreter>;
    getContractAt(
      name: "OwnedBrevityInterpreter",
      address: string | ethers.Addressable,
      signer?: ethers.Signer
    ): Promise<Contracts.OwnedBrevityInterpreter>;
    getContractAt(
      name: "Arb",
      address: string | ethers.Addressable,
      signer?: ethers.Signer
    ): Promise<Contracts.Arb>;
    getContractAt(
      name: "ISwap",
      address: string | ethers.Addressable,
      signer?: ethers.Signer
    ): Promise<Contracts.ISwap>;
    getContractAt(
      name: "LoopTest",
      address: string | ethers.Addressable,
      signer?: ethers.Signer
    ): Promise<Contracts.LoopTest>;
    getContractAt(
      name: "MintableERC20",
      address: string | ethers.Addressable,
      signer?: ethers.Signer
    ): Promise<Contracts.MintableERC20>;
    getContractAt(
      name: "Test",
      address: string | ethers.Addressable,
      signer?: ethers.Signer
    ): Promise<Contracts.Test>;
    getContractAt(
      name: "TestCoin",
      address: string | ethers.Addressable,
      signer?: ethers.Signer
    ): Promise<Contracts.TestCoin>;
    getContractAt(
      name: "TestToken",
      address: string | ethers.Addressable,
      signer?: ethers.Signer
    ): Promise<Contracts.TestToken>;

    deployContract(
      name: "Ownable",
      signerOrOptions?: ethers.Signer | DeployContractOptions
    ): Promise<Contracts.Ownable>;
    deployContract(
      name: "IERC1155Errors",
      signerOrOptions?: ethers.Signer | DeployContractOptions
    ): Promise<Contracts.IERC1155Errors>;
    deployContract(
      name: "IERC20Errors",
      signerOrOptions?: ethers.Signer | DeployContractOptions
    ): Promise<Contracts.IERC20Errors>;
    deployContract(
      name: "IERC721Errors",
      signerOrOptions?: ethers.Signer | DeployContractOptions
    ): Promise<Contracts.IERC721Errors>;
    deployContract(
      name: "IERC5267",
      signerOrOptions?: ethers.Signer | DeployContractOptions
    ): Promise<Contracts.IERC5267>;
    deployContract(
      name: "Clones",
      signerOrOptions?: ethers.Signer | DeployContractOptions
    ): Promise<Contracts.Clones>;
    deployContract(
      name: "ERC20",
      signerOrOptions?: ethers.Signer | DeployContractOptions
    ): Promise<Contracts.ERC20>;
    deployContract(
      name: "ERC20Burnable",
      signerOrOptions?: ethers.Signer | DeployContractOptions
    ): Promise<Contracts.ERC20Burnable>;
    deployContract(
      name: "IERC20Metadata",
      signerOrOptions?: ethers.Signer | DeployContractOptions
    ): Promise<Contracts.IERC20Metadata>;
    deployContract(
      name: "IERC20",
      signerOrOptions?: ethers.Signer | DeployContractOptions
    ): Promise<Contracts.IERC20>;
    deployContract(
      name: "ECDSA",
      signerOrOptions?: ethers.Signer | DeployContractOptions
    ): Promise<Contracts.ECDSA>;
    deployContract(
      name: "EIP712",
      signerOrOptions?: ethers.Signer | DeployContractOptions
    ): Promise<Contracts.EIP712>;
    deployContract(
      name: "Math",
      signerOrOptions?: ethers.Signer | DeployContractOptions
    ): Promise<Contracts.Math>;
    deployContract(
      name: "Nonces",
      signerOrOptions?: ethers.Signer | DeployContractOptions
    ): Promise<Contracts.Nonces>;
    deployContract(
      name: "ShortStrings",
      signerOrOptions?: ethers.Signer | DeployContractOptions
    ): Promise<Contracts.ShortStrings>;
    deployContract(
      name: "Strings",
      signerOrOptions?: ethers.Signer | DeployContractOptions
    ): Promise<Contracts.Strings>;
    deployContract(
      name: "BrevityInterpreter",
      signerOrOptions?: ethers.Signer | DeployContractOptions
    ): Promise<Contracts.BrevityInterpreter>;
    deployContract(
      name: "CloneFactory",
      signerOrOptions?: ethers.Signer | DeployContractOptions
    ): Promise<Contracts.CloneFactory>;
    deployContract(
      name: "SetOwner",
      signerOrOptions?: ethers.Signer | DeployContractOptions
    ): Promise<Contracts.SetOwner>;
    deployContract(
      name: "IBrevityInterpreter",
      signerOrOptions?: ethers.Signer | DeployContractOptions
    ): Promise<Contracts.IBrevityInterpreter>;
    deployContract(
      name: "OwnedBrevityInterpreter",
      signerOrOptions?: ethers.Signer | DeployContractOptions
    ): Promise<Contracts.OwnedBrevityInterpreter>;
    deployContract(
      name: "Arb",
      signerOrOptions?: ethers.Signer | DeployContractOptions
    ): Promise<Contracts.Arb>;
    deployContract(
      name: "ISwap",
      signerOrOptions?: ethers.Signer | DeployContractOptions
    ): Promise<Contracts.ISwap>;
    deployContract(
      name: "LoopTest",
      signerOrOptions?: ethers.Signer | DeployContractOptions
    ): Promise<Contracts.LoopTest>;
    deployContract(
      name: "MintableERC20",
      signerOrOptions?: ethers.Signer | DeployContractOptions
    ): Promise<Contracts.MintableERC20>;
    deployContract(
      name: "Test",
      signerOrOptions?: ethers.Signer | DeployContractOptions
    ): Promise<Contracts.Test>;
    deployContract(
      name: "TestCoin",
      signerOrOptions?: ethers.Signer | DeployContractOptions
    ): Promise<Contracts.TestCoin>;
    deployContract(
      name: "TestToken",
      signerOrOptions?: ethers.Signer | DeployContractOptions
    ): Promise<Contracts.TestToken>;

    deployContract(
      name: "Ownable",
      args: any[],
      signerOrOptions?: ethers.Signer | DeployContractOptions
    ): Promise<Contracts.Ownable>;
    deployContract(
      name: "IERC1155Errors",
      args: any[],
      signerOrOptions?: ethers.Signer | DeployContractOptions
    ): Promise<Contracts.IERC1155Errors>;
    deployContract(
      name: "IERC20Errors",
      args: any[],
      signerOrOptions?: ethers.Signer | DeployContractOptions
    ): Promise<Contracts.IERC20Errors>;
    deployContract(
      name: "IERC721Errors",
      args: any[],
      signerOrOptions?: ethers.Signer | DeployContractOptions
    ): Promise<Contracts.IERC721Errors>;
    deployContract(
      name: "IERC5267",
      args: any[],
      signerOrOptions?: ethers.Signer | DeployContractOptions
    ): Promise<Contracts.IERC5267>;
    deployContract(
      name: "Clones",
      args: any[],
      signerOrOptions?: ethers.Signer | DeployContractOptions
    ): Promise<Contracts.Clones>;
    deployContract(
      name: "ERC20",
      args: any[],
      signerOrOptions?: ethers.Signer | DeployContractOptions
    ): Promise<Contracts.ERC20>;
    deployContract(
      name: "ERC20Burnable",
      args: any[],
      signerOrOptions?: ethers.Signer | DeployContractOptions
    ): Promise<Contracts.ERC20Burnable>;
    deployContract(
      name: "IERC20Metadata",
      args: any[],
      signerOrOptions?: ethers.Signer | DeployContractOptions
    ): Promise<Contracts.IERC20Metadata>;
    deployContract(
      name: "IERC20",
      args: any[],
      signerOrOptions?: ethers.Signer | DeployContractOptions
    ): Promise<Contracts.IERC20>;
    deployContract(
      name: "ECDSA",
      args: any[],
      signerOrOptions?: ethers.Signer | DeployContractOptions
    ): Promise<Contracts.ECDSA>;
    deployContract(
      name: "EIP712",
      args: any[],
      signerOrOptions?: ethers.Signer | DeployContractOptions
    ): Promise<Contracts.EIP712>;
    deployContract(
      name: "Math",
      args: any[],
      signerOrOptions?: ethers.Signer | DeployContractOptions
    ): Promise<Contracts.Math>;
    deployContract(
      name: "Nonces",
      args: any[],
      signerOrOptions?: ethers.Signer | DeployContractOptions
    ): Promise<Contracts.Nonces>;
    deployContract(
      name: "ShortStrings",
      args: any[],
      signerOrOptions?: ethers.Signer | DeployContractOptions
    ): Promise<Contracts.ShortStrings>;
    deployContract(
      name: "Strings",
      args: any[],
      signerOrOptions?: ethers.Signer | DeployContractOptions
    ): Promise<Contracts.Strings>;
    deployContract(
      name: "BrevityInterpreter",
      args: any[],
      signerOrOptions?: ethers.Signer | DeployContractOptions
    ): Promise<Contracts.BrevityInterpreter>;
    deployContract(
      name: "CloneFactory",
      args: any[],
      signerOrOptions?: ethers.Signer | DeployContractOptions
    ): Promise<Contracts.CloneFactory>;
    deployContract(
      name: "SetOwner",
      args: any[],
      signerOrOptions?: ethers.Signer | DeployContractOptions
    ): Promise<Contracts.SetOwner>;
    deployContract(
      name: "IBrevityInterpreter",
      args: any[],
      signerOrOptions?: ethers.Signer | DeployContractOptions
    ): Promise<Contracts.IBrevityInterpreter>;
    deployContract(
      name: "OwnedBrevityInterpreter",
      args: any[],
      signerOrOptions?: ethers.Signer | DeployContractOptions
    ): Promise<Contracts.OwnedBrevityInterpreter>;
    deployContract(
      name: "Arb",
      args: any[],
      signerOrOptions?: ethers.Signer | DeployContractOptions
    ): Promise<Contracts.Arb>;
    deployContract(
      name: "ISwap",
      args: any[],
      signerOrOptions?: ethers.Signer | DeployContractOptions
    ): Promise<Contracts.ISwap>;
    deployContract(
      name: "LoopTest",
      args: any[],
      signerOrOptions?: ethers.Signer | DeployContractOptions
    ): Promise<Contracts.LoopTest>;
    deployContract(
      name: "MintableERC20",
      args: any[],
      signerOrOptions?: ethers.Signer | DeployContractOptions
    ): Promise<Contracts.MintableERC20>;
    deployContract(
      name: "Test",
      args: any[],
      signerOrOptions?: ethers.Signer | DeployContractOptions
    ): Promise<Contracts.Test>;
    deployContract(
      name: "TestCoin",
      args: any[],
      signerOrOptions?: ethers.Signer | DeployContractOptions
    ): Promise<Contracts.TestCoin>;
    deployContract(
      name: "TestToken",
      args: any[],
      signerOrOptions?: ethers.Signer | DeployContractOptions
    ): Promise<Contracts.TestToken>;

    // default types
    getContractFactory(
      name: string,
      signerOrOptions?: ethers.Signer | FactoryOptions
    ): Promise<ethers.ContractFactory>;
    getContractFactory(
      abi: any[],
      bytecode: ethers.BytesLike,
      signer?: ethers.Signer
    ): Promise<ethers.ContractFactory>;
    getContractAt(
      nameOrAbi: string | any[],
      address: string | ethers.Addressable,
      signer?: ethers.Signer
    ): Promise<ethers.Contract>;
    deployContract(
      name: string,
      signerOrOptions?: ethers.Signer | DeployContractOptions
    ): Promise<ethers.Contract>;
    deployContract(
      name: string,
      args: any[],
      signerOrOptions?: ethers.Signer | DeployContractOptions
    ): Promise<ethers.Contract>;
  }
}
