import * as XLSX from 'xlsx'
import { prisma } from '@sellsync/database'

export interface ImportRow {
  sku: string
  name: string
  description?: string
  brand?: string
  ncm?: string
  gtin?: string
  weight?: number
  height?: number
  width?: number
  length?: number
  images?: string
  price?: number
  stock?: number
}

export interface ImportResult {
  created: number
  updated: number
  errors: Array<{ row: number; sku: string; reason: string }>
}

function toNum(v: unknown): number | undefined {
  const n = Number(v)
  return isNaN(n) || v === '' || v == null ? undefined : n
}

export function parseSpreadsheet(buffer: Buffer, mimetype: string): ImportRow[] {
  const workbook = XLSX.read(buffer, { type: 'buffer' })
  const sheet = workbook.Sheets[workbook.SheetNames[0]]
  const rows = XLSX.utils.sheet_to_json<Record<string, unknown>>(sheet, { defval: '' })

  return rows.map((row) => ({
    sku: String(row['sku'] ?? row['SKU'] ?? '').trim(),
    name: String(row['name'] ?? row['nome'] ?? row['Nome'] ?? '').trim(),
    description: String(row['description'] ?? row['descricao'] ?? row['descrição'] ?? '').trim() || undefined,
    brand: String(row['brand'] ?? row['marca'] ?? row['Marca'] ?? '').trim() || undefined,
    ncm: String(row['ncm'] ?? row['NCM'] ?? '').replace(/\D/g, '') || undefined,
    gtin: String(row['gtin'] ?? row['ean'] ?? row['EAN'] ?? row['GTIN'] ?? '').trim() || undefined,
    weight: toNum(row['weight'] ?? row['peso'] ?? row['Peso (kg)']),
    height: toNum(row['height'] ?? row['altura'] ?? row['Altura (cm)']),
    width: toNum(row['width'] ?? row['largura'] ?? row['Largura (cm)']),
    length: toNum(row['length'] ?? row['comprimento'] ?? row['Comprimento (cm)']),
    images: String(row['images'] ?? row['imagens'] ?? row['imagem'] ?? '').trim() || undefined,
    price: toNum(row['price'] ?? row['preco'] ?? row['preço'] ?? row['Preço']),
    stock: toNum(row['stock'] ?? row['estoque'] ?? row['Estoque']),
  }))
}

export async function importProducts(
  rows: ImportRow[],
  tenantId: string,
): Promise<ImportResult> {
  const result: ImportResult = { created: 0, updated: 0, errors: [] }

  for (let i = 0; i < rows.length; i++) {
    const row = rows[i]
    const rowNum = i + 2 // 1-indexed + header

    if (!row.sku) {
      result.errors.push({ row: rowNum, sku: '', reason: 'SKU obrigatório' })
      continue
    }
    if (!row.name) {
      result.errors.push({ row: rowNum, sku: row.sku, reason: 'Nome obrigatório' })
      continue
    }

    try {
      const images = row.images
        ? row.images.split(/[,\n]/).map((u) => u.trim()).filter(Boolean)
        : []

      const existing = await prisma.product.findFirst({
        where: { tenantId, sku: row.sku },
      })

      if (existing) {
        await prisma.product.update({
          where: { id: existing.id },
          data: {
            name: row.name,
            description: row.description,
            brand: row.brand,
            ncm: row.ncm,
            gtin: row.gtin,
            weight: row.weight,
            height: row.height,
            width: row.width,
            length: row.length,
            images: images.length > 0 ? images : existing.images,
          },
        })
        result.updated++
      } else {
        const product = await prisma.product.create({
          data: {
            tenantId,
            sku: row.sku,
            name: row.name,
            description: row.description,
            brand: row.brand,
            ncm: row.ncm,
            gtin: row.gtin,
            weight: row.weight,
            height: row.height,
            width: row.width,
            length: row.length,
            images,
          },
        })

        // Seed stock if provided
        if (row.stock && row.stock > 0) {
          const warehouse = await prisma.warehouse.findFirst({ where: { tenantId } })
          if (warehouse) {
            await prisma.stockItem.create({
              data: {
                productId: product.id,
                warehouseId: warehouse.id,
                quantity: row.stock,
                reserved: 0,
              },
            })
          }
        }

        result.created++
      }
    } catch (err) {
      result.errors.push({ row: rowNum, sku: row.sku, reason: 'Erro interno ao salvar' })
    }
  }

  return result
}
