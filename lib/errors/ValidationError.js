/**
 * Validation Errors
 *
 * Standard error for invalid types
 */
class ValidationError extends TypeError {
  /**
     * Handle AJV Errors
     * @param errors
     */
  constructor(errors) {
    super(
        'Validation Failed!\n' +
            errors.map((error, idx)=>`Error ${idx}: Path '${error.instancePath}' ${error.message}`).join('\n'),
    );
  }
}

module.exports = ValidationError;
