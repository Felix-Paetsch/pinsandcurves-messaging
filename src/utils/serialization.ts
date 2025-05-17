/**
 * Serializes an object with circular reference detection and depth limiting
 */
export function serializeWithDepth(value: any, max_depth: number = 50): any {
    const seen = new WeakMap<object, string>();
    const paths: string[] = [];

    function serialize(value: any, depth: number, path: string): any {
        // Check depth limit
        if (depth > max_depth) {
            return "[Max Depth Exceeded]";
        }

        // Handle null/undefined
        if (value === null || value === undefined) {
            return value;
        }

        // Handle primitive types
        if (typeof value !== 'object') {
            return value;
        }

        // Handle Date objects
        if (value instanceof Date) {
            return value.toISOString();
        }

        // Check for circular references
        if (seen.has(value)) {
            return `[Circular Reference -> ${seen.get(value)}]`;
        }

        // Add current object to seen with its path
        seen.set(value, path);
        paths.push(path);

        // Handle arrays
        if (Array.isArray(value)) {
            const result = value.map((item, index) =>
                serialize(item, depth + 1, `${path}[${index}]`)
            );
            paths.pop();
            return result;
        }

        // Handle objects
        try {
            // Try to use toJSON if available
            if (typeof value.toJSON === 'function' && path !== 'root') {
                const jsonResult = value.toJSON();
                return serialize(jsonResult, depth + 1, path);
            }
        } catch (e) {
            // If toJSON fails, continue with normal object serialization
        }

        // Normal object serialization
        const result: Record<string, any> = {};
        for (const [key, prop] of Object.entries(value)) {
            result[key] = serialize(prop, depth + 1, `${path}.${key}`);
        }
        paths.pop();
        return result;
    }

    return serialize(value, 0, 'root');
} 