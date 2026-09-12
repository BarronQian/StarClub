export type MarketSubcategory = {
  code: string
  nameZh: string
  nameEn: string
}

export type MarketCategory = {
  code: string
  nameZh: string
  nameEn: string
  subcategories: MarketSubcategory[]
}

export const ARMOR_PARTS = [
  {
    code: 'undersuit',
    nameZh: '基底服',
    nameEn: 'Undersuit',
    hasWeight: false,
  },
  {
    code: 'helmet',
    nameZh: '头盔',
    nameEn: 'Helmet',
    hasWeight: true,
  },
  {
    code: 'arms',
    nameZh: '臂甲',
    nameEn: 'Arms',
    hasWeight: true,
  },
  {
    code: 'torso',
    nameZh: '胸甲',
    nameEn: 'Torso',
    hasWeight: true,
  },
  {
    code: 'legs',
    nameZh: '腿甲',
    nameEn: 'Legs',
    hasWeight: true,
  },
  {
    code: 'backpack',
    nameZh: '背包',
    nameEn: 'Backpack',
    hasWeight: true,
  },
  {
    code: 'other',
    nameZh: '其他',
    nameEn: 'Other',
    hasWeight: false,
  },
] as const

export const ARMOR_WEIGHTS = [
  {
    code: 'light',
    nameZh: '轻型',
    nameEn: 'Light',
  },
  {
    code: 'medium',
    nameZh: '中型',
    nameEn: 'Medium',
  },
  {
    code: 'heavy',
    nameZh: '重型',
    nameEn: 'Heavy',
  },
  {
    code: 'super-heavy',
    nameZh: '超重型',
    nameEn: 'Super Heavy',
  },
] as const

