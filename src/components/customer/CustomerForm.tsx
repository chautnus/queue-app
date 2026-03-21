"use client";

import { useState } from "react";
import { useTranslations } from "next-intl";

type Field = {
  name: string;
  label: string;
  type: string;
  required: boolean;
  options?: string[];
};

type Props = {
  fields: Field[];
  onSubmit: (data: Record<string, unknown>) => void;
  onBack: () => void;
};

export default function CustomerForm({ fields, onSubmit, onBack }: Props) {
  const t = useTranslations("customer");
  const tc = useTranslations("common");
  const [values, setValues] = useState<Record<string, string>>({});

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSubmit(values);
  };

  const update = (name: string, value: string) => {
    setValues((prev) => ({ ...prev, [name]: value }));
  };

  return (
    <div className="card p-6">
      <h2 className="text-lg font-semibold text-slate-900 mb-1">{t("your_info")}</h2>
      <p className="text-sm text-slate-500 mb-6">
        {t("your_info_desc")}
      </p>

      <form onSubmit={handleSubmit} className="space-y-4">
        {fields.map((field) => (
          <div key={field.name}>
            <label className="block text-sm font-medium text-slate-700 mb-1.5">
              {field.label}
              {field.required && <span className="text-red-500 ml-1">*</span>}
            </label>

            {field.type === "select" && field.options ? (
              <select
                value={values[field.name] ?? ""}
                onChange={(e) => update(field.name, e.target.value)}
                required={field.required}
                className="input"
              >
                <option value="">{t("select_option")}</option>
                {field.options.map((opt) => (
                  <option key={opt} value={opt}>
                    {opt}
                  </option>
                ))}
              </select>
            ) : (
              <input
                type={field.type === "number" ? "number" : field.type === "tel" ? "tel" : field.type === "email" ? "email" : "text"}
                value={values[field.name] ?? ""}
                onChange={(e) => update(field.name, e.target.value)}
                required={field.required}
                className="input"
                placeholder={field.label}
              />
            )}
          </div>
        ))}

        <div className="flex gap-3 pt-2">
          <button
            type="button"
            onClick={onBack}
            className="btn-ghost flex-1 py-3 border border-slate-200"
          >
            {tc("back")}
          </button>
          <button
            type="submit"
            className="btn-primary flex-1 py-3"
          >
            {tc("continue")}
          </button>
        </div>
      </form>
    </div>
  );
}
