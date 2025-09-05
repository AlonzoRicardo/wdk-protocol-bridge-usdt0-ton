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

import BaseUsdt0ProtocolTon from './base-usdt0-protocol-ton.js'
import { internal, SendMode, toNano } from '@ton/ton'
import { Coin, CurrencyAmount, Token } from '@wdk-ton-packages/ui-core'
import { createOftBridgeConfig } from '@wdk-ton-packages/ui-bridge-oft'

const DUMMY_MESSAGE_VALUE = toNano(0.8)

export default class InternalUsdt0ProtocolTon extends BaseUsdt0ProtocolTon {
  async bridge ({ recipient, targetChain, token, amount, oft, simulate = false }) {
    const { oft: preparedOft, address, decimals, jettonWalletAddress } = await this._prepareBridge({ recipient, targetChain, token, amount, oft })

    const body = await this._getBridgeBody(
      {
        srcChainKey: 'ton',
        dstChainKey: targetChain,
        srcAddress: address,
        srcToken: { chainKey: 'ton' },
        dstToken: { chainKey: targetChain },
        srcAmount: CurrencyAmount.fromRawAmount(
          Token.from({ chainKey: 'ton', decimals }),
          amount
        ),
        dstAddress: this._parseAddressToHex(recipient),
        dstAmountMin: CurrencyAmount.fromRawAmount(
          Token.from({ chainKey: targetChain, decimals }),
          this._subtractContractFeeFromAmount(amount)
        ),
        dstNativeAmount: CurrencyAmount.fromRawAmount(
          Coin.from({ chainKey: targetChain, decimals: 0 }),
          0
        )
      },
      createOftBridgeConfig(preparedOft)
    )

    const internalMessage = internal({
      to: jettonWalletAddress,
      value: DUMMY_MESSAGE_VALUE,
      body
    })

    const { keyPair, _wallet, _tonClient } = this._account
    const walletContract = _tonClient.open(_wallet)
    const seqno = await walletContract.getSeqno()

    const transfer = walletContract.createTransfer({
      secretKey: keyPair.privateKey,
      seqno,
      messages: [internalMessage],
      sendMode: SendMode.PAY_GAS_SEPARATELY | SendMode.IGNORE_ERRORS,
      timeout: Math.floor(Date.now() / 1000) + 60
    })

    const estimatedGas = await this._getTransferFee(transfer)

    if (simulate) {
      return {
        hash: null,
        fee: estimatedGas,
        bridgeFee: this._getContractFee(amount)
      }
    }

    await walletContract.send(transfer)

    return {
      hash: this._account._getMessageHash(internalMessage).toString('hex'),
      fee: estimatedGas,
      bridgeFee: this._getContractFee(amount)
    }
  }

  async quoteBridge (options) {
    return await this.bridge({ ...options, simulate: true })
  }

  async _getTransferFee (transfer) {
    /* eslint-disable camelcase */
    const { source_fees: { in_fwd_fee, storage_fee, gas_fee, fwd_fee } } =
      await this._account._tonClient.estimateExternalMessageFee(this._account._wallet.address, { body: transfer })

    return Number(in_fwd_fee + storage_fee + gas_fee + fwd_fee)
  }
}
