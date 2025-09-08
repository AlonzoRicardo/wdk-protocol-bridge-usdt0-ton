export default class Usdt0ProtocolTon extends BridgeProtocol {
    /**
     * Creates a new read-only interface to the usdt0 protocol for the ton blockchain.
     *
     * @overload
     * @param {WalletAccountReadOnlyTon | WalletAccountReadOnlyTonGasless} account - The wallet account to use to interact with the protocol.
     * @param {BridgeProtocolConfig} [config] - The bridge protocol configuration.
     */
    constructor(account: WalletAccountReadOnlyTon | WalletAccountReadOnlyTonGasless, config?: BridgeProtocolConfig);
    /**
     * Creates a new interface to the usdt0 protocol for the ton blockchain.
     *
     * @overload
     * @param {WalletAccountTon | WalletAccountTonGasless} account - The wallet account to use to interact with the protocol.
     * @param {BridgeProtocolConfig} [config] - The bridge protocol configuration.
     */
    constructor(account: WalletAccountTon | WalletAccountTonGasless, config?: BridgeProtocolConfig);
    /** @private */
    private _underlyingProtocol;
    /**
     * Bridges a token to a different blockchain.
     *
     * @param {Usdt0BridgeOptions} options - The bridge's options.
     * @param {Pick<TonGaslessWalletConfig, 'paymasterToken'> & Pick<BridgeProtocolConfig, 'bridgeMaxFee'>} [config] - If the protocol has
     *   been initialized with a gasless wallet account, overrides the 'paymasterToken' option defined in its configuration and the
     *   'bridgeMaxFee' option defined in the protocol configuration.
     * @returns {Promise<BridgeResult>} The bridge's result.
     */
    bridge(options: Usdt0BridgeOptions, config?: Pick<TonGaslessWalletConfig, "paymasterToken"> & Pick<BridgeProtocolConfig, "bridgeMaxFee">): Promise<BridgeResult>;
    /**
     * Quotes the costs of a bridge operation.
     *
     * @param {Usdt0BridgeOptions} options - The bridge's options.
     * @param {Pick<TonGaslessWalletConfig, 'paymasterToken'>} [config] - If the protocol has been initialized with a gasless
     *   wallet account, overrides the 'paymasterToken' option defined in its configuration.
     * @returns {Promise<Omit<BridgeResult, 'hash'>>} The bridge's quotes.
     */
    quoteBridge(options: Usdt0BridgeOptions, config?: Pick<TonGaslessWalletConfig, "paymasterToken">): Promise<Omit<BridgeResult, "hash">>;
}
export type OftBridgeConfig = import("@wdk-ton-packages/ui-bridge-oft/types").OftBridgeConfig;
export type BridgeProtocolConfig = import("@wdk/wallet/protocols").BridgeProtocolConfig;
export type BridgeOptions = import("@wdk/wallet/protocols").BridgeOptions;
export type BridgeResult = import("@wdk/wallet/protocols").BridgeResult;
export type WalletAccountTon = import("@wdk/wallet-ton").WalletAccountTon;
export type WalletAccountReadOnlyTonGasless = import("@wdk/wallet-ton-gasless").WalletAccountReadOnlyTonGasless;
export type WalletAccountTonGasless = import("@wdk/wallet-ton-gasless").WalletAccountTonGasless;
export type TonGaslessWalletConfig = import("@wdk/wallet-ton-gasless").TonGaslessWalletConfig;
export type Usdt0BridgeOptions = BridgeOptions;
import { BridgeProtocol } from '@wdk/wallet/protocols';
import { WalletAccountReadOnlyTon } from '@wdk/wallet-ton';
