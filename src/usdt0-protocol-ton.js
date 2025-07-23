
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

import { AbstractBridgeProtocol } from '@wdk/wallet/protocols'
import { WalletAccountTonGasless } from '@wdk/wallet-ton-gasless'

import { replace } from 'lodash-es'
import { Address, beginCell, storeMessageRelaxed, toNano, internal, Cell, external, SendMode, storeMessage } from '@ton/ton'
import { Coin, CurrencyAmount, Token } from '@wdk-ton-packages/ui-core'
import { parseTonAddress } from '@wdk-ton-packages/ui-ton'
import { createOftBridgeConfig } from '@wdk-ton-packages/ui-bridge-oft'
// eslint-disable-next-line camelcase
import { OftBridgeApiFactory__ton } from '@wdk-ton-packages/ui-bridge-oft/ton'

import OFT_TOKEN_CONFIG from './data/oft-token-config.json' with { type: 'json' }

/**
 * @typedef {import('@wdk/wallet/protocols').BridgeProtocolConfig} BridgeProtocolConfig
 */

/**
 * @typedef {Object} BridgeOptions
 * @property {string} targetChain - The identifier of the destination blockchain (e.g., "arbitrum").
 * @property {string} token - The address of the token to bridge.
 * @property {string} recipient - The address of the recipient.
 * @property {number} amount - The amount of tokens to bridge to the destination chain (in base unit).
 */

/**
 * @typedef {Object} BridgeResult
 * @property {string} hash - The hash of the bridge operation.
 * @property {number} fee - The gas cost.
 * @property {number} bridgeFee - The bridge cost in the bridged token.
 */

/**
 * @typedef {Object} BridgeQuote
 * @property {number} fee - The gas cost.
 * @property {number} bridgeFee - The bridge cost in the bridged token.
 */

const BRIDGE_FEE_BASIS_POINTS = 10n
const BASIS_POINTS_DENOMINATOR = 10_000n
const DUMMY_MESSAGE_VALUE = toNano(0.5)

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

/**
 * USDT0 Protocol implementation for TON blockchain bridge operations.
 * Extends AbstractBridgeProtocol to provide token bridging functionality.
 */
export default class Usdt0ProtocolTon extends AbstractBridgeProtocol {
  /**
   * Creates a new USDT0 Protocol TON instance.
   * @param {import('@wdk/wallet/protocols').IWalletAccount} account - The wallet account to use to interact with the protocol.
   * @param {BridgeProtocolConfig} [config] - The bridge protocol configuration.
   */
  constructor(account, config) {
    super(account, config)
    this._underlyingProtocol = account instanceof WalletAccountTonGasless
      ? new InternalUsdt0ProtocolTonGasless(account, config)
      : new InternalUsdt0ProtocolTon(account, config)
  }

  /**
   * Bridges a token to a different blockchain.
   * @param {BridgeOptions} options - The bridge's options.
   * @returns {Promise<BridgeResult>} The bridge's result.
   */
  async bridge(options, config) {
    return await this._underlyingProtocol.bridge(options, config)
  }

  /**
   * Quotes the costs of a bridge operation.
   * @param {BridgeOptions} options - The bridge's options.
   * @returns {Promise<BridgeQuote>} The bridge's quotes.
   * @throws {Error} When quote calculation fails or validation fails.
   */
  async quoteBridge(options) {
    return await this._underlyingProtocol.quoteBridge(options)
  }
}

/**
 * Internal protocol for gasless bridge opreations.
 */
class InternalUsdt0ProtocolTonGasless extends AbstractBridgeProtocol {
  constructor(account, config) {
    super(account, config)
  }

