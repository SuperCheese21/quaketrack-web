import type { Earthquake } from '../trpc';
import QuakeCard from './QuakeCard';

const QuakeList = ({ quakes }: { quakes: Earthquake[] }) => {
  if (quakes.length === 0) {
    return (
      <p className="p-8 text-center text-base-content/60">
        No earthquakes match your filters.
      </p>
    );
  }
  return (
    <div className="mx-auto flex w-full max-w-3xl flex-col gap-1.5 p-2 sm:p-3">
      {quakes.map((quake) => (
        <QuakeCard key={quake.id} quake={quake} />
      ))}
    </div>
  );
};

export default QuakeList;
