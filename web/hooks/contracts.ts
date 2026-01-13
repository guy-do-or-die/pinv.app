import {
  createUseReadContract,
  createUseWriteContract,
  createUseSimulateContract,
  createUseWatchContractEvent,
} from 'wagmi/codegen'

//////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
// PinV
//////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////

/**
 * - [__View Contract on Base Basescan__](https://basescan.org/address/0x0000000000000000000000000000000000000000)
 * -
 * - [__View Contract on Base Sepolia Basescan__](https://sepolia.basescan.org/address/0xfb5118bcaec3b6d774307e777679c7bc16dce020)
 */
export const pinVAbi = [
  {
    type: 'constructor',
    inputs: [
      {
        name: '_pinStoreImplementation',
        internalType: 'address',
        type: 'address',
      },
      {
        name: '_config',
        internalType: 'struct Config.ConfigData',
        type: 'tuple',
        components: [
          {
            name: 'initialMintPrice',
            internalType: 'uint256',
            type: 'uint256',
          },
          {
            name: 'minSecondaryMintPrice',
            internalType: 'uint256',
            type: 'uint256',
          },
          {
            name: 'secondaryMintFeeBps',
            internalType: 'uint256',
            type: 'uint256',
          },
          { name: 'tradingFeeBps', internalType: 'uint256', type: 'uint256' },
        ],
      },
    ],
    stateMutability: 'nonpayable',
  },
  {
    type: 'function',
    inputs: [],
    name: 'BASIS_POINTS',
    outputs: [{ name: '', internalType: 'uint256', type: 'uint256' }],
    stateMutability: 'view',
  },
  {
    type: 'function',
    inputs: [
      { name: 'account', internalType: 'address', type: 'address' },
      { name: 'id', internalType: 'uint256', type: 'uint256' },
    ],
    name: 'balanceOf',
    outputs: [{ name: '', internalType: 'uint256', type: 'uint256' }],
    stateMutability: 'view',
  },
  {
    type: 'function',
    inputs: [
      { name: 'accounts', internalType: 'address[]', type: 'address[]' },
      { name: 'ids', internalType: 'uint256[]', type: 'uint256[]' },
    ],
    name: 'balanceOfBatch',
    outputs: [{ name: '', internalType: 'uint256[]', type: 'uint256[]' }],
    stateMutability: 'view',
  },
  {
    type: 'function',
    inputs: [],
    name: 'config',
    outputs: [
      { name: 'initialMintPrice', internalType: 'uint256', type: 'uint256' },
      {
        name: 'minSecondaryMintPrice',
        internalType: 'uint256',
        type: 'uint256',
      },
      { name: 'secondaryMintFeeBps', internalType: 'uint256', type: 'uint256' },
      { name: 'tradingFeeBps', internalType: 'uint256', type: 'uint256' },
    ],
    stateMutability: 'view',
  },
  {
    type: 'function',
    inputs: [{ name: 'id', internalType: 'uint256', type: 'uint256' }],
    name: 'exists',
    outputs: [{ name: '', internalType: 'bool', type: 'bool' }],
    stateMutability: 'view',
  },
  {
    type: 'function',
    inputs: [],
    name: 'getConfig',
    outputs: [
      {
        name: '',
        internalType: 'struct Config.ConfigData',
        type: 'tuple',
        components: [
          {
            name: 'initialMintPrice',
            internalType: 'uint256',
            type: 'uint256',
          },
          {
            name: 'minSecondaryMintPrice',
            internalType: 'uint256',
            type: 'uint256',
          },
          {
            name: 'secondaryMintFeeBps',
            internalType: 'uint256',
            type: 'uint256',
          },
          { name: 'tradingFeeBps', internalType: 'uint256', type: 'uint256' },
        ],
      },
    ],
    stateMutability: 'view',
  },
  {
    type: 'function',
    inputs: [
      { name: 'account', internalType: 'address', type: 'address' },
      { name: 'operator', internalType: 'address', type: 'address' },
    ],
    name: 'isApprovedForAll',
    outputs: [{ name: '', internalType: 'bool', type: 'bool' }],
    stateMutability: 'view',
  },
  {
    type: 'function',
    inputs: [
      { name: 'to', internalType: 'address', type: 'address' },
      { name: 'title', internalType: 'string', type: 'string' },
      { name: 'tagline', internalType: 'string', type: 'string' },
      { name: 'initialIpfsId', internalType: 'string', type: 'string' },
      { name: 'data', internalType: 'bytes', type: 'bytes' },
    ],
    name: 'mint',
    outputs: [],
    stateMutability: 'payable',
  },
  {
    type: 'function',
    inputs: [],
    name: 'nextTokenId',
    outputs: [{ name: '', internalType: 'uint256', type: 'uint256' }],
    stateMutability: 'view',
  },
  {
    type: 'function',
    inputs: [],
    name: 'owner',
    outputs: [{ name: '', internalType: 'address', type: 'address' }],
    stateMutability: 'view',
  },
  {
    type: 'function',
    inputs: [],
    name: 'pinStoreImplementation',
    outputs: [{ name: '', internalType: 'address', type: 'address' }],
    stateMutability: 'view',
  },
  {
    type: 'function',
    inputs: [{ name: '', internalType: 'uint256', type: 'uint256' }],
    name: 'pinStores',
    outputs: [{ name: '', internalType: 'address', type: 'address' }],
    stateMutability: 'view',
  },
  {
    type: 'function',
    inputs: [],
    name: 'renounceOwnership',
    outputs: [],
    stateMutability: 'nonpayable',
  },
  {
    type: 'function',
    inputs: [
      { name: 'from', internalType: 'address', type: 'address' },
      { name: 'to', internalType: 'address', type: 'address' },
      { name: 'ids', internalType: 'uint256[]', type: 'uint256[]' },
      { name: 'values', internalType: 'uint256[]', type: 'uint256[]' },
      { name: 'data', internalType: 'bytes', type: 'bytes' },
    ],
    name: 'safeBatchTransferFrom',
    outputs: [],
    stateMutability: 'nonpayable',
  },
  {
    type: 'function',
    inputs: [
      { name: 'from', internalType: 'address', type: 'address' },
      { name: 'to', internalType: 'address', type: 'address' },
      { name: 'id', internalType: 'uint256', type: 'uint256' },
      { name: 'value', internalType: 'uint256', type: 'uint256' },
      { name: 'data', internalType: 'bytes', type: 'bytes' },
    ],
    name: 'safeTransferFrom',
    outputs: [],
    stateMutability: 'nonpayable',
  },
  {
    type: 'function',
    inputs: [
      { name: 'tokenId', internalType: 'uint256', type: 'uint256' },
      { name: 'amount', internalType: 'uint256', type: 'uint256' },
      { name: 'data', internalType: 'bytes', type: 'bytes' },
    ],
    name: 'secondaryMint',
    outputs: [],
    stateMutability: 'payable',
  },
  {
    type: 'function',
    inputs: [
      { name: 'operator', internalType: 'address', type: 'address' },
      { name: 'approved', internalType: 'bool', type: 'bool' },
    ],
    name: 'setApprovalForAll',
    outputs: [],
    stateMutability: 'nonpayable',
  },
  {
    type: 'function',
    inputs: [
      {
        name: '_config',
        internalType: 'struct Config.ConfigData',
        type: 'tuple',
        components: [
          {
            name: 'initialMintPrice',
            internalType: 'uint256',
            type: 'uint256',
          },
          {
            name: 'minSecondaryMintPrice',
            internalType: 'uint256',
            type: 'uint256',
          },
          {
            name: 'secondaryMintFeeBps',
            internalType: 'uint256',
            type: 'uint256',
          },
          { name: 'tradingFeeBps', internalType: 'uint256', type: 'uint256' },
        ],
      },
    ],
    name: 'setConfig',
    outputs: [],
    stateMutability: 'nonpayable',
  },
  {
    type: 'function',
    inputs: [{ name: '_newImpl', internalType: 'address', type: 'address' }],
    name: 'setPinStoreImplementation',
    outputs: [],
    stateMutability: 'nonpayable',
  },
  {
    type: 'function',
    inputs: [{ name: 'interfaceId', internalType: 'bytes4', type: 'bytes4' }],
    name: 'supportsInterface',
    outputs: [{ name: '', internalType: 'bool', type: 'bool' }],
    stateMutability: 'view',
  },
  {
    type: 'function',
    inputs: [],
    name: 'totalSupply',
    outputs: [{ name: '', internalType: 'uint256', type: 'uint256' }],
    stateMutability: 'view',
  },
  {
    type: 'function',
    inputs: [{ name: 'id', internalType: 'uint256', type: 'uint256' }],
    name: 'totalSupply',
    outputs: [{ name: '', internalType: 'uint256', type: 'uint256' }],
    stateMutability: 'view',
  },
  {
    type: 'function',
    inputs: [{ name: 'newOwner', internalType: 'address', type: 'address' }],
    name: 'transferOwnership',
    outputs: [],
    stateMutability: 'nonpayable',
  },
  {
    type: 'function',
    inputs: [{ name: '_tokenId', internalType: 'uint256', type: 'uint256' }],
    name: 'uri',
    outputs: [{ name: '', internalType: 'string', type: 'string' }],
    stateMutability: 'view',
  },
  {
    type: 'function',
    inputs: [],
    name: 'withdraw',
    outputs: [],
    stateMutability: 'nonpayable',
  },
  {
    type: 'event',
    anonymous: false,
    inputs: [
      {
        name: 'account',
        internalType: 'address',
        type: 'address',
        indexed: true,
      },
      {
        name: 'operator',
        internalType: 'address',
        type: 'address',
        indexed: true,
      },
      { name: 'approved', internalType: 'bool', type: 'bool', indexed: false },
    ],
    name: 'ApprovalForAll',
  },
  {
    type: 'event',
    anonymous: false,
    inputs: [
      {
        name: 'newConfig',
        internalType: 'struct Config.ConfigData',
        type: 'tuple',
        components: [
          {
            name: 'initialMintPrice',
            internalType: 'uint256',
            type: 'uint256',
          },
          {
            name: 'minSecondaryMintPrice',
            internalType: 'uint256',
            type: 'uint256',
          },
          {
            name: 'secondaryMintFeeBps',
            internalType: 'uint256',
            type: 'uint256',
          },
          { name: 'tradingFeeBps', internalType: 'uint256', type: 'uint256' },
        ],
        indexed: false,
      },
    ],
    name: 'ConfigUpdated',
  },
  {
    type: 'event',
    anonymous: false,
    inputs: [
      {
        name: 'tokenId',
        internalType: 'uint256',
        type: 'uint256',
        indexed: true,
      },
      {
        name: 'creator',
        internalType: 'address',
        type: 'address',
        indexed: true,
      },
      {
        name: 'storeAddress',
        internalType: 'address',
        type: 'address',
        indexed: false,
      },
      { name: 'title', internalType: 'string', type: 'string', indexed: false },
    ],
    name: 'Mint',
  },
  {
    type: 'event',
    anonymous: false,
    inputs: [
      {
        name: 'previousOwner',
        internalType: 'address',
        type: 'address',
        indexed: true,
      },
      {
        name: 'newOwner',
        internalType: 'address',
        type: 'address',
        indexed: true,
      },
    ],
    name: 'OwnershipTransferred',
  },
  {
    type: 'event',
    anonymous: false,
    inputs: [
      {
        name: 'tokenId',
        internalType: 'uint256',
        type: 'uint256',
        indexed: true,
      },
      { name: 'to', internalType: 'address', type: 'address', indexed: true },
      {
        name: 'amount',
        internalType: 'uint256',
        type: 'uint256',
        indexed: false,
      },
      {
        name: 'totalPrice',
        internalType: 'uint256',
        type: 'uint256',
        indexed: false,
      },
      { name: 'fee', internalType: 'uint256', type: 'uint256', indexed: false },
    ],
    name: 'SecondaryMint',
  },
  {
    type: 'event',
    anonymous: false,
    inputs: [
      {
        name: 'operator',
        internalType: 'address',
        type: 'address',
        indexed: true,
      },
      { name: 'from', internalType: 'address', type: 'address', indexed: true },
      { name: 'to', internalType: 'address', type: 'address', indexed: true },
      {
        name: 'ids',
        internalType: 'uint256[]',
        type: 'uint256[]',
        indexed: false,
      },
      {
        name: 'values',
        internalType: 'uint256[]',
        type: 'uint256[]',
        indexed: false,
      },
    ],
    name: 'TransferBatch',
  },
  {
    type: 'event',
    anonymous: false,
    inputs: [
      {
        name: 'operator',
        internalType: 'address',
        type: 'address',
        indexed: true,
      },
      { name: 'from', internalType: 'address', type: 'address', indexed: true },
      { name: 'to', internalType: 'address', type: 'address', indexed: true },
      { name: 'id', internalType: 'uint256', type: 'uint256', indexed: false },
      {
        name: 'value',
        internalType: 'uint256',
        type: 'uint256',
        indexed: false,
      },
    ],
    name: 'TransferSingle',
  },
  {
    type: 'event',
    anonymous: false,
    inputs: [
      { name: 'value', internalType: 'string', type: 'string', indexed: false },
      { name: 'id', internalType: 'uint256', type: 'uint256', indexed: true },
    ],
    name: 'URI',
  },
  {
    type: 'event',
    anonymous: false,
    inputs: [
      { name: 'to', internalType: 'address', type: 'address', indexed: true },
      {
        name: 'amount',
        internalType: 'uint256',
        type: 'uint256',
        indexed: false,
      },
    ],
    name: 'Withdrawn',
  },
  {
    type: 'error',
    inputs: [
      { name: 'sender', internalType: 'address', type: 'address' },
      { name: 'balance', internalType: 'uint256', type: 'uint256' },
      { name: 'needed', internalType: 'uint256', type: 'uint256' },
      { name: 'tokenId', internalType: 'uint256', type: 'uint256' },
    ],
    name: 'ERC1155InsufficientBalance',
  },
  {
    type: 'error',
    inputs: [{ name: 'approver', internalType: 'address', type: 'address' }],
    name: 'ERC1155InvalidApprover',
  },
  {
    type: 'error',
    inputs: [
      { name: 'idsLength', internalType: 'uint256', type: 'uint256' },
      { name: 'valuesLength', internalType: 'uint256', type: 'uint256' },
    ],
    name: 'ERC1155InvalidArrayLength',
  },
  {
    type: 'error',
    inputs: [{ name: 'operator', internalType: 'address', type: 'address' }],
    name: 'ERC1155InvalidOperator',
  },
  {
    type: 'error',
    inputs: [{ name: 'receiver', internalType: 'address', type: 'address' }],
    name: 'ERC1155InvalidReceiver',
  },
  {
    type: 'error',
    inputs: [{ name: 'sender', internalType: 'address', type: 'address' }],
    name: 'ERC1155InvalidSender',
  },
  {
    type: 'error',
    inputs: [
      { name: 'operator', internalType: 'address', type: 'address' },
      { name: 'owner', internalType: 'address', type: 'address' },
    ],
    name: 'ERC1155MissingApprovalForAll',
  },
  { type: 'error', inputs: [], name: 'FailedDeployment' },
  {
    type: 'error',
    inputs: [
      { name: 'balance', internalType: 'uint256', type: 'uint256' },
      { name: 'needed', internalType: 'uint256', type: 'uint256' },
    ],
    name: 'InsufficientBalance',
  },
  {
    type: 'error',
    inputs: [
      { name: 'required', internalType: 'uint256', type: 'uint256' },
      { name: 'sent', internalType: 'uint256', type: 'uint256' },
    ],
    name: 'InsufficientPayment',
  },
  { type: 'error', inputs: [], name: 'InvalidBps' },
  { type: 'error', inputs: [], name: 'InvalidImplementation' },
  { type: 'error', inputs: [], name: 'NoBalanceToWithdraw' },
  {
    type: 'error',
    inputs: [{ name: 'owner', internalType: 'address', type: 'address' }],
    name: 'OwnableInvalidOwner',
  },
  {
    type: 'error',
    inputs: [{ name: 'account', internalType: 'address', type: 'address' }],
    name: 'OwnableUnauthorizedAccount',
  },
  { type: 'error', inputs: [], name: 'ReentrancyGuardReentrantCall' },
  {
    type: 'error',
    inputs: [{ name: 'tokenId', internalType: 'uint256', type: 'uint256' }],
    name: 'StoreNotFound',
  },
  { type: 'error', inputs: [], name: 'TransferFailed' },
  { type: 'error', inputs: [], name: 'WithdrawalFailed' },
] as const

