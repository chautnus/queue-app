import { Metadata } from "next";
import BrandPageContent from "./BrandPageContent";

export const metadata: Metadata = { title: "Brand" };

export default function BrandPage() {
  return <BrandPageContent />;
}
