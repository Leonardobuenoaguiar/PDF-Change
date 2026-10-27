export function Logo({ className = "" }: { className?: string }) {
  return (
    <div className={`flex items-center gap-2.5 ${className}`}>
      <div className="relative grid h-9 w-9 place-items-center rounded-xl bg-ink">
        <div className="absolute -bottom-1 -right-1 h-4 w-4 rounded-md bg-brand" />
        <svg viewBox="0 0 24 24" className="relative h-5 w-5 text-white" fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round">
          <path d="M14 3v5h5" />
          <path d="M19 10v9a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h7l5 5z" />
        </svg>
      </div>
      <span className="text-lg font-semibold tracking-tight text-ink">
        PDF<span className="text-brand"> Change</span>
      </span>
    </div>
  );
}
