import type { SelectProps } from 'antd'

export interface InfiniteRefreshSelectProps<ValueType> extends Omit<
  SelectProps,
  'options' | 'loading'
> {
  fetchOptions: (
    page: number,
    pageSize: number,
    search?: string,
  ) => Promise<{ data: ValueType[]; total: number }>
  debounceTimeout?: number
  itemRender?: (option: ValueType) => React.ReactNode
  pageSize?: number
}
