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

const DAYS_FULL = ["Chủ nhật", "Thứ 2", "Thứ 3", "Thứ 4", "Thứ 5", "Thứ 6", "Thứ 7"];

const TABS = [
  { id: 0, label: "Cơ bản" },
  { id: 1, label: "Luồng & Cửa" },
  { id: 2, label: "Khách hàng" },
  { id: 3, label: "QR & Xuất bản" },
];

// ─── Icons ────────────────────────────────────────────────────────────────────

function ChevronIcon({ open, className = "" }: { open: boolean; className?: string }) {
  return (
    <svg
      className={`w-4 h-4 transition-transform ${open ? "rotate-180" : ""} ${className}`}
      fill="none"
      stroke="currentColor"
      viewBox="0 0 24 24"
    >
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
    </svg>
  );
}

function UploadIcon() {
  return (
    <svg className="w-8 h-8 text-slate-300 mx-auto mb-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
    </svg>
  );
}

// ─── Props ────────────────────────────────────────────────────────────────────

type QueueWizardProps = {
  mode?: "create" | "edit";
  queueId?: string;
  initialValues?: Partial<CreateQueueInput>;
  initialLogoUrl?: string;
};

// ─── Main Component ───────────────────────────────────────────────────────────

export default function QueueWizard({
  mode = "create",
  queueId,
  initialValues,
  initialLogoUrl,
}: QueueWizardProps) {
  const router = useRouter();
  const [activeTab, setActiveTab] = useState(0);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [logoUploading, setLogoUploading] = useState(false);
  const [logoPreview, setLogoPreview] = useState<string | null>(initialLogoUrl ?? null);
  const [dragOver, setDragOver] = useState(false);
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
          name: "Tổng quát",
          ticketPrefix: "A",
          avgProcessingSeconds: 300,
          counters: [{ name: "Cửa 1" }],
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

  // Tab error detection
  const tabHasError = [
    !!(errors.name || errors.startAt || errors.endAt || errors.timezone),
    !!(errors.streams),
    !!(errors.customFields),
    false,
  ];

  const onSubmit = async (data: CreateQueueInput) => {
    setSubmitting(true);
    setError(null);

    const hasInfo =
      data.collectName !== "HIDDEN" ||
      data.collectPhone !== "HIDDEN" ||
      data.collectEmail !== "HIDDEN" ||
      (data.customFields && data.customFields.length > 0);
    data.requireCustomerInfo = !!hasInfo;

    if (mode === "edit" && queueId) {
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
      setError("Logo phải nhỏ hơn 10 MB");
      return;
    }
    setLogoUploading(true);
    setLogoPreview(URL.createObjectURL(file));
    try {
      const fd = new FormData();
      fd.append("file", file);
      const res = await fetch("/api/upload/logo", { method: "POST", body: fd });
      if (res.ok) {
        const { url } = await res.json();
        setValue("logoUrl", url);
      } else {
        setError("Tải logo thất bại");
        setLogoPreview(null);
      }
    } finally {
      setLogoUploading(false);
    }
  };

  return (
    <div className="max-w-2xl">
      <form onSubmit={handleSubmit(onSubmit)}>
        {/* ── Sticky header ── */}
        <div className="sticky top-0 z-10 bg-white border-b border-slate-200 -mx-4 px-4 mb-0">
          <div className="flex items-center justify-between py-3">
            <h1 className="font-bold text-lg text-slate-900">
              {mode === "edit" ? "Chỉnh sửa hàng đợi" : "Tạo hàng đợi mới"}
            </h1>
            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={() => router.back()}
                className="btn-ghost text-sm py-2 px-3"
              >
                Hủy
              </button>
              <button
                type="submit"
                disabled={submitting}
                className="btn-primary text-sm py-2"
              >
                {submitting
                  ? mode === "edit" ? "Đang lưu..." : "Đang tạo..."
                  : mode === "edit" ? "Lưu thay đổi" : "Tạo hàng đợi"}
              </button>
            </div>
          </div>

          {/* ── Tab nav ── */}
          <div className="flex gap-0">
            {TABS.map((tab) => (
              <button
                key={tab.id}
                type="button"
                onClick={() => setActiveTab(tab.id)}
                className={`flex items-center gap-1.5 px-4 py-3 text-sm font-medium border-b-2 transition-colors ${
                  activeTab === tab.id
                    ? "text-blue-600 border-blue-600"
                    : "text-slate-500 border-transparent hover:text-slate-700"
                }`}
              >
                {tab.label}
                {tabHasError[tab.id] && (
                  <span className="w-1.5 h-1.5 bg-red-500 rounded-full" />
                )}
              </button>
            ))}
          </div>
        </div>

        {/* ── Error banner ── */}
        {error && (
          <div className="mt-4 p-3 bg-red-50 border border-red-200 rounded-xl text-sm text-red-700 flex items-start gap-2">
            <span className="mt-0.5">⚠</span>
            <span>{error}</span>
          </div>
        )}

        {/* ── Tab content ── */}
        <div className="py-6 space-y-5">

          {/* TAB 0: Cơ bản */}
          {activeTab === 0 && (
            <>
              {/* Logo upload */}
              <Section title="Logo hàng đợi">
                <div
                  className={`relative border-2 border-dashed rounded-2xl p-6 text-center cursor-pointer transition-colors ${
                    dragOver
                      ? "border-blue-400 bg-blue-50"
                      : logoPreview
                      ? "border-slate-200 bg-slate-50"
                      : "border-slate-200 hover:border-blue-300 hover:bg-slate-50"
                  }`}
                  onClick={() => fileInputRef.current?.click()}
                  onDragOver={(e) => { e.preventDefault(); setDragOver(true); }}
                  onDragLeave={() => setDragOver(false)}
                  onDrop={(e) => {
                    e.preventDefault();
                    setDragOver(false);
                    const f = e.dataTransfer.files[0];
                    if (f) handleLogoFile(f);
                  }}
                >
                  {logoPreview ? (
                    <div className="flex items-center gap-4">
                      <img
                        src={logoPreview}
                        alt="Logo preview"
                        className="w-20 h-20 rounded-2xl object-cover border border-slate-200 shrink-0"
                      />
                      <div className="text-left">
                        <p className="text-sm font-medium text-slate-700">
                          {logoUploading ? "Đang tải lên..." : "Logo đã chọn"}
                        </p>
                        <p className="text-xs text-slate-400 mt-0.5">Click để thay đổi · PNG/JPG tối đa 10 MB</p>
                        {logoUploading && (
                          <div className="mt-2 h-1 bg-slate-200 rounded-full overflow-hidden w-32">
                            <div className="h-full bg-blue-500 animate-pulse w-2/3" />
                          </div>
                        )}
                      </div>
                    </div>
                  ) : (
                    <>
                      <UploadIcon />
                      <p className="text-sm font-medium text-slate-600">Kéo thả hoặc click để tải lên</p>
                      <p className="text-xs text-slate-400 mt-1">PNG, JPG · Tối đa 10 MB</p>
                    </>
                  )}
                  <input
                    ref={fileInputRef}
                    type="file"
                    accept="image/*"
                    className="hidden"
                    onChange={(e) => { const f = e.target.files?.[0]; if (f) handleLogoFile(f); }}
                  />
                </div>
              </Section>

              {/* Basic info */}
              <Section title="Thông tin chung">
                <div className="space-y-4">
                  <FormField label="Tên hàng đợi" required error={errors.name?.message}>
                    <input
                      {...register("name")}
                      className={`input ${errors.name ? "input-error" : ""}`}
                      placeholder="VD: Chi nhánh Ngân hàng A"
                    />
                  </FormField>
                  <FormField label="Lời chào">
                    <input
                      {...register("greeting")}
                      className="input"
                      placeholder="VD: Chào mừng! Chúng tôi sẽ phục vụ bạn sớm."
                    />
                  </FormField>
                </div>
              </Section>

              {/* Operating hours */}
              <Section title="Thời gian hoạt động">
                <div className="space-y-4">
                  <div className="grid grid-cols-2 gap-3">
                    <FormField label="Bắt đầu" required error={errors.startAt?.message}>
                      <input
                        type="datetime-local"
                        {...register("startAt")}
                        className={`input ${errors.startAt ? "input-error" : ""}`}
                      />
                    </FormField>
                    <FormField label="Kết thúc" required error={errors.endAt?.message}>
                      <input
                        type="datetime-local"
                        {...register("endAt")}
                        className={`input ${errors.endAt ? "input-error" : ""}`}
                      />
                    </FormField>
                  </div>
                  <FormField label="Múi giờ" required>
                    <select {...register("timezone")} className="input">
                      {TIMEZONES.map((tz) => (
                        <option key={tz} value={tz}>{tz}</option>
                      ))}
                    </select>
                  </FormField>
                </div>
              </Section>

              {/* Advanced */}
              <Section title="Tùy chọn nâng cao">
                <FormField label="URL chuyển hướng sau khi lấy số">
                  <input
                    {...register("redirectUrl")}
                    type="url"
                    className="input"
                    placeholder="https://... (Mở sau khi khách lấy số)"
                  />
                </FormField>
              </Section>
            </>
          )}

          {/* TAB 1: Streams & Counters */}
          {activeTab === 1 && (
            <Section
              title="Luồng phục vụ"
              action={
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
                  className="text-sm text-blue-600 hover:text-blue-700 font-medium"
                >
                  + Thêm luồng
                </button>
              }
            >
              <div className="space-y-3">
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
                  className="w-full py-4 border-2 border-dashed border-slate-200 text-slate-400 rounded-2xl hover:border-blue-300 hover:text-blue-600 font-medium text-sm transition-colors"
                >
                  + Thêm luồng phục vụ
                </button>
              </div>
            </Section>
          )}

          {/* TAB 2: Customer behavior */}
          {activeTab === 2 && (
            <>
              <Section title="Thông tin thu thập">
                <p className="text-xs text-slate-400 mb-4">Chọn chế độ cho từng trường thông tin</p>
                <div className="space-y-2">
                  {(
                    [
                      { key: "collectName" as const, label: "Họ tên" },
                      { key: "collectPhone" as const, label: "Số điện thoại" },
                      { key: "collectEmail" as const, label: "Email" },
                    ] as { key: "collectName" | "collectPhone" | "collectEmail"; label: string }[]
                  ).map(({ key, label }) => (
                    <div key={key} className="flex items-center justify-between p-3 rounded-xl border border-slate-200 bg-white">
                      <span className="text-sm font-medium text-slate-800">{label}</span>
                      <Controller
                        control={control}
                        name={key}
                        render={({ field }) => (
                          <div className="flex rounded-lg border border-slate-200 overflow-hidden">
                            {[
                              { val: "HIDDEN", text: "Ẩn" },
                              { val: "OPTIONAL", text: "Tùy chọn" },
                              { val: "REQUIRED", text: "Bắt buộc" },
                            ].map(({ val, text }) => (
                              <button
                                key={val}
                                type="button"
                                onClick={() => field.onChange(val as CollectMode)}
                                className={`px-3 py-1.5 text-xs font-medium transition-colors ${
                                  field.value === val
                                    ? "bg-blue-600 text-white"
                                    : "bg-white text-slate-500 hover:bg-slate-50"
                                }`}
                              >
                                {text}
                              </button>
                            ))}
                          </div>
                        )}
                      />
                    </div>
                  ))}
                </div>
              </Section>

              <Section
                title="Trường tùy chỉnh"
                action={null}
              >
                <CustomFieldsEditor control={control} watch={watch} setValue={setValue} register={register} />
              </Section>

              <Section title="Chuyển hàng đợi">
                <label className="flex items-center gap-3 p-4 border border-slate-200 rounded-xl cursor-pointer hover:bg-slate-50 transition-colors">
                  <input
                    type="checkbox"
                    {...register("allowTransfer")}
                    className="w-5 h-5 rounded border-slate-300 text-blue-600 focus:ring-blue-500"
                  />
                  <div>
                    <p className="text-sm font-medium text-slate-900">Cho phép chuyển hàng đợi</p>
                    <p className="text-xs text-slate-500 mt-0.5">Khách có thể được chuyển sang hàng đợi khác</p>
                  </div>
                </label>
              </Section>
            </>
          )}

          {/* TAB 3: QR & Publish */}
          {activeTab === 3 && (
            <Section title="Chế độ mã QR">
              <Controller
                control={control}
                name="qrRotationType"
                render={({ field }) => (
                  <div className="space-y-3">
                    {[
                      {
                        val: "FIXED",
                        title: "Mã QR cố định",
                        desc: "Cùng một mã QR mãi mãi. Phù hợp khi in poster, banner cố định.",
                      },
                      {
                        val: "DAILY",
                        title: "Mã QR xoay theo ngày",
                        desc: "Mã QR thay đổi lúc nửa đêm. Bảo mật hơn, phù hợp môi trường kiểm soát cao.",
                      },
                    ].map(({ val, title, desc }) => (
                      <label
                        key={val}
                        className={`flex items-start gap-4 p-4 border-2 rounded-2xl cursor-pointer transition-colors ${
                          field.value === val
                            ? "border-blue-600 bg-blue-50"
                            : "border-slate-200 hover:border-slate-300 bg-white"
                        }`}
                      >
                        <input
                          type="radio"
                          value={val}
                          checked={field.value === val}
                          onChange={() => field.onChange(val)}
                          className="mt-0.5 text-blue-600"
                        />
                        <div>
                          <p className="font-medium text-slate-900 text-sm">{title}</p>
                          <p className="text-xs text-slate-500 mt-0.5">{desc}</p>
                        </div>
                      </label>
                    ))}
                  </div>
                )}
              />
            </Section>
          )}

        </div>

        {/* Bottom submit (mobile) */}
        <div className="pb-8 pt-2">
          <button
            type="submit"
            disabled={submitting}
            className="btn-primary w-full py-3.5 text-base"
          >
            {submitting
              ? mode === "edit" ? "Đang lưu..." : "Đang tạo..."
              : mode === "edit" ? "Lưu thay đổi" : "Tạo hàng đợi"}
          </button>
        </div>
      </form>
    </div>
  );
}

