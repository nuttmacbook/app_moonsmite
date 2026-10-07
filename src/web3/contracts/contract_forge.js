// The game contract: address of the PROXY (VITE_FORGE_ADDRESS), with the engine ABI.
export const Forge = {
    address: import.meta.env.VITE_FORGE_ADDRESS,
    abi: [
        {
            "inputs": [],
            "name": "AlreadyInitialized",
            "type": "error"
        },
        {
            "inputs": [],
            "name": "AlreadyListed",
            "type": "error"
        },
        {
            "inputs": [],
            "name": "AtLeastOnePoint",
            "type": "error"
        },
        {
            "inputs": [],
            "name": "BatchSize",
            "type": "error"
        },
        {
            "inputs": [],
            "name": "FeeFailed",
            "type": "error"
        },
        {
            "inputs": [],
            "name": "FeeTooHigh",
            "type": "error"
        },
        {
            "inputs": [],
            "name": "FurnaceAboveTime",
            "type": "error"
        },
        {
            "inputs": [],
            "name": "FurnaceWentDown",
            "type": "error"
        },
        {
            "inputs": [],
            "name": "GuildLevelsOutOfRange",
            "type": "error"
        },
        {
            "inputs": [],
            "name": "GuildTotalTooHigh",
            "type": "error"
        },
        {
            "inputs": [],
            "name": "ItemIsListed",
            "type": "error"
        },
        {
            "inputs": [],
            "name": "MintFirst",
            "type": "error"
        },
        {
            "inputs": [],
            "name": "NoSuchSlot",
            "type": "error"
        },
        {
            "inputs": [],
            "name": "NoToken",
            "type": "error"
        },
        {
            "inputs": [],
            "name": "NotAllowed",
            "type": "error"
        },
        {
            "inputs": [],
            "name": "NotListed",
            "type": "error"
        },
        {
            "inputs": [],
            "name": "NotSignedByGame",
            "type": "error"
        },
        {
            "inputs": [],
            "name": "NotYourItem",
            "type": "error"
        },
        {
            "inputs": [],
            "name": "NothingToClaim",
            "type": "error"
        },
        {
            "inputs": [],
            "name": "OneUnlockPerLevel",
            "type": "error"
        },
        {
            "inputs": [],
            "name": "OnlyOwner",
            "type": "error"
        },
        {
            "inputs": [],
            "name": "OwnItem",
            "type": "error"
        },
        {
            "inputs": [],
            "name": "PaymentFailed",
            "type": "error"
        },
        {
            "inputs": [],
            "name": "PointsAboveFurnace",
            "type": "error"
        },
        {
            "inputs": [],
            "name": "PointsAboveMax",
            "type": "error"
        },
        {
            "inputs": [],
            "name": "PointsPerHourOutOfRange",
            "type": "error"
        },
        {
            "inputs": [],
            "name": "PoolEmpty",
            "type": "error"
        },
        {
            "inputs": [],
            "name": "PriceChanged",
            "type": "error"
        },
        {
            "inputs": [],
            "name": "PriceIsZero",
            "type": "error"
        },
        {
            "inputs": [],
            "name": "ReceiverRejected",
            "type": "error"
        },
        {
            "inputs": [],
            "name": "Reentrant",
            "type": "error"
        },
        {
            "inputs": [],
            "name": "ReferrerNotFound",
            "type": "error"
        },
        {
            "inputs": [],
            "name": "SameWallet",
            "type": "error"
        },
        {
            "inputs": [],
            "name": "ScoreAboveMax",
            "type": "error"
        },
        {
            "inputs": [],
            "name": "ScoreWentDown",
            "type": "error"
        },
        {
            "inputs": [],
            "name": "SelfReferral",
            "type": "error"
        },
        {
            "inputs": [],
            "name": "ShelfChanged",
            "type": "error"
        },
        {
            "inputs": [],
            "name": "SignatureExpired",
            "type": "error"
        },
        {
            "inputs": [],
            "name": "SoldOut",
            "type": "error"
        },
        {
            "inputs": [],
            "name": "StrikesWentDown",
            "type": "error"
        },
        {
            "inputs": [],
            "name": "UnlocksMustNotGoDown",
            "type": "error"
        },
        {
            "inputs": [],
            "name": "ValueAboveCap",
            "type": "error"
        },
        {
            "inputs": [],
            "name": "ValueWentDown",
            "type": "error"
        },
        {
            "inputs": [],
            "name": "WrongOwner",
            "type": "error"
        },
        {
            "inputs": [],
            "name": "ZeroAddress",
            "type": "error"
        },
        {
            "anonymous": false,
            "inputs": [
                {
                    "indexed": true,
                    "internalType": "address",
                    "name": "owner",
                    "type": "address"
                },
                {
                    "indexed": true,
                    "internalType": "address",
                    "name": "approved",
                    "type": "address"
                },
                {
                    "indexed": true,
                    "internalType": "uint256",
                    "name": "tokenId",
                    "type": "uint256"
                }
            ],
            "name": "Approval",
            "type": "event"
        },
        {
            "anonymous": false,
            "inputs": [
                {
                    "indexed": true,
                    "internalType": "address",
                    "name": "owner",
                    "type": "address"
                },
                {
                    "indexed": true,
                    "internalType": "address",
                    "name": "operator",
                    "type": "address"
                },
                {
                    "indexed": false,
                    "internalType": "bool",
                    "name": "approved",
                    "type": "bool"
                }
            ],
            "name": "ApprovalForAll",
            "type": "event"
        },
        {
            "anonymous": false,
            "inputs": [
                {
                    "indexed": false,
                    "internalType": "uint256",
                    "name": "feeBps",
                    "type": "uint256"
                }
            ],
            "name": "FeeChanged",
            "type": "event"
        },
        {
            "anonymous": false,
            "inputs": [
                {
                    "indexed": false,
                    "internalType": "uint256",
                    "name": "pointsPerHour",
                    "type": "uint256"
                }
            ],
            "name": "FurnaceChanged",
            "type": "event"
        },
        {
            "anonymous": false,
            "inputs": [
                {
                    "indexed": false,
                    "internalType": "uint256[]",
                    "name": "rates",
                    "type": "uint256[]"
                },
                {
                    "indexed": false,
                    "internalType": "uint256[]",
                    "name": "unlocks",
                    "type": "uint256[]"
                }
            ],
            "name": "GuildChanged",
            "type": "event"
        },
        {
            "anonymous": false,
            "inputs": [
                {
                    "indexed": true,
                    "internalType": "uint256",
                    "name": "tokenId",
                    "type": "uint256"
                },
                {
                    "indexed": true,
                    "internalType": "address",
                    "name": "seller",
                    "type": "address"
                },
                {
                    "indexed": false,
                    "internalType": "uint256",
                    "name": "price",
                    "type": "uint256"
                },
                {
                    "indexed": false,
                    "internalType": "uint256",
                    "name": "value",
                    "type": "uint256"
                }
            ],
            "name": "Listed",
            "type": "event"
        },
        {
            "anonymous": false,
            "inputs": [
                {
                    "indexed": false,
                    "internalType": "uint256",
                    "name": "maxPoints",
                    "type": "uint256"
                }
            ],
            "name": "MaxPointsChanged",
            "type": "event"
        },
        {
            "anonymous": false,
            "inputs": [
                {
                    "indexed": true,
                    "internalType": "address",
                    "name": "referrer",
                    "type": "address"
                },
                {
                    "indexed": false,
                    "internalType": "uint256",
                    "name": "amount",
                    "type": "uint256"
                }
            ],
            "name": "ReferralClaimed",
            "type": "event"
        },
        {
            "anonymous": false,
            "inputs": [
                {
                    "indexed": true,
                    "internalType": "address",
                    "name": "referrer",
                    "type": "address"
                },
                {
                    "indexed": true,
                    "internalType": "address",
                    "name": "player",
                    "type": "address"
                },
                {
                    "indexed": false,
                    "internalType": "uint256",
                    "name": "level",
                    "type": "uint256"
                },
                {
                    "indexed": false,
                    "internalType": "uint256",
                    "name": "reward",
                    "type": "uint256"
                }
            ],
            "name": "ReferralReward",
            "type": "event"
        },
        {
            "anonymous": false,
            "inputs": [
                {
                    "indexed": true,
                    "internalType": "address",
                    "name": "account",
                    "type": "address"
                },
                {
                    "indexed": true,
                    "internalType": "address",
                    "name": "referrer",
                    "type": "address"
                }
            ],
            "name": "Registered",
            "type": "event"
        },
        {
            "anonymous": false,
            "inputs": [
                {
                    "indexed": false,
                    "internalType": "address",
                    "name": "renderer",
                    "type": "address"
                }
            ],
            "name": "RendererChanged",
            "type": "event"
        },
        {
            "anonymous": false,
            "inputs": [
                {
                    "indexed": false,
                    "internalType": "uint256",
                    "name": "limit",
                    "type": "uint256"
                }
            ],
            "name": "ShelfLimitChanged",
            "type": "event"
        },
        {
            "anonymous": false,
            "inputs": [
                {
                    "indexed": true,
                    "internalType": "uint256",
                    "name": "tokenId",
                    "type": "uint256"
                },
                {
                    "indexed": true,
                    "internalType": "address",
                    "name": "seller",
                    "type": "address"
                },
                {
                    "indexed": true,
                    "internalType": "address",
                    "name": "buyer",
                    "type": "address"
                },
                {
                    "indexed": false,
                    "internalType": "uint256",
                    "name": "price",
                    "type": "uint256"
                },
                {
                    "indexed": false,
                    "internalType": "uint256",
                    "name": "fee",
                    "type": "uint256"
                }
            ],
            "name": "Sold",
            "type": "event"
        },
        {
            "anonymous": false,
            "inputs": [
                {
                    "indexed": true,
                    "internalType": "uint256",
                    "name": "tokenId",
                    "type": "uint256"
                },
                {
                    "indexed": false,
                    "internalType": "uint256",
                    "name": "value",
                    "type": "uint256"
                },
                {
                    "indexed": false,
                    "internalType": "uint256",
                    "name": "strikes",
                    "type": "uint256"
                },
                {
                    "indexed": false,
                    "internalType": "uint256",
                    "name": "totalScore",
                    "type": "uint256"
                }
            ],
            "name": "StatsSynced",
            "type": "event"
        },
        {
            "anonymous": false,
            "inputs": [
                {
                    "indexed": true,
                    "internalType": "uint256",
                    "name": "tokenId",
                    "type": "uint256"
                },
                {
                    "indexed": true,
                    "internalType": "address",
                    "name": "buyer",
                    "type": "address"
                },
                {
                    "indexed": false,
                    "internalType": "uint256",
                    "name": "price",
                    "type": "uint256"
                },
                {
                    "indexed": false,
                    "internalType": "uint256",
                    "name": "seed",
                    "type": "uint256"
                },
                {
                    "indexed": false,
                    "internalType": "uint256",
                    "name": "round",
                    "type": "uint256"
                },
                {
                    "indexed": false,
                    "internalType": "uint256",
                    "name": "slot",
                    "type": "uint256"
                }
            ],
            "name": "SwordMinted",
            "type": "event"
        },
        {
            "anonymous": false,
            "inputs": [
                {
                    "indexed": true,
                    "internalType": "address",
                    "name": "from",
                    "type": "address"
                },
                {
                    "indexed": true,
                    "internalType": "address",
                    "name": "to",
                    "type": "address"
                },
                {
                    "indexed": true,
                    "internalType": "uint256",
                    "name": "tokenId",
                    "type": "uint256"
                }
            ],
            "name": "Transfer",
            "type": "event"
        },
        {
            "anonymous": false,
            "inputs": [
                {
                    "indexed": true,
                    "internalType": "uint256",
                    "name": "tokenId",
                    "type": "uint256"
                }
            ],
            "name": "Unlisted",
            "type": "event"
        },
        {
            "inputs": [
                {
                    "internalType": "uint256",
                    "name": "id",
                    "type": "uint256"
                }
            ],
            "name": "accountOfId",
            "outputs": [
                {
                    "internalType": "address",
                    "name": "",
                    "type": "address"
                }
            ],
            "stateMutability": "view",
            "type": "function"
        },
        {
            "inputs": [
                {
                    "internalType": "address",
                    "name": "to",
                    "type": "address"
                },
                {
                    "internalType": "uint256",
                    "name": "tokenId",
                    "type": "uint256"
                }
            ],
            "name": "approve",
            "outputs": [],
            "stateMutability": "nonpayable",
            "type": "function"
        },
        {
            "inputs": [
                {
                    "internalType": "address",
                    "name": "owner_",
                    "type": "address"
                }
            ],
            "name": "balanceOf",
            "outputs": [
                {
                    "internalType": "uint256",
                    "name": "",
                    "type": "uint256"
                }
            ],
            "stateMutability": "view",
            "type": "function"
        },
        {
            "inputs": [
                {
                    "internalType": "uint256",
                    "name": "tokenId",
                    "type": "uint256"
                },
                {
                    "internalType": "uint256",
                    "name": "price",
                    "type": "uint256"
                }
            ],
            "name": "buyListed",
            "outputs": [],
            "stateMutability": "nonpayable",
            "type": "function"
        },
        {
            "inputs": [
                {
                    "internalType": "uint256",
                    "name": "tokenId",
                    "type": "uint256"
                }
            ],
            "name": "cancelListing",
            "outputs": [],
            "stateMutability": "nonpayable",
            "type": "function"
        },
        {
            "inputs": [],
            "name": "claimReferral",
            "outputs": [],
            "stateMutability": "nonpayable",
            "type": "function"
        },
        {
            "inputs": [
                {
                    "internalType": "uint256",
                    "name": "tokenId",
                    "type": "uint256"
                }
            ],
            "name": "costBasisOf",
            "outputs": [
                {
                    "internalType": "uint256",
                    "name": "",
                    "type": "uint256"
                }
            ],
            "stateMutability": "view",
            "type": "function"
        },
        {
            "inputs": [],
            "name": "furnaceRate",
            "outputs": [
                {
                    "internalType": "uint256",
                    "name": "pointsPerHour",
                    "type": "uint256"
                },
                {
                    "internalType": "uint256",
                    "name": "strikesPerMonth",
                    "type": "uint256"
                },
                {
                    "internalType": "uint256",
                    "name": "maxPoints",
                    "type": "uint256"
                }
            ],
            "stateMutability": "view",
            "type": "function"
        },
        {
            "inputs": [
                {
                    "internalType": "address",
                    "name": "account_",
                    "type": "address"
                }
            ],
            "name": "getAccount",
            "outputs": [
                {
                    "components": [
                        {
                            "internalType": "address",
                            "name": "referrer",
                            "type": "address"
                        },
                        {
                            "internalType": "uint256",
                            "name": "joinedAt",
                            "type": "uint256"
                        },
                        {
                            "internalType": "uint256",
                            "name": "referrals",
                            "type": "uint256"
                        },
                        {
                            "internalType": "uint256",
                            "name": "spent",
                            "type": "uint256"
                        },
                        {
                            "internalType": "uint256",
                            "name": "earned",
                            "type": "uint256"
                        },
                        {
                            "internalType": "uint256",
                            "name": "taxPaid",
                            "type": "uint256"
                        },
                        {
                            "internalType": "uint256",
                            "name": "minted",
                            "type": "uint256"
                        },
                        {
                            "internalType": "uint256",
                            "name": "bought",
                            "type": "uint256"
                        },
                        {
                            "internalType": "uint256",
                            "name": "sold",
                            "type": "uint256"
                        },
                        {
                            "internalType": "uint256",
                            "name": "furnaces",
                            "type": "uint256"
                        },
                        {
                            "internalType": "uint256",
                            "name": "guildProfit",
                            "type": "uint256"
                        },
                        {
                            "internalType": "uint256",
                            "name": "referralEarned",
                            "type": "uint256"
                        },
                        {
                            "internalType": "uint256",
                            "name": "referralClaimed",
                            "type": "uint256"
                        },
                        {
                            "internalType": "uint256",
                            "name": "id",
                            "type": "uint256"
                        }
                    ],
                    "internalType": "struct Storage.Account",
                    "name": "",
                    "type": "tuple"
                },
                {
                    "internalType": "bool",
                    "name": "",
                    "type": "bool"
                }
            ],
            "stateMutability": "view",
            "type": "function"
        },
        {
            "inputs": [
                {
                    "internalType": "uint256",
                    "name": "tokenId",
                    "type": "uint256"
                }
            ],
            "name": "getApproved",
            "outputs": [
                {
                    "internalType": "address",
                    "name": "",
                    "type": "address"
                }
            ],
            "stateMutability": "view",
            "type": "function"
        },
        {
            "inputs": [],
            "name": "getConfig",
            "outputs": [
                {
                    "internalType": "address",
                    "name": "",
                    "type": "address"
                },
                {
                    "internalType": "address",
                    "name": "",
                    "type": "address"
                },
                {
                    "internalType": "address",
                    "name": "",
                    "type": "address"
                },
                {
                    "internalType": "address",
                    "name": "",
                    "type": "address"
                },
                {
                    "internalType": "uint256",
                    "name": "",
                    "type": "uint256"
                },
                {
                    "internalType": "address",
                    "name": "",
                    "type": "address"
                }
            ],
            "stateMutability": "view",
            "type": "function"
        },
        {
            "inputs": [],
            "name": "getDappInfo",
            "outputs": [
                {
                    "internalType": "uint256",
                    "name": "",
                    "type": "uint256"
                },
                {
                    "internalType": "uint256",
                    "name": "",
                    "type": "uint256"
                },
                {
                    "internalType": "uint256",
                    "name": "",
                    "type": "uint256"
                },
                {
                    "internalType": "uint256",
                    "name": "",
                    "type": "uint256"
                },
                {
                    "internalType": "uint256",
                    "name": "",
                    "type": "uint256"
                },
                {
                    "internalType": "uint256",
                    "name": "",
                    "type": "uint256"
                },
                {
                    "internalType": "uint256",
                    "name": "",
                    "type": "uint256"
                }
            ],
            "stateMutability": "view",
            "type": "function"
        },
        {
            "inputs": [
                {
                    "internalType": "address",
                    "name": "account_",
                    "type": "address"
                }
            ],
            "name": "getGuild",
            "outputs": [
                {
                    "internalType": "uint256[]",
                    "name": "rates",
                    "type": "uint256[]"
                },
                {
                    "internalType": "uint256[]",
                    "name": "unlocks",
                    "type": "uint256[]"
                },
                {
                    "internalType": "uint256[30]",
                    "name": "members",
                    "type": "uint256[30]"
                },
                {
                    "internalType": "uint256[30]",
                    "name": "income",
                    "type": "uint256[30]"
                }
            ],
            "stateMutability": "view",
            "type": "function"
        },
        {
            "inputs": [
                {
                    "internalType": "uint256",
                    "name": "offset",
                    "type": "uint256"
                },
                {
                    "internalType": "uint256",
                    "name": "limit",
                    "type": "uint256"
                }
            ],
            "name": "getListings",
            "outputs": [
                {
                    "internalType": "uint256[]",
                    "name": "",
                    "type": "uint256[]"
                },
                {
                    "components": [
                        {
                            "internalType": "uint256",
                            "name": "value",
                            "type": "uint256"
                        },
                        {
                            "internalType": "uint256",
                            "name": "points",
                            "type": "uint256"
                        },
                        {
                            "internalType": "uint256",
                            "name": "furnaceMinutes",
                            "type": "uint256"
                        },
                        {
                            "internalType": "uint256",
                            "name": "strikes",
                            "type": "uint256"
                        },
                        {
                            "internalType": "uint256",
                            "name": "totalScore",
                            "type": "uint256"
                        },
                        {
                            "internalType": "uint256",
                            "name": "syncedAt",
                            "type": "uint256"
                        },
                        {
                            "internalType": "uint256",
                            "name": "listPrice",
                            "type": "uint256"
                        },
                        {
                            "internalType": "uint256",
                            "name": "mintPrice",
                            "type": "uint256"
                        },
                        {
                            "internalType": "uint256",
                            "name": "seed",
                            "type": "uint256"
                        }
                    ],
                    "internalType": "struct Storage.Sword[]",
                    "name": "",
                    "type": "tuple[]"
                },
                {
                    "internalType": "address[]",
                    "name": "",
                    "type": "address[]"
                }
            ],
            "stateMutability": "view",
            "type": "function"
        },
        {
            "inputs": [],
            "name": "getShelf",
            "outputs": [
                {
                    "internalType": "uint256",
                    "name": "round",
                    "type": "uint256"
                },
                {
                    "internalType": "uint256[]",
                    "name": "prices",
                    "type": "uint256[]"
                },
                {
                    "internalType": "uint256[]",
                    "name": "seeds",
                    "type": "uint256[]"
                },
                {
                    "internalType": "uint256",
                    "name": "refreshAt",
                    "type": "uint256"
                },
                {
                    "internalType": "uint256[]",
                    "name": "minted",
                    "type": "uint256[]"
                },
                {
                    "internalType": "uint256",
                    "name": "limit",
                    "type": "uint256"
                }
            ],
            "stateMutability": "view",
            "type": "function"
        },
        {
            "inputs": [
                {
                    "internalType": "uint256",
                    "name": "tokenId",
                    "type": "uint256"
                }
            ],
            "name": "getSword",
            "outputs": [
                {
                    "components": [
                        {
                            "internalType": "uint256",
                            "name": "value",
                            "type": "uint256"
                        },
                        {
                            "internalType": "uint256",
                            "name": "points",
                            "type": "uint256"
                        },
                        {
                            "internalType": "uint256",
                            "name": "furnaceMinutes",
                            "type": "uint256"
                        },
                        {
                            "internalType": "uint256",
                            "name": "strikes",
                            "type": "uint256"
                        },
                        {
                            "internalType": "uint256",
                            "name": "totalScore",
                            "type": "uint256"
                        },
                        {
                            "internalType": "uint256",
                            "name": "syncedAt",
                            "type": "uint256"
                        },
                        {
                            "internalType": "uint256",
                            "name": "listPrice",
                            "type": "uint256"
                        },
                        {
                            "internalType": "uint256",
                            "name": "mintPrice",
                            "type": "uint256"
                        },
                        {
                            "internalType": "uint256",
                            "name": "seed",
                            "type": "uint256"
                        }
                    ],
                    "internalType": "struct Storage.Sword",
                    "name": "",
                    "type": "tuple"
                },
                {
                    "internalType": "address",
                    "name": "",
                    "type": "address"
                },
                {
                    "internalType": "uint256",
                    "name": "",
                    "type": "uint256"
                }
            ],
            "stateMutability": "view",
            "type": "function"
        },
        {
            "inputs": [
                {
                    "internalType": "address",
                    "name": "account_",
                    "type": "address"
                }
            ],
            "name": "getUserInfo",
            "outputs": [
                {
                    "internalType": "uint256[]",
                    "name": "",
                    "type": "uint256[]"
                },
                {
                    "components": [
                        {
                            "internalType": "uint256",
                            "name": "value",
                            "type": "uint256"
                        },
                        {
                            "internalType": "uint256",
                            "name": "points",
                            "type": "uint256"
                        },
                        {
                            "internalType": "uint256",
                            "name": "furnaceMinutes",
                            "type": "uint256"
                        },
                        {
                            "internalType": "uint256",
                            "name": "strikes",
                            "type": "uint256"
                        },
                        {
                            "internalType": "uint256",
                            "name": "totalScore",
                            "type": "uint256"
                        },
                        {
                            "internalType": "uint256",
                            "name": "syncedAt",
                            "type": "uint256"
                        },
                        {
                            "internalType": "uint256",
                            "name": "listPrice",
                            "type": "uint256"
                        },
                        {
                            "internalType": "uint256",
                            "name": "mintPrice",
                            "type": "uint256"
                        },
                        {
                            "internalType": "uint256",
                            "name": "seed",
                            "type": "uint256"
                        }
                    ],
                    "internalType": "struct Storage.Sword[]",
                    "name": "",
                    "type": "tuple[]"
                }
            ],
            "stateMutability": "view",
            "type": "function"
        },
        {
            "inputs": [],
            "name": "guildConfig",
            "outputs": [
                {
                    "internalType": "uint256[]",
                    "name": "rates",
                    "type": "uint256[]"
                },
                {
                    "internalType": "uint256[]",
                    "name": "unlocks",
                    "type": "uint256[]"
                }
            ],
            "stateMutability": "view",
            "type": "function"
        },
        {
            "inputs": [
                {
                    "internalType": "address",
                    "name": "owner_",
                    "type": "address"
                },
                {
                    "internalType": "address",
                    "name": "coin_",
                    "type": "address"
                },
                {
                    "internalType": "address",
                    "name": "signer_",
                    "type": "address"
                },
                {
                    "internalType": "address",
                    "name": "treasury_",
                    "type": "address"
                }
            ],
            "name": "initialize",
            "outputs": [],
            "stateMutability": "nonpayable",
            "type": "function"
        },
        {
            "inputs": [
                {
                    "internalType": "address",
                    "name": "owner_",
                    "type": "address"
                },
                {
                    "internalType": "address",
                    "name": "operator",
                    "type": "address"
                }
            ],
            "name": "isApprovedForAll",
            "outputs": [
                {
                    "internalType": "bool",
                    "name": "",
                    "type": "bool"
                }
            ],
            "stateMutability": "view",
            "type": "function"
        },
        {
            "inputs": [
                {
                    "internalType": "uint256",
                    "name": "tokenId",
                    "type": "uint256"
                }
            ],
            "name": "itemOf",
            "outputs": [
                {
                    "internalType": "uint256",
                    "name": "",
                    "type": "uint256"
                }
            ],
            "stateMutability": "view",
            "type": "function"
        },
        {
            "inputs": [
                {
                    "internalType": "uint256",
                    "name": "tokenId",
                    "type": "uint256"
                },
                {
                    "internalType": "uint256",
                    "name": "price",
                    "type": "uint256"
                },
                {
                    "components": [
                        {
                            "internalType": "uint256",
                            "name": "value",
                            "type": "uint256"
                        },
                        {
                            "internalType": "uint256",
                            "name": "points",
                            "type": "uint256"
                        },
                        {
                            "internalType": "uint256",
                            "name": "furnaceMinutes",
                            "type": "uint256"
                        },
                        {
                            "internalType": "uint256",
                            "name": "strikes",
                            "type": "uint256"
                        },
                        {
                            "internalType": "uint256",
                            "name": "totalScore",
                            "type": "uint256"
                        }
                    ],
                    "internalType": "struct Storage.Stats",
                    "name": "stats",
                    "type": "tuple"
                },
                {
                    "internalType": "uint256",
                    "name": "deadline",
                    "type": "uint256"
                },
                {
                    "internalType": "bytes",
                    "name": "sig",
                    "type": "bytes"
                }
            ],
            "name": "list",
            "outputs": [],
            "stateMutability": "nonpayable",
            "type": "function"
        },
        {
            "inputs": [
                {
                    "internalType": "uint256",
                    "name": "value",
                    "type": "uint256"
                },
                {
                    "internalType": "uint256",
                    "name": "strikes",
                    "type": "uint256"
                }
            ],
            "name": "maxValue",
            "outputs": [
                {
                    "internalType": "uint256",
                    "name": "",
                    "type": "uint256"
                }
            ],
            "stateMutability": "view",
            "type": "function"
        },
        {
            "inputs": [
                {
                    "internalType": "uint256",
                    "name": "round",
                    "type": "uint256"
                },
                {
                    "internalType": "uint256",
                    "name": "slot",
                    "type": "uint256"
                },
                {
                    "internalType": "address",
                    "name": "referrer",
                    "type": "address"
                }
            ],
            "name": "mintSword",
            "outputs": [],
            "stateMutability": "nonpayable",
            "type": "function"
        },
        {
            "inputs": [],
            "name": "name",
            "outputs": [
                {
                    "internalType": "string",
                    "name": "",
                    "type": "string"
                }
            ],
            "stateMutability": "pure",
            "type": "function"
        },
        {
            "inputs": [
                {
                    "internalType": "uint256",
                    "name": "tokenId",
                    "type": "uint256"
                }
            ],
            "name": "ownerOf",
            "outputs": [
                {
                    "internalType": "address",
                    "name": "",
                    "type": "address"
                }
            ],
            "stateMutability": "view",
            "type": "function"
        },
        {
            "inputs": [],
            "name": "referralPool",
            "outputs": [
                {
                    "internalType": "uint256",
                    "name": "",
                    "type": "uint256"
                }
            ],
            "stateMutability": "view",
            "type": "function"
        },
        {
            "inputs": [
                {
                    "internalType": "address",
                    "name": "from",
                    "type": "address"
                },
                {
                    "internalType": "address",
                    "name": "to",
                    "type": "address"
                },
                {
                    "internalType": "uint256",
                    "name": "tokenId",
                    "type": "uint256"
                }
            ],
            "name": "safeTransferFrom",
            "outputs": [],
            "stateMutability": "nonpayable",
            "type": "function"
        },
        {
            "inputs": [
                {
                    "internalType": "address",
                    "name": "from",
                    "type": "address"
                },
                {
                    "internalType": "address",
                    "name": "to",
                    "type": "address"
                },
                {
                    "internalType": "uint256",
                    "name": "tokenId",
                    "type": "uint256"
                },
                {
                    "internalType": "bytes",
                    "name": "data",
                    "type": "bytes"
                }
            ],
            "name": "safeTransferFrom",
            "outputs": [],
            "stateMutability": "nonpayable",
            "type": "function"
        },
        {
            "inputs": [
                {
                    "internalType": "address",
                    "name": "operator",
                    "type": "address"
                },
                {
                    "internalType": "bool",
                    "name": "approved",
                    "type": "bool"
                }
            ],
            "name": "setApprovalForAll",
            "outputs": [],
            "stateMutability": "nonpayable",
            "type": "function"
        },
        {
            "inputs": [
                {
                    "internalType": "uint256",
                    "name": "feeBps_",
                    "type": "uint256"
                }
            ],
            "name": "setFeeBps",
            "outputs": [],
            "stateMutability": "nonpayable",
            "type": "function"
        },
        {
            "inputs": [
                {
                    "internalType": "address",
                    "name": "account_",
                    "type": "address"
                },
                {
                    "internalType": "uint256",
                    "name": "furnaces_",
                    "type": "uint256"
                }
            ],
            "name": "setFurnaces",
            "outputs": [],
            "stateMutability": "nonpayable",
            "type": "function"
        },
        {
            "inputs": [
                {
                    "internalType": "uint256[]",
                    "name": "rates",
                    "type": "uint256[]"
                },
                {
                    "internalType": "uint256[]",
                    "name": "unlocks",
                    "type": "uint256[]"
                }
            ],
            "name": "setGuild",
            "outputs": [],
            "stateMutability": "nonpayable",
            "type": "function"
        },
        {
            "inputs": [
                {
                    "internalType": "uint256",
                    "name": "maxPoints_",
                    "type": "uint256"
                }
            ],
            "name": "setMaxPoints",
            "outputs": [],
            "stateMutability": "nonpayable",
            "type": "function"
        },
        {
            "inputs": [
                {
                    "internalType": "uint256",
                    "name": "pointsPerHour_",
                    "type": "uint256"
                }
            ],
            "name": "setPointsPerHour",
            "outputs": [],
            "stateMutability": "nonpayable",
            "type": "function"
        },
        {
            "inputs": [
                {
                    "internalType": "address",
                    "name": "renderer_",
                    "type": "address"
                }
            ],
            "name": "setRenderer",
            "outputs": [],
            "stateMutability": "nonpayable",
            "type": "function"
        },
        {
            "inputs": [
                {
                    "internalType": "uint256",
                    "name": "limit_",
                    "type": "uint256"
                }
            ],
            "name": "setShelfLimit",
            "outputs": [],
            "stateMutability": "nonpayable",
            "type": "function"
        },
        {
            "inputs": [
                {
                    "internalType": "address",
                    "name": "signer_",
                    "type": "address"
                }
            ],
            "name": "setSigner",
            "outputs": [],
            "stateMutability": "nonpayable",
            "type": "function"
        },
        {
            "inputs": [
                {
                    "internalType": "address",
                    "name": "treasury_",
                    "type": "address"
                }
            ],
            "name": "setTreasury",
            "outputs": [],
            "stateMutability": "nonpayable",
            "type": "function"
        },
        {
            "inputs": [
                {
                    "internalType": "uint256",
                    "name": "round",
                    "type": "uint256"
                },
                {
                    "internalType": "uint256",
                    "name": "slot",
                    "type": "uint256"
                }
            ],
            "name": "shelfItem",
            "outputs": [
                {
                    "internalType": "uint256",
                    "name": "",
                    "type": "uint256"
                },
                {
                    "internalType": "uint256",
                    "name": "",
                    "type": "uint256"
                }
            ],
            "stateMutability": "view",
            "type": "function"
        },
        {
            "inputs": [
                {
                    "internalType": "bytes4",
                    "name": "interfaceId",
                    "type": "bytes4"
                }
            ],
            "name": "supportsInterface",
            "outputs": [
                {
                    "internalType": "bool",
                    "name": "",
                    "type": "bool"
                }
            ],
            "stateMutability": "pure",
            "type": "function"
        },
        {
            "inputs": [],
            "name": "symbol",
            "outputs": [
                {
                    "internalType": "string",
                    "name": "",
                    "type": "string"
                }
            ],
            "stateMutability": "pure",
            "type": "function"
        },
        {
            "inputs": [
                {
                    "internalType": "uint256",
                    "name": "tokenId",
                    "type": "uint256"
                },
                {
                    "components": [
                        {
                            "internalType": "uint256",
                            "name": "value",
                            "type": "uint256"
                        },
                        {
                            "internalType": "uint256",
                            "name": "points",
                            "type": "uint256"
                        },
                        {
                            "internalType": "uint256",
                            "name": "furnaceMinutes",
                            "type": "uint256"
                        },
                        {
                            "internalType": "uint256",
                            "name": "strikes",
                            "type": "uint256"
                        },
                        {
                            "internalType": "uint256",
                            "name": "totalScore",
                            "type": "uint256"
                        }
                    ],
                    "internalType": "struct Storage.Stats",
                    "name": "stats",
                    "type": "tuple"
                },
                {
                    "internalType": "uint256",
                    "name": "deadline",
                    "type": "uint256"
                },
                {
                    "internalType": "bytes",
                    "name": "sig",
                    "type": "bytes"
                }
            ],
            "name": "sync",
            "outputs": [],
            "stateMutability": "nonpayable",
            "type": "function"
        },
        {
            "inputs": [
                {
                    "components": [
                        {
                            "internalType": "uint256",
                            "name": "tokenId",
                            "type": "uint256"
                        },
                        {
                            "components": [
                                {
                                    "internalType": "uint256",
                                    "name": "value",
                                    "type": "uint256"
                                },
                                {
                                    "internalType": "uint256",
                                    "name": "points",
                                    "type": "uint256"
                                },
                                {
                                    "internalType": "uint256",
                                    "name": "furnaceMinutes",
                                    "type": "uint256"
                                },
                                {
                                    "internalType": "uint256",
                                    "name": "strikes",
                                    "type": "uint256"
                                },
                                {
                                    "internalType": "uint256",
                                    "name": "totalScore",
                                    "type": "uint256"
                                }
                            ],
                            "internalType": "struct Storage.Stats",
                            "name": "stats",
                            "type": "tuple"
                        },
                        {
                            "internalType": "uint256",
                            "name": "deadline",
                            "type": "uint256"
                        },
                        {
                            "internalType": "bytes",
                            "name": "sig",
                            "type": "bytes"
                        }
                    ],
                    "internalType": "struct Storage.SyncItem[]",
                    "name": "items",
                    "type": "tuple[]"
                }
            ],
            "name": "syncMany",
            "outputs": [],
            "stateMutability": "nonpayable",
            "type": "function"
        },
        {
            "inputs": [
                {
                    "internalType": "uint256",
                    "name": "tokenId",
                    "type": "uint256"
                }
            ],
            "name": "tokenURI",
            "outputs": [
                {
                    "internalType": "string",
                    "name": "",
                    "type": "string"
                }
            ],
            "stateMutability": "view",
            "type": "function"
        },
        {
            "inputs": [
                {
                    "internalType": "address",
                    "name": "from",
                    "type": "address"
                },
                {
                    "internalType": "address",
                    "name": "to",
                    "type": "address"
                },
                {
                    "internalType": "uint256",
                    "name": "tokenId",
                    "type": "uint256"
                }
            ],
            "name": "transferFrom",
            "outputs": [],
            "stateMutability": "nonpayable",
            "type": "function"
        },
        {
            "inputs": [
                {
                    "internalType": "address",
                    "name": "owner_",
                    "type": "address"
                }
            ],
            "name": "transferOwnership",
            "outputs": [],
            "stateMutability": "nonpayable",
            "type": "function"
        },
        {
            "inputs": [
                {
                    "internalType": "address",
                    "name": "to",
                    "type": "address"
                },
                {
                    "internalType": "uint256",
                    "name": "tokenId",
                    "type": "uint256"
                },
                {
                    "components": [
                        {
                            "internalType": "uint256",
                            "name": "value",
                            "type": "uint256"
                        },
                        {
                            "internalType": "uint256",
                            "name": "points",
                            "type": "uint256"
                        },
                        {
                            "internalType": "uint256",
                            "name": "furnaceMinutes",
                            "type": "uint256"
                        },
                        {
                            "internalType": "uint256",
                            "name": "strikes",
                            "type": "uint256"
                        },
                        {
                            "internalType": "uint256",
                            "name": "totalScore",
                            "type": "uint256"
                        }
                    ],
                    "internalType": "struct Storage.Stats",
                    "name": "stats",
                    "type": "tuple"
                },
                {
                    "internalType": "uint256",
                    "name": "deadline",
                    "type": "uint256"
                },
                {
                    "internalType": "bytes",
                    "name": "sig",
                    "type": "bytes"
                }
            ],
            "name": "transferWithStats",
            "outputs": [],
            "stateMutability": "nonpayable",
            "type": "function"
        }
    ],
};
