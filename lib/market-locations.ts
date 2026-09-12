export type MarketLocationPlace = {
  code: string
  nameZh: string
  nameEn: string
}

export type MarketLocationRegion = {
  code: string
  nameZh: string
  nameEn: string
  places: MarketLocationPlace[]
}

export type MarketLocationSystem = {
  code: string
  nameZh: string
  nameEn: string
  regions: MarketLocationRegion[]
}

export const MARKET_LOCATIONS: MarketLocationSystem[] = [
  // =========================================================
  // STANTON / 斯坦顿
  // =========================================================
  {
    code: 'stanton',
    nameZh: '斯坦顿',
    nameEn: 'Stanton',

    regions: [
      // -----------------------------------------------------
      // Hurston
      // -----------------------------------------------------
      {
        code: 'hurston',
        nameZh: '赫斯顿',
        nameEn: 'Hurston',

        places: [
          {
            code: 'lorville',
            nameZh: '罗威尔',
            nameEn: 'Lorville',
          },
          {
            code: 'everus-harbor',
            nameZh: '埃弗勒斯空间站',
            nameEn: 'Everus Harbor',
          },
          {
            code: 'other',
            nameZh: '其他',
            nameEn: 'Other',
          },
        ],
      },

      // -----------------------------------------------------
      // Crusader
      // -----------------------------------------------------
      {
        code: 'crusader',
        nameZh: '十字军',
        nameEn: 'Crusader',

        places: [
          {
            code: 'orison',
            nameZh: '奥里森',
            nameEn: 'Orison',
          },
          {
            code: 'seraphim',
            nameZh: '炽天使空间站',
            nameEn: 'Seraphim Station',
          },
          {
            code: 'grim-hex',
            nameZh: '六角湾',
            nameEn: 'Grim HEX',
          },
          {
            code: 'other',
            nameZh: '其他',
            nameEn: 'Other',
          },
        ],
      },

      // -----------------------------------------------------
      // ArcCorp
      // -----------------------------------------------------
      {
        code: 'arccorp',
        nameZh: '弧光星',
        nameEn: 'ArcCorp',

        places: [
          {
            code: 'area18',
            nameZh: '18区',
            nameEn: 'Area18',
          },
          {
            code: 'baijini-point',
            nameZh: '拜基尼空间站',
            nameEn: 'Baijini Point',
          },
          {
            code: 'other',
            nameZh: '其他',
            nameEn: 'Other',
          },
        ],
      },

      // -----------------------------------------------------
      // microTech
      // -----------------------------------------------------
      {
        code: 'microtech',
        nameZh: '微科星',
        nameEn: 'microTech',

        places: [
          {
            code: 'new-babbage',
            nameZh: '新巴贝奇',
            nameEn: 'New Babbage',
          },
          {
            code: 'port-tressler',
            nameZh: '特雷斯勒空间站',
            nameEn: 'Port Tressler',
          },
          {
            code: 'other',
            nameZh: '其他',
            nameEn: 'Other',
          },
        ],
      },

      // -----------------------------------------------------
      // Hurston Lagrange Stations
      // -----------------------------------------------------
      {
        code: 'hurston-lagrange',
        nameZh: '赫斯顿拉格朗日点',
        nameEn: 'Hurston Lagrange Points',

        places: [
          {
            code: 'hur-l1',
            nameZh: 'HUR-L1',
            nameEn: 'HUR-L1',
          },
          {
            code: 'hur-l2',
            nameZh: 'HUR-L2',
            nameEn: 'HUR-L2',
          },
          {
            code: 'hur-l3',
            nameZh: 'HUR-L3',
            nameEn: 'HUR-L3',
          },
          {
            code: 'hur-l4',
            nameZh: 'HUR-L4',
            nameEn: 'HUR-L4',
          },
          {
            code: 'hur-l5',
            nameZh: 'HUR-L5',
            nameEn: 'HUR-L5',
          },
          {
            code: 'other',
            nameZh: '其他',
            nameEn: 'Other',
          },
        ],
      },

      // -----------------------------------------------------
      // Crusader Lagrange Stations
      // -----------------------------------------------------
      {
        code: 'crusader-lagrange',
        nameZh: '十字军拉格朗日点',
        nameEn: 'Crusader Lagrange Points',

        places: [
          {
            code: 'cru-l1',
            nameZh: 'CRU-L1',
            nameEn: 'CRU-L1',
          },
          {
            code: 'cru-l4',
            nameZh: 'CRU-L4',
            nameEn: 'CRU-L4',
          },
          {
            code: 'cru-l5',
            nameZh: 'CRU-L5',
            nameEn: 'CRU-L5',
          },
          {
            code: 'other',
            nameZh: '其他',
            nameEn: 'Other',
          },
        ],
      },

      // -----------------------------------------------------
      // ArcCorp Lagrange Stations
      // -----------------------------------------------------
      {
        code: 'arccorp-lagrange',
        nameZh: '弧光星拉格朗日点',
        nameEn: 'ArcCorp Lagrange Points',

        places: [
          {
            code: 'arc-l1',
            nameZh: 'ARC-L1',
            nameEn: 'ARC-L1',
          },
          {
            code: 'arc-l2',
            nameZh: 'ARC-L2',
            nameEn: 'ARC-L2',
          },
          {
            code: 'arc-l3',
            nameZh: 'ARC-L3',
            nameEn: 'ARC-L3',
          },
          {
            code: 'arc-l4',
            nameZh: 'ARC-L4',
            nameEn: 'ARC-L4',
          },
          {
            code: 'arc-l5',
            nameZh: 'ARC-L5',
            nameEn: 'ARC-L5',
          },
          {
            code: 'other',
            nameZh: '其他',
            nameEn: 'Other',
          },
        ],
      },

      // -----------------------------------------------------
      // microTech Lagrange Stations
      // -----------------------------------------------------
      {
        code: 'microtech-lagrange',
        nameZh: '微科星拉格朗日点',
        nameEn: 'microTech Lagrange Points',

        places: [
          {
            code: 'mic-l1',
            nameZh: 'MIC-L1',
            nameEn: 'MIC-L1',
          },
          {
            code: 'mic-l2',
            nameZh: 'MIC-L2',
            nameEn: 'MIC-L2',
          },
          {
            code: 'mic-l3',
            nameZh: 'MIC-L3',
            nameEn: 'MIC-L3',
          },
          {
            code: 'mic-l4',
            nameZh: 'MIC-L4',
            nameEn: 'MIC-L4',
          },
          {
            code: 'mic-l5',
            nameZh: 'MIC-L5',
            nameEn: 'MIC-L5',
          },
          {
            code: 'other',
            nameZh: '其他',
            nameEn: 'Other',
          },
        ],
      },

      // -----------------------------------------------------
      // Gateways / Other Stanton Stations
      // -----------------------------------------------------
      {
        code: 'stanton-gateways',
        nameZh: '斯坦顿星门空间站',
        nameEn: 'Stanton Gateway Stations',

        places: [
          {
            code: 'pyro-gateway-stanton',
            nameZh: '派罗星门空间站',
            nameEn: 'Pyro Gateway',
          },
          {
            code: 'nyx-gateway-stanton',
            nameZh: '尼克斯星门空间站',
            nameEn: 'Nyx Gateway',
          },
          {
            code: 'terra-gateway-stanton',
            nameZh: '泰拉星门空间站',
            nameEn: 'Terra Gateway',
          },
          {
            code: 'other',
            nameZh: '其他',
            nameEn: 'Other',
          },
        ],
      },

      {
        code: 'stanton-other',
        nameZh: '其他区域',
        nameEn: 'Other Stanton Locations',

        places: [
          {
            code: 'other',
            nameZh: '其他',
            nameEn: 'Other',
          },
        ],
      },
    ],
  },

  // =========================================================
  // PYRO / 派罗
  // =========================================================
  {
    code: 'pyro',
    nameZh: '派罗',
    nameEn: 'Pyro',

    regions: [
      // -----------------------------------------------------
      // Major stations
      // -----------------------------------------------------
      {
        code: 'pyro-stations',
        nameZh: '主要空间站',
        nameEn: 'Major Stations',

        places: [
          {
            code: 'checkmate',
            nameZh: '死局空间站',
            nameEn: 'Checkmate Station',
          },
          {
            code: 'orbituary',
            nameZh: '轨道讣闻空间站',
            nameEn: 'Orbituary Station',
          },
          {
            code: 'patch-city',
            nameZh: 'Patch City',
            nameEn: 'Patch City',
          },
          {
            code: 'gaslight',
            nameZh: '煤气灯空间站',
            nameEn: 'Gaslight Station',
          },
          {
            code: 'rats-nest',
            nameZh: '鼠巢空间站',
            nameEn: "Rat's Nest",
          },
          {
            code: 'ruin-station',
            nameZh: '废墟空间站',
            nameEn: 'Ruin Station',
          },
          {
            code: 'other',
            nameZh: '其他',
            nameEn: 'Other',
          },
        ],
      },

      // -----------------------------------------------------
      // Gateway stations
      // -----------------------------------------------------
      {
        code: 'pyro-gateways',
        nameZh: '星门空间站',
        nameEn: 'Gateway Stations',

        places: [
          {
            code: 'stanton-gateway-pyro',
            nameZh: '斯坦顿星门空间站',
            nameEn: 'Stanton Gateway',
          },
          {
            code: 'nyx-gateway-pyro',
            nameZh: '尼克斯星门空间站',
            nameEn: 'Nyx Gateway',
          },
          {
            code: 'other',
            nameZh: '其他',
            nameEn: 'Other',
          },
        ],
      },

      // -----------------------------------------------------
      // Service stations
      // -----------------------------------------------------
      {
        code: 'pyro-service-stations',
        nameZh: '服务空间站',
        nameEn: 'Service Stations',

        places: [
          {
            code: 'megumi-refueling',
            nameZh: 'Megumi 加油站',
            nameEn: 'Megumi Refueling',
          },
          {
            code: 'rods-fuel',
            nameZh: 'Rod 补给站',
            nameEn: "Rod's Fuel 'N Supplies",
          },
          {
            code: 'dudley-daughters',
            nameZh: 'Dudley & Daughters',
            nameEn: 'Dudley & Daughters',
          },
          {
            code: 'starlight',
            nameZh: 'Starlight 服务站',
            nameEn: 'Starlight Service Station',
          },
          {
            code: 'other',
            nameZh: '其他',
            nameEn: 'Other',
          },
        ],
      },

      {
        code: 'pyro-other',
        nameZh: '其他区域',
        nameEn: 'Other Pyro Locations',

        places: [
          {
            code: 'other',
            nameZh: '其他',
            nameEn: 'Other',
          },
        ],
      },
    ],
  },

  // =========================================================
  // NYX / 尼克斯
  // =========================================================
  {
    code: 'nyx',
    nameZh: '尼克斯',
    nameEn: 'Nyx',

    regions: [
      // -----------------------------------------------------
      // Delamar
      // -----------------------------------------------------
      {
        code: 'delamar',
        nameZh: '德拉玛',
        nameEn: 'Delamar',

        places: [
          {
            code: 'levski',
            nameZh: '列夫斯基',
            nameEn: 'Levski',
          },
          {
            code: 'other',
            nameZh: '其他',
            nameEn: 'Other',
          },
        ],
      },

      // -----------------------------------------------------
      // Gateway stations
      // -----------------------------------------------------
      {
        code: 'nyx-gateways',
        nameZh: '星门空间站',
        nameEn: 'Gateway Stations',

        places: [
          {
            code: 'stanton-gateway-nyx',
            nameZh: '斯坦顿星门空间站',
            nameEn: 'Stanton Gateway',
          },
          {
            code: 'pyro-gateway-nyx',
            nameZh: '派罗星门空间站',
            nameEn: 'Pyro Gateway',
          },
          {
            code: 'other',
            nameZh: '其他',
            nameEn: 'Other',
          },
        ],
      },

      // -----------------------------------------------------
      // People's Service Stations
      // -----------------------------------------------------
      {
        code: 'peoples-service-stations',
        nameZh: '人民服务空间站',
        nameEn: "People's Service Stations",

        places: [
          {
            code: 'peoples-alpha',
            nameZh: '人民服务站 Alpha',
            nameEn: "People's Service Station Alpha",
          },
          {
            code: 'peoples-delta',
            nameZh: '人民服务站 Delta',
            nameEn: "People's Service Station Delta",
          },
          {
            code: 'peoples-lambda',
            nameZh: '人民服务站 Lambda',
            nameEn: "People's Service Station Lambda",
          },
          {
            code: 'peoples-theta',
            nameZh: '人民服务站 Theta',
            nameEn: "People's Service Station Theta",
          },
          {
            code: 'other',
            nameZh: '其他',
            nameEn: 'Other',
          },
        ],
      },

      // -----------------------------------------------------
      // Other stations
      // -----------------------------------------------------
      {
        code: 'nyx-stations',
        nameZh: '其他空间站',
        nameEn: 'Other Stations',

        places: [
          {
            code: 'qv-services',
            nameZh: 'QV 服务空间站',
            nameEn: 'QV Services Station',
          },
          {
            code: 'other',
            nameZh: '其他',
            nameEn: 'Other',
          },
        ],
      },

      {
        code: 'nyx-other',
        nameZh: '其他区域',
        nameEn: 'Other Nyx Locations',

        places: [
          {
            code: 'other',
            nameZh: '其他',
            nameEn: 'Other',
          },
        ],
      },
    ],
  },
]

export function getMarketSystem(
  systemCode: string,
) {
  return (
    MARKET_LOCATIONS.find(
      (system) =>
        system.code ===
        systemCode,
    ) ?? null
  )
}

export function getMarketRegion(
  systemCode: string,
  regionCode: string,
) {
  const system =
    getMarketSystem(
      systemCode,
    )

  return (
    system?.regions.find(
      (region) =>
        region.code ===
        regionCode,
    ) ?? null
  )
}

export function getMarketPlace(
  systemCode: string,
  regionCode: string,
  placeCode: string,
) {
  const region =
    getMarketRegion(
      systemCode,
      regionCode,
    )

  return (
    region?.places.find(
      (place) =>
        place.code ===
        placeCode,
    ) ?? null
  )
}

export function getMarketLocationLabel(
  systemCode: string,
  regionCode: string,
  placeCode: string,
) {
  const place =
    getMarketPlace(
      systemCode,
      regionCode,
      placeCode,
    )

  if (!place) {
    return ''
  }

  if (
    place.nameZh ===
    place.nameEn
  ) {
    return place.nameEn
  }

  return `${place.nameZh} / ${place.nameEn}`
}