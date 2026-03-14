"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { useForm, useFieldArray, Controller } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import {
  CreateQueueSchema,
  type CreateQueueInput,
} from "@/lib/validations/queue";

const STEPS = [
  "Basic Info",
  "Streams & Counters",
  "Customer Options",
  "QR Settings",
  "Review",
];

const TIMEZONES = [
  "Asia/Ho_Chi_Minh",
  "Asia/Bangkok",
  "Asia/Singapore",
  "Asia/Tokyo",
  "America/New_York",
  "Europe/London",
  "UTC",
];

const DAYS = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];

export default function QueueWizard() {
  const router = useRouter();
  const [step, setStep] = useState(0);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const {
    register,
    control,
    handleSubmit,
    watch,
    formState: { errors },
  } = useForm<CreateQueueInput>({
    resolver: zodResolver(CreateQueueSchema),
    defaultValues: {
      name: "",
      timezone: "Asia/Ho_Chi_Minh",
      qrRotationType: "FIXED",
      requireCustomerInfo: false,
      allowTransfer: false,
      streams: [
        {
          name: "Main",
          ticketPrefix: "A",
          avgProcessingSeconds: 300,
          counters: [{ name: "Counter 1" }],
        },
      ],
      customFields: [],
    },
  });

  const {
    fields: streamFields,
    append: appendStream,
    remove: removeStream,
  } = useFieldArray({ control, name: "streams" });

  const onSubmit = async (data: CreateQueueInput) => {
    setSubmitting(true);
    setError(null);

    const res = await fetch("/api/queues", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(data),
    });

    if (res.ok) {
      const { queue } = await res.json();
      router.push(`/dashboard/queues/${queue.id}`);
    } else {
      const body = await res.json();
      setError(JSON.stringify(body.error));
      setSubmitting(false);
    }
  };

  const requireCustomerInfo = watch("requireCustomerInfo");

  return (
    <div className="max-w-2xl">
      {/* Step indicator */}
      <div className="flex items-center gap-1 mb-8 overflow-x-auto pb-2">
        {STEPS.map((s, i) => (
          <div key={s} className="flex items-center gap-1 shrink-0">
            <button
              type="button"
              onClick={() => i < step && setStep(i)}
              className={`px-3 py-1.5 rounded-full text-xs font-medium transition-colors ${
                i === step
                  ? "bg-blue-600 text-white"
                  : i < step
                  ? "bg-blue-100 text-blue-700 cursor-pointer"
                  : "bg-gray-100 text-gray-500"
              }`}
            >
              {i + 1}. {s}
            </button>
            {i < STEPS.length - 1 && (
              <div
                className={`h-px w-4 ${i < step ? "bg-blue-300" : "bg-gray-200"}`}
              />
            )}
          </div>
        ))}
      </div>

      <form onSubmit={handleSubmit(onSubmit)}>
        {/* Step 0: Basic Info */}
        {step === 0 && (
          <div className="bg-white rounded-2xl border border-gray-100 p-6 space-y-4">
            <h2 className="text-lg font-semibold">Basic Information</h2>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Queue Name *
              </label>
              <input
                {...register("name")}
                className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500"
                placeholder="e.g. Bank Branch A"
              />
              {errors.name && (
                <p className="text-sm text-red-600 mt-1">{errors.name.message}</p>
              )}
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Welcome Message
              </label>
              <input
                {...register("greeting")}
                className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500"
                placeholder="e.g. Welcome! We'll serve you shortly."
              />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Start Date & Time *
                </label>
                <input
                  type="datetime-local"
                  {...register("startAt")}
                  className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  End Date & Time *
                </label>
                <input
                  type="datetime-local"
                  {...register("endAt")}
                  className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Timezone *
              </label>
              <select
                {...register("timezone")}
                className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                {TIMEZONES.map((tz) => (
                  <option key={tz} value={tz}>
                    {tz}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Redirect URL (optional)
              </label>
              <input
                {...register("redirectUrl")}
                type="url"
                className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500"
                placeholder="https://... Opens after customer joins"
              />
            </div>
          </div>
        )}

        {/* Step 1: Streams & Counters */}
        {step === 1 && (
          <div className="space-y-4">
            {streamFields.map((streamField, si) => (
              <StreamEditor
                key={streamField.id}
                streamIndex={si}
                register={register}
                control={control}
                errors={errors}
                onRemove={() => removeStream(si)}
                canRemove={streamFields.length > 1}
              />
            ))}

            <button
              type="button"
              onClick={() =>
                appendStream({
                  name: `Stream ${streamFields.length + 1}`,
                  ticketPrefix: String.fromCharCode(65 + streamFields.length),
                  avgProcessingSeconds: 300,
                  counters: [{ name: "Counter 1" }],
                })
              }
              className="w-full py-3 border-2 border-dashed border-gray-300 text-gray-600 rounded-xl hover:border-blue-400 hover:text-blue-600 font-medium"
            >
              + Add Stream
            </button>
          </div>
        )}

        {/* Step 2: Customer Options */}
        {step === 2 && (
          <div className="bg-white rounded-2xl border border-gray-100 p-6 space-y-4">
            <h2 className="text-lg font-semibold">Customer Options</h2>

            <label className="flex items-center gap-3 p-4 border border-gray-200 rounded-xl cursor-pointer hover:bg-gray-50">
              <input
                type="checkbox"
                {...register("requireCustomerInfo")}
                className="w-5 h-5 rounded text-blue-600"
              />
              <div>
                <p className="font-medium text-gray-900">Collect customer info</p>
                <p className="text-sm text-gray-500">
                  Ask customers to fill in a form before joining
                </p>
              </div>
            </label>

            {requireCustomerInfo && (
              <CustomFieldsEditor control={control} />
            )}

            <label className="flex items-center gap-3 p-4 border border-gray-200 rounded-xl cursor-pointer hover:bg-gray-50">
              <input
                type="checkbox"
                {...register("allowTransfer")}
                className="w-5 h-5 rounded text-blue-600"
              />
              <div>
                <p className="font-medium text-gray-900">Allow queue transfer</p>
                <p className="text-sm text-gray-500">
                  Customers can be moved to another queue
                </p>
              </div>
            </label>
          </div>
        )}

        {/* Step 3: QR Settings */}
        {step === 3 && (
          <div className="bg-white rounded-2xl border border-gray-100 p-6 space-y-4">
            <h2 className="text-lg font-semibold">QR Code Settings</h2>

            <div className="space-y-3">
              <Controller
                control={control}
                name="qrRotationType"
                render={({ field }) => (
                  <>
                    <label
                      className={`flex items-start gap-3 p-4 border-2 rounded-xl cursor-pointer transition-colors ${
                        field.value === "FIXED"
                          ? "border-blue-600 bg-blue-50"
                          : "border-gray-200 hover:border-gray-300"
                      }`}
                    >
                      <input
                        type="radio"
                        value="FIXED"
                        checked={field.value === "FIXED"}
                        onChange={() => field.onChange("FIXED")}
                        className="mt-0.5"
                      />
                      <div>
                        <p className="font-medium text-gray-900">Fixed QR Code</p>
                        <p className="text-sm text-gray-500">
                          Same QR code forever. Easy to print and post.
                        </p>
                      </div>
                    </label>
                    <label
                      className={`flex items-start gap-3 p-4 border-2 rounded-xl cursor-pointer transition-colors ${
                        field.value === "DAILY"
                          ? "border-blue-600 bg-blue-50"
                          : "border-gray-200 hover:border-gray-300"
                      }`}
                    >
                      <input
                        type="radio"
                        value="DAILY"
                        checked={field.value === "DAILY"}
                        onChange={() => field.onChange("DAILY")}
                        className="mt-0.5"
                      />
                      <div>
                        <p className="font-medium text-gray-900">
                          Daily Rotating QR Code
                        </p>
                        <p className="text-sm text-gray-500">
                          QR code changes each day. More secure.
                        </p>
                      </div>
                    </label>
                  </>
                )}
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Google AdSense Slot ID (optional)
              </label>
              <input
                {...register("adBannerSlotId")}
                className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500"
                placeholder="e.g. 1234567890"
              />
              <p className="text-xs text-gray-400 mt-1">
                Shown as an ad banner on the customer queue page
              </p>
            </div>
          </div>
        )}

        {/* Step 4: Review */}
        {step === 4 && (
          <div className="bg-white rounded-2xl border border-gray-100 p-6">
            <h2 className="text-lg font-semibold mb-4">Ready to create</h2>
            <p className="text-gray-500 text-sm">
              Review your settings and click Create Queue to finish.
            </p>
            {error && (
              <div className="mt-4 p-3 bg-red-50 border border-red-200 rounded-xl text-sm text-red-700">
                {error}
              </div>
            )}
          </div>
        )}

        {/* Navigation */}
        <div className="flex gap-3 mt-6">
          {step > 0 && (
            <button
              type="button"
              onClick={() => setStep(step - 1)}
              className="flex-1 py-3 border border-gray-300 text-gray-700 font-medium rounded-xl hover:bg-gray-50"
            >
              Back
            </button>
          )}
          {step < STEPS.length - 1 ? (
            <button
              type="button"
              onClick={() => setStep(step + 1)}
              className="flex-1 py-3 bg-blue-600 text-white font-semibold rounded-xl hover:bg-blue-700"
            >
              Next →
            </button>
          ) : (
            <button
              type="submit"
              disabled={submitting}
              className="flex-1 py-3 bg-blue-600 text-white font-semibold rounded-xl hover:bg-blue-700 disabled:opacity-50"
            >
              {submitting ? "Creating..." : "Create Queue"}
            </button>
          )}
        </div>
      </form>
    </div>
  );
}

// Sub-components

function StreamEditor({
  streamIndex: si,
  register,
  control,
  errors,
  onRemove,
  canRemove,
}: {
  streamIndex: number;
  register: ReturnType<typeof useForm<CreateQueueInput>>["register"];
  control: ReturnType<typeof useForm<CreateQueueInput>>["control"];
  errors: ReturnType<typeof useForm<CreateQueueInput>>["formState"]["errors"];
  onRemove: () => void;
  canRemove: boolean;
}) {
  const {
    fields: counterFields,
    append: appendCounter,
    remove: removeCounter,
  } = useFieldArray({ control, name: `streams.${si}.counters` });

  return (
    <div className="bg-white rounded-2xl border border-gray-100 p-5">
      <div className="flex items-center justify-between mb-4">
        <h3 className="font-semibold text-gray-900">Stream {si + 1}</h3>
        {canRemove && (
          <button
            type="button"
            onClick={onRemove}
            className="text-red-500 hover:text-red-700 text-sm"
          >
            Remove
          </button>
        )}
      </div>

      <div className="grid grid-cols-2 gap-3 mb-4">
        <div>
          <label className="block text-xs font-medium text-gray-600 mb-1">
            Stream Name *
          </label>
          <input
            {...register(`streams.${si}.name`)}
            className="w-full px-3 py-2.5 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
            placeholder="e.g. Deposits"
          />
          {errors.streams?.[si]?.name && (
            <p className="text-xs text-red-600 mt-1">
              {errors.streams[si]?.name?.message}
            </p>
          )}
        </div>
        <div>
          <label className="block text-xs font-medium text-gray-600 mb-1">
            Ticket Prefix
          </label>
          <input
            {...register(`streams.${si}.ticketPrefix`)}
            maxLength={3}
            className="w-full px-3 py-2.5 border border-gray-200 rounded-xl text-sm font-mono focus:outline-none focus:ring-2 focus:ring-blue-500"
            placeholder="A"
          />
        </div>
      </div>

      <div className="mb-4">
        <label className="block text-xs font-medium text-gray-600 mb-1">
          Avg. processing time (seconds)
        </label>
        <input
          type="number"
          {...register(`streams.${si}.avgProcessingSeconds`, {
            valueAsNumber: true,
          })}
          className="w-full px-3 py-2.5 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
          placeholder="300"
        />
      </div>

      <div>
        <div className="flex items-center justify-between mb-2">
          <label className="text-xs font-medium text-gray-600">Counters</label>
        </div>
        <div className="space-y-2">
          {counterFields.map((cf, ci) => (
            <div key={cf.id} className="flex gap-2">
              <input
                {...register(`streams.${si}.counters.${ci}.name`)}
                className="flex-1 px-3 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                placeholder={`Counter ${ci + 1}`}
              />
              {counterFields.length > 1 && (
                <button
                  type="button"
                  onClick={() => removeCounter(ci)}
                  className="px-2 text-gray-400 hover:text-red-500"
                >
                  ×
                </button>
              )}
            </div>
          ))}
        </div>
        <button
          type="button"
          onClick={() => appendCounter({ name: `Counter ${counterFields.length + 1}` })}
          className="mt-2 text-xs text-blue-600 hover:text-blue-700 font-medium"
        >
          + Add counter
        </button>
      </div>
    </div>
  );
}

function CustomFieldsEditor({
  control,
}: {
  control: ReturnType<typeof useForm<CreateQueueInput>>["control"];
}) {
  const { fields, append, remove } = useFieldArray({
    control,
    name: "customFields",
  });

  return (
    <div className="border border-gray-200 rounded-xl p-4 space-y-3">
      <div className="flex items-center justify-between">
        <p className="text-sm font-medium text-gray-700">Custom fields</p>
        <button
          type="button"
          onClick={() =>
            append({ name: `field${fields.length}`, label: "", type: "text", required: false })
          }
          className="text-xs text-blue-600 hover:text-blue-700 font-medium"
        >
          + Add field
        </button>
      </div>

      {fields.map((f, i) => (
        <div key={f.id} className="flex gap-2 items-start">
          <div className="flex-1 grid grid-cols-2 gap-2">
            <Controller
              control={control}
              name={`customFields.${i}.label`}
              render={({ field }) => (
                <input
                  {...field}
                  placeholder="Label"
                  className="px-3 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              )}
            />
            <Controller
              control={control}
              name={`customFields.${i}.type`}
              render={({ field }) => (
                <select
                  {...field}
                  className="px-3 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                >
                  <option value="text">Text</option>
                  <option value="number">Number</option>
                  <option value="phone">Phone</option>
                  <option value="email">Email</option>
                  <option value="select">Select</option>
                </select>
              )}
            />
          </div>
          <button
            type="button"
            onClick={() => remove(i)}
            className="mt-2 text-gray-400 hover:text-red-500 text-lg"
          >
            ×
          </button>
        </div>
      ))}

      {fields.length === 0 && (
        <p className="text-sm text-gray-400 text-center py-2">
          No custom fields yet
        </p>
      )}
    </div>
  );
}

// DAYS is declared at module level above
void DAYS;
