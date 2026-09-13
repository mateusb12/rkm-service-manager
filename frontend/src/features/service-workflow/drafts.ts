// @ts-nocheck

const draftKey = (it) => `rkm_${(it || 'IT001').toLowerCase()}_draft_v1`;

export const loadDraft = (it = 'IT001') => {
    try {
        const raw = localStorage.getItem(draftKey(it));
        return raw ? JSON.parse(raw) : null;
    }
    catch (_) {
        return null;
    }
};

export const saveDraft = (it, rec) => {
    try {
        localStorage.setItem(draftKey(it), JSON.stringify(rec));
    }
    catch (_) { /* noop */ }
};

export const clearDraft = (it = 'IT001') => { try {
    localStorage.removeItem(draftKey(it));
}
catch (_) { /* noop */ } };
