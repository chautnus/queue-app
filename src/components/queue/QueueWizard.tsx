"use client";

import { useState, useRef } from "react";
import { useRouter } from "next/navigation";
import { useForm, useFieldArray, Controller, useWatch } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import {
  CreateQueueSchema,
  type CreateQueueInput,
  type CollectMode,
} from "@/lib/validations/queue";

const TIMEZONES = [
  "Asia/Ho_Chi_Minh",
  "Asia/Bangkok",
  "Asia/Singapore",
  "Asia/Tokyo",
  "America/New_York",
  "Europe/London",
  "UTC",
];

const DAYS = ["CN", "T2", "T3", "T4", "T5", "T6", "T7"];
const DAYS_FULL = ["Chủ nhật", "Thứ 2", "Thứ 3", "Thứ 4", "Thứ 5", "Thứ 6", "Thứ 7"];

const SECTIONS = [
  "Thông tin cơ bản",
  "Luồng & Cửa phục vụ",
  "Hành vi khách hàng",
  "Cài đặt QR",
];

function ChevronIcon({ open }: { open: boolean }) {
  return (
    <svg
      className={`w-5 h-5 text-gray-400 transition-transform ${open ? "rotate-180" : ""}`}
      fill="none"
      stroke="currentColor"
      viewBox="0 0 24 24"
    >
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
    </svg>
  );
}

function SectionHeader({
  title,
  open,
  hasError,
  onClick,
}: {
  title: string;
  open: boolean;
  hasError: boolean;
  onClick: () => void;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className="w-full flex items-center justify-between px-5 py-4 text-left"
    >
      <span className="font-semibold text-gray-900 flex items-center gap-2">
        {title}
        {hasError && (
          <span className="inline-block w-2 h-2 rounded-full bg-red-500" />
        )}
      </span>
      <ChevronIcon open={open} />
    </button>
  );
}

type QueueWizardProps = {
  mode?: "create" | "edit";
  queueId?: string;
  initialValues?: Partial<CreateQueueInput>;
  initialLogoUrl?: string;
};

