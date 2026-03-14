"use client";

import { useState } from "react";

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
  const [values, setValues] = useState<Record<string, string>>({});

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSubmit(values);
  };

  const update = (name: string, value: string) => {
    setValues((prev) => ({ ...prev, [name]: value }));
  };

  return (
    <div className="bg-white rounded-2xl border border-gray-100 p-6">
      <h2 className="text-lg font-semibold text-gray-900 mb-1">Your Information</h2>
      <p className="text-sm text-gray-500 mb-6">
        Please fill in the required details.
      </p>

      <form onSubmit={handleSubmit} className="space-y-4">
        {fields.map((field) => (
          <div key={field.name}>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              {field.label}
              {field.required && <span className="text-red-500 ml-1">*</span>}
            </label>

            {field.type === "select" && field.options ? (
              <select
                value={values[field.name] ?? ""}
                onChange={(e) => update(field.name, e.target.value)}
                required={field.required}
                className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                <option value="">Select...</option>
                {field.options.map((opt) => (
                  <option key={opt} value={opt}>
                    {opt}
                  </option>
                ))}
              </select>
            ) : (
              <input
                type={field.type === "number" ? "number" : field.type === "phone" ? "tel" : field.type === "email" ? "email" : "text"}
                value={values[field.name] ?? ""}
                onChange={(e) => update(field.name, e.target.value)}
                required={field.required}
                className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500"
                placeholder={field.label}
              />
            )}
          </div>
        ))}

        <div className="flex gap-3 pt-2">
          <button
            type="button"
            onClick={onBack}
            className="flex-1 py-3 border border-gray-300 text-gray-700 font-medium rounded-xl hover:bg-gray-50"
          >
            Back
          </button>
          <button
            type="submit"
            className="flex-1 py-3 bg-blue-600 text-white font-medium rounded-xl hover:bg-blue-700"
          >
            Continue
          </button>
        </div>
      </form>
    </div>
  );
}