// ─── Section wrapper ───────────────────────────────────────────────────────────

function Section({
  title,
  children,
  action,
}: {
  title: string;
  children: React.ReactNode;
  action?: React.ReactNode;
}) {
  return (
    <div className="card p-5">
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-sm font-semibold text-slate-700 uppercase tracking-wide">{title}</h3>
        {action}
      </div>
      {children}
    </div>
  );
}

// ─── FormField ────────────────────────────────────────────────────────────────

function FormField({
  label,
  required,
  error,
  children,
}: {
  label: string;
  required?: boolean;
  error?: string;
  children: React.ReactNode;
}) {
  return (
    <div>
      <label className={`label ${required ? "label-required" : ""}`}>{label}</label>
      {children}
      {error && <p className="text-xs text-red-600 mt-1">{error}</p>}
    </div>
  );
}

// ─── StreamEditor ─────────────────────────────────────────────────────────────

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
    <div className="border border-slate-200 rounded-2xl bg-white overflow-hidden">
      {/* Stream header */}
      <div className="flex items-center justify-between px-4 py-3 bg-slate-50 border-b border-slate-100">
        <span className="text-sm font-semibold text-slate-700">Luồng {si + 1}</span>
        {canRemove && (
          <button type="button" onClick={onRemove} className="text-xs text-red-500 hover:text-red-700 font-medium">
            Xóa luồng
          </button>
        )}
      </div>

      <div className="p-4 space-y-3">
        <div className="grid grid-cols-2 gap-3">
          <FormField label="Tên luồng" required error={errors.streams?.[si]?.name?.message}>
            <input
              {...register(`streams.${si}.name`)}
              className="input text-sm"
              placeholder="VD: Tổng quát"
            />
          </FormField>
          <FormField label="Tiền tố số vé">
            <input
              {...register(`streams.${si}.ticketPrefix`)}
              maxLength={3}
              className="input text-sm font-mono"
              placeholder="A"
            />
          </FormField>
        </div>

        <FormField label="Thời gian phục vụ TB (giây)">
          <input
            type="number"
            {...register(`streams.${si}.avgProcessingSeconds`, { valueAsNumber: true })}
            className="input text-sm"
            placeholder="300"
          />
        </FormField>

        {/* Counters */}
        <div>
          <div className="flex items-center justify-between mb-2">
            <span className="text-xs font-medium text-slate-500 uppercase tracking-wide">Cửa phục vụ</span>
            <button
              type="button"
              onClick={() => appendCounter({ name: `Cửa ${counterFields.length + 1}` })}
              className="text-xs text-blue-600 hover:text-blue-700 font-medium"
            >
              + Thêm cửa
            </button>
          </div>
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
        </div>
      </div>
    </div>
  );
}

