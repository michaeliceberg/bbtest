// lib/ddxConst.ts — общие для клиента и сервера константы паззла «абонемент в спортзал».
export const DDX_PIECES = 9 // 3 × 3 квадратных кусочка
export const DDX_COLS = 3
export const DDX_ROWS = 3
export const DDX_MERGE_COST = 2 // столько повторок сливаются в один недостающий кусочек
export type DdxPieceState = { piece: number; qty: number; placed: boolean }
