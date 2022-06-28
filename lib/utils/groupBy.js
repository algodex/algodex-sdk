/**
 * Group By Key
 * @param {Array} items
 * @param {string} key
 * @return {Object}
 * @ignore
 */
const groupBy = (items, key) => items.reduce(
    (result, item) => ({
      ...result,
      [item[key]]: [
        ...(result[item[key]] || []),
        item.signedTxn,
      ],
    }),
    {},
);

module.exports = groupBy;