export const MARKET_CATEGORIES: MarketCategory[] = [

  {
    code: 'weapon',
    nameZh: '武器',
    nameEn: 'Weapons',
    subcategories: [
      {
        code: 'pistol',
        nameZh: '手枪',
        nameEn: 'Pistols',
      },
      {
        code: 'smg',
        nameZh: '冲锋枪',
        nameEn: 'SMGs',
      },
      {
        code: 'rifle',
        nameZh: '步枪',
        nameEn: 'Rifles',
      },
      {
        code: 'sniper',
        nameZh: '狙击枪',
        nameEn: 'Sniper Rifles',
      },
      {
        code: 'shotgun',
        nameZh: '霰弹枪',
        nameEn: 'Shotguns',
      },
      {
        code: 'lmg',
        nameZh: '轻机枪',
        nameEn: 'LMGs',
      },
      {
        code: 'heavy',
        nameZh: '重型武器',
        nameEn: 'Heavy Weapons',
      },
      {
        code: 'melee',
        nameZh: '近战武器',
        nameEn: 'Melee Weapons',
      },
      {
        code: 'ammo',
        nameZh: '弹药',
        nameEn: 'Ammunition',
      },
      {
        code: 'attachment',
        nameZh: '武器配件',
        nameEn: 'Weapon Attachments',
      },
      {
        code: 'other',
        nameZh: '其他',
        nameEn: 'Other',
      },
    ],
  },

  {
    code: 'armor',
    nameZh: '护甲',
    nameEn: 'Armor',
    subcategories: [
      {
        code: 'undersuit',
        nameZh: '基底服',
        nameEn: 'Undersuit',
      },

      {
        code: 'helmet-light',
        nameZh: '轻型头盔',
        nameEn: 'Light Helmet',
      },
      {
        code: 'helmet-medium',
        nameZh: '中型头盔',
        nameEn: 'Medium Helmet',
      },
      {
        code: 'helmet-heavy',
        nameZh: '重型头盔',
        nameEn: 'Heavy Helmet',
      },
      {
        code: 'helmet-super-heavy',
        nameZh: '超重型头盔',
        nameEn: 'Super Heavy Helmet',
      },

      {
        code: 'arms-light',
        nameZh: '轻型臂甲',
        nameEn: 'Light Arms',
      },
      {
        code: 'arms-medium',
        nameZh: '中型臂甲',
        nameEn: 'Medium Arms',
      },
      {
        code: 'arms-heavy',
        nameZh: '重型臂甲',
        nameEn: 'Heavy Arms',
      },
      {
        code: 'arms-super-heavy',
        nameZh: '超重型臂甲',
        nameEn: 'Super Heavy Arms',
      },

      {
        code: 'torso-light',
        nameZh: '轻型胸甲',
        nameEn: 'Light Torso',
      },
      {
        code: 'torso-medium',
        nameZh: '中型胸甲',
        nameEn: 'Medium Torso',
      },
      {
        code: 'torso-heavy',
        nameZh: '重型胸甲',
        nameEn: 'Heavy Torso',
      },
      {
        code: 'torso-super-heavy',
        nameZh: '超重型胸甲',
        nameEn: 'Super Heavy Torso',
      },

      {
        code: 'legs-light',
        nameZh: '轻型腿甲',
        nameEn: 'Light Legs',
      },
      {
        code: 'legs-medium',
        nameZh: '中型腿甲',
        nameEn: 'Medium Legs',
      },
      {
        code: 'legs-heavy',
        nameZh: '重型腿甲',
        nameEn: 'Heavy Legs',
      },
      {
        code: 'legs-super-heavy',
        nameZh: '超重型腿甲',
        nameEn: 'Super Heavy Legs',
      },

      {
        code: 'backpack-light',
        nameZh: '轻型背包',
        nameEn: 'Light Backpack',
      },
      {
        code: 'backpack-medium',
        nameZh: '中型背包',
        nameEn: 'Medium Backpack',
      },
      {
        code: 'backpack-heavy',
        nameZh: '重型背包',
        nameEn: 'Heavy Backpack',
      },
      {
        code: 'backpack-super-heavy',
        nameZh: '超重型背包',
        nameEn: 'Super Heavy Backpack',
      },

      {
        code: 'other',
        nameZh: '其他',
        nameEn: 'Other',
      },
    ],
  },

  {
    code: 'equipment',
    nameZh: '装备',
    nameEn: 'Equipment',
    subcategories: [
      {
        code: 'multitool',
        nameZh: '多功能工具',
        nameEn: 'Multi-Tools',
      },
      {
        code: 'gadget',
        nameZh: '工具 / 装置',
        nameEn: 'Gadgets',
      },
      {
        code: 'medical',
        nameZh: '医疗用品',
        nameEn: 'Medical Equipment',
      },
      {
        code: 'clothing',
        nameZh: '服装',
        nameEn: 'Clothing',
      },
      {
        code: 'consumable',
        nameZh: '消耗品',
        nameEn: 'Consumables',
      },
      {
        code: 'other',
        nameZh: '其他',
        nameEn: 'Other',
      },
    ],
  },

  {
    code: 'component',
    nameZh: '舰船组件',
    nameEn: 'Ship Components',
    subcategories: [
      {
        code: 'weapon',
        nameZh: '舰船武器',
        nameEn: 'Ship Weapons',
      },
      {
        code: 'missile',
        nameZh: '导弹 / 鱼雷',
        nameEn: 'Missiles & Torpedoes',
      },
      {
        code: 'shield',
        nameZh: '护盾发生器',
        nameEn: 'Shield Generators',
      },
      {
        code: 'power-plant',
        nameZh: '发电机',
        nameEn: 'Power Plants',
      },
      {
        code: 'cooler',
        nameZh: '冷却器',
        nameEn: 'Coolers',
      },
      {
        code: 'quantum-drive',
        nameZh: '量子驱动器',
        nameEn: 'Quantum Drives',
      },
      {
        code: 'jump-drive',
        nameZh: '跳跃驱动器',
        nameEn: 'Jump Drives',
      },
      {
        code: 'radar',
        nameZh: '雷达',
        nameEn: 'Radars',
      },
      {
        code: 'paint',
        nameZh: '涂装',
        nameEn: 'Paints',
      },
      {
        code: 'other',
        nameZh: '其他',
        nameEn: 'Other',
      },
    ],
  },

  {
    code: 'cargo',
    nameZh: '货物',
    nameEn: 'Cargo',
    subcategories: [
      {
        code: 'commodity',
        nameZh: '贸易商品',
        nameEn: 'Commodities',
      },
      {
        code: 'container',
        nameZh: '货箱 / 容器',
        nameEn: 'Containers',
      },
      {
        code: 'salvage',
        nameZh: '打捞货物',
        nameEn: 'Salvage Cargo',
      },
      {
        code: 'mission',
        nameZh: '任务物品',
        nameEn: 'Mission Cargo',
      },
      {
        code: 'other',
        nameZh: '其他',
        nameEn: 'Other',
      },
    ],
  },

  {
    code: 'material',
    nameZh: '材料',
    nameEn: 'Materials',
    subcategories: [
      {
        code: 'mineral',
        nameZh: '矿物',
        nameEn: 'Minerals',
      },
      {
        code: 'refined',
        nameZh: '精炼材料',
        nameEn: 'Refined Materials',
      },
      {
        code: 'salvage',
        nameZh: '打捞材料',
        nameEn: 'Salvage Materials',
      },
      {
        code: 'crafting',
        nameZh: '制造材料',
        nameEn: 'Crafting Materials',
      },
      {
        code: 'other',
        nameZh: '其他',
        nameEn: 'Other',
      },
    ],
  },

  {
    code: 'other',
    nameZh: '其他',
    nameEn: 'Other',
    subcategories: [
      {
        code: 'collectible',
        nameZh: '收藏品',
        nameEn: 'Collectibles',
      },
      {
        code: 'decoration',
        nameZh: '装饰品',
        nameEn: 'Decorations',
      },
      {
        code: 'event',
        nameZh: '活动物品',
        nameEn: 'Event Items',
      },
      {
        code: 'other',
        nameZh: '其他',
        nameEn: 'Other',
      },
    ],
  },
]

