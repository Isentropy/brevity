import { HardhatUserConfig } from "hardhat/config";
import "@nomicfoundation/hardhat-toolbox";

const config: HardhatUserConfig = {
  solidity: {
    version: "0.8.27",
    settings: {
      evmVersion: "cancun",
      optimizer: {
        enabled: true,
        runs: 200
      }
    }
  },
  networks: {
    hardhat: {
      chains: {
        8453: {
          hardforkHistory: {
            london: 0,
            merge: 0,
            shanghai: 0,
            cancun: 0,
          }
        }
      }
    }
  }
};

export default config;
