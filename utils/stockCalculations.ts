
import type { StockLot, DerivedStockState } from '../types';

// In a real app, this would be determined by the logged-in user's company/entity
const MY_COMPANY_POOLS = ['pool-main', 'pool-assets', 'pool-supplies', 'pool-repair'];

const isMyPool = (poolId: string) => MY_COMPANY_POOLS.includes(poolId);

export const calculateDerivedStates = (stockLots: StockLot[]): DerivedStockState[] => {
  
  const myOwnedStock = stockLots
    .filter(lot => isMyPool(lot.mpId) && lot.spId === lot.mpId)
    .reduce((sum, lot) => sum + lot.quantity, 0);

  const myOwnedStockMyCustody = stockLots
    .filter(lot => isMyPool(lot.mpId) && lot.spId === lot.mpId && lot.cpId === lot.mpId)
    .reduce((sum, lot) => sum + lot.quantity, 0);

  const totalStockInHand = stockLots
    .filter(lot => isMyPool(lot.cpId))
    .reduce((sum, lot) => sum + lot.quantity, 0);

  const i3psInHand = stockLots
    .filter(lot => isMyPool(lot.mpId) && isMyPool(lot.cpId) && !isMyPool(lot.spId))
    .reduce((sum, lot) => sum + lot.quantity, 0);

  const o3psOwned = stockLots
    .filter(lot => isMyPool(lot.mpId) && lot.spId === lot.mpId && !isMyPool(lot.cpId))
    .reduce((sum, lot) => sum + lot.quantity, 0);
    
  const chainConsigned = stockLots
    .filter(lot => !isMyPool(lot.spId) && !isMyPool(lot.cpId) && isMyPool(lot.mpId))
    .reduce((sum, lot) => sum + lot.quantity, 0);

  const totalCurrentStock = stockLots
    .filter(lot => isMyPool(lot.mpId))
    .reduce((sum, lot) => sum + lot.quantity, 0);

  return [
    {
      label: 'Total Stock-in-hand',
      value: totalStockInHand,
      description: 'All stock physically in our custody (CP = Me)',
    },
    {
      label: 'Total Current Stock',
      value: totalCurrentStock,
      description: 'All stock we are tracking (MP = Me), incl. I3PS & O3PS',
    },
    {
      label: 'My Owned Stock (My Custody)',
      value: myOwnedStockMyCustody,
      description: 'Stock we own and hold (MP = SP = CP = Me)',
    },
    {
      label: 'I3PS In-hand',
      value: i3psInHand,
      description: 'Others\' stock we hold ((MP=CP=Me) <> SP)',
    },
    {
      label: 'O3PS Owned',
      value: o3psOwned,
      description: 'Our stock held by others ((MP=SP=Me) <> CP)',
    },
    {
      label: 'Chain Consigned',
      value: chainConsigned,
      description: 'Our tracked stock, from others, held by others (MP=Me, SP<>Me, CP<>Me)',
    },
  ];
};