export function getMarketCategory(
  categoryCode: string,
) {
  return (
    MARKET_CATEGORIES.find(
      (category) =>
        category.code ===
        categoryCode,
    ) ?? null
  )
}

export function getMarketSubcategory(
  categoryCode: string,
  subcategoryCode: string,
) {
  const category =
    getMarketCategory(
      categoryCode,
    )

  return (
    category?.subcategories.find(
      (subcategory) =>
        subcategory.code ===
        subcategoryCode,
    ) ?? null
  )
}

export function getArmorPart(
  partCode: string,
) {
  return (
    ARMOR_PARTS.find(
      (part) =>
        part.code ===
        partCode,
    ) ?? null
  )
}

export function getArmorWeight(
  weightCode: string,
) {
  return (
    ARMOR_WEIGHTS.find(
      (weight) =>
        weight.code ===
        weightCode,
    ) ?? null
  )
}

export function buildArmorSubcategory(
  partCode: string,
  weightCode: string,
) {
  const part =
    getArmorPart(partCode)

  if (!part) {
    return ''
  }

  if (!part.hasWeight) {
    return part.code
  }

  const weight =
    getArmorWeight(
      weightCode,
    )

  if (!weight) {
    return ''
  }

  return `${part.code}-${weight.code}`
}

export function getMarketCategoryLabel(
  categoryCode: string,
) {
  const category =
    getMarketCategory(
      categoryCode,
    )

  if (!category) {
    return ''
  }

  return `${category.nameZh} / ${category.nameEn}`
}

export function getMarketSubcategoryLabel(
  categoryCode: string,
  subcategoryCode: string,
) {
  const subcategory =
    getMarketSubcategory(
      categoryCode,
      subcategoryCode,
    )

  if (!subcategory) {
    return ''
  }

  return `${subcategory.nameZh} / ${subcategory.nameEn}`
}