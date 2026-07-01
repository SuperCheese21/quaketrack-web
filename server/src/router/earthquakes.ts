import { TRPCError } from '@trpc/server';
import { z } from 'zod';

import { publicProcedure, router } from '../trpc.js';
import {
  fetchEarthquakeDetail,
  fetchEarthquakes,
} from '../services/usgs.js';

const filtersSchema = z.object({
  minMagnitude: z.number().min(0).max(10),
  limit: z.number().int().positive().max(20000),
  dateEnabled: z.boolean(),
  startTime: z.string().nullish(),
  endTime: z.string().nullish(),
  orderBy: z.enum(['time', 'time-asc', 'magnitude', 'magnitude-asc']),
});

export const earthquakesRouter = router({
  list: publicProcedure.input(filtersSchema).query(async ({ input }) => {
    try {
      return await fetchEarthquakes(input);
    } catch (err) {
      throw new TRPCError({
        code: 'BAD_GATEWAY',
        message: 'Unable to fetch earthquake data from USGS',
        cause: err,
      });
    }
  }),

  detail: publicProcedure
    .input(z.object({ id: z.string().min(1) }))
    .query(async ({ input }) => {
      try {
        return await fetchEarthquakeDetail(input.id);
      } catch (err) {
        throw new TRPCError({
          code: 'BAD_GATEWAY',
          message: 'Unable to fetch earthquake details from USGS',
          cause: err,
        });
      }
    }),
});
