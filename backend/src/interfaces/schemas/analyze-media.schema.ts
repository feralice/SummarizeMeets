import { z } from 'zod';

export const MeetingAnalysisSchema = z.object({
  summary: z.object({
    introduction: z.string().min(20),
    key_points: z.array(z.string()).min(5),
    conclusion: z.string().min(10),
  }),
  topics: z
    .array(
      z.object({
        title: z.string().min(5),
        description: z.string().min(20),
      })
    )
    .min(3),
  decisions: z.array(z.string()),
  action_items: z
    .array(
      z
        .object({
          task: z.string().min(12),
          responsible: z.string().nullable(),
          deadline: z
            .string()
            .regex(/^\d{4}-\d{2}-\d{2}$/)
            .nullable(),
          needs_review: z.boolean(),
        })
        .refine(
          (item) => item.needs_review || (item.responsible !== null && item.deadline !== null),
          {
            message: 'needs_review must be true if responsible or deadline is missing',
          }
        )
    )
    .min(1),
  speakers: z.array(
    z.object({
      speaker: z.string(),
      description: z.string().min(10),
    })
  ),
});
