import type { SorterResult, SortOrder } from 'antd/es/table/interface'

export function buildSorter<T>(sorter: SorterResult<T> | SorterResult<T>[]): string {
  if (!Array.isArray(sorter)) {
    if (!sorter.order && !sorter.field) {
      return ''
    }
    const order = (originalOrder: SortOrder | undefined) => {
      return originalOrder === 'ascend' ? 'asc' : 'desc'
    }
    return `${sorter.field} ${order(sorter.order)}`
  }

  if (sorter.length === 0) {
    return ''
  }

  const ascFields: string[] = []
  const descFields: string[] = []

  for (const s of sorter) {
    if (s.order === 'ascend') {
      ascFields.push(s.field as string)
    } else if (s.order === 'descend') {
      descFields.push(s.field as string)
    }
  }

  const resultParts: string[] = []

  if (descFields.length > 0) {
    resultParts.push(`${descFields.join(', ')} desc`)
  }

  if (ascFields.length > 0) {
    resultParts.push(`${ascFields.join(', ')} asc`)
  }

  return resultParts.join(', ')
}
