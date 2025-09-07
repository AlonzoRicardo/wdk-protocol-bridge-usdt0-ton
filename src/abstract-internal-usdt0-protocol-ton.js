// Copyright 2024 Tether Operations Limited
//
// Licensed under the Apache License, Version 2.0 (the "License");
// you may not use this file except in compliance with the License.
// You may obtain a copy of the License at
//
//     http://www.apache.org/licenses/LICENSE-2.0
//
// Unless required by applicable law or agreed to in writing, software
// distributed under the License is distributed on an "AS IS" BASIS,
// WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
// See the License for the specific language governing permissions and
// limitations under the License.
'use strict'

import { BridgeProtocol } from '@wdk/wallet/protocols'

import { Coin, CurrencyAmount, Token } from '@wdk-ton-packages/ui-core'
import { parseTonAddress } from '@wdk-ton-packages/ui-ton'
import { createOftBridgeConfig } from '@wdk-ton-packages/ui-bridge-oft'

// eslint-disable-next-line camelcase
import { OftBridgeApiFactory__ton } from '@wdk-ton-packages/ui-bridge-oft/ton'

import { Cell, toNano } from '@ton/ton'

const BRIDGE_FEE_BASIS_POINTS = 10n

const DENOMINATOR_BASIS_POINTS = 10_000n

const DUMMY_MESSAGE_VALUE = toNano(0.8)

const BRIDGE_ADDRESS_CONFIG = {
  oftProxy: '0x1ddf580052174ed1dd0d66c35bfdc1a5fcc69af4f4ae36154b13dcfc6c14a35f',
  controller: '0x1eb2bbea3d8c0d42ff7fd60f0264c866c934bbff727526ca759e7374cae0c166',
  ulnManager: '0x06b52b11abaf65bf1ff47c57e890ba4ad6a75a68859bbe5a51c1fc451954c54c',
  token: '0xb113a994b5024a16719f69139328eb759596c38a25f59028b146fecdc3621dfe',
  executor: '0x0f9a60ea29c5c9e4643601e8881e850498ee680a413e8ba01d5e55ce1c221024'
}

const BRIDGE_ULN_CONFIGS = {
  USDT_TON_ARBITRUM: {
    confirmations: '2',
    confirmationsNull: false,
    executor: '0x0',
    executorNull: true,
    maxMessageBytes: '522',
    optionalDVNs: [],
    optionalDVNsNull: false,
    requiredDVNs: ['0xd122dec4ec8bd66c68344faf0dd471d727a7d57a21b62051705bbe2e4c272a7'],
    requiredDVNsNull: false,
    workerQuoteGasLimit: '120000'
  }
}

const OFT_TOKEN_CONFIG = {
  EQCxE6mUtQJKFnGfaROTKOt1lZbDiiX1kCixRv7Nw2Id_sDs: {
    version: 3,
    fee: false,
    sharedDecimals: 6,
    deployments: {
      ethereum: {
        eid: 30_101,
        oftProxy: {
          address: '0x6c96de32cea08842dcc4058c14d3aaad7fa41dee'
        },
        oftNative: {
          address: '0x811ed79dB9D34E83BDB73DF6c3e07961Cfb0D5c0'
        },
        token: {
          chainKey: 'ethereum',
          decimals: 6,
          symbol: 'USDT',
          name: 'USDT',
          address: '0xdAC17F958D2ee523a2206206994597C13D831ec7'
        }
      },
      arbitrum: {
        eid: 30_110,
        oftProxy: {
          address: '0x14e4a1b13bf7f943c8ff7c51fb60fa964a298d92'
        },
        oftNative: {
          address: '0x77652D5aba086137b595875263FC200182919B92'
        },
        token: {
          chainKey: 'arbitrum',
          decimals: 6,
          symbol: 'USDT0',
          name: 'USDT0',
          address: '0xfd086bc7cd5c481dcc9c85ebe478a1c0b69fcbb9'
        }
      },
      ton: {
        eid: 30_343,
        oftProxy: {
          address: '0x1ddf580052174ed1dd0d66c35bfdc1a5fcc69af4f4ae36154b13dcfc6c14a35f'
        },
        token: {
          chainKey: 'ton',
          decimals: 6,
          symbol: 'USDT',
          name: 'USDT',
          address: '0xb113a994b5024a16719f69139328eb759596c38a25f59028b146fecdc3621dfe'
        },
        destinationChains: [
          'ethereum',
          'arbitrum',
          'tron'
        ]
      },
      tron: {
        eid: 30_420,
        oftProxy: {
          address: '0x8925c1dD3e5d8011946a3430d91Be742bA8EE930'
        },
        token: {
          chainKey: 'tron',
          decimals: 6,
          symbol: 'USDT',
          name: 'USDT',
          address: '0xa614f803B6FD780986A42c78Ec9c7f77e6DeD13C'
        },
        destinationChains: [
          'ton',
          'ethereum',
          'arbitrum'
        ]
      }
    }
  }
}