export default function QueueWizard({
  mode = "create",
  queueId,
  initialValues,
  initialLogoUrl,
}: QueueWizardProps) {
  const router = useRouter();
  const [openSections, setOpenSections] = useState([true, false, false, false]);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [logoUploading, setLogoUploading] = useState(false);
  const [logoPreview, setLogoPreview] = useState<string | null>(initialLogoUrl ?? null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const {
    register,
    control,
    handleSubmit,
    setValue,
    watch,
    formState: { errors },
  } = useForm<CreateQueueInput>({
    resolver: zodResolver(CreateQueueSchema),
    defaultValues: initialValues ?? {
      name: "",
      timezone: "Asia/Ho_Chi_Minh",
      qrRotationType: "FIXED",
      requireCustomerInfo: false,
      collectName: "HIDDEN",
      collectPhone: "HIDDEN",
      collectEmail: "HIDDEN",
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

  const toggleSection = (i: number) => {
    setOpenSections((prev) => prev.map((v, idx) => (idx === i ? !v : v)));
  };

  const onSubmit = async (data: CreateQueueInput) => {
    setSubmitting(true);
    setError(null);

    // Auto-set requireCustomerInfo based on collect modes + custom fields
    const hasInfo =
      data.collectName !== "HIDDEN" ||
      data.collectPhone !== "HIDDEN" ||
      data.collectEmail !== "HIDDEN" ||
      (data.customFields && data.customFields.length > 0);
    data.requireCustomerInfo = !!hasInfo;

    if (mode === "edit" && queueId) {
      // Update queue fields
      const { streams, ...queueFields } = data;
      const [r1, r2] = await Promise.all([
        fetch(`/api/queues/${queueId}`, {
          method: "PATCH",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(queueFields),
        }),
        fetch(`/api/queues/${queueId}/streams`, {
          method: "PUT",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ streams }),
        }),
      ]);

      if (r1.ok && r2.ok) {
        router.push(`/dashboard/queues/${queueId}`);
      } else {
        const errBody = await (r1.ok ? r2 : r1).json();
        setError(JSON.stringify(errBody.error));
        setSubmitting(false);
      }
    } else {
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
    }
  };

  const handleLogoFile = async (file: File) => {
    if (file.size > 10 * 1024 * 1024) {
      setError("Logo file must be under 10 MB");
      return;
    }
    setLogoUploading(true);
    const preview = URL.createObjectURL(file);
    setLogoPreview(preview);

    try {
      const fd = new FormData();
      fd.append("file", file);
      const res = await fetch("/api/upload/logo", { method: "POST", body: fd });
      if (res.ok) {
        const { url } = await res.json();
        setValue("logoUrl", url);
      } else {
        setError("Logo upload failed");
      }
    } finally {
      setLogoUploading(false);
    }
  };

  // Section error detection
  const sectionHasError = [
    !!(errors.name || errors.startAt || errors.endAt || errors.timezone),
    !!(errors.streams),
    !!(errors.customFields),
    false,
  ];

  return (
    <div className="max-w-2xl space-y-3">
      <form onSubmit={handleSubmit(onSubmit)}>
        {/* Section 0: Basic Info */}
        <div className="bg-white rounded-2xl border border-gray-100 overflow-hidden">
          <SectionHeader
            title={SECTIONS[0]}
            open={openSections[0]}
            hasError={sectionHasError[0]}
            onClick={() => toggleSection(0)}
          />
          {openSections[0] && (
            <div className="px-5 pb-5 space-y-4 border-t border-gray-50">
              {/* Logo upload */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Logo (tùy chọn, tối đa 10 MB)
                </label>
                <div className="flex items-center gap-3">
                  {logoPreview && (
                    <img
                      src={logoPreview}
                      alt="Logo preview"
                      className="w-16 h-16 rounded-xl object-cover border border-gray-200"
                    />
                  )}
                  <button
                    type="button"
                    onClick={() => fileInputRef.current?.click()}
                    disabled={logoUploading}
                    className="px-4 py-2 border border-gray-300 rounded-xl text-sm text-gray-700 hover:bg-gray-50 disabled:opacity-50"
                  >
                    {logoUploading ? "Đang tải lên..." : "Chọn ảnh"}
                  </button>
                  <input
                    ref={fileInputRef}
                    type="file"
                    accept="image/*"
                    className="hidden"
                    onChange={(e) => {
                      const f = e.target.files?.[0];
                      if (f) handleLogoFile(f);
                    }}
                  />
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Tên hàng đợi *
                </label>
                <input
                  {...register("name")}
                  className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500"
                  placeholder="VD: Chi nhánh Ngân hàng A"
                />
                {errors.name && (
                  <p className="text-sm text-red-600 mt-1">{errors.name.message}</p>
                )}
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Lời chào
                </label>
                <input
                  {...register("greeting")}
                  className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500"
                  placeholder="VD: Chào mừng! Chúng tôi sẽ phục vụ bạn sớm."
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Bắt đầu *
                  </label>
                  <input
                    type="datetime-local"
                    {...register("startAt")}
                    className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Kết thúc *
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
                  Múi giờ *
                </label>
                <select
                  {...register("timezone")}
                  className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500"
                >
                  {TIMEZONES.map((tz) => (
                    <option key={tz} value={tz}>{tz}</option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  URL chuyển hướng (tùy chọn)
                </label>
                <input
                  {...register("redirectUrl")}
                  type="url"
                  className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500"
                  placeholder="https://... Mở sau khi khách lấy số"
                />
              </div>
            </div>
          )}
        </div>

        {/* Section 1: Streams & Counters */}
        <div className="bg-white rounded-2xl border border-gray-100 overflow-hidden">
          <SectionHeader
            title={SECTIONS[1]}
            open={openSections[1]}
            hasError={sectionHasError[1]}
            onClick={() => toggleSection(1)}
          />
          {openSections[1] && (
            <div className="px-5 pb-5 border-t border-gray-50 space-y-3 pt-4">
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
                    name: `Luồng ${streamFields.length + 1}`,
                    ticketPrefix: String.fromCharCode(65 + streamFields.length),
                    avgProcessingSeconds: 300,
                    counters: [{ name: "Cửa 1" }],
                  })
                }
                className="w-full py-3 border-2 border-dashed border-gray-300 text-gray-600 rounded-xl hover:border-blue-400 hover:text-blue-600 font-medium text-sm"
              >
                + Thêm luồng
              </button>
            </div>
          )}
        </div>

        {/* Section 2: Customer Behavior */}
        <div className="bg-white rounded-2xl border border-gray-100 overflow-hidden">
          <SectionHeader
            title={SECTIONS[2]}
            open={openSections[2]}
            hasError={sectionHasError[2]}
            onClick={() => toggleSection(2)}
          />
          {openSections[2] && (
            <div className="px-5 pb-5 border-t border-gray-50 space-y-4 pt-4">
              <p className="text-sm text-gray-500">Thông tin thu thập từ khách hàng</p>

              {/* Standard fields */}
              <div className="space-y-2">
                {(
                  [
                    { key: "collectName" as const, label: "Tên khách hàng" },
                    { key: "collectPhone" as const, label: "Số điện thoại" },
                    { key: "collectEmail" as const, label: "Email" },
                  ] as { key: "collectName" | "collectPhone" | "collectEmail"; label: string }[]
                ).map(({ key, label }) => (
                  <div key={key} className="flex items-center gap-3 p-3 border border-gray-200 rounded-xl">
                    <span className="flex-1 text-sm font-medium text-gray-800">{label}</span>
                    <Controller
                      control={control}
                      name={key}
                      render={({ field }) => (
                        <select
                          value={field.value as string}
                          onChange={(e) => field.onChange(e.target.value as CollectMode)}
                          className="px-3 py-1.5 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                        >
                          <option value="HIDDEN">Ẩn</option>
                          <option value="OPTIONAL">Tùy chọn</option>
                          <option value="REQUIRED">Bắt buộc</option>
                        </select>
                      )}
                    />
                  </div>
                ))}
              </div>

              {/* Custom fields */}
              <div>
                <p className="text-sm font-medium text-gray-700 mb-2">Trường tùy chỉnh</p>
                <CustomFieldsEditor control={control} watch={watch} setValue={setValue} register={register} />
              </div>

              {/* Transfer */}
              <label className="flex items-center gap-3 p-4 border border-gray-200 rounded-xl cursor-pointer hover:bg-gray-50">
                <input
                  type="checkbox"
                  {...register("allowTransfer")}
                  className="w-5 h-5 rounded text-blue-600"
                />
                <div>
                  <p className="font-medium text-gray-900">Cho phép chuyển hàng đợi</p>
                  <p className="text-sm text-gray-500">Khách có thể được chuyển sang hàng đợi khác</p>
                </div>
              </label>
            </div>
          )}
        </div>

        {/* Section 3: QR Settings */}
        <div className="bg-white rounded-2xl border border-gray-100 overflow-hidden">
          <SectionHeader
            title={SECTIONS[3]}
            open={openSections[3]}
            hasError={sectionHasError[3]}
            onClick={() => toggleSection(3)}
          />
          {openSections[3] && (
            <div className="px-5 pb-5 border-t border-gray-50 space-y-3 pt-4">
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
                        <p className="font-medium text-gray-900">Mã QR cố định</p>
                        <p className="text-sm text-gray-500">Cùng một mã QR mãi mãi. Dễ in và dán.</p>
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
                        <p className="font-medium text-gray-900">Mã QR xoay theo ngày</p>
                        <p className="text-sm text-gray-500">Mã QR thay đổi mỗi ngày. Bảo mật hơn.</p>
                      </div>
                    </label>
                  </>
                )}
              />
            </div>
          )}
        </div>

        {/* Error display */}
        {error && (
          <div className="p-3 bg-red-50 border border-red-200 rounded-xl text-sm text-red-700">
            {error}
          </div>
        )}

        {/* Submit */}
        <button
          type="submit"
          disabled={submitting}
          className="w-full py-4 bg-blue-600 text-white font-semibold rounded-2xl hover:bg-blue-700 disabled:opacity-50 text-base"
        >
          {submitting
            ? mode === "edit" ? "Đang lưu..." : "Đang tạo..."
            : mode === "edit" ? "Lưu thay đổi" : "Tạo hàng đợi"}
        </button>
      </form>
    </div>
  );
}

// ─── Sub-components ───────────────────────────────────────────────────────────

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
    <div className="bg-gray-50 rounded-xl border border-gray-200 p-4">
      <div className="flex items-center justify-between mb-3">
        <h3 className="font-semibold text-gray-900 text-sm">Luồng {si + 1}</h3>
        {canRemove && (
          <button type="button" onClick={onRemove} className="text-red-500 hover:text-red-700 text-xs">
            Xóa luồng
          </button>
        )}
      </div>

      <div className="grid grid-cols-2 gap-3 mb-3">
        <div>
          <label className="block text-xs font-medium text-gray-600 mb-1">Tên luồng *</label>
          <input
            {...register(`streams.${si}.name`)}
            className="w-full px-3 py-2.5 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white"
            placeholder="VD: Gửi tiền"
          />
          {errors.streams?.[si]?.name && (
            <p className="text-xs text-red-600 mt-1">{errors.streams[si]?.name?.message}</p>
          )}
        </div>
        <div>
          <label className="block text-xs font-medium text-gray-600 mb-1">Tiền tố số vé</label>
          <input
            {...register(`streams.${si}.ticketPrefix`)}
            maxLength={3}
            className="w-full px-3 py-2.5 border border-gray-200 rounded-lg text-sm font-mono focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white"
            placeholder="A"
          />
        </div>
      </div>

      <div className="mb-3">
        <label className="block text-xs font-medium text-gray-600 mb-1">
          Thời gian phục vụ trung bình (giây)
        </label>
        <input
          type="number"
          {...register(`streams.${si}.avgProcessingSeconds`, { valueAsNumber: true })}
          className="w-full px-3 py-2.5 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white"
          placeholder="300"
        />
      </div>

      {/* Counters */}
      <div>
        <label className="text-xs font-medium text-gray-600 mb-2 block">Cửa phục vụ</label>
        <div className="space-y-2">
          {counterFields.map((cf, ci) => (
            <CounterEditor
              key={cf.id}
              streamIndex={si}
              counterIndex={ci}
              register={register}
              control={control}
              onRemove={() => removeCounter(ci)}
              canRemove={counterFields.length > 1}
            />
          ))}
        </div>
        <button
          type="button"
          onClick={() => appendCounter({ name: `Cửa ${counterFields.length + 1}` })}
          className="mt-2 text-xs text-blue-600 hover:text-blue-700 font-medium"
        >
          + Thêm cửa
        </button>
      </div>
    </div>
  );
}

