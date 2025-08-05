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
 * Extends BridgeProtocol to provide token bridging functionality.
 */
export default class Usdt0ProtocolTon {
    /**
     * Creates a new USDT0 Protocol TON instance.
     * @param {import('@wdk/wallet/protocols').IWalletAccount} account - The wallet account to use to interact with the protocol.
     * @param {BridgeProtocolConfig} [config] - The bridge protocol configuration.
     */
    constructor(account: any, config?: BridgeProtocolConfig);
    _underlyingProtocol: any;
    /**
     * Bridges a token to a different blockchain.
     * @param {BridgeOptions} options - The bridge's options.
     * @param {Pick<BridgeProtocolConfig, 'bridgeMaxFee', 'paymasterToken'>} [config] - If set, overrides the 'bridgeMaxFee' and 'paymasterToken' options defined in the manager configuration.
     * @returns {Promise<BridgeResult>} The bridge's result.
     */
    bridge(options: BridgeOptions, config?: Pick<BridgeProtocolConfig, "bridgeMaxFee", "paymasterToken">): Promise<BridgeResult>;
    /**
     * Quotes the costs of a bridge operation.
     * @param {BridgeOptions} options - The bridge's options.
     * @param {Pick<BridgeProtocolConfig, 'bridgeMaxFee', 'paymasterToken'>} [config] - If set, overrides the 'bridgeMaxFee' and 'paymasterToken' options defined in the manager configuration.
     * @throws {Error} When quote calculation fails or validation fails.
     */
    quoteBridge(options: BridgeOptions): Promise<any>;
}
export type BridgeProtocolConfig = import('@wdk/wallet/protocols').BridgeProtocolConfig;
export type OftBridgeConfig = import('@wdk-ton-packages/ui-bridge-oft/types').OftBridgeConfig;
export type BridgeOptions = {
    /**
     * - The identifier of the destination blockchain (e.g., "arbitrum").
     */
    targetChain: string;
    /**
     * - The address of the token to bridge.
     */
    token: string;
    /**
     * - The address of the recipient.
     */
    recipient: string;
    /**
     * - The amount of tokens to bridge to the destination chain (in base unit).
     */
    amount: number;
    /**
     * - If set, overrides the default oft config for the token to bridge. Users may use this argument to bridge jetton tokens that are not natively supported.
     */
    oft?: OftBridgeConfig;
};
export type BridgeResult = {
    /**
     * - The hash of the bridge operation.
     */
    hash: string;
    /**
     * - The gas cost.
     */
    fee: number;
    /**
     * - The bridge cost in the bridged token.
     */
    bridgeFee: number;
};
export type BridgeQuote = {
    /**
     * - The gas cost.
     */
    fee: number;
    /**
     * - The bridge cost in the bridged token.
     */
    bridgeFee: number;
};
