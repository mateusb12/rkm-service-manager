// @ts-nocheck

export const setIn = (obj, path, value) => {
    const keys = path.split('.');
    const next = Array.isArray(obj) ? [...obj] : { ...obj };
    let cur = next;
    for (let i = 0; i < keys.length - 1; i++) {
        const k = keys[i];
        cur[k] = Array.isArray(cur[k]) ? [...cur[k]] : { ...(cur[k] || {}) };
        cur = cur[k];
    }
    cur[keys[keys.length - 1]] = value;
    return next;
};
