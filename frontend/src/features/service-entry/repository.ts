// @ts-nocheck

/*
 * Persistence boundary for Service Entry records.
 *
 * UI and import tools should use this module rather than
 * depending directly on the localStorage key.
 */

const SERVICE_ENTRY_STORAGE_KEY = 'rkm-service-entry-orders-v1';

export const loadServiceEntries = () => {
    try {
        const raw = localStorage.getItem(SERVICE_ENTRY_STORAGE_KEY);
        const parsed = raw ? JSON.parse(raw) : [];
        return Array.isArray(parsed) ? parsed : [];
    }
    catch {
        return [];
    }
};

export const saveServiceEntries = (entries) => {
    try {
        localStorage.setItem(
            SERVICE_ENTRY_STORAGE_KEY,
            JSON.stringify(entries)
        );

        return true;
    }
    catch {
        return false;
    }
};
