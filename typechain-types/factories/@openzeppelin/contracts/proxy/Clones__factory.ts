/* Autogenerated file. Do not edit manually. */
/* tslint:disable */
/* eslint-disable */
import {
  Contract,
  ContractFactory,
  ContractTransactionResponse,
  Interface,
} from "ethers";
import type { Signer, ContractDeployTransaction, ContractRunner } from "ethers";
import type { NonPayableOverrides } from "../../../../common";
import type {
  Clones,
  ClonesInterface,
} from "../../../../@openzeppelin/contracts/proxy/Clones";

const _abi = [
  {
    inputs: [],
    name: "ERC1167FailedCreateClone",
    type: "error",
  },
] as const;

const _bytecode =
  "0x60566037600b82828239805160001a607314602a57634e487b7160e01b600052600060045260246000fd5b30600052607381538281f3fe73000000000000000000000000000000000000000030146080604052600080fdfea26469706673582212208a25a5cc9316a97b115b3867af5288e1989a9624de23efa53709faf2bda1b10f64736f6c634300081b0033";

type ClonesConstructorParams =
  | [signer?: Signer]
  | ConstructorParameters<typeof ContractFactory>;

const isSuperArgs = (
  xs: ClonesConstructorParams
): xs is ConstructorParameters<typeof ContractFactory> => xs.length > 1;

export class Clones__factory extends ContractFactory {
  constructor(...args: ClonesConstructorParams) {
    if (isSuperArgs(args)) {
      super(...args);
    } else {
      super(_abi, _bytecode, args[0]);
    }
  }

  override getDeployTransaction(
    overrides?: NonPayableOverrides & { from?: string }
  ): Promise<ContractDeployTransaction> {
    return super.getDeployTransaction(overrides || {});
  }
  override deploy(overrides?: NonPayableOverrides & { from?: string }) {
    return super.deploy(overrides || {}) as Promise<
      Clones & {
        deploymentTransaction(): ContractTransactionResponse;
      }
    >;
  }
  override connect(runner: ContractRunner | null): Clones__factory {
    return super.connect(runner) as Clones__factory;
  }

  static readonly bytecode = _bytecode;
  static readonly abi = _abi;
  static createInterface(): ClonesInterface {
    return new Interface(_abi) as ClonesInterface;
  }
  static connect(address: string, runner?: ContractRunner | null): Clones {
    return new Contract(address, _abi, runner) as unknown as Clones;
  }
}
