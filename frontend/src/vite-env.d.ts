/// <reference types="vite/client" />

interface ImportMetaEnv {
    readonly VITE_COMMIT_SHA?: string;
    readonly VITE_COMMIT_DATE?: string;
    readonly VITE_COMMIT_TITLE?: string;
}

interface ImportMeta {
    readonly env: ImportMetaEnv;
}
