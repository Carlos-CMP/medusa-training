export type DemoSavedList = {
  id: string
  name: string
  owner: string
  costCenter: string
  updatedAt: string
  items: Array<{
    sku: string
    name: string
    quantity: number
    unit: "uds" | "cajas"
  }>
}

export type DemoDocument = {
  id: string
  type: "Factura" | "Albaran" | "Abono"
  number: string
  date: string
  order: string
  amount: string
  status: "Disponible" | "Pendiente"
}

export type DemoRmaCase = {
  id: string
  status: "Abierto" | "En revision" | "Cerrado"
  product: string
  serial: string
  reason: string
  updatedAt: string
}

export type DemoReplacement = {
  sku: string
  name: string
  reason: string
  availability: string
  href: string
}

export const demoSavedLists: DemoSavedList[] = [
  {
    id: "lista-auditorio-2026",
    name: "Proyecto auditorio Madrid Q3",
    owner: "Iberia Buyer",
    costCenter: "CC-MAD-AUDIO",
    updatedAt: "2026-08-18",
    items: [
      {
        sku: "NS-TX1-BLK",
        name: "Novisound Tower Pro X1",
        quantity: 8,
        unit: "uds",
      },
      {
        sku: "NGS-GHX-600-BLK",
        name: "NGS GHX-600",
        quantity: 24,
        unit: "uds",
      },
    ],
  },
  {
    id: "reposicion-tiendas-norte",
    name: "Reposicion tiendas zona norte",
    owner: "Compras Iberia",
    costCenter: "CC-NORTE-RETAIL",
    updatedAt: "2026-08-12",
    items: [
      {
        sku: "NGS-EVO-MOUSE-BLK",
        name: "NGS EVO Mouse",
        quantity: 12,
        unit: "cajas",
      },
      {
        sku: "NGS-FUNKY-KIT-BLK",
        name: "NGS Funky Kit",
        quantity: 6,
        unit: "cajas",
      },
    ],
  },
]

export const demoDocuments: DemoDocument[] = [
  {
    id: "fac-2026-1048",
    type: "Factura",
    number: "FAC-2026-1048",
    date: "2026-08-11",
    order: "ORD-DEMO-0048",
    amount: "8.742,00 EUR",
    status: "Disponible",
  },
  {
    id: "alb-2026-8031",
    type: "Albaran",
    number: "ALB-2026-8031",
    date: "2026-08-12",
    order: "ORD-DEMO-0048",
    amount: "Entrega completa",
    status: "Disponible",
  },
  {
    id: "fac-2026-1032",
    type: "Factura",
    number: "FAC-2026-1032",
    date: "2026-07-28",
    order: "ORD-DEMO-0032",
    amount: "2.196,40 EUR",
    status: "Disponible",
  },
]

export const demoRmaCases: DemoRmaCase[] = [
  {
    id: "rma-2026-018",
    status: "En revision",
    product: "Novisound Tower Pro X1",
    serial: "NS-TX1-26-00418",
    reason: "Revision preventiva antes de instalacion",
    updatedAt: "2026-08-19",
  },
  {
    id: "rma-2026-011",
    status: "Cerrado",
    product: "NGS GHX-600",
    serial: "NGS-GHX-26-00902",
    reason: "Sustitucion de cableado de prueba",
    updatedAt: "2026-08-04",
  },
]

export const demoReplacementsByHandle: Record<string, DemoReplacement[]> = {
  "novisound-tower-pro-x1": [
    {
      sku: "NS-A500-RACK",
      name: "Novisound Amplifier A500 Rack edition",
      reason: "Amplificacion compatible para instalaciones fijas",
      availability: "En stock",
      href: "/products/novisound-amplifier-a500",
    },
    {
      sku: "NS-M2-BLK",
      name: "Novisound Wireless Mic M2",
      reason: "Accesorio recomendado para salas y eventos",
      availability: "Entrega 24/48h",
      href: "/products/novisound-wireless-mic-m2",
    },
  ],
  "novisound-amplifier-a500": [
    {
      sku: "NS-TX1-BLK",
      name: "Novisound Tower Pro X1",
      reason: "Altavoz compatible para el mismo proyecto",
      availability: "En stock",
      href: "/products/novisound-tower-pro-x1",
    },
  ],
  "ngs-ghx-600": [
    {
      sku: "NGS-GHX-CABLE",
      name: "Cable de recambio GHX",
      reason: "Recambio operativo para parque instalado",
      availability: "Stock tecnico",
      href: "/store",
    },
  ],
}

export const getDemoReplacements = (handle?: string | null) =>
  handle ? demoReplacementsByHandle[handle] || [] : []