/**
 * - [__View Contract on Base Basescan__](https://basescan.org/address/0x0000000000000000000000000000000000000000)
 * -
 * - [__View Contract on Base Sepolia Basescan__](https://sepolia.basescan.org/address/0xfb5118bcaec3b6d774307e777679c7bc16dce020)
 */
export const pinVAddress = {
  8453: '0x0000000000000000000000000000000000000000',
  31337: '0x0000000000000000000000000000000000000000',
  84532: '0xfB5118bcAec3b6D774307E777679C7Bc16dcE020',
} as const

/**
 * - [__View Contract on Base Basescan__](https://basescan.org/address/0x0000000000000000000000000000000000000000)
 * -
 * - [__View Contract on Base Sepolia Basescan__](https://sepolia.basescan.org/address/0xfb5118bcaec3b6d774307e777679c7bc16dce020)
 */
export const pinVConfig = { address: pinVAddress, abi: pinVAbi } as const

//////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
// PinVStore
//////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////

export const pinVStoreAbi = [
  { type: 'receive', stateMutability: 'payable' },
  {
    type: 'function',
    inputs: [],
    name: 'BASIS_POINTS',
    outputs: [{ name: '', internalType: 'uint256', type: 'uint256' }],
    stateMutability: 'view',
  },
  {
    type: 'function',
    inputs: [{ name: '_ipfsId', internalType: 'string', type: 'string' }],
    name: 'addVersion',
    outputs: [],
    stateMutability: 'nonpayable',
  },
  {
    type: 'function',
    inputs: [],
    name: 'config',
    outputs: [
      { name: 'initialMintPrice', internalType: 'uint256', type: 'uint256' },
      {
        name: 'minSecondaryMintPrice',
        internalType: 'uint256',
        type: 'uint256',
      },
      { name: 'secondaryMintFeeBps', internalType: 'uint256', type: 'uint256' },
      { name: 'tradingFeeBps', internalType: 'uint256', type: 'uint256' },
    ],
    stateMutability: 'view',
  },
  {
    type: 'function',
    inputs: [],
    name: 'creator',
    outputs: [{ name: '', internalType: 'address', type: 'address' }],
    stateMutability: 'view',
  },
  {
    type: 'function',
    inputs: [],
    name: 'factory',
    outputs: [{ name: '', internalType: 'address', type: 'address' }],
    stateMutability: 'view',
  },
  {
    type: 'function',
    inputs: [],
    name: 'getConfig',
    outputs: [
      {
        name: '',
        internalType: 'struct Config.ConfigData',
        type: 'tuple',
        components: [
          {
            name: 'initialMintPrice',
            internalType: 'uint256',
            type: 'uint256',
          },
          {
            name: 'minSecondaryMintPrice',
            internalType: 'uint256',
            type: 'uint256',
          },
          {
            name: 'secondaryMintFeeBps',
            internalType: 'uint256',
            type: 'uint256',
          },
          { name: 'tradingFeeBps', internalType: 'uint256', type: 'uint256' },
        ],
      },
    ],
    stateMutability: 'view',
  },
  {
    type: 'function',
    inputs: [
      { name: '_creator', internalType: 'address', type: 'address' },
      { name: '_tokenId', internalType: 'uint256', type: 'uint256' },
      { name: '_title', internalType: 'string', type: 'string' },
      { name: '_tagline', internalType: 'string', type: 'string' },
      { name: '_initialIpfsId', internalType: 'string', type: 'string' },
      {
        name: '_config',
        internalType: 'struct Config.ConfigData',
        type: 'tuple',
        components: [
          {
            name: 'initialMintPrice',
            internalType: 'uint256',
            type: 'uint256',
          },
          {
            name: 'minSecondaryMintPrice',
            internalType: 'uint256',
            type: 'uint256',
          },
          {
            name: 'secondaryMintFeeBps',
            internalType: 'uint256',
            type: 'uint256',
          },
          { name: 'tradingFeeBps', internalType: 'uint256', type: 'uint256' },
        ],
      },
    ],
    name: 'initialize',
    outputs: [],
    stateMutability: 'nonpayable',
  },
  {
    type: 'function',
    inputs: [],
    name: 'latestVersion',
    outputs: [{ name: '', internalType: 'uint256', type: 'uint256' }],
    stateMutability: 'view',
  },
  {
    type: 'function',
    inputs: [],
    name: 'secondaryMintPrice',
    outputs: [{ name: '', internalType: 'uint256', type: 'uint256' }],
    stateMutability: 'view',
  },
  {
    type: 'function',
    inputs: [{ name: '_newCreator', internalType: 'address', type: 'address' }],
    name: 'setCreator',
    outputs: [],
    stateMutability: 'nonpayable',
  },
  {
    type: 'function',
    inputs: [{ name: '_price', internalType: 'uint256', type: 'uint256' }],
    name: 'setSecondaryMintPrice',
    outputs: [],
    stateMutability: 'nonpayable',
  },
  {
    type: 'function',
    inputs: [{ name: '_bps', internalType: 'uint256', type: 'uint256' }],
    name: 'setTradingCreatorFeeBps',
    outputs: [],
    stateMutability: 'nonpayable',
  },
  {
    type: 'function',
    inputs: [],
    name: 'tagline',
    outputs: [{ name: '', internalType: 'string', type: 'string' }],
    stateMutability: 'view',
  },
  {
    type: 'function',
    inputs: [],
    name: 'title',
    outputs: [{ name: '', internalType: 'string', type: 'string' }],
    stateMutability: 'view',
  },
  {
    type: 'function',
    inputs: [],
    name: 'tokenId',
    outputs: [{ name: '', internalType: 'uint256', type: 'uint256' }],
    stateMutability: 'view',
  },
  {
    type: 'function',
    inputs: [],
    name: 'tradingCreatorFeeBps',
    outputs: [{ name: '', internalType: 'uint256', type: 'uint256' }],
    stateMutability: 'view',
  },
  {
    type: 'function',
    inputs: [
      { name: '_title', internalType: 'string', type: 'string' },
      { name: '_tagline', internalType: 'string', type: 'string' },
    ],
    name: 'updateMetadata',
    outputs: [],
    stateMutability: 'nonpayable',
  },
  {
    type: 'function',
    inputs: [{ name: '', internalType: 'uint256', type: 'uint256' }],
    name: 'versions',
    outputs: [{ name: '', internalType: 'string', type: 'string' }],
    stateMutability: 'view',
  },
  {
    type: 'function',
    inputs: [
      { name: 'to', internalType: 'address', type: 'address' },
      { name: 'amount', internalType: 'uint256', type: 'uint256' },
    ],
    name: 'withdraw',
    outputs: [],
    stateMutability: 'nonpayable',
  },
  {
    type: 'event',
    anonymous: false,
    inputs: [
      {
        name: 'newCreator',
        internalType: 'address',
        type: 'address',
        indexed: true,
      },
    ],
    name: 'CreatorUpdated',
  },
  {
    type: 'event',
    anonymous: false,
    inputs: [
      {
        name: 'version',
        internalType: 'uint64',
        type: 'uint64',
        indexed: false,
      },
    ],
    name: 'Initialized',
  },
  {
    type: 'event',
    anonymous: false,
    inputs: [
      { name: 'title', internalType: 'string', type: 'string', indexed: false },
      {
        name: 'tagline',
        internalType: 'string',
        type: 'string',
        indexed: false,
      },
    ],
    name: 'MetadataUpdated',
  },
  {
    type: 'event',
    anonymous: false,
    inputs: [
      {
        name: 'price',
        internalType: 'uint256',
        type: 'uint256',
        indexed: false,
      },
    ],
    name: 'SecondaryMintPriceUpdated',
  },
  {
    type: 'event',
    anonymous: false,
    inputs: [
      {
        name: 'tokenId',
        internalType: 'uint256',
        type: 'uint256',
        indexed: true,
      },
      {
        name: 'creator',
        internalType: 'address',
        type: 'address',
        indexed: true,
      },
      { name: 'title', internalType: 'string', type: 'string', indexed: false },
      {
        name: 'tagline',
        internalType: 'string',
        type: 'string',
        indexed: false,
      },
    ],
    name: 'StoreInitialized',
  },
  {
    type: 'event',
    anonymous: false,
    inputs: [
      { name: 'bps', internalType: 'uint256', type: 'uint256', indexed: false },
    ],
    name: 'TradingCreatorFeeBpsUpdated',
  },
  {
    type: 'event',
    anonymous: false,
    inputs: [
      {
        name: 'versionId',
        internalType: 'uint256',
        type: 'uint256',
        indexed: true,
      },
      {
        name: 'ipfsId',
        internalType: 'string',
        type: 'string',
        indexed: false,
      },
    ],
    name: 'VersionAdded',
  },
  {
    type: 'event',
    anonymous: false,
    inputs: [
      { name: 'to', internalType: 'address', type: 'address', indexed: true },
      {
        name: 'amount',
        internalType: 'uint256',
        type: 'uint256',
        indexed: false,
      },
    ],
    name: 'Withdrawn',
  },
  { type: 'error', inputs: [], name: 'CallerNotCreator' },
  { type: 'error', inputs: [], name: 'EmptyIpfsId' },
  { type: 'error', inputs: [], name: 'InsufficientBalance' },
  {
    type: 'error',
    inputs: [{ name: 'bps', internalType: 'uint256', type: 'uint256' }],
    name: 'InvalidBps',
  },
  { type: 'error', inputs: [], name: 'InvalidCreatorAddress' },
  { type: 'error', inputs: [], name: 'InvalidInitialization' },
  { type: 'error', inputs: [], name: 'NotInitializing' },
  { type: 'error', inputs: [], name: 'ReentrancyGuardReentrantCall' },
  { type: 'error', inputs: [], name: 'TransferFailed' },
] as const

