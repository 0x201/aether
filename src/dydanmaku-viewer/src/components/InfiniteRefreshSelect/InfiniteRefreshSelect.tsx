import React, { useState, useMemo, useRef, useCallback } from 'react';
import {
  Select,
  Spin,
} from 'antd';
import { debounce } from 'lodash';
import type { InfiniteRefreshSelectProps } from './type';


const InfiniteRefreshSelect = <
  ValueType extends {
    key?: string | number;
    label: React.ReactNode;
    value: string | number;
  } = any,
>({
  fetchOptions,
  debounceTimeout = 300,
  optionRender,
  pageSize = 20,
  ...props
}: InfiniteRefreshSelectProps<ValueType>) => {
  const [fetching, setFetching] = useState(false);
  const [options, setOptions] = useState<ValueType[]>([]);
  const [hasMore, setHasMore] = useState(true);
  const [page, setPage] = useState(1);
  const [searchTerm, setSearchTerm] = useState('');
  const fetchRef = useRef(0);

  // Reset pagination when search term changes
  const resetPagination = useCallback((search: string) => {
    setSearchTerm(search);
    setPage(1);
    setOptions([]);
    setHasMore(true);
  }, []);

  // Handle scroll to load more options
  const handlePopupScroll = useCallback((e: React.UIEvent<HTMLDivElement>) => {
    const { target } = e;
    if (target instanceof HTMLDivElement) {
      // Check if we've scrolled near the bottom
      const { scrollTop, clientHeight, scrollHeight } = target;
      if (scrollHeight - scrollTop <= clientHeight + 10 && !fetching && hasMore) {
        setPage(prev => prev + 1); // Load next page
      }
    }
  }, [fetching, hasMore]);

  // Memoize the fetcher with debounce
  const debouncedFetcher = useMemo(() => {
    const loadOptions = (pageNum: number, value: string) => {
      fetchRef.current += 1;
      const fetchId = fetchRef.current;
      setFetching(true);

      fetchOptions(pageNum, pageSize, value).then(({ data, total }) => {
        if (fetchId !== fetchRef.current) {
          // for fetch callback order
          return;
        }

        // Append new options to existing options when loading more pages
        if (pageNum === 1) {
          setOptions(data);
        } else {
          setOptions(prev => [...prev, ...data]);
        }

        // Check if we have loaded all data
        setHasMore(options.length + data.length < total);
        setFetching(false);
      }).catch(() => {
        if (fetchId === fetchRef.current) {
          setFetching(false);
        }
      });
    };

    return {
      debouncedLoad: debounce((pageNum: number, value: string) => {
        loadOptions(pageNum, value);
      }, debounceTimeout),
      load: (value: string, pageNum: number) => {
        loadOptions(pageNum, value);
      }
    };
  }, [fetchOptions, debounceTimeout, pageSize, options.length]);

  // Handle search input
  const handleSearch = useCallback((value: string) => {
    if (searchTerm !== value) {
      resetPagination(value);
      debouncedFetcher.debouncedLoad(1, value);
    } else if (value === searchTerm && page > 1 && hasMore) {
      // If we're loading more pages for the same search term
      debouncedFetcher.debouncedLoad(page, value);
    }
  }, [searchTerm, resetPagination, debouncedFetcher, page, hasMore]);

  // Effect to trigger loading when page changes
  useMemo(() => {
    if (searchTerm && page > 1 && hasMore) {
      debouncedFetcher.load(searchTerm, page);
    }
  }, [searchTerm, page, hasMore, debouncedFetcher]);

  React.useEffect(() => {
    return () => {
      debouncedFetcher.debouncedLoad.cancel?.();
    };
  }, [debouncedFetcher]);

  return (
    <Select
      labelInValue
      showSearch={{
        filterOption: false,
        onSearch: handleSearch,
      }}
      onPopupScroll={handlePopupScroll}
      notFoundContent={fetching && page === 1 ? <Spin size="small" /> : "No results found"}
      {...props}
      options={options}
      optionRender={optionRender}
      loading={fetching && page === 1}
    />
  );
};

export default InfiniteRefreshSelect;