// ─── CounterEditor ────────────────────────────────────────────────────────────

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

  const initSchedule = () => {
    if (scheduleFields.length === 0) {
      replace(
        Array.from({ length: 7 }, (_, dayOfWeek) => ({
          dayOfWeek,
          isOpen: dayOfWeek >= 1 && dayOfWeek <= 5,
          openTime: "08:00",
          closeTime: "17:00",
        }))
      );
    }
    setScheduleOpen(true);
  };

  return (
    <div className="bg-slate-50 rounded-xl border border-slate-100 p-3">
      <div className="flex items-center gap-2">
        <input
          {...register(`streams.${si}.counters.${ci}.name`)}
          className="flex-1 px-3 py-2 border border-slate-200 rounded-lg text-sm bg-white focus:outline-none focus:ring-2 focus:ring-blue-500"
          placeholder={`Cửa ${ci + 1}`}
        />
        <button
          type="button"
          onClick={() => (scheduleOpen ? setScheduleOpen(false) : initSchedule())}
          className={`flex items-center gap-1 px-2.5 py-2 text-xs font-medium border rounded-lg transition-colors ${
            scheduleOpen
              ? "bg-blue-50 border-blue-200 text-blue-600"
              : "bg-white border-slate-200 text-slate-500 hover:text-blue-600"
          }`}
        >
          Lịch
          <ChevronIcon open={scheduleOpen} />
        </button>
        {canRemove && (
          <button
            type="button"
            onClick={onRemove}
            className="w-8 h-8 flex items-center justify-center text-slate-300 hover:text-red-500 rounded-lg hover:bg-red-50 transition-colors"
          >
            ×
          </button>
        )}
      </div>

      {scheduleOpen && scheduleFields.length === 7 && (
        <div className="mt-3 pt-3 border-t border-slate-100 space-y-2">
          <div className="flex items-center justify-between">
            <span className="text-xs font-medium text-slate-500">Lịch hoạt động</span>
            <button
              type="button"
              onClick={() => {
                const first = scheduleFields[1]; // Mon
                const openTime = (first as { openTime?: string }).openTime ?? "08:00";
                const closeTime = (first as { closeTime?: string }).closeTime ?? "17:00";
                replace(
                  Array.from({ length: 7 }, (_, dayOfWeek) => ({
                    dayOfWeek,
                    isOpen: dayOfWeek >= 1 && dayOfWeek <= 5,
                    openTime,
                    closeTime,
                  }))
                );
              }}
              className="text-xs text-blue-600 hover:text-blue-700"
            >
              Áp dụng cho tất cả
            </button>
          </div>
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

// ─── DayScheduleRow ───────────────────────────────────────────────────────────

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
    <div className="flex items-center gap-3 text-xs">
      <input
        type="hidden"
        {...register(`streams.${si}.counters.${ci}.schedule.${scheduleIndex}.dayOfWeek`, {
          valueAsNumber: true,
        })}
        value={dayIdx}
      />
      <label className="flex items-center gap-2 w-24 cursor-pointer">
        <input
          type="checkbox"
          {...register(`streams.${si}.counters.${ci}.schedule.${scheduleIndex}.isOpen`)}
          className="rounded border-slate-300 text-blue-600"
        />
        <span className={isOpen ? "text-slate-800 font-medium" : "text-slate-400"}>{dayName}</span>
      </label>
      {isOpen ? (
        <div className="flex items-center gap-2">
          <input
            type="time"
            {...register(`streams.${si}.counters.${ci}.schedule.${scheduleIndex}.openTime`)}
            className="px-2 py-1 border border-slate-200 rounded-lg text-xs bg-white focus:outline-none focus:ring-1 focus:ring-blue-500"
          />
          <span className="text-slate-300">–</span>
          <input
            type="time"
            {...register(`streams.${si}.counters.${ci}.schedule.${scheduleIndex}.closeTime`)}
            className="px-2 py-1 border border-slate-200 rounded-lg text-xs bg-white focus:outline-none focus:ring-1 focus:ring-blue-500"
          />
        </div>
      ) : (
        <span className="text-slate-300 text-xs">Nghỉ</span>
      )}
    </div>
  );
}

// ─── CustomFieldsEditor ───────────────────────────────────────────────────────

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
    <div className="space-y-3">
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

        return (
          <div key={f.id} className="bg-slate-50 rounded-xl border border-slate-200 p-3 space-y-3">
            <div className="flex gap-2 items-center">
              <Controller
                control={control}
                name={`customFields.${i}.label`}
                render={({ field }) => (
                  <input
                    {...field}
                    placeholder="Nhãn trường"
                    className="flex-1 px-3 py-2 border border-slate-200 rounded-lg text-sm bg-white focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                )}
              />
              <Controller
                control={control}
                name={`customFields.${i}.type`}
                render={({ field }) => (
                  <select
                    {...field}
                    className="px-2 py-2 border border-slate-200 rounded-lg text-sm bg-white focus:outline-none focus:ring-2 focus:ring-blue-500"
                  >
                    <option value="text">Văn bản</option>
                    <option value="number">Số</option>
                    <option value="phone">Điện thoại</option>
                    <option value="email">Email</option>
                    <option value="select">Chọn</option>
                  </select>
                )}
              />
              <label className="flex items-center gap-1.5 text-xs text-slate-600 whitespace-nowrap">
                <input type="checkbox" {...register(`customFields.${i}.required`)} className="rounded" />
                Bắt buộc
              </label>
              <button
                type="button"
                onClick={() => remove(i)}
                className="w-7 h-7 flex items-center justify-center text-slate-300 hover:text-red-500 rounded-lg hover:bg-red-50 text-base transition-colors"
              >
                ×
              </button>
            </div>

            {fieldType === "select" && (
              <div className="space-y-2">
                <p className="text-xs font-medium text-slate-500">Các lựa chọn:</p>
                <div className="space-y-1.5">
                  {currentOptions.map((opt: string, oi: number) => (
                    <div key={oi} className="flex gap-2 items-center">
                      <span className="flex-1 px-3 py-1.5 bg-white border border-slate-200 rounded-lg text-xs text-slate-700">{opt}</span>
                      <button
                        type="button"
                        onClick={() => setValue(`customFields.${i}.options`, currentOptions.filter((_: string, idx: number) => idx !== oi))}
                        className="text-slate-300 hover:text-red-500 text-xs px-1"
                      >
                        ×
                      </button>
                    </div>
                  ))}
                </div>
                <div className="flex gap-2">
                  <input
                    type="text"
                    value={optionInputs[i] ?? ""}
                    onChange={(e) => setOptionInputs((prev) => ({ ...prev, [i]: e.target.value }))}
                    placeholder="Nhập lựa chọn rồi nhấn Thêm..."
                    className="flex-1 px-3 py-1.5 border border-slate-200 rounded-lg text-xs bg-white focus:outline-none focus:ring-1 focus:ring-blue-500"
                    onKeyDown={(e) => { if (e.key === "Enter") { e.preventDefault(); addOption(); } }}
                  />
                  <button
                    type="button"
                    onClick={addOption}
                    className="px-3 py-1.5 bg-blue-600 text-white rounded-lg text-xs hover:bg-blue-700"
                  >
                    Thêm
                  </button>
                </div>
              </div>
            )}
          </div>
        );
      })}

      <button
        type="button"
        onClick={() => append({ name: `field${fields.length}`, label: "", type: "text", required: false })}
        className="w-full py-3 border-2 border-dashed border-slate-200 text-slate-400 rounded-xl hover:border-blue-300 hover:text-blue-600 text-sm font-medium transition-colors"
      >
        + Thêm trường tùy chỉnh
      </button>

      {fields.length === 0 && (
        <p className="text-xs text-slate-400 text-center py-1">Chưa có trường tùy chỉnh nào</p>
      )}
    </div>
  );
}