//////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
// React
//////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////

/**
 * Wraps __{@link useReadContract}__ with `abi` set to __{@link pinVAbi}__
 *
 * - [__View Contract on Base Basescan__](https://basescan.org/address/0x0000000000000000000000000000000000000000)
 * -
 * - [__View Contract on Base Sepolia Basescan__](https://sepolia.basescan.org/address/0xfb5118bcaec3b6d774307e777679c7bc16dce020)
 */
export const useReadPinV = /*#__PURE__*/ createUseReadContract({
  abi: pinVAbi,
  address: pinVAddress,
})

/**
 * Wraps __{@link useReadContract}__ with `abi` set to __{@link pinVAbi}__ and `functionName` set to `"BASIS_POINTS"`
 *
 * - [__View Contract on Base Basescan__](https://basescan.org/address/0x0000000000000000000000000000000000000000)
 * -
 * - [__View Contract on Base Sepolia Basescan__](https://sepolia.basescan.org/address/0xfb5118bcaec3b6d774307e777679c7bc16dce020)
 */
export const useReadPinVBasisPoints = /*#__PURE__*/ createUseReadContract({
  abi: pinVAbi,
  address: pinVAddress,
  functionName: 'BASIS_POINTS',
})

/**
 * Wraps __{@link useReadContract}__ with `abi` set to __{@link pinVAbi}__ and `functionName` set to `"balanceOf"`
 *
 * - [__View Contract on Base Basescan__](https://basescan.org/address/0x0000000000000000000000000000000000000000)
 * -
 * - [__View Contract on Base Sepolia Basescan__](https://sepolia.basescan.org/address/0xfb5118bcaec3b6d774307e777679c7bc16dce020)
 */
