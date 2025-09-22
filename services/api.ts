// services/api.ts
import type { StockLot, Pool, Location, Area, Marking, User, Role, PermissionGrant } from '../types';

class DataService {
  // Private stores for our data
  private pools: Pool[] = [];
  private locations: Location[] = [];
  private areas: Area[] = [];
  private stockLots: StockLot[] = [];
  private markings: Marking[] = [];
  private users: User[] = [];
  private roles: Role[] = [];
  private permissions: PermissionGrant[] = [];
  private isInitialized = false;

  private async _fetch<T>(url: string): Promise<T> {
    try {
      const response = await fetch(url);
      if (!response.ok) throw new Error(`HTTP error! status: ${response.status}`);
      return await response.json() as T;
    } catch (e) {
      console.error(`Failed to fetch from ${url}`, e);
      // On failure, return an empty array to prevent app crashes
      return [] as unknown as T;
    }
  }

  // --- Initialization ---
  async init(): Promise<void> {
    if (this.isInitialized) return;

    // Fetch all data in parallel for efficiency
    const [
      pools, locations, areas, stockLots, markings, users, roles, permissions
    ] = await Promise.all([
      this._fetch<Pool[]>('/data/pools.json'),
      this._fetch<Location[]>('/data/locations.json'),
      this._fetch<Area[]>('/data/areas.json'),
      this._fetch<StockLot[]>('/data/stockLots.json'),
      this._fetch<Marking[]>('/data/markings.json'),
      this._fetch<User[]>('/data/users.json'),
      this._fetch<Role[]>('/data/roles.json'),
      this._fetch<PermissionGrant[]>('/data/permissions.json'),
    ]);

    this.pools = pools;
    this.locations = locations;
    this.areas = areas;
    this.stockLots = stockLots;
    this.markings = markings;
    this.users = users;
    this.roles = roles;
    this.permissions = permissions;

    this.isInitialized = true;
    console.log("Data service initialized successfully.");
  }
  
  // --- Data Accessors (Synchronous) ---
  getPools = (): Pool[] => [...this.pools];
  getLocations = (): Location[] => [...this.locations];
  getAreas = (): Area[] => [...this.areas];
  getStockLots = (): StockLot[] => [...this.stockLots];
  getMarkings = (): Marking[] => [...this.markings];
  getUsers = (): User[] => [...this.users];
  getRoles = (): Role[] => [...this.roles];
  getPermissions = (): PermissionGrant[] => [...this.permissions];

  // --- CRUD Operations (Asynchronous Simulation) ---
  private create = <T extends {id: string}>(store: T[], newItem: Omit<T, 'id'>, entityName: string): Promise<T> => {
    return new Promise(resolve => setTimeout(() => {
        const itemWithId = { ...newItem, id: `${entityName}-${Date.now()}` } as T;
        store.push(itemWithId);
        resolve(itemWithId);
    }, 300));
  }

  private update = <T extends {id: string}>(store: T[], updatedItem: T): Promise<T> => {
      return new Promise((resolve, reject) => setTimeout(() => {
        const index = store.findIndex(item => item.id === updatedItem.id);
        if (index > -1) {
            store[index] = updatedItem;
            resolve(updatedItem);
        } else {
            reject(new Error(`${typeof updatedItem} not found`));
        }
      }, 300));
  }

  private del = <T extends {id: string; parentId?: string}>(store: T[], id: string): Promise<void> => {
      return new Promise((resolve, reject) => setTimeout(() => {
          const index = store.findIndex(item => item.id === id);
          if (index > -1) {
              store.splice(index, 1);
              // Handle re-parenting for hierarchical data
              store.forEach(item => {
                  if(item.parentId === id) {
                      item.parentId = undefined;
                  }
              });
              resolve();
          } else {
              reject(new Error(`Item with id ${id} not found`));
          }
      }, 300));
  }

  // Pools CRUD
  createPool = (pool: Omit<Pool, 'id'>) => this.create(this.pools, pool, 'pool');
  updatePool = (pool: Pool) => this.update(this.pools, pool);
  deletePool = (id: string) => this.del(this.pools, id);

  // Locations CRUD
  createLocation = (location: Omit<Location, 'id'>) => this.create(this.locations, location, 'location');
  updateLocation = (location: Location) => this.update(this.locations, location);
  deleteLocation = (id: string) => this.del(this.locations, id);

  // Areas CRUD
  createArea = (area: Omit<Area, 'id'>) => this.create(this.areas, area, 'area');
  updateArea = (area: Area) => this.update(this.areas, area);
  deleteArea = (id: string) => this.del(this.areas, id);
}

// Export a single instance of the service
export const dataService = new DataService();
