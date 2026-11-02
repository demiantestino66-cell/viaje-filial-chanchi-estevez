export default function SocioSkeleton() {
  return (
    <div
      role="status"
      aria-label="Buscando los datos del socio"
      className="space-y-3 rounded-2xl border border-sky-400/20 bg-slate-950/70 p-4"
    >
      <span className="sr-only">Buscando los datos del socio...</span>
      <div className="flex items-center gap-3">
        <div className="h-14 w-14 animate-pulse rounded-xl bg-slate-700/80" />
        <div className="flex-1 space-y-2">
          <div className="h-3 w-2/3 animate-pulse rounded bg-slate-700/80" />
          <div className="h-3 w-1/2 animate-pulse rounded bg-slate-800" />
        </div>
      </div>
      <div className="h-3 w-full animate-pulse rounded bg-slate-800" />
      <div className="h-3 w-4/5 animate-pulse rounded bg-slate-800" />
    </div>
  );
}
