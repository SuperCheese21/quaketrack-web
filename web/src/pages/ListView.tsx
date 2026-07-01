import { keepPreviousData } from '@tanstack/react-query';
import { Loading } from 'stratosphere-ui';

import QuakeList from '../components/QuakeList';
import { RefreshIcon } from '../components/icons';
import { formatRelative } from '../lib/format';
import { useFilters } from '../lib/useFilters';
import { trpc } from '../trpc';

const ListView = () => {
  const { filters } = useFilters();
  const query = trpc.earthquakes.list.useQuery(filters, {
    placeholderData: keepPreviousData,
    refetchOnWindowFocus: false,
  });

  return (
    <div className="flex h-full flex-col">
      <div className="flex items-center justify-between gap-2 border-b border-base-300 bg-base-100 px-3 py-2">
        <div className="min-w-0">
          <h1 className="truncate text-sm font-semibold sm:text-base">
            {query.data
              ? `${query.data.metadata.count.toLocaleString()} earthquakes`
              : 'Earthquakes'}
          </h1>
          {query.data ? (
            <p className="text-xs text-base-content/60">
              Updated {formatRelative(query.data.metadata.generated)}
            </p>
          ) : null}
        </div>
        <button
          type="button"
          className="btn btn-circle btn-ghost btn-sm"
          onClick={() => void query.refetch()}
          disabled={query.isFetching}
          aria-label="Refresh"
        >
          <RefreshIcon
            width={20}
            height={20}
            className={query.isFetching ? 'animate-spin' : ''}
          />
        </button>
      </div>

      <div className="min-h-0 flex-1 overflow-y-auto">
        {query.isPending ? (
          <div className="flex h-full items-center justify-center">
            <Loading size="lg" />
          </div>
        ) : query.isError ? (
          <div className="alert alert-error m-4 w-auto">
            {query.error.message}
          </div>
        ) : (
          <QuakeList quakes={query.data.earthquakes} />
        )}
      </div>
    </div>
  );
};

export default ListView;
