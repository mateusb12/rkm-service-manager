// @ts-nocheck

/*
 * Real OS records collected from Lizy.
 *
 * Important:
 * - empty string means "do not import a value"
 * - literal N.I. from Lizy is NEVER stored as business data
 * - sourceMissing preserves whether Lizy showed an empty field
 *   or explicitly displayed N.I.
 * - sourceEquipmentCategory is preserved exactly as observed
 */

export const LIZY_ORDERS = [
    {
        orderNumber: '20265584',
        sourceStatus: 'Aguardando Inspeções',
        sourceOrderKind: 'Serviço',
        sourceEquipmentCategory: 'Motor',

        client: 'RKM HIDRAULICA',

        openingDate: '2026-09-10',
        expectedDeliveryDate: '',
        invoiceNumber: '',
        serialNumber: '',
        manufacturer: '',

        equipment: 'Bloco hidráulico',
        model: '',

        clientReference: '',
        requester: '',
        claimedDefect: '',

        urgent: false,
        hydraulic: true,
        pneumatic: false,

        visibleImageCount: 1,

        checklistMarked: [
            'Hidráulico',
            'Apres. Relatório',
            'Recuperável',
        ],

        checklistUnmarked: [],
        unidentifiedChecklistMarks: 16,

        sourceMissing: {
            empty: [
                'expectedDeliveryDate',
                'invoiceNumber',
                'model',
            ],
            notInformed: [
                'manufacturer',
            ],
        },

        sourceNotes: [
            'Observação de expedição existe na ficha, mas o conteúdo não foi coletado.',
        ],
    },

    {
        orderNumber: '20265583',
        sourceStatus: 'Aguardando Inspeções',
        sourceOrderKind: 'Serviço',
        sourceEquipmentCategory: 'Motor',

        client: 'RKM HIDRAULICA',

        openingDate: '2026-09-10',
        expectedDeliveryDate: '',
        invoiceNumber: '',
        serialNumber: '',
        manufacturer: '',

        equipment: 'Bomba de pistão',
        model: 'hidraulico',

        clientReference: '',
        requester: '',
        claimedDefect: '',

        urgent: false,
        hydraulic: true,
        pneumatic: false,

        visibleImageCount: 1,

        checklistMarked: [
            'Hidráulico',
            'Apres. Relatório',
        ],

        checklistUnmarked: [],
        unidentifiedChecklistMarks: 0,

        sourceMissing: {
            empty: [
                'expectedDeliveryDate',
            ],
            notInformed: [
                'invoiceNumber',
                'manufacturer',
            ],
        },

        sourceNotes: [
            'Observação de expedição existe na ficha, mas o conteúdo não foi coletado.',
        ],
    },

    {
        orderNumber: '20265582',
        sourceStatus: 'Analisando',
        sourceOrderKind: 'Serviço',
        sourceEquipmentCategory: 'Motor',

        client: 'PLANALTO INDUSTRIA',

        openingDate: '2026-09-10',
        expectedDeliveryDate: '',
        invoiceNumber: '',
        serialNumber: '',
        manufacturer: 'planalto',

        equipment: 'Cilindro hidráulico',
        model: 'Telescópio',

        clientReference: '',
        requester: '',
        claimedDefect: '',

        urgent: false,
        hydraulic: false,
        pneumatic: false,

        visibleImageCount: 1,

        checklistMarked: [
            'Erro de Montagem',
            'Falha de Vedação',
            'Troca de Vedações',
            'Teste Hidrostático (ISO 10100)',
            'Recuperável',
        ],

        checklistUnmarked: [],
        unidentifiedChecklistMarks: 16,

        sourceMissing: {
            empty: [
                'expectedDeliveryDate',
            ],
            notInformed: [
                'invoiceNumber',
            ],
        },

        sourceNotes: [],
    },

    {
        orderNumber: '20265581',
        sourceStatus: 'Analisando',
        sourceOrderKind: 'Serviço',
        sourceEquipmentCategory: 'Motor',

        client: 'PLANALTO INDUSTRIA',

        openingDate: '2026-09-10',
        expectedDeliveryDate: '',
        invoiceNumber: '',
        serialNumber: '',
        manufacturer: 'planalto',

        equipment: 'Telescópio',
        model: '',

        clientReference: '',
        requester: '',
        claimedDefect: '',

        urgent: false,
        hydraulic: false,
        pneumatic: false,

        visibleImageCount: 1,

        checklistMarked: [
            'Apres. Relatório',
            'Erro de Montagem',
            'Falha de Vedação',
            'Troca de Vedações',
            'Teste Hidrostático',
            'Recuperável',
        ],

        checklistUnmarked: [],
        unidentifiedChecklistMarks: 16,

        sourceMissing: {
            empty: [
                'expectedDeliveryDate',
            ],
            notInformed: [
                'invoiceNumber',
                'model',
            ],
        },

        sourceNotes: [],
    },

    {
        orderNumber: '20265580',
        sourceStatus: 'Aguardando Inspeções',
        sourceOrderKind: 'Serviço',
        sourceEquipmentCategory: 'Motor',

        /*
         * Client was redacted in the source material available here.
         * Never replace this with a placeholder business value.
         */
        client: '',
        clientRedacted: true,

        openingDate: '2026-09-10',
        expectedDeliveryDate: '',
        invoiceNumber: '',
        serialNumber: '',
        manufacturer: '',

        equipment: 'Comando hidráulico',
        model: '',

        clientReference: '',
        requester: '',
        claimedDefect: 'troca vedações',

        urgent: false,
        hydraulic: true,
        pneumatic: false,

        visibleImageCount: 1,

        checklistMarked: [
            'Hidráulico',
            'Apres. Relatório',
        ],

        checklistUnmarked: [],
        unidentifiedChecklistMarks: 0,

        sourceMissing: {
            empty: [
                'expectedDeliveryDate',
            ],
            notInformed: [
                'invoiceNumber',
                'manufacturer',
                'model',
            ],
        },

        sourceNotes: [
            'Cliente omitido porque estava redigido na coleta disponível.',
        ],
    },

    {
        orderNumber: '2026465',
        sourceStatus: 'Aguardando Inspeções',
        sourceOrderKind: 'Serviço',
        sourceEquipmentCategory: 'Motor',

        client: 'RES ENERGY',

        openingDate: '2026-07-06',
        expectedDeliveryDate: '',
        invoiceNumber: '',
        serialNumber: '',
        manufacturer: '',

        equipment: 'Componente bomba',
        model: "Bomba d'água",

        clientReference: '',
        requester: '',
        claimedDefect: '',

        urgent: true,
        hydraulic: false,
        pneumatic: false,

        visibleImageCount: null,

        checklistMarked: [
            'Urgente',
            'Apres. Relatório',
        ],

        checklistUnmarked: [],
        unidentifiedChecklistMarks: 0,

        sourceMissing: {
            empty: [
                'expectedDeliveryDate',
            ],
            notInformed: [
                'invoiceNumber',
                'manufacturer',
            ],
        },

        sourceNotes: [],
    },

    {
        orderNumber: '2026445',
        sourceStatus: 'Aguardando Inspeções',
        sourceOrderKind: 'Serviço',
        sourceEquipmentCategory: 'Motor',

        client: 'RKM HIDRAULICA',

        openingDate: '2026-06-19',
        expectedDeliveryDate: '',
        invoiceNumber: '',
        serialNumber: '01',
        manufacturer: 'filtrec',

        equipment: 'Filtro',
        model: 'aqq',

        clientReference: '',
        requester: '',
        claimedDefect: '',

        urgent: false,
        hydraulic: true,
        pneumatic: false,

        visibleImageCount: 2,

        checklistMarked: [
            'Hidráulico',
        ],

        checklistUnmarked: [],
        unidentifiedChecklistMarks: 0,

        sourceMissing: {
            empty: [
                'expectedDeliveryDate',
                'invoiceNumber',
            ],
            notInformed: [],
        },

        sourceNotes: [],
    },

    {
        orderNumber: '2026390',
        sourceStatus: 'Aguardando Inspeções',
        sourceOrderKind: 'Serviço',
        sourceEquipmentCategory: 'Motor',

        client: 'GERDAU CAUCAIA',

        openingDate: '2026-05-21',
        expectedDeliveryDate: '2026-06-07',
        invoiceNumber: '44921',
        serialNumber: '',
        manufacturer: '',

        equipment: 'Cilindro tela',
        model: 'HIDRÁULICO',

        clientReference: '',
        requester: '',
        claimedDefect: '',

        urgent: false,
        hydraulic: false,
        pneumatic: false,

        visibleImageCount: 2,

        checklistMarked: [
            'Apres. Relatório',
        ],

        checklistUnmarked: [],
        unidentifiedChecklistMarks: 0,

        sourceMissing: {
            empty: [],
            notInformed: [
                'manufacturer',
            ],
        },

        sourceNotes: [],
    },

    {
        orderNumber: '2026388',
        sourceStatus: 'Aguardando Inspeções',
        sourceOrderKind: 'Serviço',
        sourceEquipmentCategory: 'Motor',

        client: 'GERDAU CAUCAIA',

        openingDate: '2026-05-21',
        expectedDeliveryDate: '2026-06-07',
        invoiceNumber: '44921',
        serialNumber: '',
        manufacturer: '',

        equipment: 'Cilindro tela',
        model: 'HIDRÁULICO',

        clientReference: '',
        requester: '',
        claimedDefect: '',

        urgent: false,
        hydraulic: false,
        pneumatic: false,

        visibleImageCount: 2,

        checklistMarked: [
            'Apres. Relatório',
        ],

        checklistUnmarked: [],
        unidentifiedChecklistMarks: 0,

        sourceMissing: {
            empty: [],
            notInformed: [
                'manufacturer',
            ],
        },

        sourceNotes: [],
    },

    {
        orderNumber: '2026387',
        sourceStatus: 'Aguardando Inspeções',
        sourceOrderKind: 'Serviço',
        sourceEquipmentCategory: 'Motor',

        client: 'GERDAU CAUCAIA',

        openingDate: '2026-05-21',
        expectedDeliveryDate: '2026-06-07',
        invoiceNumber: '44921',
        serialNumber: '',
        manufacturer: '',

        equipment: 'Cilindro tela',
        model: 'HIDRÁULICO',

        clientReference: '',
        requester: '',
        claimedDefect: '',

        urgent: false,
        hydraulic: false,
        pneumatic: false,

        visibleImageCount: 2,

        checklistMarked: [
            'Apres. Relatório',
        ],

        checklistUnmarked: [],
        unidentifiedChecklistMarks: 0,

        sourceMissing: {
            empty: [],
            notInformed: [
                'manufacturer',
            ],
        },

        sourceNotes: [],
    },

    {
        orderNumber: '2026386',
        sourceStatus: 'Aguardando Inspeções',
        sourceOrderKind: 'Serviço',
        sourceEquipmentCategory: 'Motor',

        client: 'GERDAU CAUCAIA',

        openingDate: '2026-05-21',
        expectedDeliveryDate: '2026-06-07',
        invoiceNumber: '44921',
        serialNumber: '',
        manufacturer: '',

        equipment: 'Cilindro tela',
        model: 'HIDRÁULICO',

        clientReference: '',
        requester: '',
        claimedDefect: '',

        urgent: false,
        hydraulic: false,
        pneumatic: false,

        visibleImageCount: 1,

        checklistMarked: [],

        checklistUnmarked: [
            'Apres. Relatório',
        ],

        unidentifiedChecklistMarks: 0,

        sourceMissing: {
            empty: [],
            notInformed: [
                'manufacturer',
            ],
        },

        sourceNotes: [],
    },

    {
        orderNumber: '2026385',
        sourceStatus: 'Aguardando Inspeções',
        sourceOrderKind: 'Serviço',
        sourceEquipmentCategory: 'Motor',

        client: 'GERDAU CAUCAIA',

        openingDate: '2026-05-21',
        expectedDeliveryDate: '2026-06-07',
        invoiceNumber: '44921',
        serialNumber: '',
        manufacturer: '',

        equipment: 'Cilindro tela',
        model: 'HIDRÁULICO',

        clientReference: '',
        requester: '',
        claimedDefect: '',

        urgent: false,
        hydraulic: false,
        pneumatic: false,

        visibleImageCount: 1,

        checklistMarked: [
            'Apres. Relatório',
        ],

        checklistUnmarked: [],
        unidentifiedChecklistMarks: 0,

        sourceMissing: {
            empty: [],
            notInformed: [
                'manufacturer',
            ],
        },

        sourceNotes: [],
    },

    {
        orderNumber: '2026384',
        sourceStatus: 'Aguardando Inspeções',
        sourceOrderKind: 'Serviço',
        sourceEquipmentCategory: 'Motor',

        client: 'GERDAU CAUCAIA',

        openingDate: '2026-05-21',
        expectedDeliveryDate: '2026-06-07',
        invoiceNumber: '44921',
        serialNumber: '',
        manufacturer: '',

        equipment: 'Cilindro tela',
        model: 'HIDRÁULICO',

        clientReference: '',
        requester: '',
        claimedDefect: '',

        urgent: false,
        hydraulic: false,
        pneumatic: false,

        visibleImageCount: 1,

        checklistMarked: [],

        checklistUnmarked: [
            'Apres. Relatório',
        ],

        unidentifiedChecklistMarks: 0,

        sourceMissing: {
            empty: [],
            notInformed: [
                'manufacturer',
            ],
        },

        sourceNotes: [],
    },

    {
        orderNumber: '2026383',
        sourceStatus: 'Aguardando Inspeções',
        sourceOrderKind: 'Serviço',
        sourceEquipmentCategory: 'Motor',

        client: 'GERDAU CAUCAIA',

        openingDate: '2026-05-21',
        expectedDeliveryDate: '2026-06-07',
        invoiceNumber: '44921',
        serialNumber: '',
        manufacturer: '',

        equipment: 'Cilindro de solda',
        model: 'hidrálico',

        clientReference: '',
        requester: '',
        claimedDefect: '',

        urgent: false,
        hydraulic: false,
        pneumatic: false,

        visibleImageCount: 1,

        checklistMarked: [
            'Apres. Relatório',
        ],

        checklistUnmarked: [],
        unidentifiedChecklistMarks: 0,

        sourceMissing: {
            empty: [],
            notInformed: [
                'manufacturer',
            ],
        },

        sourceNotes: [
            'Grafia do modelo preservada exatamente como na ficha.',
        ],
    },

    {
        orderNumber: '2026360',
        sourceStatus: 'Aguardando Inspeções',
        sourceOrderKind: 'Serviço',
        sourceEquipmentCategory: 'Motor',

        client: 'SIEMENS GAMESA BA',

        openingDate: '2026-05-11',
        expectedDeliveryDate: '2026-05-20',
        invoiceNumber: '114717',
        serialNumber: '01',
        manufacturer: 'SIEMENS',

        equipment: 'Bomba',
        model: 'HIDRÁULICA',

        clientReference: '',
        requester: '',
        claimedDefect: '',

        urgent: false,
        hydraulic: false,
        pneumatic: false,

        visibleImageCount: 2,

        checklistMarked: [],
        checklistUnmarked: [],
        unidentifiedChecklistMarks: 0,

        sourceMissing: {
            empty: [],
            notInformed: [],
        },

        sourceNotes: [
            'Nenhum item do checklist apareceu marcado na coleta.',
        ],
    },

    {
        orderNumber: '2026359',
        sourceStatus: 'Aguardando Inspeções',
        sourceOrderKind: 'Serviço',
        sourceEquipmentCategory: 'Motor',

        client: 'SIEMENS GAMESA BA',

        openingDate: '2026-05-11',
        expectedDeliveryDate: '2026-05-20',
        invoiceNumber: '114717',
        serialNumber: '01',
        manufacturer: 'SIEMENS',

        equipment: 'Bomba',
        model: 'HIDRÁULICA',

        clientReference: '',
        requester: '',
        claimedDefect: '',

        urgent: false,
        hydraulic: false,
        pneumatic: false,

        visibleImageCount: 2,

        checklistMarked: [
            'Apres. Relatório',
        ],

        checklistUnmarked: [],
        unidentifiedChecklistMarks: 0,

        sourceMissing: {
            empty: [],
            notInformed: [],
        },

        sourceNotes: [],
    },
];
