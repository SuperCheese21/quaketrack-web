import { useNavigate } from 'react-router-dom';

import { formatRGB, magnitudeColorRGB } from '../lib/colorUtil';
import { formatMagnitude, formatTime } from '../lib/format';
import type { Earthquake } from '../trpc';
import { ChevronRightIcon, ClockIcon, LocationIcon } from './icons';

// Web port of src/components/QuakesListItem.js — a magnitude-colored row.
const QuakeCard = ({ quake }: { quake: Earthquake }) => {
  const navigate = useNavigate();
  const background = formatRGB(magnitudeColorRGB(quake.mag));

  return (
    <button
      type="button"
      onClick={() => navigate(`/quake/${encodeURIComponent(quake.id)}`)}
      className="flex w-full items-stretch gap-2 rounded-lg p-2 text-left shadow-sm transition active:scale-[0.99] hover:shadow-md"
      style={{ backgroundColor: background }}
    >
      <div className="flex w-14 shrink-0 items-center justify-center">
        <span className="text-3xl font-bold text-white drop-shadow">
          {formatMagnitude(quake.mag, 1)}
        </span>
      </div>

      <div className="flex min-w-0 flex-1 flex-col justify-center gap-1 text-black">
        <div className="flex items-center gap-1">
          <LocationIcon width={18} height={18} className="shrink-0" />
          <span className="truncate font-semibold">{quake.place}</span>
        </div>
        <div className="flex items-center gap-1 text-sm">
          <ClockIcon width={16} height={16} className="shrink-0" />
          <span>{formatTime(quake.time)}</span>
        </div>
      </div>

      <div className="flex items-center text-white/90">
        <ChevronRightIcon width={26} height={26} />
      </div>
    </button>
  );
};

export default QuakeCard;
