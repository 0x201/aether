import React, { useState, useMemo, useRef, useCallback, useEffect } from 'react';
import {
  Select,
  Spin,
} from 'antd';
import { debounce } from 'lodash';
import type { InfiniteRefreshSelectProps } from './type';


type BaseOptionType = {
  key?: string | number;
  label: React.ReactNode;
  value: string | number;
}

const InfiniteRefreshSelect = <
  ValueType extends BaseOptionType = BaseOptionType,
>({
  fetchOptions,
  debounceTimeout = 300,
  itemRender,
  pageSize = 20,
  ...props
}: InfiniteRefreshSelectProps<ValueType>) => {
  const [fetching, setFetching] = useState(false);
  const [options, setOptions] = useState<ValueType[]>([]);
  const [hasMore, setHasMore] = useState(true);
  const [page, setPage] = useState(1);
  const [searchTerm, setSearchTerm] = useState('');

  const fetchRef = useRef(0);
  const loadingRef = useRef(false);

  const resetPagination = useCallback((search: string) => {
    setSearchTerm(search);
    setPage(1);
    setOptions([]);
    setHasMore(true);
  }, []);

  const loadOptions = useCallback(
    async (pageNum: number, search: string) => {
      if (loadingRef.current) return;

      const currentFetchId = ++fetchRef.current;
      loadingRef.current = true;
      setFetching(true);

      try {
        const { data, total } = await fetchOptions(pageNum, pageSize, search);
        if (currentFetchId === fetchRef.current) {
          setOptions(prev => {
            const next = pageNum === 1 ? data : [...prev, ...data];
            setHasMore(next.length < total);
            return next;
          });
        }
      } catch (error) {
        console.error('Failed to fetch options:', error);
      } finally {
        if (currentFetchId === fetchRef.current) {
          setFetching(false);
          loadingRef.current = false;
        }
      }
    }, [fetchOptions, pageSize]);

  const debouncedSearch = useMemo(
    () =>
      debounce((search: string) => {
        loadOptions(1, search);
      }, debounceTimeout),
    [loadOptions, debounceTimeout],
  );

  useEffect(() => {
    return () => {
      debouncedSearch.cancel();
    };
  }, [debouncedSearch]);

  const handleSearch = useCallback(
    (value: string) => {
      debouncedSearch.cancel();
      resetPagination(value);
      debouncedSearch(value);
    },
    [debouncedSearch, resetPagination],
  );

  const handlePopupScroll = useCallback(
    (e: React.UIEvent<HTMLDivElement>) => {
      const { target } = e;
      if (!(target instanceof HTMLDivElement)) return;

      const { scrollTop, clientHeight, scrollHeight } = target;
      if (
        scrollHeight - scrollTop <= clientHeight + 10 &&
        !loadingRef.current &&
        hasMore
      ) {
        setPage((prev) => prev + 1);
      }
    },
    [hasMore],
  );

  useEffect(() => {
    if (loadingRef.current) return;

    if (page === 1 && options.length === 0) {
      loadOptions(1, searchTerm);
    } else if (page > 1 && hasMore) {
      loadOptions(page, searchTerm);
    }
  }, [page, searchTerm, hasMore, options.length, loadOptions]);

  const selectOptions = useMemo(
    () =>
      options.map((opt) => ({
        ...opt,
        label: itemRender ? itemRender(opt) : opt.label,
      })),
    [options, itemRender],
  );

  const popupRender = useCallback(
    (menu: React.ReactElement) => (
      <>
        {menu}
        {fetching && page > 1 && (
          <div style={{ padding: 8, textAlign: 'center' }}>
            <Spin size="small" />
          </div>
        )}
      </>
    ),
    [fetching, page],
  );

  return (
    <Select
      labelInValue
      showSearch={{
        filterOption: false,
        onSearch: handleSearch
      }}
      onPopupScroll={handlePopupScroll}
      notFoundContent={
        fetching && page === 1 ? <Spin size="small" /> : 'No results found'
      }
      loading={fetching && page === 1}
      popupRender={popupRender}
      options={selectOptions}
      {...props}
    >
    </Select>
  );
};

export default InfiniteRefreshSelect;
