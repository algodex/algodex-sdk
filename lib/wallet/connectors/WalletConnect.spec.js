const logger = require('../../logger');
it('should patch WalletConnect', ()=>{
  if (typeof window === 'undefined') {
    logger.info('Node Test');
    expect(()=>require('./WalletConnect')).toThrowError('Wallet is not supported!!!');
  } else {
    logger.info('Browser Test');
    const WalletConnect = require('@walletconnect/client').default;
    const DexWalletConnect = require('./WalletConnect');
    expect(DexWalletConnect).toBeInstanceOf(WalletConnect);
    expect(WalletConnect.prototype.sign).toBeInstanceOf(Function);
  }
});