export const useReadPinVBalanceOf = /*#__PURE__*/ createUseReadContract({
  abi: pinVAbi,
  address: pinVAddress,
  functionName: 'balanceOf',
})

/**
 * Wraps __{@link useReadContract}__ with `abi` set to __{@link pinVAbi}__ and `functionName` set to `"balanceOfBatch"`
 *
 * - [__View Contract on Base Basescan__](https://basescan.org/address/0x0000000000000000000000000000000000000000)
 * -
 * - [__View Contract on Base Sepolia Basescan__](https://sepolia.basescan.org/address/0xfb5118bcaec3b6d774307e777679c7bc16dce020)
 */
export const useReadPinVBalanceOfBatch = /*#__PURE__*/ createUseReadContract({
  abi: pinVAbi,
  address: pinVAddress,
  functionName: 'balanceOfBatch',
})

/**
 * Wraps __{@link useReadContract}__ with `abi` set to __{@link pinVAbi}__ and `functionName` set to `"config"`
 *
 * - [__View Contract on Base Basescan__](https://basescan.org/address/0x0000000000000000000000000000000000000000)
 * -
 * - [__View Contract on Base Sepolia Basescan__](https://sepolia.basescan.org/address/0xfb5118bcaec3b6d774307e777679c7bc16dce020)
 */
export const useReadPinVConfig = /*#__PURE__*/ createUseReadContract({
  abi: pinVAbi,
  address: pinVAddress,
  functionName: 'config',
})

/**
 * Wraps __{@link useReadContract}__ with `abi` set to __{@link pinVAbi}__ and `functionName` set to `"exists"`
 *
 * - [__View Contract on Base Basescan__](https://basescan.org/address/0x0000000000000000000000000000000000000000)
 * -
 * - [__View Contract on Base Sepolia Basescan__](https://sepolia.basescan.org/address/0xfb5118bcaec3b6d774307e777679c7bc16dce020)
 */
export const useReadPinVExists = /*#__PURE__*/ createUseReadContract({
  abi: pinVAbi,
  address: pinVAddress,
  functionName: 'exists',
})

/**
 * Wraps __{@link useReadContract}__ with `abi` set to __{@link pinVAbi}__ and `functionName` set to `"getConfig"`
 *
 * - [__View Contract on Base Basescan__](https://basescan.org/address/0x0000000000000000000000000000000000000000)
 * -
 * - [__View Contract on Base Sepolia Basescan__](https://sepolia.basescan.org/address/0xfb5118bcaec3b6d774307e777679c7bc16dce020)
 */
export const useReadPinVGetConfig = /*#__PURE__*/ createUseReadContract({
  abi: pinVAbi,
  address: pinVAddress,
  functionName: 'getConfig',
})

/**
 * Wraps __{@link useReadContract}__ with `abi` set to __{@link pinVAbi}__ and `functionName` set to `"isApprovedForAll"`
 *
 * - [__View Contract on Base Basescan__](https://basescan.org/address/0x0000000000000000000000000000000000000000)
 * -
 * - [__View Contract on Base Sepolia Basescan__](https://sepolia.basescan.org/address/0xfb5118bcaec3b6d774307e777679c7bc16dce020)
 */
export const useReadPinVIsApprovedForAll = /*#__PURE__*/ createUseReadContract({
  abi: pinVAbi,
  address: pinVAddress,
  functionName: 'isApprovedForAll',
})

/**
 * Wraps __{@link useReadContract}__ with `abi` set to __{@link pinVAbi}__ and `functionName` set to `"nextTokenId"`
 *
 * - [__View Contract on Base Basescan__](https://basescan.org/address/0x0000000000000000000000000000000000000000)
 * -
 * - [__View Contract on Base Sepolia Basescan__](https://sepolia.basescan.org/address/0xfb5118bcaec3b6d774307e777679c7bc16dce020)
 */
export const useReadPinVNextTokenId = /*#__PURE__*/ createUseReadContract({
  abi: pinVAbi,
  address: pinVAddress,
  functionName: 'nextTokenId',
})

/**
 * Wraps __{@link useReadContract}__ with `abi` set to __{@link pinVAbi}__ and `functionName` set to `"owner"`
 *
 * - [__View Contract on Base Basescan__](https://basescan.org/address/0x0000000000000000000000000000000000000000)
 * -
 * - [__View Contract on Base Sepolia Basescan__](https://sepolia.basescan.org/address/0xfb5118bcaec3b6d774307e777679c7bc16dce020)
 */
export const useReadPinVOwner = /*#__PURE__*/ createUseReadContract({
  abi: pinVAbi,
  address: pinVAddress,
  functionName: 'owner',
})

/**
 * Wraps __{@link useReadContract}__ with `abi` set to __{@link pinVAbi}__ and `functionName` set to `"pinStoreImplementation"`
 *
 * - [__View Contract on Base Basescan__](https://basescan.org/address/0x0000000000000000000000000000000000000000)
 * -
 * - [__View Contract on Base Sepolia Basescan__](https://sepolia.basescan.org/address/0xfb5118bcaec3b6d774307e777679c7bc16dce020)
 */
export const useReadPinVPinStoreImplementation =
  /*#__PURE__*/ createUseReadContract({
    abi: pinVAbi,
    address: pinVAddress,
    functionName: 'pinStoreImplementation',
  })

/**
 * Wraps __{@link useReadContract}__ with `abi` set to __{@link pinVAbi}__ and `functionName` set to `"pinStores"`
 *
 * - [__View Contract on Base Basescan__](https://basescan.org/address/0x0000000000000000000000000000000000000000)
 * -
 * - [__View Contract on Base Sepolia Basescan__](https://sepolia.basescan.org/address/0xfb5118bcaec3b6d774307e777679c7bc16dce020)
 */
export const useReadPinVPinStores = /*#__PURE__*/ createUseReadContract({
  abi: pinVAbi,
  address: pinVAddress,
  functionName: 'pinStores',
})

/**
 * Wraps __{@link useReadContract}__ with `abi` set to __{@link pinVAbi}__ and `functionName` set to `"supportsInterface"`
 *
 * - [__View Contract on Base Basescan__](https://basescan.org/address/0x0000000000000000000000000000000000000000)
 * -
 * - [__View Contract on Base Sepolia Basescan__](https://sepolia.basescan.org/address/0xfb5118bcaec3b6d774307e777679c7bc16dce020)
 */
export const useReadPinVSupportsInterface = /*#__PURE__*/ createUseReadContract(
  { abi: pinVAbi, address: pinVAddress, functionName: 'supportsInterface' },
)

/**
 * Wraps __{@link useReadContract}__ with `abi` set to __{@link pinVAbi}__ and `functionName` set to `"totalSupply"`
 *
 * - [__View Contract on Base Basescan__](https://basescan.org/address/0x0000000000000000000000000000000000000000)
 * -
 * - [__View Contract on Base Sepolia Basescan__](https://sepolia.basescan.org/address/0xfb5118bcaec3b6d774307e777679c7bc16dce020)
 */
