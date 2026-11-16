// Loot Chest Service - PUNKERS Game
// Based on HTML reference implementation

export interface LootItem {
  emoji: string;
  name: string;
  punk: number;
  rarity: string;
  rc: string; // rarity color
  weight: number;
}

export interface LootChest {
  id: string;
  icon: string;
  label: string;
  color: string;
  rgb: string;
  cost: number;
  lootTable: LootItem[];
}

export interface LootResult {
  chestId: string;
  chestLabel: string;
  chestCost: number;
  loot: LootItem;
}

export const LOOT_CHESTS: LootChest[] = [
  {
    id: 'common', icon: '📦', label: 'COMMON',
    color: '#888888', rgb: '136,136,136', cost: 10,
    lootTable: [
      { emoji: '🪙', name: 'Small Loot',  punk: 5,   rarity: 'COMMON',    rc: '#888888', weight: 50 },
      { emoji: '💰', name: 'Decent Loot', punk: 15,  rarity: 'UNCOMMON',  rc: '#aaaaaa', weight: 30 },
      { emoji: '🔫', name: 'Good Loot',   punk: 30,  rarity: 'RARE',      rc: '#ff6600', weight: 15 },
      { emoji: '💎', name: 'Big Score',   punk: 60,  rarity: 'EPIC',      rc: '#b44dff', weight: 4  },
      { emoji: '👑', name: 'JACKPOT',     punk: 150, rarity: 'LEGENDARY', rc: '#ffcc00', weight: 1  },
    ],
  },
  {
    id: 'rare', icon: '🗝️', label: 'RARE',
    color: '#ff6600', rgb: '255,102,0', cost: 30,
    lootTable: [
      { emoji: '💰', name: 'Punk Bag',    punk: 25,  rarity: 'COMMON',    rc: '#888888', weight: 40 },
      { emoji: '🔫', name: 'War Chest',   punk: 50,  rarity: 'UNCOMMON',  rc: '#aaaaaa', weight: 30 },
      { emoji: '💎', name: 'Rare Drop',   punk: 100, rarity: 'RARE',      rc: '#ff6600', weight: 18 },
      { emoji: '🧿', name: 'Epic Haul',   punk: 200, rarity: 'EPIC',      rc: '#b44dff', weight: 10 },
      { emoji: '☠️', name: 'SKULL LOOT', punk: 500, rarity: 'LEGENDARY', rc: '#ffcc00', weight: 2  },
    ],
  },
  {
    id: 'legendary', icon: '💀', label: 'LEGENDARY',
    color: '#ffcc00', rgb: '255,204,0', cost: 100,
    lootTable: [
      { emoji: '🔫', name: 'Punk Cache',  punk: 80,   rarity: 'COMMON',    rc: '#888888', weight: 35 },
      { emoji: '🧿', name: 'Dark Haul',   punk: 150,  rarity: 'UNCOMMON',  rc: '#aaaaaa', weight: 30 },
      { emoji: '💎', name: 'Legend Drop', punk: 300,  rarity: 'RARE',      rc: '#ff6600', weight: 20 },
      { emoji: '🌑', name: 'Shadow Loot', punk: 600,  rarity: 'EPIC',      rc: '#b44dff', weight: 12 },
      { emoji: '👁️', name: 'THE VOID',   punk: 2000, rarity: 'LEGENDARY', rc: '#ffcc00', weight: 3  },
    ],
  },
];

export type ChestType = 'common' | 'rare' | 'legendary';

/**
 * Roll loot from a chest's loot table (weighted random)
 */
export function rollLoot(chest: LootChest): LootItem {
  const total = chest.lootTable.reduce((s, l) => s + l.weight, 0);
  let r = Math.random() * total;
  for (const l of chest.lootTable) {
    r -= l.weight;
    if (r <= 0) return l;
  }
  return chest.lootTable[0];
}

/**
 * Open a loot chest and return the result
 */
export function openChest(chestId: ChestType): LootResult | null {
  const chest = LOOT_CHESTS.find((c) => c.id === chestId);
  if (!chest) return null;

  const loot = rollLoot(chest);

  return {
    chestId: chest.id,
    chestLabel: chest.label,
    chestCost: chest.cost,
    loot,
  };
}
