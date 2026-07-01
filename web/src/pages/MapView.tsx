import { keepPreviousData } from '@tanstack/react-query';
import { Loading } from 'stratosphere-ui';

import QuakeMap from '../components/QuakeMap';
import { useFilters } from '../lib/useFilters';
import { trpc } from '../trpc';

const MapView = () => {
  const { filters } = useFilters();
  const query = trpc.earthquakes.list.useQuery(filters, {
    placeholderData: keepPreviousData,
    refetchOnWindowFocus: false,
  });

  return (
    <div className="relative h-full w-full">
      {query.data ? (
        <QuakeMap quakes={query.data.earthquakes} />
      ) : (
        <div className="flex h-full items-center justify-center">
          <Loading size="lg" />
        </div>
      )}
      {query.isError ? (
        <div className="absolute left-1/2 top-4 z-[1000] w-auto -translate-x-1/2">
          <div className="alert alert-error">{query.error.message}</div>
        </div>
      ) : null}
    </div>
  );
};

export default MapView;