export const useReadPinVTotalSupply = /*#__PURE__*/ createUseReadContract({
  abi: pinVAbi,
  address: pinVAddress,
  functionName: 'totalSupply',
})

/**
 * Wraps __{@link useReadContract}__ with `abi` set to __{@link pinVAbi}__ and `functionName` set to `"uri"`
 *
 * - [__View Contract on Base Basescan__](https://basescan.org/address/0x0000000000000000000000000000000000000000)
 * -
 * - [__View Contract on Base Sepolia Basescan__](https://sepolia.basescan.org/address/0xfb5118bcaec3b6d774307e777679c7bc16dce020)
 */
export const useReadPinVUri = /*#__PURE__*/ createUseReadContract({
  abi: pinVAbi,
  address: pinVAddress,
  functionName: 'uri',
})

/**
 * Wraps __{@link useWriteContract}__ with `abi` set to __{@link pinVAbi}__
 *
 * - [__View Contract on Base Basescan__](https://basescan.org/address/0x0000000000000000000000000000000000000000)
 * -
 * - [__View Contract on Base Sepolia Basescan__](https://sepolia.basescan.org/address/0xfb5118bcaec3b6d774307e777679c7bc16dce020)
 */
export const useWritePinV = /*#__PURE__*/ createUseWriteContract({
  abi: pinVAbi,
  address: pinVAddress,
})

/**
 * Wraps __{@link useWriteContract}__ with `abi` set to __{@link pinVAbi}__ and `functionName` set to `"mint"`
 *
 * - [__View Contract on Base Basescan__](https://basescan.org/address/0x0000000000000000000000000000000000000000)
 * -
 * - [__View Contract on Base Sepolia Basescan__](https://sepolia.basescan.org/address/0xfb5118bcaec3b6d774307e777679c7bc16dce020)
 */
export const useWritePinVMint = /*#__PURE__*/ createUseWriteContract({
  abi: pinVAbi,
  address: pinVAddress,
  functionName: 'mint',
})

/**
 * Wraps __{@link useWriteContract}__ with `abi` set to __{@link pinVAbi}__ and `functionName` set to `"renounceOwnership"`
 *
 * - [__View Contract on Base Basescan__](https://basescan.org/address/0x0000000000000000000000000000000000000000)
 * -
 * - [__View Contract on Base Sepolia Basescan__](https://sepolia.basescan.org/address/0xfb5118bcaec3b6d774307e777679c7bc16dce020)
 */
export const useWritePinVRenounceOwnership =
  /*#__PURE__*/ createUseWriteContract({
    abi: pinVAbi,
    address: pinVAddress,
    functionName: 'renounceOwnership',
  })

/**
 * Wraps __{@link useWriteContract}__ with `abi` set to __{@link pinVAbi}__ and `functionName` set to `"safeBatchTransferFrom"`
 *
 * - [__View Contract on Base Basescan__](https://basescan.org/address/0x0000000000000000000000000000000000000000)
 * -
 * - [__View Contract on Base Sepolia Basescan__](https://sepolia.basescan.org/address/0xfb5118bcaec3b6d774307e777679c7bc16dce020)
 */
export const useWritePinVSafeBatchTransferFrom =
  /*#__PURE__*/ createUseWriteContract({
    abi: pinVAbi,
    address: pinVAddress,
    functionName: 'safeBatchTransferFrom',
  })

/**
 * Wraps __{@link useWriteContract}__ with `abi` set to __{@link pinVAbi}__ and `functionName` set to `"safeTransferFrom"`
 *
 * - [__View Contract on Base Basescan__](https://basescan.org/address/0x0000000000000000000000000000000000000000)
 * -
 * - [__View Contract on Base Sepolia Basescan__](https://sepolia.basescan.org/address/0xfb5118bcaec3b6d774307e777679c7bc16dce020)
 */
export const useWritePinVSafeTransferFrom =
  /*#__PURE__*/ createUseWriteContract({
    abi: pinVAbi,
    address: pinVAddress,
    functionName: 'safeTransferFrom',
  })

/**
 * Wraps __{@link useWriteContract}__ with `abi` set to __{@link pinVAbi}__ and `functionName` set to `"secondaryMint"`
 *
 * - [__View Contract on Base Basescan__](https://basescan.org/address/0x0000000000000000000000000000000000000000)
 * -
 * - [__View Contract on Base Sepolia Basescan__](https://sepolia.basescan.org/address/0xfb5118bcaec3b6d774307e777679c7bc16dce020)
 */
export const useWritePinVSecondaryMint = /*#__PURE__*/ createUseWriteContract({
  abi: pinVAbi,
  address: pinVAddress,
  functionName: 'secondaryMint',
})

/**
 * Wraps __{@link useWriteContract}__ with `abi` set to __{@link pinVAbi}__ and `functionName` set to `"setApprovalForAll"`
 *
 * - [__View Contract on Base Basescan__](https://basescan.org/address/0x0000000000000000000000000000000000000000)
 * -
 * - [__View Contract on Base Sepolia Basescan__](https://sepolia.basescan.org/address/0xfb5118bcaec3b6d774307e777679c7bc16dce020)
 */
export const useWritePinVSetApprovalForAll =
  /*#__PURE__*/ createUseWriteContract({
    abi: pinVAbi,
    address: pinVAddress,
    functionName: 'setApprovalForAll',
  })

/**
 * Wraps __{@link useWriteContract}__ with `abi` set to __{@link pinVAbi}__ and `functionName` set to `"setConfig"`
 *
 * - [__View Contract on Base Basescan__](https://basescan.org/address/0x0000000000000000000000000000000000000000)
 * -
 * - [__View Contract on Base Sepolia Basescan__](https://sepolia.basescan.org/address/0xfb5118bcaec3b6d774307e777679c7bc16dce020)
 */
export const useWritePinVSetConfig = /*#__PURE__*/ createUseWriteContract({
  abi: pinVAbi,
  address: pinVAddress,
  functionName: 'setConfig',
})

/**
 * Wraps __{@link useWriteContract}__ with `abi` set to __{@link pinVAbi}__ and `functionName` set to `"setPinStoreImplementation"`
 *
 * - [__View Contract on Base Basescan__](https://basescan.org/address/0x0000000000000000000000000000000000000000)
 * -
 * - [__View Contract on Base Sepolia Basescan__](https://sepolia.basescan.org/address/0xfb5118bcaec3b6d774307e777679c7bc16dce020)
 */
export const useWritePinVSetPinStoreImplementation =
  /*#__PURE__*/ createUseWriteContract({
    abi: pinVAbi,
    address: pinVAddress,
    functionName: 'setPinStoreImplementation',
  })

/**
 * Wraps __{@link useWriteContract}__ with `abi` set to __{@link pinVAbi}__ and `functionName` set to `"transferOwnership"`
 *
 * - [__View Contract on Base Basescan__](https://basescan.org/address/0x0000000000000000000000000000000000000000)
 * -
 * - [__View Contract on Base Sepolia Basescan__](https://sepolia.basescan.org/address/0xfb5118bcaec3b6d774307e777679c7bc16dce020)
 */
export const useWritePinVTransferOwnership =
  /*#__PURE__*/ createUseWriteContract({
    abi: pinVAbi,
    address: pinVAddress,
    functionName: 'transferOwnership',
  })

/**
 * Wraps __{@link useWriteContract}__ with `abi` set to __{@link pinVAbi}__ and `functionName` set to `"withdraw"`
 *
 * - [__View Contract on Base Basescan__](https://basescan.org/address/0x0000000000000000000000000000000000000000)
 * -
 * - [__View Contract on Base Sepolia Basescan__](https://sepolia.basescan.org/address/0xfb5118bcaec3b6d774307e777679c7bc16dce020)
 */
export const useWritePinVWithdraw = /*#__PURE__*/ createUseWriteContract({
  abi: pinVAbi,
  address: pinVAddress,
  functionName: 'withdraw',
})

/**
 * Wraps __{@link useSimulateContract}__ with `abi` set to __{@link pinVAbi}__
 *
 * - [__View Contract on Base Basescan__](https://basescan.org/address/0x0000000000000000000000000000000000000000)
 * -
 * - [__View Contract on Base Sepolia Basescan__](https://sepolia.basescan.org/address/0xfb5118bcaec3b6d774307e777679c7bc16dce020)
 */
export const useSimulatePinV = /*#__PURE__*/ createUseSimulateContract({
  abi: pinVAbi,
  address: pinVAddress,
})

