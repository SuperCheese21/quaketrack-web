import type { ReactNode } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { Loading } from 'stratosphere-ui';

import ShakeMap from '../components/ShakeMap';
import { BackIcon } from '../components/icons';
import { formatRGBA, magnitudeColorRGB } from '../lib/colorUtil';
import { formatMagnitude, formatTime } from '../lib/format';
import { trpc } from '../trpc';

const StatBox = ({ label, value }: { label: string; value: ReactNode }) => (
  <div className="rounded-lg bg-base-100/70 p-2 text-center">
    <div className="text-xs uppercase tracking-wide opacity-60">{label}</div>
    <div className="font-semibold">{value}</div>
  </div>
);

const QuakeDetail = () => {
  const { id = '' } = useParams();
  const navigate = useNavigate();
  const query = trpc.earthquakes.detail.useQuery(
    { id },
    { enabled: id.length > 0 },
  );

  if (query.isPending) {
    return (
      <div className="flex h-full items-center justify-center">
        <Loading size="lg" />
      </div>
    );
  }

  if (query.isError) {
    return (
      <div className="p-4">
        <div className="alert alert-error">{query.error.message}</div>
      </div>
    );
  }

  const { earthquake, contours } = query.data;
  const background = formatRGBA(magnitudeColorRGB(earthquake.mag), 0.4);

  return (
    <div className="flex h-full flex-col" style={{ backgroundColor: background }}>
      <div className="flex items-center gap-2 px-2 py-2">
        <button
          type="button"
          className="btn btn-circle btn-ghost btn-sm"
          onClick={() => navigate(-1)}
          aria-label="Back"
        >
          <BackIcon width={20} height={20} />
        </button>
      </div>

      <div className="mx-auto flex w-full max-w-3xl min-h-0 flex-1 flex-col gap-3 overflow-y-auto px-4 pb-6">
        <div className="text-center">
          <h1 className="text-4xl font-bold text-black">
            M {formatMagnitude(earthquake.mag, 2)}
          </h1>
          <a
            href={earthquake.url}
            target="_blank"
            rel="noreferrer"
            className="link text-blue-800"
          >
            {earthquake.place}
          </a>
        </div>

        <div className="grid grid-cols-2 gap-2 sm:grid-cols-4">
          <StatBox label="Depth" value={`${earthquake.depth} km`} />
          <StatBox label="Felt" value={earthquake.felt ?? 'N/A'} />
          <StatBox label="Significance" value={earthquake.sig} />
          <StatBox label="Tsunami" value={earthquake.tsunami ? 'Yes' : 'No'} />
        </div>

        <div className="text-sm text-black">
          <p>Occurred {formatTime(earthquake.time)}</p>
          <p>Updated {formatTime(earthquake.updated)}</p>
        </div>

        <div className="min-h-[300px] flex-1 overflow-hidden rounded-lg border border-black/10">
          <ShakeMap detail={query.data} />
        </div>
        {contours.length === 0 ? (
          <p className="text-center text-xs text-black/60">
            No ShakeMap intensity data available for this event.
          </p>
        ) : null}
      </div>
    </div>
  );
};

export default QuakeDetail;
