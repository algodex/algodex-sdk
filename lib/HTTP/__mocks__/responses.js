const data = {
  a: 'b',
};

const asset = {
  assetID: 1234,
  assetName: 'fullName',
  unitName: 'name',
  txCount: 'txns',
  circulatingSupply: 'circulating',
  destroyed: false,
  totalSupply: 1000,
  txid: 123,
  timestamp: 123,
  decimals: 5,
  verified: false,
  url: 'http://localhost',
};
module.exports = {
  'https://api-testnet-public.algodex.com/algodex-backend/charts2.php?assetId=15322902&chartTime=1h': {data},
  'https://api-testnet-public.algodex.com/algodex-backend/assets.php': {data: [data]},
  'https://api-testnet-public.algodex.com/algodex-backend/assets.php?id=15322902': {
    data: [data],
  },
  'https://api-testnet-public.algodex.com/algodex-backend/asset_search.php?query=15322902': {data},
  'https://api-testnet-public.algodex.com/algodex-backend/orders.php?assetId=15322902': {data},
  'https://api-testnet-public.algodex.com/algodex-backend/trade_history.php?assetId=15322902': {data},
  'https://api-testnet-public.algodex.com/algodex-backend/orders.php?ownerAddr=TJFFNUYWHPPIYDE4DGGYPGHWKGAPJEWP3DGE5THZS3B2M2XIAPQ2WY3X4I&getAssetInfo=true': {data},
  'https://api-testnet-public.algodex.com/algodex-backend/wallet_assets.php?ownerAddr=TJFFNUYWHPPIYDE4DGGYPGHWKGAPJEWP3DGE5THZS3B2M2XIAPQ2WY3X4I': {data},
  'https://api-testnet-public.algodex.com/algodex-backend/trade_history.php?ownerAddr=TJFFNUYWHPPIYDE4DGGYPGHWKGAPJEWP3DGE5THZS3B2M2XIAPQ2WY3X4I&getAssetInfo=true': {data},
  'https://testnet.algoexplorerapi.io/v1/asset/14704676/info': {
    'txid': '2KHWZ46WESMVPOKOD6LSHCN736CF4BU6E55W276VMATK4O2SQ6SA',
    'timestamp': 1615329020,
    'decimals': 6,
    'creator': 'E7SGC4ULFOVGYICHG3OHHGA3KX7RMOCLB2OQTBUWT4GYXOL6D4OAKFMPJI',
    'owner': null,
    'assetID': 14704676,
    'assetName': 'Wrapped Algo Testnet',
    'unitName': 'wALGO Ts',
    'url': 'https://stakerdao.com',
    'defaultFrozen': false,
    'clawbackAccount': 'E7SGC4ULFOVGYICHG3OHHGA3KX7RMOCLB2OQTBUWT4GYXOL6D4OAKFMPJI',
    'freezeAccount': 'E7SGC4ULFOVGYICHG3OHHGA3KX7RMOCLB2OQTBUWT4GYXOL6D4OAKFMPJI',
    'reserveAccount': 'E7SGC4ULFOVGYICHG3OHHGA3KX7RMOCLB2OQTBUWT4GYXOL6D4OAKFMPJI',
    'managerAccount': 'E7SGC4ULFOVGYICHG3OHHGA3KX7RMOCLB2OQTBUWT4GYXOL6D4OAKFMPJI',
    'totalSupply': 9000000000000000,
    'txCount': 8976,
    'circulatingSupply': 1000000002378891,
    'verified': true,
    'destroyed': false,
    'verified_info': {
      'name': 'Wrapped Algo Testnet',
      'title': 'Wrapped Algo Testnet',
      'creator': 'E7SGC4ULFOVGYICHG3OHHGA3KX7RMOCLB2OQTBUWT4GYXOL6D4OAKFMPJI',
      'url': 'https://stakerdao.com',
      'unit': 'wALGOTs',
      'description': 'The Wrapped ALGO Testnet (wALGOT) is a fully collateralized representation of testnet ALGO - a collateralized staking position that unlocks the power of DeFi and can be used for testing purposes only. This version exists only in the Algorand TestNet.\n\nFor more information, visit: https://docs.stakerdao.com/walgo-faq-and-docs',
    },
  },
  'https://testnet.algoexplorerapi.io/v1/asset/15322902/info': {
    'txid': 'NOFSUK4EXHFFXJK3ZA6DZMGE6CAGQ7G5JT2X7FYTYQBSQEBZHY4Q',
    'timestamp': 1618666459,
    'decimals': 6,
    'creator': 'PBSSJ2W6FDXVRPT4L4FGHTX2IHY3VREI44SB7VJTVT75UT6ER3CTVD6B74',
    'owner': null,
    'assetID': 15322902,
    'assetName': 'Lamps',
    'unitName': 'LAMP',
    'defaultFrozen': false,
    'clawbackAccount': 'PBSSJ2W6FDXVRPT4L4FGHTX2IHY3VREI44SB7VJTVT75UT6ER3CTVD6B74',
    'freezeAccount': 'PBSSJ2W6FDXVRPT4L4FGHTX2IHY3VREI44SB7VJTVT75UT6ER3CTVD6B74',
    'reserveAccount': 'PBSSJ2W6FDXVRPT4L4FGHTX2IHY3VREI44SB7VJTVT75UT6ER3CTVD6B74',
    'managerAccount': 'PBSSJ2W6FDXVRPT4L4FGHTX2IHY3VREI44SB7VJTVT75UT6ER3CTVD6B74',
    'totalSupply': 100000000000,
    'txCount': 691078,
    'circulatingSupply': 99989322377,
    'verified': false,
    'destroyed': false,
  },
  'https://testnet.algoexplorerapi.io/v1/search/15322902': {data},
  'https://price.algoexplorerapi.io/price/algo-usd': {data},
};