function CounterEditor({
  streamIndex: si,
  counterIndex: ci,
  register,
  control,
  onRemove,
  canRemove,
}: {
  streamIndex: number;
  counterIndex: number;
  register: ReturnType<typeof useForm<CreateQueueInput>>["register"];
  control: ReturnType<typeof useForm<CreateQueueInput>>["control"];
  onRemove: () => void;
  canRemove: boolean;
}) {
  const [scheduleOpen, setScheduleOpen] = useState(false);
  const { fields: scheduleFields, replace } = useFieldArray({
    control,
    name: `streams.${si}.counters.${ci}.schedule`,
  });

  // Initialize schedule if opening for first time
  const initSchedule = () => {
    if (scheduleFields.length === 0) {
      replace(
        DAYS.map((_, dayOfWeek) => ({
          dayOfWeek,
          isOpen: dayOfWeek >= 1 && dayOfWeek <= 5, // Mon-Fri open by default
          openTime: "08:00",
          closeTime: "17:00",
        }))
      );
    }
    setScheduleOpen(true);
  };

  return (
    <div className="bg-white rounded-lg border border-gray-200 p-3">
      <div className="flex items-center gap-2">
        <input
          {...register(`streams.${si}.counters.${ci}.name`)}
          className="flex-1 px-3 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
          placeholder={`Cửa ${ci + 1}`}
        />
        <button
          type="button"
          onClick={() => (scheduleOpen ? setScheduleOpen(false) : initSchedule())}
          className="px-2 py-2 text-xs text-gray-500 hover:text-blue-600 border border-gray-200 rounded-lg whitespace-nowrap"
          title="Lịch hoạt động"
        >
          📅
        </button>
        {canRemove && (
          <button type="button" onClick={onRemove} className="px-2 text-gray-400 hover:text-red-500 text-lg leading-none">
            ×
          </button>
        )}
      </div>

      {scheduleOpen && scheduleFields.length === 7 && (
        <div className="mt-3 space-y-1.5">
          {DAYS_FULL.map((dayName, dayIdx) => (
            <DayScheduleRow
              key={dayIdx}
              dayIdx={dayIdx}
              dayName={dayName}
              si={si}
              ci={ci}
              scheduleIndex={dayIdx}
              register={register}
              control={control}
            />
          ))}
        </div>
      )}
    </div>
  );
}

