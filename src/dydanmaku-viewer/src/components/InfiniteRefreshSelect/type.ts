import type { SelectProps } from "antd";

export interface InfiniteRefreshSelectProps<ValueType = any>
    extends Omit<SelectProps<ValueType | ValueType[]>, 'options' | 'children'> {
    fetchOptions: (page: number, pageSize: number, search: string) => Promise<{ data: ValueType[], total: number }>;
    debounceTimeout?: number;
    optionRender?: (option: any) => React.ReactNode;
    pageSize?: number;
}