// @ts-nocheck

import {
    loadServiceEntries,
    saveServiceEntries,
} from '../service-entry/repository';

import {
    normalizeOrderNumber,
} from '../service-entry/model';

import {
    LIZY_ORDERS,
} from './data/lizy-orders';

import {
    mapLizyOrderToServiceEntry,
    mapLizyStatusToServiceEntry,
    validateMappedServiceEntry,
} from './mapper';


const orderIdentity = value =>
    normalizeOrderNumber(value);


const migrateLegacyLizyEntry = entry => {
    const isLegacyLizyEntry =
        entry?.sourceMetadata?.system === 'lizy' &&
        entry.status === 'Recebido' &&
        Number(entry.currentStep) === 0 &&
        entry.sourceMetadata.sourceStatus;

    if (!isLegacyLizyEntry) {
        return entry;
    }

    return {
        ...entry,
        ...mapLizyStatusToServiceEntry(
            entry.sourceMetadata.sourceStatus,
        ),
        updatedAt: new Date().toISOString(),
    };
};


export const planLizyPopulation = (
    existingEntries = loadServiceEntries(),
) => {
    const migratedExistingEntries =
        (existingEntries || []).map(migrateLegacyLizyEntry);

    const existingIds = new Set(
        migratedExistingEntries
            .map(entry =>
                orderIdentity(
                    entry.orderNumber || entry.id
                )
            )
            .filter(Boolean)
    );

    const datasetIds = new Set();

    const entriesToInsert = [];
    const skippedExisting = [];
    const invalid = [];
    const duplicateDatasetRecords = [];

    const timestamp =
        new Date().toISOString();

    for (const source of LIZY_ORDERS) {
        const sourceId =
            orderIdentity(source.orderNumber);

        if (datasetIds.has(sourceId)) {
            duplicateDatasetRecords.push({
                orderNumber: sourceId,
                reason: 'duplicate-in-dataset',
            });

            continue;
        }

        datasetIds.add(sourceId);

        const entry =
            mapLizyOrderToServiceEntry(
                source,
                timestamp,
            );

        const validation =
            validateMappedServiceEntry(entry);

        if (!validation.valid) {
            invalid.push({
                orderNumber: sourceId,
                missing: validation.missing,
                source,
            });

            continue;
        }

        if (existingIds.has(sourceId)) {
            skippedExisting.push({
                orderNumber: sourceId,
            });

            continue;
        }

        entriesToInsert.push(entry);
        existingIds.add(sourceId);
    }

    return {
        source: 'lizy',

        totalSourceRecords:
            LIZY_ORDERS.length,

        /*
         * Full current Service Entry base.
         *
         * This is intentionally different from skippedExisting:
         *
         * existingEntries
         *   = every OS already stored
         *
         * skippedExisting
         *   = source Lizy OS that collided with the current base
         */
        existingEntries: migratedExistingEntries,

        entriesToInsert,
        skippedExisting,
        invalid,
        duplicateDatasetRecords,

        nextEntries: [
            ...entriesToInsert,
            ...migratedExistingEntries,
        ],
    };
};


export const populateLizyServiceEntries = () => {
    const existingEntries =
        loadServiceEntries();

    const plan =
        planLizyPopulation(existingEntries);

    if (
        plan.duplicateDatasetRecords.length > 0
    ) {
        return {
            ...plan,
            persisted: false,
            persistenceReason:
                'dataset-has-duplicates',
        };
    }

    const existingEntriesChanged = plan.existingEntries.some((entry, index) => {
        const previous = existingEntries[index];
        return JSON.stringify(entry) !== JSON.stringify(previous);
    });

    if (plan.entriesToInsert.length === 0 && !existingEntriesChanged) {
        return {
            ...plan,
            persisted: true,
            persistenceReason:
                'nothing-to-insert',
        };
    }

    const persisted =
        saveServiceEntries(
            plan.nextEntries
        );

    return {
        ...plan,
        persisted,
        persistenceReason:
            persisted
                ? 'saved'
                : 'storage-error',
    };
};


export const formatLizyPopulationReport = report => {
    const lines = [
        'RKM — LIZY POPULATOR',
        '',
        `Fonte: Lizy`,
        `Registros na fonte: ${report.totalSourceRecords}`,
        '',
        `Inseridas: ${report.entriesToInsert.length}`,
        `Já existentes: ${report.skippedExisting.length}`,
        `Inválidas: ${report.invalid.length}`,
        `Duplicadas no dataset: ${report.duplicateDatasetRecords.length}`,
        `Persistido: ${report.persisted ? 'sim' : 'não'}`,
    ];

    if (report.invalid.length) {
        lines.push(
            '',
            'Inválidas:',
        );

        for (const item of report.invalid) {
            lines.push(
                `  ${item.orderNumber}: ${
                    item.missing
                        .map(field => field.label)
                        .join(', ')
                }`
            );
        }
    }

    if (report.skippedExisting.length) {
        lines.push(
            '',
            'Já existentes:',
        );

        for (
            const item
            of report.skippedExisting
        ) {
            lines.push(
                `  ${item.orderNumber}`
            );
        }
    }

    return lines.join('\n');
};
