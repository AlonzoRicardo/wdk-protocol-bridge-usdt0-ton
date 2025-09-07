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

import { WalletAccountTonGasless } from '@wdk/wallet-ton-gasless'

import { internal } from '@ton/ton'

import AbstractInternalUsdt0ProtocolTon from './abstract-internal-usdt0-protocol-ton.js'

export default class InternalUsdt0ProtocolTonGasless extends AbstractInternalUsdt0ProtocolTon {
  constructor (account, config) {
    super(account._tonAccount, config)

    this._gaslessAccount = account
  }

  async bridge ({ recipient, targetChain, token, amount, oft }, config) {
    if (!(this._gaslessAccount instanceof WalletAccountTonGasless)) {
      throw new Error("The 'bridge(options)' method requires the protocol to be initialized with a non read-only account.")
    }

    const { paymasterToken } = config ?? this._gaslessAccount._config

    const { bridgeMaxFee } = config ?? this._config

    const txParams = this._getBridgeTxParams({ targetChain, recipient, token, amount, oft })

    const message = internal(txParams)

    const rawParams = await this._gaslessAccount._getGaslessTokenTransferRawParams(message, { paymasterToken })
    const fee = rawParams.commission
    const bridgeFee = this._getContractFee(amount)

    if (bridgeMaxFee !== undefined && fee + bridgeFee >= bridgeMaxFee) {
      throw new Error('The bridge operation exceeds the bridge max fee.')
    }

    await this._gaslessAccount._sendGaslessTokenTransfer(rawParams)

    return {
      hash: this._account._getMessageHash(message),
      fee,
      bridgeFee
    }
  }

  async quoteBridge ({ targetChain, recipient, token, amount, oft }, config) {
    const { paymasterToken } = config ?? this._gaslessAccount._config

    const txParams = this._getBridgeTxParams({ targetChain, recipient, token, amount, oft })

    const message = internal(txParams)

    const rawParams = await this._gaslessAccount._getGaslessTokenTransferRawParams(message, { paymasterToken })
    const fee = rawParams.commission
    const bridgeFee = this._getContractFee(amount)

    return {
      fee,
      bridgeFee
    }
  }
}
