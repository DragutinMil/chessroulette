import z from 'zod';

export type EngineData = {
  bestMove: string;
  line: {
    depth: number;
    score: {
      unit: string; // 'cp' | 'mate'
      value: number;
    };
    pv?: string;
    evaluation: {
      heightsPct: {
        w: number;
        b: number;
      };
      evalAsStr: string;
    };
  };
};

export const engineLineSchema = z.object({
  depth: z.number(),
  pv: z.string().optional(),
  score: z.object({
    // unit: z.literal('cp'),
    unit: z.string(),
    value: z.number(),
  }),
});

export type EngineLine = z.TypeOf<typeof engineLineSchema>;

export const engineResult = z.object({
  bestmove: z.string(),
  info: z.array(engineLineSchema.or(z.object({ string: z.string() }))),
});

export type EngineResult = z.TypeOf<typeof engineResult>;