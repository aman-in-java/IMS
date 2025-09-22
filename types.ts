// types.ts

export interface StockLot {
  id: string;
  sku: string;
  mpId: string; // My Pool ID
  spId: string; // Source Pool ID
  cpId: string; // Custody Pool ID
  quantity: number;
  locationId: string;
  areaId?: string;
  stockState: RAGState;
  qualityState: RAGState;
  supplyState: RAGState;
  markingIds?: string[];
}

export interface Item {
    id: string;
    name: string;
    binderType: 'Goods' | 'Services' | 'Assets' | 'Bookables' | 'Trackables' | 'Topics';
    tags: string[];
}

export interface StockSelectionCriteria {
  id: string;
  areaId: string;
  poolId: string;
  status: RAGState;
  classes: string;
}


export interface DerivedStockState {
  label: string;
  value: number;
  description: string;
}

export enum RAGState {
  Red = 'Red',
  Amber = 'Amber',
  Green = 'Green',
}

export enum PoolNature {
  INVENTORY = 'Inventory',
  ASSETS = 'Assets',
  OFF_INVENTORY = 'Off-Inventory',
  OFF_ASSETS = 'Off-Assets',
  RESOURCES = 'Resources',
  BOOKABLES = 'Bookables',
  TRACKABLES = 'Trackables',
  CONTROL_ACCOUNT = 'Control Account',
  THIRD_PARTY = '3rd Party',
}

export enum PoolSubtype {
  // INVENTORY
  STOCK_IN_TRADE = 'Stock in Trade',
  PRODUCTION = 'Production',
  MRO = 'MRO',
  SPARES = 'Spares',
  CONSUMABLES = 'Consumables',
  // ASSETS
  FIXED_ASSETS = 'Fixed Assets',
  // OFF_INVENTORY
  SUPPLIES = 'Supplies',
  PACKING_MATERIALS = 'Packing Materials',
  SECURITY_TAGS = 'Security Tags',
  MARKETING_MATERIALS = 'Marketing Materials',
  OFFICE_SUPPLIES = 'Office Supplies',
  HOUSEKEEPING = 'Housekeeping',
  ELECTRICAL = 'Electrical',
  IT_CONSUMABLES = 'IT Consumables',
  TOOLS = 'Tools',
  SAFETY = 'Safety',
  UNIFORMS = 'Uniforms',
  // OFF_ASSETS
  EXPENSED_ASSETS = 'Expensed Assets',
  // RESOURCES
  PROVIDERS = 'Providers',
  // BOOKABLES
  STOCK_KITS = 'Stock Kits',
  DELUXE_ROOMS = 'Deluxe Rooms',
  SURGERY_SETS = 'Surgery Sets',
  DEMO_KITS = 'Demo Kits',
  // TRACKABLES
  INTERACTIONS = 'Interactions',
  EVENTS = 'Events',
  KPIS = 'KPIs',
  // CONTROL_ACCOUNT
  PURCHASE = 'Purchase',
  CONSIGNMENT = 'Consignment',
  REPAIR = 'Repair',
  // THIRD_PARTY
  NONE = 'N/A'
}

export interface Pool {
  id: string;
  code: string;
  name: string;
  nature: PoolNature;
  subtype: PoolSubtype;
  isNested?: boolean;
  parentId?: string;
}

export interface Location {
    id: string;
    name: string;
    description: string;
    isNested?: boolean;
    parentId?: string;
}

export interface Area {
    id: string;
    locationId: string;
    name: string;
    description: string;
    squareFeet?: number;
    isQualityArea?: boolean;
}

export interface Marking {
    id: string;
    color: 'blue' | 'green' | 'yellow' | 'red' | 'gray' | 'purple';
    labelText: string;
    promoId?: string;
}

// --- Permissions ---
export interface User {
  id: string;
  name: string;
  email: string;
  roleIds: string[];
}

export interface Role {
  id: string;
  name: string;
  description: string;
}

export enum Action {
  VIEW_DASHBOARD = 'VIEW_DASHBOARD',
  VIEW_POOLS = 'VIEW_POOLS',
  MANAGE_POOLS = 'MANAGE_POOLS',
  VIEW_LOCATIONS = 'VIEW_LOCATIONS',
  MANAGE_LOCATIONS = 'MANAGE_LOCATIONS',
  VIEW_AREAS = 'VIEW_AREAS',
  MANAGE_AREAS = 'MANAGE_AREAS',
  VIEW_SSC = 'VIEW_SSC',
  MANAGE_SSC = 'MANAGE_SSC',
  VIEW_PERMISSIONS = 'VIEW_PERMISSIONS',
  MANAGE_PERMISSIONS = 'MANAGE_PERMISSIONS',
  // More granular actions can be added here
  ALLOCATE_STOCK = 'ALLOCATE_STOCK',
  CHANGE_STOCK_STATE = 'CHANGE_STOCK_STATE',
}

export interface PermissionGrant {
  roleId: string;
  action: Action;
  constraints?: {
    allowedPoolIds?: string[];
    allowedAreaIds?: string[];
    matchingSscIds?: string[]; // New: Link permission to SSC rules
  };
}