function DayScheduleRow({
  dayIdx,
  dayName,
  si,
  ci,
  scheduleIndex,
  register,
  control,
}: {
  dayIdx: number;
  dayName: string;
  si: number;
  ci: number;
  scheduleIndex: number;
  register: ReturnType<typeof useForm<CreateQueueInput>>["register"];
  control: ReturnType<typeof useForm<CreateQueueInput>>["control"];
}) {
  const isOpen = useWatch({
    control,
    name: `streams.${si}.counters.${ci}.schedule.${scheduleIndex}.isOpen`,
  });

  return (
    <div className="flex items-center gap-2 text-xs">
      <input
        type="hidden"
        {...register(`streams.${si}.counters.${ci}.schedule.${scheduleIndex}.dayOfWeek`, {
          valueAsNumber: true,
        })}
        value={dayIdx}
      />
      <label className="flex items-center gap-1.5 w-20">
        <input
          type="checkbox"
          {...register(`streams.${si}.counters.${ci}.schedule.${scheduleIndex}.isOpen`)}
          className="rounded"
        />
        <span className={isOpen ? "text-gray-800 font-medium" : "text-gray-400"}>{dayName}</span>
      </label>
      {isOpen ? (
        <>
          <input
            type="time"
            {...register(`streams.${si}.counters.${ci}.schedule.${scheduleIndex}.openTime`)}
            className="px-2 py-1 border border-gray-200 rounded text-xs"
          />
          <span className="text-gray-400">–</span>
          <input
            type="time"
            {...register(`streams.${si}.counters.${ci}.schedule.${scheduleIndex}.closeTime`)}
            className="px-2 py-1 border border-gray-200 rounded text-xs"
          />
        </>
      ) : (
        <span className="text-gray-400 text-xs">Nghỉ</span>
      )}
    </div>
  );
}

