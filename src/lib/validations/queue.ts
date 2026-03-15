import { z } from "zod";

export const DayScheduleSchema = z.object({
  dayOfWeek: z.number().min(0).max(6),
  openTime: z.string().regex(/^\d{2}:\d{2}$/),
  closeTime: z.string().regex(/^\d{2}:\d{2}$/),
  isOpen: z.boolean(),
});

export const CustomFieldSchema = z.object({
  name: z.string().min(1),
  label: z.string().min(1),
  type: z.enum(["text", "number", "select", "phone", "email"]),
  required: z.boolean().default(false),
  options: z.array(z.string()).optional(), // for select type
  streamCondition: z.string().optional(), // streamId to route to based on value
});

export const CounterInputSchema = z.object({
  name: z.string().min(1, "Counter name required"),
  schedule: z.array(DayScheduleSchema).optional(),
});

export const StreamInputSchema = z.object({
  name: z.string().min(1, "Stream name required"),
  ticketPrefix: z
    .string()
    .max(3)
    .optional()
    .transform((v) => v || undefined),
  avgProcessingSeconds: z.number().min(30).max(3600).default(300),
  counters: z.array(CounterInputSchema).min(1, "At least one counter required"),
});

const CollectModeSchema = z.enum(["HIDDEN", "OPTIONAL", "REQUIRED"]);

export const CreateQueueSchema = z.object({
  name: z.string().min(1, "Queue name required").max(100),
  logoUrl: z.string().url().optional().or(z.literal("")),
  startAt: z.string().datetime(),
  endAt: z.string().datetime(),
  timezone: z.string().min(1, "Timezone required"),
  qrRotationType: z.enum(["FIXED", "DAILY"]).default("FIXED"),
  streams: z.array(StreamInputSchema).min(1, "At least one stream required"),
  requireCustomerInfo: z.boolean().default(false),
  collectName: CollectModeSchema.default("HIDDEN"),
  collectPhone: CollectModeSchema.default("HIDDEN"),
  collectEmail: CollectModeSchema.default("HIDDEN"),
  customFields: z.array(CustomFieldSchema).optional(),
  redirectUrl: z.string().url().optional().or(z.literal("")),
  allowTransfer: z.boolean().default(false),
  transferQueueId: z.string().optional(),
  greeting: z.string().max(500).optional(),
});

export const UpdateQueueSchema = CreateQueueSchema.partial();

export type CreateQueueInput = z.infer<typeof CreateQueueSchema>;
export type UpdateQueueInput = z.infer<typeof UpdateQueueSchema>;
export type StreamInput = z.infer<typeof StreamInputSchema>;
export type CounterInput = z.infer<typeof CounterInputSchema>;
export type CustomField = z.infer<typeof CustomFieldSchema>;
export type CollectMode = "HIDDEN" | "OPTIONAL" | "REQUIRED";