/**
 * Wraps __{@link useSimulateContract}__ with `abi` set to __{@link pinVAbi}__ and `functionName` set to `"mint"`
 *
 * - [__View Contract on Base Basescan__](https://basescan.org/address/0x0000000000000000000000000000000000000000)
 * -
 * - [__View Contract on Base Sepolia Basescan__](https://sepolia.basescan.org/address/0xfb5118bcaec3b6d774307e777679c7bc16dce020)
 */
export const useSimulatePinVMint = /*#__PURE__*/ createUseSimulateContract({
  abi: pinVAbi,
  address: pinVAddress,
  functionName: 'mint',
})

/**
 * Wraps __{@link useSimulateContract}__ with `abi` set to __{@link pinVAbi}__ and `functionName` set to `"renounceOwnership"`
 *
 * - [__View Contract on Base Basescan__](https://basescan.org/address/0x0000000000000000000000000000000000000000)
 * -
 * - [__View Contract on Base Sepolia Basescan__](https://sepolia.basescan.org/address/0xfb5118bcaec3b6d774307e777679c7bc16dce020)
 */
export const useSimulatePinVRenounceOwnership =
  /*#__PURE__*/ createUseSimulateContract({
    abi: pinVAbi,
    address: pinVAddress,
    functionName: 'renounceOwnership',
  })

/**
 * Wraps __{@link useSimulateContract}__ with `abi` set to __{@link pinVAbi}__ and `functionName` set to `"safeBatchTransferFrom"`
 *
 * - [__View Contract on Base Basescan__](https://basescan.org/address/0x0000000000000000000000000000000000000000)
 * -
 * - [__View Contract on Base Sepolia Basescan__](https://sepolia.basescan.org/address/0xfb5118bcaec3b6d774307e777679c7bc16dce020)
 */
export const useSimulatePinVSafeBatchTransferFrom =
  /*#__PURE__*/ createUseSimulateContract({
    abi: pinVAbi,
    address: pinVAddress,
    functionName: 'safeBatchTransferFrom',
  })

/**
 * Wraps __{@link useSimulateContract}__ with `abi` set to __{@link pinVAbi}__ and `functionName` set to `"safeTransferFrom"`
 *
 * - [__View Contract on Base Basescan__](https://basescan.org/address/0x0000000000000000000000000000000000000000)
 * -
 * - [__View Contract on Base Sepolia Basescan__](https://sepolia.basescan.org/address/0xfb5118bcaec3b6d774307e777679c7bc16dce020)
 */
export const useSimulatePinVSafeTransferFrom =
  /*#__PURE__*/ createUseSimulateContract({
    abi: pinVAbi,
    address: pinVAddress,
    functionName: 'safeTransferFrom',
  })

/**
 * Wraps __{@link useSimulateContract}__ with `abi` set to __{@link pinVAbi}__ and `functionName` set to `"secondaryMint"`
 *
 * - [__View Contract on Base Basescan__](https://basescan.org/address/0x0000000000000000000000000000000000000000)
 * -
 * - [__View Contract on Base Sepolia Basescan__](https://sepolia.basescan.org/address/0xfb5118bcaec3b6d774307e777679c7bc16dce020)
 */
export const useSimulatePinVSecondaryMint =
  /*#__PURE__*/ createUseSimulateContract({
    abi: pinVAbi,
    address: pinVAddress,
    functionName: 'secondaryMint',
  })

/**
 * Wraps __{@link useSimulateContract}__ with `abi` set to __{@link pinVAbi}__ and `functionName` set to `"setApprovalForAll"`
 *
 * - [__View Contract on Base Basescan__](https://basescan.org/address/0x0000000000000000000000000000000000000000)
 * -
 * - [__View Contract on Base Sepolia Basescan__](https://sepolia.basescan.org/address/0xfb5118bcaec3b6d774307e777679c7bc16dce020)
 */
export const useSimulatePinVSetApprovalForAll =
  /*#__PURE__*/ createUseSimulateContract({
    abi: pinVAbi,
    address: pinVAddress,
    functionName: 'setApprovalForAll',
  })

/**
 * Wraps __{@link useSimulateContract}__ with `abi` set to __{@link pinVAbi}__ and `functionName` set to `"setConfig"`
 *
 * - [__View Contract on Base Basescan__](https://basescan.org/address/0x0000000000000000000000000000000000000000)
 * -
 * - [__View Contract on Base Sepolia Basescan__](https://sepolia.basescan.org/address/0xfb5118bcaec3b6d774307e777679c7bc16dce020)
 */
export const useSimulatePinVSetConfig = /*#__PURE__*/ createUseSimulateContract(
  { abi: pinVAbi, address: pinVAddress, functionName: 'setConfig' },
)

/**
 * Wraps __{@link useSimulateContract}__ with `abi` set to __{@link pinVAbi}__ and `functionName` set to `"setPinStoreImplementation"`
 *
 * - [__View Contract on Base Basescan__](https://basescan.org/address/0x0000000000000000000000000000000000000000)
 * -
 * - [__View Contract on Base Sepolia Basescan__](https://sepolia.basescan.org/address/0xfb5118bcaec3b6d774307e777679c7bc16dce020)
 */
export const useSimulatePinVSetPinStoreImplementation =
  /*#__PURE__*/ createUseSimulateContract({
    abi: pinVAbi,
    address: pinVAddress,
    functionName: 'setPinStoreImplementation',
  })

/**
 * Wraps __{@link useSimulateContract}__ with `abi` set to __{@link pinVAbi}__ and `functionName` set to `"transferOwnership"`
 *
 * - [__View Contract on Base Basescan__](https://basescan.org/address/0x0000000000000000000000000000000000000000)
 * -
 * - [__View Contract on Base Sepolia Basescan__](https://sepolia.basescan.org/address/0xfb5118bcaec3b6d774307e777679c7bc16dce020)
 */
export const useSimulatePinVTransferOwnership =
  /*#__PURE__*/ createUseSimulateContract({
    abi: pinVAbi,
    address: pinVAddress,
    functionName: 'transferOwnership',
  })

/**
 * Wraps __{@link useSimulateContract}__ with `abi` set to __{@link pinVAbi}__ and `functionName` set to `"withdraw"`
 *
 * - [__View Contract on Base Basescan__](https://basescan.org/address/0x0000000000000000000000000000000000000000)
 * -
 * - [__View Contract on Base Sepolia Basescan__](https://sepolia.basescan.org/address/0xfb5118bcaec3b6d774307e777679c7bc16dce020)
 */
export const useSimulatePinVWithdraw = /*#__PURE__*/ createUseSimulateContract({
  abi: pinVAbi,
  address: pinVAddress,
  functionName: 'withdraw',
})

/**
 * Wraps __{@link useWatchContractEvent}__ with `abi` set to __{@link pinVAbi}__
 *
 * - [__View Contract on Base Basescan__](https://basescan.org/address/0x0000000000000000000000000000000000000000)
 * -
 * - [__View Contract on Base Sepolia Basescan__](https://sepolia.basescan.org/address/0xfb5118bcaec3b6d774307e777679c7bc16dce020)
 */
export const useWatchPinVEvent = /*#__PURE__*/ createUseWatchContractEvent({
  abi: pinVAbi,
  address: pinVAddress,
})

/**
 * Wraps __{@link useWatchContractEvent}__ with `abi` set to __{@link pinVAbi}__ and `eventName` set to `"ApprovalForAll"`
 *
 * - [__View Contract on Base Basescan__](https://basescan.org/address/0x0000000000000000000000000000000000000000)
 * -
 * - [__View Contract on Base Sepolia Basescan__](https://sepolia.basescan.org/address/0xfb5118bcaec3b6d774307e777679c7bc16dce020)
 */
export const useWatchPinVApprovalForAllEvent =
  /*#__PURE__*/ createUseWatchContractEvent({
    abi: pinVAbi,
    address: pinVAddress,
    eventName: 'ApprovalForAll',
  })

/**
 * Wraps __{@link useWatchContractEvent}__ with `abi` set to __{@link pinVAbi}__ and `eventName` set to `"ConfigUpdated"`
 *
 * - [__View Contract on Base Basescan__](https://basescan.org/address/0x0000000000000000000000000000000000000000)
 * -
 * - [__View Contract on Base Sepolia Basescan__](https://sepolia.basescan.org/address/0xfb5118bcaec3b6d774307e777679c7bc16dce020)
 */
export const useWatchPinVConfigUpdatedEvent =
  /*#__PURE__*/ createUseWatchContractEvent({
    abi: pinVAbi,
    address: pinVAddress,
    eventName: 'ConfigUpdated',
  })

/**
 * Wraps __{@link useWatchContractEvent}__ with `abi` set to __{@link pinVAbi}__ and `eventName` set to `"Mint"`
 *
 * - [__View Contract on Base Basescan__](https://basescan.org/address/0x0000000000000000000000000000000000000000)
 * -
 * - [__View Contract on Base Sepolia Basescan__](https://sepolia.basescan.org/address/0xfb5118bcaec3b6d774307e777679c7bc16dce020)
 */