/** @internal */
export default class AbstractInternalUsdt0ProtocolTon extends BridgeProtocol {
  async _getBridgeTxParams ({ targetChain, recipient, token, amount, oft }) {
    if (targetChain === 'ton') {
      throw new Error('The target chain cannot be equal to the source chain (ton).')
    }

    if (!oft) {
      if (!OFT_TOKEN_CONFIG[token]) {
        throw new Error(`Token '${token}' is not natively supported. Provide a custom oft configuration to bridge this token.`)
      }

      oft = OFT_TOKEN_CONFIG[token]
    }

    if (!oft.deployments[targetChain]) {
      throw new Error(`Target chain '${targetChain}' not supported.`)
    }

    const jettonWalletAddress = await this._account._getJettonWalletAddress(token)

    const oftBridgeConfig = createOftBridgeConfig(oft)

    const input = await this._getTransferInput({ targetChain, recipient, amount, oftBridgeConfig })

    const bridgeHelperFactory = new OftBridgeApiFactory__ton(
      this._account._tonClient,
      BRIDGE_ADDRESS_CONFIG,
      BRIDGE_ULN_CONFIGS
    )

    const bridgeHelper = bridgeHelperFactory.create(oftBridgeConfig)
    const { nativeFee } = await bridgeHelper.getMessageFee(input)

    const transfer = await bridgeHelper.transfer({ ...input, fee: { nativeFee } })
    const data = await transfer.unwrap()
    const boc = data.messages[0].payload.toBoc()

    const body = Cell.fromBoc(boc)[0]

    return {
      to: jettonWalletAddress,
      value: DUMMY_MESSAGE_VALUE,
      body
    }
  }

  async _getTransferInput ({ targetChain, recipient, amount, oftBridgeConfig }) {
    const address = await this._account.getAddress()

    const dstAddress = parseTonAddress(recipient).toRawString()
      .replace(':', 'x')

    const srcAmount = CurrencyAmount.fromRawAmount(
      Token.from({ chainKey: 'ton', decimals: oftBridgeConfig.sharedDecimals }),
      amount
    )

    const dstAmountMin = CurrencyAmount.fromRawAmount(
      Token.from({ chainKey: targetChain, decimals: oftBridgeConfig.sharedDecimals }),
      BigInt(amount) - this._getContractFee(amount)
    )

    const dstNativeAmount = CurrencyAmount.fromRawAmount(
      Coin.from({ chainKey: targetChain, decimals: 0 }),
      0
    )

    return {
      srcChainKey: 'ton',
      dstChainKey: targetChain,
      srcToken: { chainKey: 'ton' },
      dstToken: { chainKey: targetChain },
      srcAddress: address,
      dstAddress,
      srcAmount,
      dstAmountMin,
      dstNativeAmount
    }
  }

  _getContractFee (amount) {
    amount = BigInt(amount)

    return amount * BRIDGE_FEE_BASIS_POINTS / DENOMINATOR_BASIS_POINTS
  }
}