function CustomFieldsEditor({
  control,
  watch,
  setValue,
  register,
}: {
  control: ReturnType<typeof useForm<CreateQueueInput>>["control"];
  watch: ReturnType<typeof useForm<CreateQueueInput>>["watch"];
  setValue: ReturnType<typeof useForm<CreateQueueInput>>["setValue"];
  register: ReturnType<typeof useForm<CreateQueueInput>>["register"];
}) {
  const { fields, append, remove } = useFieldArray({ control, name: "customFields" });
  const [optionInputs, setOptionInputs] = useState<Record<number, string>>({});

  return (
    <div className="border border-gray-200 rounded-xl p-3 space-y-3">
      <div className="flex items-center justify-between">
        <p className="text-xs font-medium text-gray-600">Trường tùy chỉnh thêm</p>
        <button
          type="button"
          onClick={() =>
            append({ name: `field${fields.length}`, label: "", type: "text", required: false })
          }
          className="text-xs text-blue-600 hover:text-blue-700 font-medium"
        >
          + Thêm trường
        </button>
      </div>

      {fields.map((f, i) => {
        const fieldType = watch(`customFields.${i}.type`);
        const currentOptions = watch(`customFields.${i}.options`) ?? [];

        const addOption = () => {
          const val = optionInputs[i]?.trim();
          if (val) {
            setValue(`customFields.${i}.options`, [...currentOptions, val]);
            setOptionInputs((prev) => ({ ...prev, [i]: "" }));
          }
        };

        const removeOption = (oi: number) => {
          const updated = currentOptions.filter((_, idx) => idx !== oi);
          setValue(`customFields.${i}.options`, updated);
        };

        return (
          <div key={f.id} className="p-3 bg-gray-50 rounded-lg space-y-2">
            <div className="flex gap-2 items-center">
              <Controller
                control={control}
                name={`customFields.${i}.label`}
                render={({ field }) => (
                  <input
                    {...field}
                    placeholder="Nhãn trường"
                    className="flex-1 px-3 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white"
                  />
                )}
              />
              <Controller
                control={control}
                name={`customFields.${i}.type`}
                render={({ field }) => (
                  <select
                    {...field}
                    className="px-2 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white"
                  >
                    <option value="text">Văn bản</option>
                    <option value="number">Số</option>
                    <option value="phone">Điện thoại</option>
                    <option value="email">Email</option>
                    <option value="select">Chọn</option>
                  </select>
                )}
              />
              <label className="flex items-center gap-1 text-xs text-gray-600 whitespace-nowrap">
                <input
                  type="checkbox"
                  {...register(`customFields.${i}.required`)}
                  className="rounded"
                />
                Bắt buộc
              </label>
              <button type="button" onClick={() => remove(i)} className="text-gray-400 hover:text-red-500 text-lg leading-none">
                ×
              </button>
            </div>

            {/* Select options */}
            {fieldType === "select" && (
              <div className="pl-2 space-y-1.5">
                <p className="text-xs text-gray-500">Các lựa chọn:</p>
                {currentOptions.map((opt, oi) => (
                  <div key={oi} className="flex gap-1.5 items-center">
                    <span className="flex-1 px-2 py-1 bg-white border border-gray-200 rounded text-xs">{opt}</span>
                    <button
                      type="button"
                      onClick={() => removeOption(oi)}
                      className="text-gray-400 hover:text-red-500 text-xs px-1"
                    >
                      ×
                    </button>
                  </div>
                ))}
                <div className="flex gap-1.5">
                  <input
                    type="text"
                    value={optionInputs[i] ?? ""}
                    onChange={(e) => setOptionInputs((prev) => ({ ...prev, [i]: e.target.value }))}
                    placeholder="Nhập lựa chọn rồi nhấn Thêm..."
                    className="flex-1 px-2 py-1 border border-gray-200 rounded text-xs focus:outline-none focus:ring-1 focus:ring-blue-500 bg-white"
                    onKeyDown={(e) => {
                      if (e.key === "Enter") {
                        e.preventDefault();
                        addOption();
                      }
                    }}
                  />
                  <button
                    type="button"
                    onClick={addOption}
                    className="px-2 py-1 bg-blue-600 text-white rounded text-xs hover:bg-blue-700"
                  >
                    Thêm
                  </button>
                </div>
              </div>
            )}
          </div>
        );
      })}

      {fields.length === 0 && (
        <p className="text-xs text-gray-400 text-center py-2">Chưa có trường tùy chỉnh</p>
      )}
    </div>
  );
}

// Suppress unused var warning
void DAYS;
