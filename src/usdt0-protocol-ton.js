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

import { BridgeProtocol } from '@tetherto/wdk-wallet/protocols'

import { WalletAccountReadOnlyTon } from '@tetherto/wdk-wallet-ton'

import InternalUsdt0ProtocolTon from './internal-usdt0-protocol-ton.js'

import InternalUsdt0ProtocolTonGasless from './internal-usdt0-protocol-ton-gasless.js'

/** @typedef {import('@wdk-ton-packages/ui-bridge-oft/types').OftBridgeConfig} OftBridgeConfig */

/** @typedef {import('@tetherto/wdk-wallet/protocols').BridgeProtocolConfig} BridgeProtocolConfig */
/** @typedef {import('@tetherto/wdk-wallet/protocols').BridgeOptions} BridgeOptions */
/** @typedef {import('@tetherto/wdk-wallet/protocols').BridgeResult} BridgeResult */

/** @typedef {import('@tetherto/wdk-wallet-ton').WalletAccountTon} WalletAccountTon */

/** @typedef {import('@tetherto/wdk-wallet-ton-gasless').WalletAccountReadOnlyTonGasless} WalletAccountReadOnlyTonGasless */
/** @typedef {import('@tetherto/wdk-wallet-ton-gasless').WalletAccountTonGasless} WalletAccountTonGasless */
/** @typedef {import('@tetherto/wdk-wallet-ton-gasless').TonGaslessWalletConfig} TonGaslessWalletConfig */

/**
 * @typedef {BridgeOptions} Usdt0BridgeOptions
 * @property {OftBridgeConfig} [oft] - If set, overrides the default oft config for the token to bridge. Users may use this argument to bridge jetton tokens that are not natively supported.
 */

export default class Usdt0ProtocolTon extends BridgeProtocol {
  /**
   * Creates a new read-only interface to the usdt0 protocol for the ton blockchain.
   *
   * @overload
   * @param {WalletAccountReadOnlyTon | WalletAccountReadOnlyTonGasless} account - The wallet account to use to interact with the protocol.
   * @param {BridgeProtocolConfig} [config] - The bridge protocol configuration.
   */

  /**
   * Creates a new interface to the usdt0 protocol for the ton blockchain.
   *
   * @overload
   * @param {WalletAccountTon | WalletAccountTonGasless} account - The wallet account to use to interact with the protocol.
   * @param {BridgeProtocolConfig} [config] - The bridge protocol configuration.
   */
  constructor (account, config) {
    super(account, config)

    /** @private */
    this._underlyingProtocol = account instanceof WalletAccountReadOnlyTon
      ? new InternalUsdt0ProtocolTon(account, config)
      : new InternalUsdt0ProtocolTonGasless(account, config)
  }

  /**
   * Bridges a token to a different blockchain.
   *
   * @param {Usdt0BridgeOptions} options - The bridge's options.
   * @param {Pick<TonGaslessWalletConfig, 'paymasterToken'> & Pick<BridgeProtocolConfig, 'bridgeMaxFee'>} [config] - If the protocol has
   *   been initialized with a gasless wallet account, overrides the 'paymasterToken' option defined in its configuration and the
   *   'bridgeMaxFee' option defined in the protocol configuration.
   * @returns {Promise<BridgeResult>} The bridge's result.
   */
  async bridge (options, config) {
    return await this._underlyingProtocol.bridge(options, config)
  }

  /**
   * Quotes the costs of a bridge operation.
   *
   * @param {Usdt0BridgeOptions} options - The bridge's options.
   * @param {Pick<TonGaslessWalletConfig, 'paymasterToken'>} [config] - If the protocol has been initialized with a gasless
   *   wallet account, overrides the 'paymasterToken' option defined in its configuration.
   * @returns {Promise<Omit<BridgeResult, 'hash'>>} The bridge's quotes.
   */
  async quoteBridge (options, config) {
    return await this._underlyingProtocol.quoteBridge(options, config)
  }
}
