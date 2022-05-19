/**
 * Group By Key
 * @param {Array} items
 * @param {string} key
 * @return {Object}
 */
const groupBy = (items, key) => items.reduce(
    (result, item) => ({
      ...result,
      [item[key]]: [
        ...(result[item[key]] || []),
        item.signedTxn.blob,
      ],
    }),
    {},
);

module.exports = groupBy;
