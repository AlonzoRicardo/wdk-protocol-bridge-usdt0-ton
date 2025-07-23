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
import InternalUsdt0ProtocolTon from './internal-usdt0-protocol-ton.js'
import InternalUsdt0ProtocolTonGasless from './internal-usdt0-protocol-ton-gasless.js'

/** @typedef {import('@wdk/wallet/protocols').BridgeProtocolConfig} BridgeProtocolConfig */

/** @typedef {import('@wdk-ton-packages/ui-bridge-oft/types').OftBridgeConfig} OftBridgeConfig */

/**
 * @typedef {Object} BridgeOptions
 * @property {string} targetChain - The identifier of the destination blockchain (e.g., "arbitrum").
 * @property {string} token - The address of the token to bridge.
 * @property {string} recipient - The address of the recipient.
 * @property {number} amount - The amount of tokens to bridge to the destination chain (in base unit).
 * @property {OftBridgeConfig} [oft] - If set, overrides the default oft config for the token to bridge. Users may use this argument to bridge jetton tokens that are not natively supported.
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
  constructor (account, config) {
    super(account, config)
    this._underlyingProtocol = account instanceof WalletAccountTonGasless
      ? new InternalUsdt0ProtocolTonGasless(account, config)
      : new InternalUsdt0ProtocolTon(account, config)
  }

  /**
   * Bridges a token to a different blockchain.
   * @param {BridgeOptions} options - The bridge's options.
   * @param {Pick<BridgeProtocolConfig, 'bridgeMaxFee', 'paymasterToken'>} [config] - If set, overrides the 'bridgeMaxFee' and 'paymasterToken' options defined in the manager configuration.
   * @returns {Promise<BridgeResult>} The bridge's result.
   */
  async bridge (options, config) {
    return await this._underlyingProtocol.bridge(options, config)
  }

  /**
   * Quotes the costs of a bridge operation.
   * @param {BridgeOptions} options - The bridge's options.
   * @param {Pick<BridgeProtocolConfig, 'bridgeMaxFee', 'paymasterToken'>} [config] - If set, overrides the 'bridgeMaxFee' and 'paymasterToken' options defined in the manager configuration.
   * @throws {Error} When quote calculation fails or validation fails.
   */
  async quoteBridge (options) {
    return await this._underlyingProtocol.quoteBridge(options)
  }
}
