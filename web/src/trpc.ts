import type { AppRouter } from '@quaketrack/server';
import { createTRPCReact } from '@trpc/react-query';
import type { inferRouterOutputs } from '@trpc/server';

export const trpc = createTRPCReact<AppRouter>();

// Handy inferred types for components.
export type RouterOutputs = inferRouterOutputs<AppRouter>;
export type Earthquake =
  RouterOutputs['earthquakes']['list']['earthquakes'][number];
export type EarthquakeDetail = RouterOutputs['earthquakes']['detail'];
