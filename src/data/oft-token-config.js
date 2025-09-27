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

export default {
  EQCxE6mUtQJKFnGfaROTKOt1lZbDiiX1kCixRv7Nw2Id_sDs: {
    version: 3,
    fee: false,
    sharedDecimals: 6,
    deployments: {
      ethereum: {
        eid: 30_101,
        oftProxy: {
          address: '0x6c96de32cea08842dcc4058c14d3aaad7fa41dee'
        },
        oftNative: {
          address: '0x811ed79dB9D34E83BDB73DF6c3e07961Cfb0D5c0'
        },
        token: {
          chainKey: 'ethereum',
          decimals: 6,
          symbol: 'USDT',
          name: 'USDT',
          address: '0xdAC17F958D2ee523a2206206994597C13D831ec7'
        }
      },
      arbitrum: {
        eid: 30_110,
        oftProxy: {
          address: '0x14e4a1b13bf7f943c8ff7c51fb60fa964a298d92'
        },
        oftNative: {
          address: '0x77652D5aba086137b595875263FC200182919B92'
        },
        token: {
          chainKey: 'arbitrum',
          decimals: 6,
          symbol: 'USDT0',
          name: 'USDT0',
          address: '0xfd086bc7cd5c481dcc9c85ebe478a1c0b69fcbb9'
        }
      },
      ton: {
        eid: 30_343,
        oftProxy: {
          address: '0x1ddf580052174ed1dd0d66c35bfdc1a5fcc69af4f4ae36154b13dcfc6c14a35f'
        },
        token: {
          chainKey: 'ton',
          decimals: 6,
          symbol: 'USDT',
          name: 'USDT',
          address: '0xb113a994b5024a16719f69139328eb759596c38a25f59028b146fecdc3621dfe'
        },
        destinationChains: [
          'ethereum',
          'arbitrum',
          'tron'
        ]
      },
      tron: {
        eid: 30_420,
        oftProxy: {
          address: '0x8925c1dD3e5d8011946a3430d91Be742bA8EE930'
        },
        token: {
          chainKey: 'tron',
          decimals: 6,
          symbol: 'USDT',
          name: 'USDT',
          address: '0xa614f803B6FD780986A42c78Ec9c7f77e6DeD13C'
        },
        destinationChains: [
          'ton',
          'ethereum',
          'arbitrum'
        ]
      }
    }
  }
}
