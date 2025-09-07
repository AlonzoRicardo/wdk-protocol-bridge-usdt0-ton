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

import { WalletAccountTon } from '@wdk/wallet-ton'

import { internal } from '@ton/ton'

import AbstractInternalUsdt0ProtocolTon from './abstract-internal-usdt0-protocol-ton.js'

export default class InternalUsdt0ProtocolTon extends AbstractInternalUsdt0ProtocolTon {
  async bridge ({ targetChain, recipient, token, amount, oft }) {
    if (!(this._account instanceof WalletAccountTon)) {
      throw new Error("The 'bridge(options)' method requires the protocol to be initialized with a non read-only account.")
    }

    if (!this._account._tonClient) {
      throw new Error('The wallet must be connected to ton center in order to perform bridge operations.')
    }

    const txParams = this._getBridgeTxParams({ targetChain, recipient, token, amount, oft })

    const message = internal(txParams)

    const transfer = await this._account._getTransfer(message)
    const fee = await this._account._getTransferFee(transfer)
    const bridgeFee = this._getContractFee(amount)

    if (this._config.bridgeMaxFee !== undefined && fee + bridgeFee >= this._config.bridgeMaxFee) {
      throw new Error('The bridge operation exceeds the bridge max fee.')
    }

    await this._account._contract.send(transfer)

    return {
      hash: this._account._getMessageHash(message),
      fee,
      bridgeFee
    }
  }

  async quoteBridge ({ targetChain, recipient, token, amount, oft }) {
    if (!this._account._tonClient) {
      throw new Error('The wallet must be connected to ton center in order to quote bridge operations.')
    }

    const txParams = this._getBridgeTxParams({ targetChain, recipient, token, amount, oft })

    const message = internal(txParams)

    const transfer = await this._account._getTransfer(message)
    const fee = await this._account._getTransferFee(transfer)
    const bridgeFee = this._getContractFee(amount)

    return {
      fee,
      bridgeFee
    }
  }
}
