import { Metadata } from "next";
import BrandSettings from "./BrandSettings";

export const metadata: Metadata = { title: "Thương hiệu" };

export default function BrandPage() {
  return (
    <div>
      <h1 className="text-2xl font-bold text-slate-900 mb-6">Thương hiệu</h1>
      <BrandSettings />
    </div>
  );
}
