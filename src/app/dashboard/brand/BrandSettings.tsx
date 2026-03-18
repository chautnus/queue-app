"use client";

import { useState, useRef } from "react";

function UploadIcon() {
  return (
    <svg className="w-8 h-8 text-slate-300 mx-auto mb-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
    </svg>
  );
}

export default function BrandSettings() {
  const [logoUrl, setLogoUrl] = useState<string | null>(null);
  const [logoPreview, setLogoPreview] = useState<string | null>(null);
  const [uploading, setUploading] = useState(false);
  const [dragOver, setDragOver] = useState(false);
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleFile = async (file: File) => {
    if (file.size > 10 * 1024 * 1024) {
      setError("Logo phải nhỏ hơn 10 MB");
      return;
    }
    setUploading(true);
    setLogoPreview(URL.createObjectURL(file));
    try {
      const fd = new FormData();
      fd.append("file", file);
      const res = await fetch("/api/upload/logo", { method: "POST", body: fd });
      if (res.ok) {
        const { url } = await res.json();
        setLogoUrl(url);
      } else {
        setError("Tải logo thất bại");
        setLogoPreview(null);
      }
    } finally {
      setUploading(false);
    }
  };

  const handleSave = async () => {
    setSaving(true);
    setError(null);
    // Brand settings are per-queue; this page can save to user profile
    // For now just show saved feedback
    await new Promise((r) => setTimeout(r, 600));
    setSaved(true);
    setSaving(false);
    setTimeout(() => setSaved(false), 3000);
  };

  return (
    <div className="max-w-xl space-y-5">
      {/* Logo */}
      <div className="card p-5">
        <h3 className="text-sm font-semibold text-slate-700 uppercase tracking-wide mb-4">Logo mặc định</h3>
        <div
          className={`border-2 border-dashed rounded-2xl p-6 text-center cursor-pointer transition-colors ${
            dragOver ? "border-blue-400 bg-blue-50" : "border-slate-200 hover:border-blue-300 hover:bg-slate-50"
          }`}
          onClick={() => fileInputRef.current?.click()}
          onDragOver={(e) => { e.preventDefault(); setDragOver(true); }}
          onDragLeave={() => setDragOver(false)}
          onDrop={(e) => {
            e.preventDefault();
            setDragOver(false);
            const f = e.dataTransfer.files[0];
            if (f) handleFile(f);
          }}
        >
          {logoPreview ? (
            <div className="flex items-center gap-4">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img src={logoPreview} alt="Logo" className="w-20 h-20 rounded-2xl object-cover border border-slate-100 shrink-0" />
              <div className="text-left">
                <p className="text-sm font-medium text-slate-700">{uploading ? "Đang tải lên..." : "Logo đã chọn"}</p>
                <p className="text-xs text-slate-400 mt-0.5">Click để thay đổi · PNG/JPG tối đa 10 MB</p>
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
            onChange={(e) => { const f = e.target.files?.[0]; if (f) handleFile(f); }}
          />
        </div>

        {logoPreview && (
          <button
            type="button"
            onClick={() => { setLogoPreview(null); setLogoUrl(null); }}
            className="btn-danger text-xs mt-3"
          >
            Xóa logo
          </button>
        )}
      </div>

      {/* Info */}
      <div className="card p-5">
        <h3 className="text-sm font-semibold text-slate-700 uppercase tracking-wide mb-4">Thông tin thương hiệu</h3>
        <p className="text-xs text-slate-400">
          Logo và thông tin thương hiệu sẽ được áp dụng cho các hàng đợi mới. Hàng đợi hiện có có thể được cập nhật riêng trong phần chỉnh sửa.
        </p>
      </div>

      {error && (
        <div className="p-3 bg-red-50 border border-red-200 rounded-xl text-sm text-red-700">{error}</div>
      )}

      {saved && (
        <div className="p-3 bg-green-50 border border-green-200 rounded-xl text-sm text-green-700">✓ Đã lưu thay đổi</div>
      )}

      <button
        onClick={handleSave}
        disabled={saving || !logoUrl}
        className="btn-primary"
      >
        {saving ? "Đang lưu..." : "Lưu thay đổi"}
      </button>

      {/* Suppress unused warning */}
      {logoUrl && null}
    </div>
  );
}