export const useWatchPinVMintEvent = /*#__PURE__*/ createUseWatchContractEvent({
  abi: pinVAbi,
  address: pinVAddress,
  eventName: 'Mint',
})

/**
 * Wraps __{@link useWatchContractEvent}__ with `abi` set to __{@link pinVAbi}__ and `eventName` set to `"OwnershipTransferred"`
 *
 * - [__View Contract on Base Basescan__](https://basescan.org/address/0x0000000000000000000000000000000000000000)
 * -
 * - [__View Contract on Base Sepolia Basescan__](https://sepolia.basescan.org/address/0xfb5118bcaec3b6d774307e777679c7bc16dce020)
 */
export const useWatchPinVOwnershipTransferredEvent =
  /*#__PURE__*/ createUseWatchContractEvent({
    abi: pinVAbi,
    address: pinVAddress,
    eventName: 'OwnershipTransferred',
  })

/**
 * Wraps __{@link useWatchContractEvent}__ with `abi` set to __{@link pinVAbi}__ and `eventName` set to `"SecondaryMint"`
 *
 * - [__View Contract on Base Basescan__](https://basescan.org/address/0x0000000000000000000000000000000000000000)
 * -
 * - [__View Contract on Base Sepolia Basescan__](https://sepolia.basescan.org/address/0xfb5118bcaec3b6d774307e777679c7bc16dce020)
 */
export const useWatchPinVSecondaryMintEvent =
  /*#__PURE__*/ createUseWatchContractEvent({
    abi: pinVAbi,
    address: pinVAddress,
    eventName: 'SecondaryMint',
  })

/**
 * Wraps __{@link useWatchContractEvent}__ with `abi` set to __{@link pinVAbi}__ and `eventName` set to `"TransferBatch"`
 *
 * - [__View Contract on Base Basescan__](https://basescan.org/address/0x0000000000000000000000000000000000000000)
 * -
 * - [__View Contract on Base Sepolia Basescan__](https://sepolia.basescan.org/address/0xfb5118bcaec3b6d774307e777679c7bc16dce020)
 */
export const useWatchPinVTransferBatchEvent =
  /*#__PURE__*/ createUseWatchContractEvent({
    abi: pinVAbi,
    address: pinVAddress,
    eventName: 'TransferBatch',
  })

/**
 * Wraps __{@link useWatchContractEvent}__ with `abi` set to __{@link pinVAbi}__ and `eventName` set to `"TransferSingle"`
 *
 * - [__View Contract on Base Basescan__](https://basescan.org/address/0x0000000000000000000000000000000000000000)
 * -
 * - [__View Contract on Base Sepolia Basescan__](https://sepolia.basescan.org/address/0xfb5118bcaec3b6d774307e777679c7bc16dce020)
 */
export const useWatchPinVTransferSingleEvent =
  /*#__PURE__*/ createUseWatchContractEvent({
    abi: pinVAbi,
    address: pinVAddress,
    eventName: 'TransferSingle',
  })

/**
 * Wraps __{@link useWatchContractEvent}__ with `abi` set to __{@link pinVAbi}__ and `eventName` set to `"URI"`
 *
 * - [__View Contract on Base Basescan__](https://basescan.org/address/0x0000000000000000000000000000000000000000)
 * -
 * - [__View Contract on Base Sepolia Basescan__](https://sepolia.basescan.org/address/0xfb5118bcaec3b6d774307e777679c7bc16dce020)
 */
export const useWatchPinVUriEvent = /*#__PURE__*/ createUseWatchContractEvent({
  abi: pinVAbi,
  address: pinVAddress,
  eventName: 'URI',
})

/**
 * Wraps __{@link useWatchContractEvent}__ with `abi` set to __{@link pinVAbi}__ and `eventName` set to `"Withdrawn"`
 *
 * - [__View Contract on Base Basescan__](https://basescan.org/address/0x0000000000000000000000000000000000000000)
 * -
 * - [__View Contract on Base Sepolia Basescan__](https://sepolia.basescan.org/address/0xfb5118bcaec3b6d774307e777679c7bc16dce020)
 */
export const useWatchPinVWithdrawnEvent =
  /*#__PURE__*/ createUseWatchContractEvent({
    abi: pinVAbi,
    address: pinVAddress,
    eventName: 'Withdrawn',
  })

/**
 * Wraps __{@link useReadContract}__ with `abi` set to __{@link pinVStoreAbi}__
 */
export const useReadPinVStore = /*#__PURE__*/ createUseReadContract({
  abi: pinVStoreAbi,
})

/**
 * Wraps __{@link useReadContract}__ with `abi` set to __{@link pinVStoreAbi}__ and `functionName` set to `"BASIS_POINTS"`
 */
export const useReadPinVStoreBasisPoints = /*#__PURE__*/ createUseReadContract({
  abi: pinVStoreAbi,
  functionName: 'BASIS_POINTS',
})

/**
 * Wraps __{@link useReadContract}__ with `abi` set to __{@link pinVStoreAbi}__ and `functionName` set to `"config"`
 */
export const useReadPinVStoreConfig = /*#__PURE__*/ createUseReadContract({
  abi: pinVStoreAbi,
  functionName: 'config',
})

/**
 * Wraps __{@link useReadContract}__ with `abi` set to __{@link pinVStoreAbi}__ and `functionName` set to `"creator"`
 */
export const useReadPinVStoreCreator = /*#__PURE__*/ createUseReadContract({
  abi: pinVStoreAbi,
  functionName: 'creator',
})

/**
 * Wraps __{@link useReadContract}__ with `abi` set to __{@link pinVStoreAbi}__ and `functionName` set to `"factory"`
 */
export const useReadPinVStoreFactory = /*#__PURE__*/ createUseReadContract({
  abi: pinVStoreAbi,
  functionName: 'factory',
})

/**
 * Wraps __{@link useReadContract}__ with `abi` set to __{@link pinVStoreAbi}__ and `functionName` set to `"getConfig"`
 */
export const useReadPinVStoreGetConfig = /*#__PURE__*/ createUseReadContract({
  abi: pinVStoreAbi,
  functionName: 'getConfig',
})

/**
 * Wraps __{@link useReadContract}__ with `abi` set to __{@link pinVStoreAbi}__ and `functionName` set to `"latestVersion"`
 */
export const useReadPinVStoreLatestVersion =
  /*#__PURE__*/ createUseReadContract({
    abi: pinVStoreAbi,
    functionName: 'latestVersion',
  })

/**
 * Wraps __{@link useReadContract}__ with `abi` set to __{@link pinVStoreAbi}__ and `functionName` set to `"secondaryMintPrice"`
 */
export const useReadPinVStoreSecondaryMintPrice =
  /*#__PURE__*/ createUseReadContract({
    abi: pinVStoreAbi,
    functionName: 'secondaryMintPrice',
  })

/**
 * Wraps __{@link useReadContract}__ with `abi` set to __{@link pinVStoreAbi}__ and `functionName` set to `"tagline"`
 */
export const useReadPinVStoreTagline = /*#__PURE__*/ createUseReadContract({
  abi: pinVStoreAbi,
  functionName: 'tagline',
})

/**
 * Wraps __{@link useReadContract}__ with `abi` set to __{@link pinVStoreAbi}__ and `functionName` set to `"title"`
 */
export const useReadPinVStoreTitle = /*#__PURE__*/ createUseReadContract({
  abi: pinVStoreAbi,
  functionName: 'title',
})

/**
 * Wraps __{@link useReadContract}__ with `abi` set to __{@link pinVStoreAbi}__ and `functionName` set to `"tokenId"`
 */
export const useReadPinVStoreTokenId = /*#__PURE__*/ createUseReadContract({
  abi: pinVStoreAbi,
  functionName: 'tokenId',
})

/**
 * Wraps __{@link useReadContract}__ with `abi` set to __{@link pinVStoreAbi}__ and `functionName` set to `"tradingCreatorFeeBps"`
 */
export const useReadPinVStoreTradingCreatorFeeBps =
  /*#__PURE__*/ createUseReadContract({
    abi: pinVStoreAbi,
    functionName: 'tradingCreatorFeeBps',
  })

/**
 * Wraps __{@link useReadContract}__ with `abi` set to __{@link pinVStoreAbi}__ and `functionName` set to `"versions"`
 */
export const useReadPinVStoreVersions = /*#__PURE__*/ createUseReadContract({
  abi: pinVStoreAbi,
  functionName: 'versions',
})

/**
 * Wraps __{@link useWriteContract}__ with `abi` set to __{@link pinVStoreAbi}__
 */
export const useWritePinVStore = /*#__PURE__*/ createUseWriteContract({
  abi: pinVStoreAbi,
})

