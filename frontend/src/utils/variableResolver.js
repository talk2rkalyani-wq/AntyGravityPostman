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
 * Finds all unresolved variables in a string.
 * @param {string} str - The string containing variables to replace.
 * @param {Array} envVars - Environment variables.
 * @param {Array} collectionVars - Collection variables.
 * @returns {Array} Array of unresolved variable keys.
 */
export const getUnresolvedVariables = (str, envVars = [], collectionVars = []) => {
    if (!str || typeof str !== 'string') return [];
    
    const combinedVars = [...(envVars || []), ...(collectionVars || [])];
    const unresolved = [];
    
    const matches = str.matchAll(/\{\{([^}]+)\}\}/g);
    for (const match of matches) {
        const trimmedKey = match[1].trim();
        const row = combinedVars.find(e => e.key === trimmedKey && e.active !== false);
        if (!row && !unresolved.includes(trimmedKey)) {
            unresolved.push(trimmedKey);
        }
    }
    return unresolved;
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

/**
 * Test case runner for the variable resolution engine
 */
export const runVariableResolverTests = () => {
    console.log("Running Variable Resolver Tests...");
    let passed = 0;
    let failed = 0;

    const assert = (condition, message) => {
        if (condition) { passed++; console.log('✅ ' + message); }
        else { failed++; console.error('❌ ' + message); }
    };

    const envVars = [{ key: 'API_KEY', value: '12345', active: true }];
    const colVars = [{ key: 'BASE_URL', value: 'https://api.example.com', active: true }];

    // Test 1: Resolve existing variables (Local/Env takes priority over Collection)
    const result1 = resolveVariables('{{BASE_URL}}/users?key={{API_KEY}}', envVars, colVars);
    assert(result1 === 'https://api.example.com/users?key=12345', 'Resolves multiple variables correctly');

    // Test 2: Unresolved variables remain intact
    const result2 = resolveVariables('{{BASE_URL}}/{{UNKNOWN}}', envVars, colVars);
    assert(result2 === 'https://api.example.com/{{UNKNOWN}}', 'Leaves unresolved variables intact');

    // Test 3: Priority check (env overrides col)
    const overrideEnvVars = [{ key: 'BASE_URL', value: 'https://test.example.com', active: true }];
    const result3 = resolveVariables('{{BASE_URL}}/data', overrideEnvVars, colVars);
    assert(result3 === 'https://test.example.com/data', 'Environment variables override collection variables');

    // Test 4: Variable parsing extraction
    const mockJson = { variable: [{ key: 'TEST', value: '1', type: 'string' }] };
    const parsed = extractCollectionVariables(mockJson);
    assert(parsed.length === 1 && parsed[0].key === 'TEST', 'Extracts collection variables from JSON properly');

    console.log(`Test Summary: ${passed} Passed, ${failed} Failed\n`);
};
