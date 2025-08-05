import { describe, it, expect, beforeEach, jest } from '@jest/globals'
import { Address, Cell } from '@ton/ton'
import BaseUsdt0ProtocolTon from '../src/base-usdt0-protocol-ton.js'
import Usdt0ProtocolTon from '../src/usdt0-protocol-ton.js'
import { WalletAccountTonGasless } from '@wdk/wallet-ton-gasless'

const mockTransferCell = new Cell()
const TOKEN_ADDRESS = 'EQCxE6mUtQJKFnGfaROTKOt1lZbDiiX1kCixRv7Nw2Id_sDs'
const RECIPIENT_ADDRESS = 'UQCfu7DHKCYwqiohPFVQxjp45DDW3-tWSo-eIigNoZBaqOfQ'
const SENDER_ADDRESS = 'UQAMM7wsXH_0T7aLFJvyD1RS_KBSt6AqGV8c4i_2PUMscnoY'

jest.spyOn(BaseUsdt0ProtocolTon.prototype, '_getBridgeBody').mockResolvedValue(new Cell())

const mockTonClient = {
  open: jest.fn(() => ({
    address: Address.parse(SENDER_ADDRESS),
    getSeqno: jest.fn().mockResolvedValue(1),
    createTransfer: jest.fn().mockReturnValue(mockTransferCell),
    send: jest.fn().mockResolvedValue(null)
  })),
  estimateExternalMessageFee: jest.fn().mockResolvedValue({
    source_fees: {
      in_fwd_fee: 100n,
      storage_fee: 200n,
      gas_fee: 300n,
      fwd_fee: 400n
    }
  })
}

const mockTonApiClient = {
  gasless: {
    gaslessEstimate: jest.fn().mockResolvedValue({
      commission: '500000',
      messages: [{
        address: RECIPIENT_ADDRESS,
        amount: '1000000',
        payload: 'mock_payload'
      }]
    }),
    gaslessSend: jest.fn().mockResolvedValue(null)
  }
}

const getMockRegularAccount = () => ({
  _tonClient: mockTonClient,
  _wallet: {
    address: Address.parse(SENDER_ADDRESS),
    publicKey: Buffer.from('mock_public_key'),
    createTransfer: jest.fn().mockReturnValue(mockTransferCell)
  },
  keyPair: {
    publicKey: Buffer.from('mock_public_key'),
    privateKey: Buffer.from('mock_private_key')
  },
  getAddress: jest.fn().mockResolvedValue(SENDER_ADDRESS),
  getTokenBalance: jest.fn().mockResolvedValue(1000000000),
  _getJettonWalletAddress: jest.fn().mockResolvedValue(SENDER_ADDRESS),
  _getHash: jest.fn().mockReturnValue(Buffer.from('mock_hash'))
})

const getMockGaslessAccount = () => {
  const account = getMockRegularAccount()
  Object.setPrototypeOf(account, WalletAccountTonGasless.prototype)
  account._tonApiClient = mockTonApiClient
  account.getTokenBalance = jest.fn().mockResolvedValue(999999999999)
  return account
}

describe('Usdt0ProtocolTon', () => {
  const mockOptions = {
    recipient: RECIPIENT_ADDRESS,
    targetChain: 'ethereum',
    token: TOKEN_ADDRESS,
    amount: '1000000'
  }

  const mockConfig = {
    paymasterToken: { address: TOKEN_ADDRESS },
    bridgeMaxFee: 1000000
  }

  beforeEach(() => {
    jest.clearAllMocks()
    BaseUsdt0ProtocolTon.prototype._getBridgeBody.mockClear()
  })

  describe('Regular (Non-Gasless)', () => {
    let protocol
    let mockAccount

    beforeEach(() => {
      mockAccount = getMockRegularAccount()
      protocol = new Usdt0ProtocolTon(mockAccount, mockConfig)
    })

    describe('bridge', () => {
      it('should successfully bridge a token to another blockchain', async () => {
        const result = await protocol.bridge(mockOptions)

        expect(result).toEqual({
          hash: '6d6f636b5f68617368',
          fee: 1000,
          bridgeFee: 1000
        })

        expect(mockAccount._tonClient.open).toHaveBeenCalled()
        const walletContract = mockAccount._tonClient.open.mock.results[0].value
        expect(walletContract.send).toHaveBeenCalledWith(mockTransferCell)
      })

      it('should throw if the account is not connected to a provider', async () => {
        mockAccount._tonClient = null
        protocol = new Usdt0ProtocolTon(mockAccount, mockConfig)
        await expect(protocol.bridge(mockOptions)).rejects.toThrow()
      })
    })

    describe('quoteBridge', () => {
      it('should successfully quote a bridge operation', async () => {
        const result = await protocol.quoteBridge(mockOptions)

        expect(result).toEqual({
          hash: null,
          fee: 1000,
          bridgeFee: 1000
        })

        const walletContract = mockAccount._tonClient.open.mock.results[0].value
        expect(walletContract.send).not.toHaveBeenCalled()
      })

      it('should throw if the account is not connected to a provider', async () => {
        mockAccount._tonClient = null
        protocol = new Usdt0ProtocolTon(mockAccount, mockConfig)
        await expect(protocol.quoteBridge(mockOptions)).rejects.toThrow()
      })
    })
  })

  describe('Gasless', () => {
    let protocol
    let mockAccount

    beforeEach(() => {
      mockAccount = getMockGaslessAccount()
      protocol = new Usdt0ProtocolTon(mockAccount, mockConfig)
    })

    describe('bridge', () => {
      it('should successfully bridge a token to another blockchain', async () => {
        const result = await protocol.bridge(mockOptions, mockConfig)

        expect(result).toEqual({
          hash: '6d6f636b5f68617368',
          fee: 500000,
          bridgeFee: 1000
        })

        expect(mockAccount._tonApiClient.gasless.gaslessSend).toHaveBeenCalled()
      })

      it('should throw if the gas cost exceeds the bridge max fee configuration', async () => {
        const configWithLowMaxFee = { ...mockConfig, bridgeMaxFee: 400000 }
        await expect(protocol.bridge(mockOptions, configWithLowMaxFee)).rejects.toThrow('The bridge operation exceeds the bridge max fee.')
      })

      it('should throw if the account is not connected to a provider', async () => {
        mockAccount._tonApiClient = null
        protocol = new Usdt0ProtocolTon(mockAccount, mockConfig)
        await expect(protocol.bridge(mockOptions, mockConfig)).rejects.toThrow()
      })
    })

    describe('quoteBridge', () => {
      it('should successfully quote a bridge operation', async () => {
        const result = await protocol.quoteBridge(mockOptions, mockConfig)

        expect(result).toEqual({
          hash: null,
          fee: 500000,
          bridgeFee: 1000
        })
        expect(mockAccount._tonApiClient.gasless.gaslessSend).not.toHaveBeenCalled()
      })

      it('should throw if the account is not connected to a provider', async () => {
        mockAccount._tonApiClient = null
        protocol = new Usdt0ProtocolTon(mockAccount, mockConfig)
        await expect(protocol.quoteBridge(mockOptions, mockConfig)).rejects.toThrow()
      })
    })
  })
})
