import { PoolNature, PoolSubtype } from '../types';

export const POOL_SUBTYPE_MAP: Record<PoolNature, PoolSubtype[]> = {
    [PoolNature.INVENTORY]: [
        PoolSubtype.STOCK_IN_TRADE,
        PoolSubtype.PRODUCTION,
        PoolSubtype.MRO,
        PoolSubtype.SPARES,
        PoolSubtype.CONSUMABLES,
    ],
    [PoolNature.ASSETS]: [
        PoolSubtype.FIXED_ASSETS,
    ],
    [PoolNature.OFF_INVENTORY]: [
        PoolSubtype.SUPPLIES,
        PoolSubtype.PACKING_MATERIALS,
        PoolSubtype.SECURITY_TAGS,
        PoolSubtype.MARKETING_MATERIALS,
        PoolSubtype.OFFICE_SUPPLIES,
        PoolSubtype.HOUSEKEEPING,
        PoolSubtype.ELECTRICAL,
        PoolSubtype.IT_CONSUMABLES,
        PoolSubtype.TOOLS,
        PoolSubtype.SAFETY,
        PoolSubtype.UNIFORMS,
    ],
    [PoolNature.OFF_ASSETS]: [
        PoolSubtype.EXPENSED_ASSETS,
    ],
    [PoolNature.RESOURCES]: [
        PoolSubtype.PROVIDERS,
    ],
    [PoolNature.BOOKABLES]: [
        PoolSubtype.STOCK_KITS,
        PoolSubtype.DELUXE_ROOMS,
        PoolSubtype.SURGERY_SETS,
        PoolSubtype.DEMO_KITS,
    ],
    [PoolNature.TRACKABLES]: [
        PoolSubtype.INTERACTIONS,
        PoolSubtype.EVENTS,
        PoolSubtype.KPIS,
    ],
    [PoolNature.CONTROL_ACCOUNT]: [
        PoolSubtype.PURCHASE,
        PoolSubtype.CONSIGNMENT,
        PoolSubtype.REPAIR,
    ],
    [PoolNature.THIRD_PARTY]: [
        PoolSubtype.NONE
    ]
};