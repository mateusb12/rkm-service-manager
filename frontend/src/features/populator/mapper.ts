// @ts-nocheck

import {
    createEmptyServiceEntry,
    normalizeOrderNumber,
} from '../service-entry/model';


export const REQUIRED_POPULATOR_FIELDS = [
    ['orderType', 'Categoria do equipamento'],
    ['orderNumber', 'Nº da ordem'],
    ['client', 'Cliente'],
    ['equipment', 'Equipamento'],
];


const normalizeSearchText = value =>
    String(value || '')
        .normalize('NFD')
        .replace(/[\u0300-\u036f]/g, '')
        .trim()
        .toLowerCase();


export const classifyRkmOrderType = equipment => {
    const value = normalizeSearchText(equipment);

    if (value.includes('cilindro')) {
        return 'Cilindro';
    }

    if (value.includes('acumulador')) {
        return 'Acumulador';
    }

    if (value.includes('bomba')) {
        return 'Bomba';
    }

    if (value.includes('motor')) {
        return 'Motor hidráulico';
    }

    return 'Outro';
};


export const validateMappedServiceEntry = entry => {
    const missing = REQUIRED_POPULATOR_FIELDS
        .filter(([key]) => !String(entry[key] || '').trim())
        .map(([key, label]) => ({
            key,
            label,
        }));

    return {
        valid: missing.length === 0,
        missing,
    };
};


export const mapLizyOrderToServiceEntry = (
    source,
    timestamp = new Date().toISOString(),
) => {
    const normalizedOrderNumber =
        normalizeOrderNumber(source.orderNumber);

    return {
        ...createEmptyServiceEntry(),

        id: normalizedOrderNumber,
        orderNumber: normalizedOrderNumber,

        /*
         * Lizy's "Motor" category is deliberately NOT mapped
         * directly to Motor hidráulico.
         *
         * RKM category is derived conservatively from the
         * equipment description, while the original Lizy
         * category remains preserved under sourceMetadata.
         */
        orderType: classifyRkmOrderType(
            source.equipment,
        ),

        openingDate:
            source.openingDate || '',

        expectedDeliveryDate:
            source.expectedDeliveryDate || '',

        urgent:
            source.urgent === true,

        client:
            source.client || '',

        clientReference:
            source.clientReference || '',

        requester:
            source.requester || '',

        invoiceNumber:
            source.invoiceNumber || '',

        serialNumber:
            source.serialNumber || '',

        manufacturer:
            source.manufacturer || '',

        equipment:
            source.equipment || '',

        model:
            source.model || '',

        claimedDefect:
            source.claimedDefect || '',

        /*
         * Do not inherit createEmptyServiceEntry's hydraulic
         * default when the Lizy source didn't establish it.
         */
        hydraulic:
            source.hydraulic === true,

        pneumatic:
            source.pneumatic === true,

        status: 'Recebido',
        currentStep: 0,

        createdAt: timestamp,
        updatedAt: timestamp,

        sourceMetadata: {
            system: 'lizy',

            sourceOrderNumber:
                source.orderNumber,

            sourceStatus:
                source.sourceStatus || '',

            sourceOrderKind:
                source.sourceOrderKind || '',

            sourceEquipmentCategory:
                source.sourceEquipmentCategory || '',

            rkmCategoryOrigin:
                'derived-from-equipment-name',

            clientRedacted:
                source.clientRedacted === true,

            visibleImageCount:
                source.visibleImageCount ?? null,

            checklistMarked:
                [...(source.checklistMarked || [])],

            checklistUnmarked:
                [...(source.checklistUnmarked || [])],

            unidentifiedChecklistMarks:
                Number(
                    source.unidentifiedChecklistMarks || 0
                ),

            sourceMissing: {
                empty: [
                    ...(source.sourceMissing?.empty || []),
                ],

                notInformed: [
                    ...(source.sourceMissing?.notInformed || []),
                ],
            },

            notes: [
                ...(source.sourceNotes || []),
            ],
        },
    };
};
