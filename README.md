# @tetherto/wdk-protocol-bridge-usdt0-ton

**Note**: This package is currently in beta. Please test thoroughly in development environments before using in production.

A simple and secure package that lets TON wallet accounts bridge [USDT0](https://usdt0.to/) tokens across different blockchains. This package provides a clean SDK for moving tokens between TON and other supported chains using the LayerZero protocol and USDT0 bridge system with support for both standard and gasless transactions.

This module can be managed by the [`@tetherto/wdk`](https://github.com/tetherto/wdk-core) package, which provides a unified interface for managing multiple WDK wallet and protocol modules across different blockchains.

## 🔍 About WDK

This module is part of the [**WDK (Wallet Development Kit)**](https://wallet.tether.io/) project, which empowers developers to build secure, non-custodial wallets with unified blockchain access, stateless architecture, and complete user control. 

For detailed documentation about the complete WDK ecosystem, visit [docs.wallet.tether.io](https://docs.wallet.tether.io).

## 🌟 Features

- **Cross-Chain Bridge**: Move USDT0 tokens between TON and other supported blockchains
- **LayerZero Integration**: Uses LayerZero protocol for secure cross-chain transfers
- **Multi-Chain Support**: Bridge from TON to Ethereum, Arbitrum, Polygon, and TRON
- **Gasless Support**: Works with both standard TON wallets and gasless TON accounts
- **Fee Management**: Built-in fee calculation and bridge cost estimation
- **Token Support**: Supports USDT and other USDT0 ecosystem tokens on TON
- **TypeScript Support**: Full TypeScript definitions included
- **Memory Safety**: Secure transaction handling with proper error management
- **Flexible Configuration**: Works with custom OFT configurations for unsupported jettons

## ⬇️ Installation

To install the `@tetherto/wdk-protocol-bridge-usdt0-ton` package, follow these instructions:

You can install it using npm:

```bash
npm install @tetherto/wdk-protocol-bridge-usdt0-ton
```

## 🚀 Quick Start

### Option 1: Using with WDK Core (Recommended)

```javascript
import WDK from '@tetherto/wdk'
import Usdt0ProtocolTon from '@tetherto/wdk-protocol-bridge-usdt0-ton'

// Create WDK instance with TON wallet support
const wdk = new WDK(seedPhrase)
  .registerWallet('ton', WalletManagerTon, {
    tonApiKey: 'YOUR_TON_API_KEY',
    tonApiEndpoint: 'YOUR_TON_API_ENDPOINT'
  })
  .registerProtocol('ton', 'usdt0', Usdt0ProtocolTon, {
    bridgeMaxFee: 1000000000n
  })

// Get account with bridge protocol
const account = await wdk.getAccount('ton', 0)
const usdt0Bridge = account.getBridgeProtocol('usdt0')

// Perform bridge
const result = await usdt0Bridge.bridge({
  targetChain: 'ethereum',
  recipient: 'RECIPIENT_ADDRESS',
  token: 'TON_TOKEN_ADDRESS',
  amount: 1000000n
})
```

### Option 2: Direct Usage

### Creating a New Bridge Service

```javascript
import Usdt0ProtocolTon from '@tetherto/wdk-protocol-bridge-usdt0-ton'
import { WalletAccountTon } from '@tetherto/wdk-wallet-ton'

// Use a BIP-39 seed phrase (replace with your own secure phrase)
const seedPhrase = 'test only example nut use this real life secret phrase must random'

// Create wallet account with TON API config
const account = new WalletAccountTon(seedPhrase, {
  tonApiKey: 'YOUR_TON_API_KEY',
  tonApiEndpoint: 'YOUR_TON_API_ENDPOINT'
})

// Create bridge service with configuration
const bridgeProtocol = new Usdt0ProtocolTon(account, {
  bridgeMaxFee: 1000000000n // Optional: Maximum bridge fee in nanotons
})

// OR for gasless accounts

import { WalletAccountTonGasless } from '@tetherto/wdk-wallet-ton-gasless'

// Create gasless account
const gaslessAccount = new WalletAccountTonGasless(seedPhrase, {
  tonApiKey: 'YOUR_TON_API_KEY',
  tonApiEndpoint: 'YOUR_TON_API_ENDPOINT',
  paymasterToken: 'USDT' // Token used to pay fees
})

// Create gasless bridge service
const gaslessBridgeProtocol = new Usdt0ProtocolTon(gaslessAccount, {
  bridgeMaxFee: 1000000000n
})
```

### Basic Cross-Chain Bridging

```javascript
// Bridge USDT from TON to Ethereum
const result = await bridgeProtocol.bridge({
  targetChain: 'ethereum', // Where to send tokens
  recipient: 'RECIPIENT_ADDRESS', // Who gets the tokens on target chain
  token: 'TON_TOKEN_ADDRESS', // USDT token address on TON
  amount: 1000000n // Amount to bridge (1 USDT in base units)
})

console.log('Bridge transaction hash:', result.hash)
console.log('Total fee:', result.fee, 'nanotons')
console.log('Bridge fee:', result.bridgeFee, 'nanotons')

// Bridge to Arbitrum
const arbitrumResult = await bridgeProtocol.bridge({
  targetChain: 'arbitrum',
  recipient: 'RECIPIENT_ADDRESS',
  token: 'TON_TOKEN_ADDRESS',
  amount: 5000000n // 5 USDT
})

// Bridge to TRON
const tronResult = await bridgeProtocol.bridge({
  targetChain: 'tron',
  recipient: 'RECIPIENT_ADDRESS',
  token: 'TON_TOKEN_ADDRESS',
  amount: 10000000n // 10 USDT
})
```

### Getting Bridge Quotes

```javascript
// Get bridge cost estimate before executing
const quote = await bridgeProtocol.quoteBridge({
  targetChain: 'ethereum',
  recipient: 'RECIPIENT_ADDRESS',
  token: 'TON_TOKEN_ADDRESS',
  amount: 1000000n
})

console.log('Estimated fee:', quote.fee, 'nanotons')
console.log('Estimated bridge fee:', quote.bridgeFee, 'nanotons')

// Check if bridge is cost-effective
if (quote.fee + quote.bridgeFee > 1000000000n) { // More than 1 TON
  console.log('Bridge fees too high, consider waiting or different amount')
} else {
  // Execute the bridge
  const result = await bridgeProtocol.bridge({
    targetChain: 'ethereum',
    recipient: 'RECIPIENT_ADDRESS',
    token: 'TON_TOKEN_ADDRESS',
    amount: 1000000n
  })
}
```

### Gasless Cross-Chain Bridging

```javascript
// Gasless bridge using USDT to pay fees
const gaslessResult = await gaslessBridgeProtocol.bridge({
  targetChain: 'ethereum',
  recipient: 'RECIPIENT_ADDRESS',
  token: 'TON_TOKEN_ADDRESS',
  amount: 1000000n
}, {
  paymasterToken: 'USDT', // Override paymaster token
  bridgeMaxFee: 1000000000n // Override max fee
})

console.log('Gasless bridge hash:', gaslessResult.hash)
console.log('Fee paid in USDT:', gaslessResult.fee)
console.log('Bridge service fee:', gaslessResult.bridgeFee)
```

### Custom Token Bridging

```javascript
// Bridge custom jetton tokens with OFT configuration
const customTokenResult = await bridgeProtocol.bridge({
  targetChain: 'ethereum',
  recipient: 'RECIPIENT_ADDRESS',
  token: 'CUSTOM_TOKEN_ADDRESS',
  amount: 1000000n,
  oft: {
    version: 3,
    sharedDecimals: 6,
    deployments: {
      ton: { 
        token: { address: 'TON_TOKEN_ADDRESS' }
      },
      ethereum: { 
        token: { address: 'ETH_TOKEN_ADDRESS' }
      }
    }
  }
})

console.log('Custom token bridge hash:', customTokenResult.hash)
```

### Advanced Bridge Operations

```javascript
// Quote bridge for multiple chains
const chains = ['ethereum', 'arbitrum', 'tron']
const amount = 1000000n
const token = 'TON_TOKEN_ADDRESS'
const recipient = 'RECIPIENT_ADDRESS'

for (const chain of chains) {
  try {
    const quote = await bridgeProtocol.quoteBridge({
      targetChain: chain,
      recipient,
      token,
      amount
    })
    
    console.log(`Bridge to ${chain}:`)
    console.log(`  Fee: ${quote.fee} nanotons`)
    console.log(`  Bridge fee: ${quote.bridgeFee} nanotons`)
    console.log(`  Total cost: ${quote.fee + quote.bridgeFee} nanotons`)
    
  } catch (error) {
    console.error(`Bridge to ${chain} not available:`, error.message)
  }
}
```

## 📚 API Reference

### Table of Contents

| Class | Description | Methods |
|-------|-------------|---------|
| [Usdt0ProtocolTon](#usdt0protocolton) | Main class for bridging USDT0 tokens from TON. Extends `BridgeProtocol` from `@tetherto/wdk-wallet/protocols`. | [Constructor](#constructor), [Methods](#methods) |

### Usdt0ProtocolTon

The main class for bridging USDT0 tokens from TON blockchain to other chains using the LayerZero protocol.  
Extends `BridgeProtocol` from `@tetherto/wdk-wallet/protocols`.

#### Constructor

```javascript
new Usdt0ProtocolTon(account, config)
```

**Parameters:**
- `account` (WalletAccountTon | WalletAccountTonGasless | WalletAccountReadOnlyTon | WalletAccountReadOnlyTonGasless): The wallet account to use for bridge operations
- `config` (object, optional): Configuration object
  - `bridgeMaxFee` (bigint, optional): Maximum total bridge cost in nanotons

**Example:**
```javascript
const bridgeProtocol = new Usdt0ProtocolTon(account, {
  bridgeMaxFee: 1000000000n // Maximum bridge fee in nanotons
})
```

#### Methods

| Method | Description | Returns |
|--------|-------------|---------|
| `bridge(options, config?)` | Bridges tokens from TON to another blockchain | `Promise<{hash: string, fee: bigint, bridgeFee: bigint}>` |
| `quoteBridge(options, config?)` | Gets the cost of a bridge operation | `Promise<{fee: bigint, bridgeFee: bigint}>` |

##### `bridge(options, config?)`
Bridges tokens from TON to a different blockchain using the USDT0 protocol.

**Parameters:**
- `options` (object): Bridge operation options
  - `targetChain` (string): Where to send tokens ('ethereum', 'arbitrum', 'tron')
  - `recipient` (string): Address that will get the bridged tokens
  - `token` (string): Token address on TON
  - `amount` (bigint): Amount to bridge in token base units
  - `oft` (object, optional): Custom token config for jettons not built in
- `config` (object, optional): Override settings for gasless accounts
  - `paymasterToken` (string, optional): Token to use for paying fees
  - `bridgeMaxFee` (bigint, optional): Override maximum bridge fee

**Returns:** `Promise<BridgeResult>` - Bridge operation result

**Example:**
```javascript
const result = await bridgeProtocol.bridge({
  targetChain: 'ethereum',
  recipient: 'RECIPIENT_ADDRESS',
  token: 'TON_TOKEN_ADDRESS',
  amount: 1000000n
})
```

##### `quoteBridge(options, config?)`
Gets the cost of a bridge operation without executing it.

**Parameters:**
- `options` (object): Same as bridge method
- `config` (object, optional): Override settings for gasless accounts

**Returns:** `Promise<BridgeQuote>` - Bridge cost estimate

**Example:**
```javascript
const quote = await bridgeProtocol.quoteBridge({
  targetChain: 'ethereum',
  recipient: 'RECIPIENT_ADDRESS',
  token: 'TON_TOKEN_ADDRESS',
  amount: 1000000n
})
```

## 🌐 Supported Networks

This package works with TON blockchain and can bridge to:

**Source Chain:**
- **TON Mainnet** (EID: 30343)
- **TON Testnet**

**Target Chains:**
- **Ethereum** (Chain ID: 1, EID: 30101)
- **Arbitrum** (Chain ID: 42161, EID: 30110)
- **TRON** (EID: 30420)
- **EVM L2 Networks** (Various Layer 2 solutions)

**Token Support:**
- USDT and other USDT0 ecosystem tokens
- Custom jetton tokens with OFT configuration
- Token support determined by OFT (Omnichain Fungible Token) contracts

**Note:** The protocol uses LayerZero's endpoint IDs (EIDs) to identify destination chains and handle cross-chain communication.

## 🔒 Security Considerations

- **Seed Phrase Security**: Always store your seed phrase securely and never share it
- **Private Key Management**: The package handles private keys internally with memory safety features
- **TON API Security**: Use trusted TON API endpoints and consider rate limiting
- **Transaction Validation**: Always validate bridge details before signing
- **Bridge Limits**: Set `bridgeMaxFee` in config to prevent excessive bridge fees
- **Quote Validation**: Always get quotes before executing bridges
- **Token Verification**: Verify token contract addresses before bridging
- **Chain Verification**: Ensure target chain supports the token being bridged
- **Recipient Validation**: Double-check recipient addresses for target chains
- **LayerZero Security**: Trust LayerZero protocol for cross-chain message delivery
- **Gas Estimation**: Consider gas costs on target chains for recipients
- **OFT Configuration**: Verify custom OFT configurations for unsupported tokens

## 🛠️ Development

### Building

```bash
# Install dependencies
npm install

# Build TypeScript definitions
npm run build:types

# Lint code
npm run lint

# Fix linting issues
npm run lint:fix
```

### Testing

```bash
# Run tests
npm test

# Run tests with coverage
npm run test:coverage
```

## 📜 License

This project is licensed under the Apache License 2.0 - see the [LICENSE](LICENSE) file for details.

## 🤝 Contributing

Contributions are welcome! Please feel free to submit a Pull Request.

## 🆘 Support

For support, please open an issue on the GitHub repository.

---