/**
 * Wraps __{@link useWriteContract}__ with `abi` set to __{@link pinVStoreAbi}__ and `functionName` set to `"addVersion"`
 */
export const useWritePinVStoreAddVersion = /*#__PURE__*/ createUseWriteContract(
  { abi: pinVStoreAbi, functionName: 'addVersion' },
)

/**
 * Wraps __{@link useWriteContract}__ with `abi` set to __{@link pinVStoreAbi}__ and `functionName` set to `"initialize"`
 */
export const useWritePinVStoreInitialize = /*#__PURE__*/ createUseWriteContract(
  { abi: pinVStoreAbi, functionName: 'initialize' },
)

/**
 * Wraps __{@link useWriteContract}__ with `abi` set to __{@link pinVStoreAbi}__ and `functionName` set to `"setCreator"`
 */
export const useWritePinVStoreSetCreator = /*#__PURE__*/ createUseWriteContract(
  { abi: pinVStoreAbi, functionName: 'setCreator' },
)

/**
 * Wraps __{@link useWriteContract}__ with `abi` set to __{@link pinVStoreAbi}__ and `functionName` set to `"setSecondaryMintPrice"`
 */
export const useWritePinVStoreSetSecondaryMintPrice =
  /*#__PURE__*/ createUseWriteContract({
    abi: pinVStoreAbi,
    functionName: 'setSecondaryMintPrice',
  })

/**
 * Wraps __{@link useWriteContract}__ with `abi` set to __{@link pinVStoreAbi}__ and `functionName` set to `"setTradingCreatorFeeBps"`
 */
export const useWritePinVStoreSetTradingCreatorFeeBps =
  /*#__PURE__*/ createUseWriteContract({
    abi: pinVStoreAbi,
    functionName: 'setTradingCreatorFeeBps',
  })

/**
 * Wraps __{@link useWriteContract}__ with `abi` set to __{@link pinVStoreAbi}__ and `functionName` set to `"updateMetadata"`
 */
export const useWritePinVStoreUpdateMetadata =
  /*#__PURE__*/ createUseWriteContract({
    abi: pinVStoreAbi,
    functionName: 'updateMetadata',
  })

/**
 * Wraps __{@link useWriteContract}__ with `abi` set to __{@link pinVStoreAbi}__ and `functionName` set to `"withdraw"`
 */
export const useWritePinVStoreWithdraw = /*#__PURE__*/ createUseWriteContract({
  abi: pinVStoreAbi,
  functionName: 'withdraw',
})

/**
 * Wraps __{@link useSimulateContract}__ with `abi` set to __{@link pinVStoreAbi}__
 */
export const useSimulatePinVStore = /*#__PURE__*/ createUseSimulateContract({
  abi: pinVStoreAbi,
})

/**
 * Wraps __{@link useSimulateContract}__ with `abi` set to __{@link pinVStoreAbi}__ and `functionName` set to `"addVersion"`
 */
export const useSimulatePinVStoreAddVersion =
  /*#__PURE__*/ createUseSimulateContract({
    abi: pinVStoreAbi,
    functionName: 'addVersion',
  })

/**
 * Wraps __{@link useSimulateContract}__ with `abi` set to __{@link pinVStoreAbi}__ and `functionName` set to `"initialize"`
 */
export const useSimulatePinVStoreInitialize =
  /*#__PURE__*/ createUseSimulateContract({
    abi: pinVStoreAbi,
    functionName: 'initialize',
  })

/**
 * Wraps __{@link useSimulateContract}__ with `abi` set to __{@link pinVStoreAbi}__ and `functionName` set to `"setCreator"`
 */
export const useSimulatePinVStoreSetCreator =
  /*#__PURE__*/ createUseSimulateContract({
    abi: pinVStoreAbi,
    functionName: 'setCreator',
  })

/**
 * Wraps __{@link useSimulateContract}__ with `abi` set to __{@link pinVStoreAbi}__ and `functionName` set to `"setSecondaryMintPrice"`
 */
export const useSimulatePinVStoreSetSecondaryMintPrice =
  /*#__PURE__*/ createUseSimulateContract({
    abi: pinVStoreAbi,
    functionName: 'setSecondaryMintPrice',
  })

/**
 * Wraps __{@link useSimulateContract}__ with `abi` set to __{@link pinVStoreAbi}__ and `functionName` set to `"setTradingCreatorFeeBps"`
 */
export const useSimulatePinVStoreSetTradingCreatorFeeBps =
  /*#__PURE__*/ createUseSimulateContract({
    abi: pinVStoreAbi,
    functionName: 'setTradingCreatorFeeBps',
  })

/**
 * Wraps __{@link useSimulateContract}__ with `abi` set to __{@link pinVStoreAbi}__ and `functionName` set to `"updateMetadata"`
 */
export const useSimulatePinVStoreUpdateMetadata =
  /*#__PURE__*/ createUseSimulateContract({
    abi: pinVStoreAbi,
    functionName: 'updateMetadata',
  })

/**
 * Wraps __{@link useSimulateContract}__ with `abi` set to __{@link pinVStoreAbi}__ and `functionName` set to `"withdraw"`
 */
export const useSimulatePinVStoreWithdraw =
  /*#__PURE__*/ createUseSimulateContract({
    abi: pinVStoreAbi,
    functionName: 'withdraw',
  })

/**
 * Wraps __{@link useWatchContractEvent}__ with `abi` set to __{@link pinVStoreAbi}__
 */
export const useWatchPinVStoreEvent = /*#__PURE__*/ createUseWatchContractEvent(
  { abi: pinVStoreAbi },
)

/**
 * Wraps __{@link useWatchContractEvent}__ with `abi` set to __{@link pinVStoreAbi}__ and `eventName` set to `"CreatorUpdated"`
 */
export const useWatchPinVStoreCreatorUpdatedEvent =
  /*#__PURE__*/ createUseWatchContractEvent({
    abi: pinVStoreAbi,
    eventName: 'CreatorUpdated',
  })

/**
 * Wraps __{@link useWatchContractEvent}__ with `abi` set to __{@link pinVStoreAbi}__ and `eventName` set to `"Initialized"`
 */
export const useWatchPinVStoreInitializedEvent =
  /*#__PURE__*/ createUseWatchContractEvent({
    abi: pinVStoreAbi,
    eventName: 'Initialized',
  })

/**
 * Wraps __{@link useWatchContractEvent}__ with `abi` set to __{@link pinVStoreAbi}__ and `eventName` set to `"MetadataUpdated"`
 */
export const useWatchPinVStoreMetadataUpdatedEvent =
  /*#__PURE__*/ createUseWatchContractEvent({
    abi: pinVStoreAbi,
    eventName: 'MetadataUpdated',
  })

/**
 * Wraps __{@link useWatchContractEvent}__ with `abi` set to __{@link pinVStoreAbi}__ and `eventName` set to `"SecondaryMintPriceUpdated"`
 */
export const useWatchPinVStoreSecondaryMintPriceUpdatedEvent =
  /*#__PURE__*/ createUseWatchContractEvent({
    abi: pinVStoreAbi,
    eventName: 'SecondaryMintPriceUpdated',
  })

/**
 * Wraps __{@link useWatchContractEvent}__ with `abi` set to __{@link pinVStoreAbi}__ and `eventName` set to `"StoreInitialized"`
 */
export const useWatchPinVStoreStoreInitializedEvent =
  /*#__PURE__*/ createUseWatchContractEvent({
    abi: pinVStoreAbi,
    eventName: 'StoreInitialized',
  })

/**
 * Wraps __{@link useWatchContractEvent}__ with `abi` set to __{@link pinVStoreAbi}__ and `eventName` set to `"TradingCreatorFeeBpsUpdated"`
 */
export const useWatchPinVStoreTradingCreatorFeeBpsUpdatedEvent =
  /*#__PURE__*/ createUseWatchContractEvent({
    abi: pinVStoreAbi,
    eventName: 'TradingCreatorFeeBpsUpdated',
  })

/**
 * Wraps __{@link useWatchContractEvent}__ with `abi` set to __{@link pinVStoreAbi}__ and `eventName` set to `"VersionAdded"`
 */
export const useWatchPinVStoreVersionAddedEvent =
  /*#__PURE__*/ createUseWatchContractEvent({
    abi: pinVStoreAbi,
    eventName: 'VersionAdded',
  })

/**
 * Wraps __{@link useWatchContractEvent}__ with `abi` set to __{@link pinVStoreAbi}__ and `eventName` set to `"Withdrawn"`
 */
export const useWatchPinVStoreWithdrawnEvent =
  /*#__PURE__*/ createUseWatchContractEvent({
    abi: pinVStoreAbi,
    eventName: 'Withdrawn',
  })
