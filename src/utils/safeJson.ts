/**
 * Safely stringifies a JSON object, handling circular references.
 */
export const safeStringify = (obj: any, indent?: number): string => {
  const cache = new WeakSet();
  return JSON.stringify(
    obj,
    (key, value) => {
      if (typeof value === 'object' && value !== null) {
        if (cache.has(value)) {
          return; // Discard circular reference
        }
        cache.add(value);
      }
      return value;
    },
    indent
  );
};
