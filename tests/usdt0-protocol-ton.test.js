import { describe, it, expect, beforeEach, jest } from '@jest/globals'
import { WalletAccountTonGasless as WalletAccountTonGaslessInterface } from '@wdk/wallet-ton-gasless'

jest.unstable_mockModule('../src/internal-usdt0-protocol-ton.js', () => ({
  __esModule: true,
  default: jest.fn(() => ({
    bridge: jest.fn(),
    quoteBridge: jest.fn(),
  })),
}))

jest.unstable_mockModule('../src/internal-usdt0-protocol-ton-gasless.js', () => ({
  __esModule: true,
  default: jest.fn(() => ({
    bridge: jest.fn(),
    quoteBridge: jest.fn(),
  })),
}))

jest.unstable_mockModule('@wdk/wallet-ton', () => ({
  WalletAccountReadOnlyTon: class WalletAccountReadOnlyTon { },
}))

const { WalletAccountReadOnlyTon } = await import('@wdk/wallet-ton')
const { default: Usdt0ProtocolTon } = await import('../src/usdt0-protocol-ton.js')
const { default: InternalUsdt0ProtocolTonGaslessMock } = await import('../src/internal-usdt0-protocol-ton-gasless.js')
const { default: InternalUsdt0ProtocolTonMock } = await import('../src/internal-usdt0-protocol-ton.js')

describe('Usdt0ProtocolTon', () => {
  let mockAccount
  let mockGaslessAccount
  const mockOptions = {
    targetChain: 'arbitrum',
    recipient: '0x...',
    token: 'EQ...',
    amount: 1000n,
  }
  const mockConfig = { bridgeMaxFee: 10000n }

  beforeEach(() => {
    jest.clearAllMocks()
    mockAccount = {
      __proto__: WalletAccountReadOnlyTon.prototype,
    }
    mockGaslessAccount = {
      __proto__: WalletAccountTonGaslessInterface.prototype,
    }
  })

  describe('constructor', () => {
    it('should initialize with InternalUsdt0ProtocolTonGasless for a gasless account', () => {
      new Usdt0ProtocolTon(mockGaslessAccount, mockConfig)
      expect(InternalUsdt0ProtocolTonGaslessMock).toHaveBeenCalledWith(mockGaslessAccount, mockConfig)
      expect(InternalUsdt0ProtocolTonMock).not.toHaveBeenCalled()
    })

    it('should initialize with InternalUsdt0ProtocolTon for a non-gasless account', () => {
      new Usdt0ProtocolTon(mockAccount, mockConfig)
      expect(InternalUsdt0ProtocolTonMock).toHaveBeenCalledWith(mockAccount, mockConfig)
      expect(InternalUsdt0ProtocolTonGaslessMock).not.toHaveBeenCalled()
    })
  })

  describe('bridge', () => {
    it('should delegate to the gasless protocol for a gasless account', async () => {
      const mockGaslessProtocolInstance = { bridge: jest.fn() }
      InternalUsdt0ProtocolTonGaslessMock.mockReturnValue(mockGaslessProtocolInstance)

      const protocol = new Usdt0ProtocolTon(mockGaslessAccount, mockConfig)
      await protocol.bridge(mockOptions, mockConfig)

      expect(mockGaslessProtocolInstance.bridge).toHaveBeenCalledWith(mockOptions, mockConfig)
    })

    it('should delegate to the normal protocol for a non-gasless account', async () => {
      const mockNormalProtocolInstance = { bridge: jest.fn() }
      InternalUsdt0ProtocolTonMock.mockReturnValue(mockNormalProtocolInstance)

      const protocol = new Usdt0ProtocolTon(mockAccount, mockConfig)
      await protocol.bridge(mockOptions, mockConfig)

      expect(mockNormalProtocolInstance.bridge).toHaveBeenCalledWith(mockOptions, mockConfig)
    })
  })

  describe('quoteBridge', () => {
    it('should delegate to the gasless protocol for a gasless account', async () => {
      const mockGaslessProtocolInstance = { quoteBridge: jest.fn() }
      InternalUsdt0ProtocolTonGaslessMock.mockReturnValue(mockGaslessProtocolInstance)

      const protocol = new Usdt0ProtocolTon(mockGaslessAccount, mockConfig)
      await protocol.quoteBridge(mockOptions, mockConfig)

      expect(mockGaslessProtocolInstance.quoteBridge).toHaveBeenCalledWith(mockOptions, mockConfig)
    })

    it('should delegate to the normal protocol for a non-gasless account', async () => {
      const mockNormalProtocolInstance = { quoteBridge: jest.fn() }
      InternalUsdt0ProtocolTonMock.mockReturnValue(mockNormalProtocolInstance)

      const protocol = new Usdt0ProtocolTon(mockAccount, mockConfig)
      await protocol.quoteBridge(mockOptions, mockConfig)

      expect(mockNormalProtocolInstance.quoteBridge).toHaveBeenCalledWith(mockOptions, mockConfig)
    })
  })
})

