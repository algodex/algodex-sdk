/** @module functions */

/**
 * Deprecate Function
 *
 * Used to warn the user the function is deprecated. Optionally exit early
 *
 * @param {function} fn The function to deprecate
 * @param {object} [options] Options for deprecate
 * @param {boolean} [options.throws] Flag for throwing error
 * @param {string} [options.file] File that is deprecating the method
 * @returns {function} Returns the function with the message
 * @package
 */
function deprecate(fn, {file="index.js", throws = false} = {}){return (...args)=>{
    const fnName = fn.name === "" ? "unnamedFunction" : fn.name
    const message = `Method: ${fnName} is @deprecated from ${file}!!! \nimport {${fnName}} from '@algodex/algodex-sdk/lib/functions/*'`
    if(throws) throw new Error(message)
    else console.warn(message)
    return fn(...args)
}}

module.exports = deprecate
