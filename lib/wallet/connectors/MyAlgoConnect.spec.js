it('should patch MyAlgoConnect', ()=>{
  if (typeof window === 'undefined') {
    expect(()=>require('./MyAlgoConnect')).toThrowError('Wallet is not supported!!!');
  } else {
    const MyAlgoConnect = require('@randlabs/myalgo-connect');
    expect(require('./MyAlgoConnect')).toBeInstanceOf(MyAlgoConnect);
  }
});
