const {determineFinalOrderAmounts} = require('./getTakerOrderInformation');

describe('withDetermineFinalOrderAndWalletAmounts', () => {
  const mockedOrderAndWalletAmounts = {
    orderAssetAmount: 200,
    orderAlgoAmount: 5000,
    walletAlgoAmount: 7000,
    walletAssetAmount: 3,
  };
  const {orderAlgoBalance: sellAlgoAmount, orderAssetBalance: sellAssetAmount} = determineFinalOrderAmounts(mockedOrderAndWalletAmounts, true);
  const {orderAlgoBalance: buyAlgoAmount, orderAssetBalance: buyAssetAmount} = determineFinalOrderAmounts(mockedOrderAndWalletAmounts, false);


  it('should output the expected algo asa amount when selling', () => {
    expect(buyAlgoAmount).toEqual(5000);
    expect(buyAssetAmount).toEqual(3);
  });

  it('should output the expected algo and asa amount when  buying', () => {
    expect(sellAlgoAmount).toEqual(7000);
    expect(sellAssetAmount).toEqual(3);
  });
});
