// @ts-nocheck

import {
    STEPS,
    initialRecord,
    computeAlerts,
    STEP_RENDERERS,
} from '../its/it001';

import {
    STEPS_IT002,
    initialRecordIT002,
    computeAlertsIT002,
    STEP_RENDERERS_IT002,
} from '../its/it002';

export const IT_CONFIG = {
    IT001: { steps: STEPS, renderers: STEP_RENDERERS, computeAlerts, initialRecord, label: 'IT001 — Bexiga', titleLong: 'IT001 — Manutenção de Acumulador de Pressão Tipo Bexiga' },
    IT002: { steps: STEPS_IT002, renderers: STEP_RENDERERS_IT002, computeAlerts: computeAlertsIT002, initialRecord: initialRecordIT002, label: 'IT002 — Pistão', titleLong: 'IT002 — Manutenção de Acumulador Hidropneumático Tipo Pistão' },
};
