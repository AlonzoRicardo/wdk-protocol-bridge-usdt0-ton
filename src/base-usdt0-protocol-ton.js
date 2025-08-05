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
import { replace } from 'lodash-es'
import { Cell } from '@ton/ton'
import { parseTonAddress } from '@wdk-ton-packages/ui-ton'
// eslint-disable-next-line camelcase
import { OftBridgeApiFactory__ton } from '@wdk-ton-packages/ui-bridge-oft/ton'

import OFT_TOKEN_CONFIG from './data/oft-token-config.json' with { type: 'json' }

const BRIDGE_FEE_BASIS_POINTS = 10n
const BASIS_POINTS_DENOMINATOR = 10_000n

const BRIDGE_ADDRESS_CONFIG = {
  oftProxy: '0x170725394aa56136fbd27d0ce31d8a98e0f8ae72a4d2379b5dde83e211a2d5fa',
  controller: '0x1eb2bbea3d8c0d42ff7fd60f0264c866c934bbff727526ca759e7374cae0c166',
  ulnManager: '0x150645746e25be5486eb3b2f5d98b44c6b324697c48d495d059f96fc9d3ec368',
  token: '0xb113a994b5024a16719f69139328eb759596c38a25f59028b146fecdc3621dfe',
  executor: ''
}

const BRIDGE_ULN_CONFIGS = [
  {
    confirmations: '5',
    confirmationsNull: false,
    executor: '0x0',
    executorNull: true,
    maxMessageBytes: '42',
    optionalDVNs: [],
    optionalDVNsNull: false,
    requiredDVNs: ['0xd122dec4ec8bd66c68344faf0dd471d727a7d57a21b62051705bbe2e4c272a7'],
    requiredDVNsNull: false,
    workerQuoteGasLimit: '120000'
  }
]

export default class BaseUsdt0ProtocolTon extends BridgeProtocol {
  constructor(account, config) {
    super(account, config)
  }

  async _prepareBridge(options) {
    let { targetChain, token, amount, oft } = options
    targetChain = targetChain.toLowerCase()

    if (targetChain === 'ton') {
      throw new Error('The target chain cannot be equal to the source chain (ton).')
    }

    if (!oft) {
      if (!OFT_TOKEN_CONFIG[token]) {
        throw new Error(`Bridge not supported for token: ${token}. Provide a custom oft configuration to bridge this token.`)
      }
      oft = OFT_TOKEN_CONFIG[token]
    }

    if (!oft.deployments[targetChain]) {
      throw new Error(`Target chain '${targetChain}' not supported yet.`)
    }

    const balance = await this._account.getTokenBalance(token)
    if (balance < amount) {
      throw new Error('Not enough jetton token balance to bridge.')
    }

    const address = await this._account.getAddress()
    const decimals = oft.sharedDecimals

    const jettonWalletAddress = await this._account._tonAccount._getJettonWalletAddress(token)
    if (!jettonWalletAddress) {
      throw new Error('Jetton wallet address not found.')
    }

    return { oft, address, decimals, jettonWalletAddress }
  }

  async _getBridgeBody(input, oftBridgeConfig) {
    const bridgeHelper = new OftBridgeApiFactory__ton(
      this._account._tonAccount._tonClient,
      BRIDGE_ADDRESS_CONFIG,
      BRIDGE_ULN_CONFIGS
    ).create(oftBridgeConfig)

    const { nativeFee } = await bridgeHelper.getMessageFee(input)
    input.fee = { nativeFee }

    const transfer = await bridgeHelper.transfer(input)
    const data = await transfer.unwrap()

    const boc = data.messages[0].payload.toBoc()
    return Cell.fromBoc(boc)[0]
  }

  _parseAddressToHex(address) {
    return replace(parseTonAddress(address).toRawString(), ':', 'x')
  }

  _getContractFee(amount) {
    return Number((BigInt(amount) * BRIDGE_FEE_BASIS_POINTS) / BASIS_POINTS_DENOMINATOR)
  }

  _subtractContractFeeFromAmount(amount) {
    return Number((BigInt(amount) * (BASIS_POINTS_DENOMINATOR - BRIDGE_FEE_BASIS_POINTS)) / BASIS_POINTS_DENOMINATOR)
  }
}