  async bridge({ recipient, targetChain, token, amount, oft, simulate = false }, config) {
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

    const body = await this._getBridgeBody(
      {
        dstChainKey: targetChain,
        srcAddress: address,
        srcToken: {
          chainKey: 'ton'
        },
        dstToken: {
          chainKey: targetChain
        },
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
      createOftBridgeConfig(oft)
    )

    const { paymasterToken, bridgeMaxFee } = config ?? this._config

    const jettonWalletAddress = await this._account._getJettonWalletAddress(token)

    if (!jettonWalletAddress) {
      throw new Error('Jetton wallet address not found.')
    }

    const internalMessage = internal({
      to: jettonWalletAddress,
      value: DUMMY_MESSAGE_VALUE,
      body
    })

    const message = beginCell()
      .storeWritable(storeMessageRelaxed(internalMessage))
      .endCell()

    const gaslessParams = await this.getGaslessEstimate(
      Address.parse(paymasterToken.address),
      message,
    )

    const gasCostInPaymasterToken = Number(gaslessParams.commission)

    if (bridgeMaxFee && gasCostInPaymasterToken >= bridgeMaxFee) {
      throw new Error('The bridge operation exceeds the bridge max fee.')
    }

    if (simulate) {
      return {
        hash: null,
        commission: gasCostInPaymasterToken
      }
    }

    await this.sendGaslessTransaction(gaslessParams, token)

    return {
      hash: this._account._getHash(internalMessage).toString('hex'),
      gasCost: gasCostInPaymasterToken,
      bridgeCost: this._getContractFee(amount)
    }
  }

  async quoteBridge(options, config) {
    return await this.bridge({ ...options, simulate: true }, config)
  }

  async _getBridgeBody(input, oftBridgeConfig) {
    const bridgeHelper = new OftBridgeApiFactory__ton(
      this._account._tonClient,
      BRIDGE_ADDRESS_CONFIG,
      BRIDGE_ULN_CONFIGS
    )
      .create(oftBridgeConfig)

    const { nativeFee } = await bridgeHelper.getMessageFee(input)

    input.fee = { nativeFee }

    const transfer = await bridgeHelper.transfer(input)
    const data = await transfer.unwrap()

    const boc = data.messages[0].payload.toBoc()
    return Cell.fromBoc(boc)[0]
  }


  async sendGaslessTransaction(gaslessParams, token) {
    const { keyPair } = this._account

    const jettonMasterBalance = await this._account.getTokenBalance(token)

    if (jettonMasterBalance < Number(gaslessParams.commission)) {
      throw new Error('Not enough jetton master balance.')
    }

    const contract = this._account._tonClient.open(this._account._wallet)
    const seqno = await contract.getSeqno()

    const transfer = this._account._wallet.createTransfer({
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

    return {
      hash: null,
      commission: Number(gaslessParams.commission)
    }
  }

  async getGaslessEstimate(jettonMasterAddress, boc) {
    return await this._account._tonApiClient.gasless.gaslessEstimate(
      jettonMasterAddress,
      {
        walletAddress: this._account._wallet.address,
        walletPublicKey: Buffer.from(this._account._wallet.publicKey).toString('hex'),
        messages: [{ boc }]
      }
    )
  }

  async getRelayAddress() {
    const gaslessConfig = await this._account._tonApiClient.gasless.gaslessConfig()

    return gaslessConfig.relayAddress
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

/**
 * Standard protocol for user-funded bridge operations from TON.
 * In this protocol, the user pays the network fees directly from their TON balance.
 */
class InternalUsdt0ProtocolTon extends AbstractBridgeProtocol {
  constructor(account, config) {
    super(account, config)
  }

  async bridge({ recipient, targetChain, token, amount, oft, simulate = false }) {
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
          Coin.from({ chainKey: 'targetChain', decimals: 0 }),
          0
        )
      },
      createOftBridgeConfig(oft)
    )

    const jettonWalletAddress = await this._account._getJettonWalletAddress(token)

    if (!jettonWalletAddress) {
      throw new Error('Jetton wallet address not found.')
    }

    const internalMessage = internal({
      to: jettonWalletAddress,
      value: DUMMY_MESSAGE_VALUE,
      body
    })

    const { keyPair, _wallet, _tonClient } = this._account;
    
    if (!keyPair || !keyPair.privateKey) {
      throw new Error('Private key is required to bridge or quote a bridge operation.');
    }

    const walletContract = _tonClient.open(_wallet);
    const seqno = await walletContract.getSeqno();

    const transfer = walletContract.createTransfer({
      secretKey: keyPair.privateKey,
      seqno,
      messages: [internalMessage],
      sendMode: SendMode.PAY_GAS_SEPARATELY | SendMode.IGNORE_ERRORS,
      timeout: Math.floor(Date.now() / 1000) + 60,
    });

    const estimatedGas = await this._getTransferFee(transfer);

    if (simulate) {
      return {
        hash: null,
        gasCost: estimatedGas,
        bridgeCost: this._getContractFee(amount)
      }
    }

    await walletContract.send(transfer);

    return {
      hash: this._account._getHash(internalMessage).toString('hex'),
      gasCost: estimatedGas,
      bridgeCost: this._getContractFee(amount)
    }
  }

  async quoteBridge(options) {
    return await this.bridge({ ...options, simulate: true })
  }

  async _sendStandardTransaction(message) {
    const { keyPair, _wallet, _tonClient } = this._account

    if (!keyPair || !keyPair.privateKey) {
      throw new Error('Private key is required to send a standard transaction.')
    }

    const walletContract = _tonClient.open(_wallet)
    const seqno = await walletContract.getSeqno()

    const transfer = walletContract.createTransfer({
      secretKey: keyPair.privateKey,
      seqno: seqno,
      messages: [message],
      sendMode: SendMode.PAY_GAS_SEPARATELY | SendMode.IGNORE_ERRORS,
      timeout: Math.floor(Date.now() / 1000) + 60,
    })

    await walletContract.send(transfer)
  }

  async _getBridgeBody(input, oftBridgeConfig) {
    const bridgeHelper = new OftBridgeApiFactory__ton(
      this._account._tonClient,
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

  /** @private */
  async _getTransferFee(transfer) {
    /* eslint-disable camelcase */
    const { source_fees: { in_fwd_fee, storage_fee, gas_fee, fwd_fee } } =
      await this._account._tonClient.estimateExternalMessageFee(this._account._wallet.address, { body: transfer })

    return in_fwd_fee + storage_fee + gas_fee + fwd_fee
  }
}