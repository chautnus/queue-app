import pkg from "../../package.json";

export default function VersionFooter() {
  return (
    <div className="fixed bottom-4 right-4 z-[99999] pointer-events-none">
      <span className="bg-blue-600 text-white text-[12px] font-bold px-3 py-1.5 rounded-lg shadow-2xl border-2 border-white animate-bounce-subtle">
        v{pkg.version}
      </span>
    </div>
  );
}
