import pkg from "../../package.json";

export default function VersionFooter() {
  return (
    <div className="fixed bottom-2 right-2 z-[9999] pointer-events-none opacity-50 hover:opacity-100 transition-opacity">
      <span className="bg-slate-900 text-white text-[10px] font-mono px-2 py-1 rounded-md shadow-lg border border-white/10">
        v{pkg.version}
      </span>
    </div>
  );
}
