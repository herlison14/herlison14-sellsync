import {
  Package, X, TrendingDown, AlertTriangle,
  RefreshCw, FileText, RotateCcw, Info,
} from 'lucide-react'
import type { ElementType } from 'react'

export const TYPE_ICON: Record<string, ElementType> = {
  NEW_ORDER:          Package,
  ORDER_CANCELLED:    X,
  LOW_STOCK:          TrendingDown,
  STOCK_OUT:          AlertTriangle,
  PRICE_CHANGED:      RefreshCw,
  NF_E_ISSUED:        FileText,
  NF_E_ERROR:         AlertTriangle,
  RETURN_REQUESTED:   RotateCcw,
  INTEGRATION_ERROR:  AlertTriangle,
  SYSTEM:             Info,
}

export const TYPE_COLOR: Record<string, string> = {
  NEW_ORDER:         'text-blue-600 bg-blue-50',
  ORDER_CANCELLED:   'text-red-600 bg-red-50',
  LOW_STOCK:         'text-amber-600 bg-amber-50',
  STOCK_OUT:         'text-red-700 bg-red-100',
  PRICE_CHANGED:     'text-emerald-600 bg-emerald-50',
  NF_E_ISSUED:       'text-blue-600 bg-blue-50',
  NF_E_ERROR:        'text-red-600 bg-red-50',
  RETURN_REQUESTED:  'text-orange-600 bg-orange-50',
  INTEGRATION_ERROR: 'text-red-600 bg-red-50',
  SYSTEM:            'text-muted-foreground bg-muted',
}

export const ORDER_STATUS_COLOR: Record<string, string> = {
  PENDING:    'bg-amber-50 text-amber-700 border-amber-200',
  CONFIRMED:  'bg-blue-50 text-blue-700 border-blue-200',
  INVOICED:   'bg-purple-50 text-purple-700 border-purple-200',
  SHIPPED:    'bg-indigo-50 text-indigo-700 border-indigo-200',
  DELIVERED:  'bg-emerald-50 text-emerald-700 border-emerald-200',
  CANCELLED:  'bg-red-50 text-red-700 border-red-200',
  RETURNED:   'bg-orange-50 text-orange-700 border-orange-200',
}

export const ORDER_STATUS_LABEL: Record<string, string> = {
  PENDING:   'Pendente',
  CONFIRMED: 'Confirmado',
  INVOICED:  'Faturado',
  SHIPPED:   'Enviado',
  DELIVERED: 'Entregue',
  CANCELLED: 'Cancelado',
  RETURNED:  'Devolvido',
}
