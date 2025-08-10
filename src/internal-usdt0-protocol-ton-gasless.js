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
import { Address, beginCell, storeMessageRelaxed, toNano, internal, external, SendMode, storeMessage } from '@ton/ton'
import { Coin, CurrencyAmount, Token } from '@wdk-ton-packages/ui-core'
import { createOftBridgeConfig } from '@wdk-ton-packages/ui-bridge-oft'

const DUMMY_MESSAGE_VALUE = toNano(0.5)

export default class InternalUsdt0ProtocolTonGasless extends BaseUsdt0ProtocolTon {
  constructor (account, config) {
    super(account._tonAccount, config)
    this._gaslessAccount = account
    this._tonAccount = account._tonAccount
  }

  async bridge ({ recipient, targetChain, token, amount, oft, simulate = false }, config) {
    const { oft: preparedOft, address, decimals, jettonWalletAddress } = await this._prepareBridge({ recipient, targetChain, token, amount, oft })

    const body = await this._getBridgeBody(
      {
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

    const { paymasterToken, bridgeMaxFee } = config ?? this._config

    const internalMessage = internal({
      to: jettonWalletAddress,
      value: DUMMY_MESSAGE_VALUE,
      body
    })

    const message = beginCell()
      .storeWritable(storeMessageRelaxed(internalMessage))
      .endCell()

    const gaslessParams = await this._getGaslessEstimate(
      Address.parse(paymasterToken.address),
      message
    )

    const bridgeFee = this._getContractFee(amount)
    const fee = Number(gaslessParams.commission)

    if (bridgeMaxFee && (fee + bridgeFee) >= bridgeMaxFee) {
      throw new Error('The bridge operation exceeds the bridge max fee.')
    }

    if (simulate) {
      return {
        hash: null,
        fee,
        bridgeFee
      }
    }

    await this._sendGaslessTransaction(gaslessParams, token)

    return {
      hash: this._account._tonAccount._getMessageHash(internalMessage).toString('hex'),
      fee,
      bridgeFee
    }
  }

  async quoteBridge (options, config) {
    return await this.bridge({ ...options, simulate: true }, config)
  }

  async _sendGaslessTransaction (gaslessParams, token) {
    const { keyPair } = this._account

    const jettonMasterBalance = await this._account.getTokenBalance(token)

    if (jettonMasterBalance < Number(gaslessParams.commission)) {
      throw new Error('Not enough jetton master balance.')
    }

    const contract = this._tonAccount._tonClient.open(this._tonAccount._wallet)
    const seqno = await contract.getSeqno()

    const transfer = this._tonAccount._wallet.createTransfer({
      seqno,
      authType: 'internal',
      timeout: Math.ceil(Date.now() / 1000) + 60,
      secretKey: keyPair.privateKey,
      sendMode: SendMode.PAY_GAS_SEPARATELY + SendMode.IGNORE_ERRORS,
      messages: gaslessParams.messages.map(message =>
        internal({
          to: message.address,
          value: BigInt(message.amount),
          body: message.payload
        })
      )
    })

    const message = beginCell()
      .storeWritable(
        storeMessage(
          external({
            init: seqno === 0 ? contract.init : undefined,
            to: contract.address,
            body: transfer
          })
        )
      )
      .endCell()

    await this._account._tonApiClient.gasless.gaslessSend({
      walletPublicKey: Buffer.from(keyPair.publicKey).toString('hex'),
      boc: message
    })
  }

  async _getGaslessEstimate (jettonMasterAddress, boc) {
    return await this._gaslessAccount._tonApiClient.gasless.gaslessEstimate(
      jettonMasterAddress,
      {
        walletAddress: this._tonAccount._wallet.address,
        walletPublicKey: Buffer.from(this._tonAccount._wallet.publicKey).toString('hex'),
        messages: [{ boc }]
      }
    )
  }
}
