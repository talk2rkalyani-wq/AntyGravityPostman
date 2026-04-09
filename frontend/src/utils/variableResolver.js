/**
 * Resolves variables in a string based on an array of combined variables.
 * Format for variables in strings: {{VARIABLE_NAME}}
 * Priority: Variables at the beginning of the combinedVars array take precedence over those at the end.
 *
 * @param {string} str - The string containing variables to replace.
 * @param {Array} envVars - Environment variables array (highest priority).
 * @param {Array} collectionVars - Collection variables array.
 * @returns {string} The resolved string.
 */
export const resolveVariables = (str, envVars = [], collectionVars = []) => {
    if (!str || typeof str !== 'string') return str;
    
    // Combine variables: environment variables first (higher priority)
    const combinedVars = [...(envVars || []), ...(collectionVars || [])];
    
    return str.replace(/\{\{([^}]+)\}\}/g, (match, key) => {
        const trimmedKey = key.trim();
        // find() returns the first element matching the condition.
        const row = combinedVars.find(e => e.key === trimmedKey && e.active !== false);
        return row ? row.value : match; // Keep unresolved variables as is
    });
};

/**
 * Extracts collection variables from parsed Postman collection JSON.
 * @param {Object} collectionJson - The parsed Postman collection root object.
 * @returns {Array} Array of variable objects { key, value, active: true }.
 */
export const extractCollectionVariables = (collectionJson) => {
    if (!collectionJson.variable || !Array.isArray(collectionJson.variable)) {
        return [];
    }
    return collectionJson.variable.map(v => ({
        key: v.key || '',
        value: v.value || '',
        type: v.type || 'string',
        active: v.disabled !== true // If it's disabled: true in postman, it is inactive here.
    }));
};
