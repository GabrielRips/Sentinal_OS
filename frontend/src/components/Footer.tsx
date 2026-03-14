export default function Footer() {
  return (
    <footer className="border-t border-[#1A1A1A]">
      <div className="max-w-7xl mx-auto px-6 lg:px-12 py-6 flex items-center justify-between">
        <div className="flex items-center gap-2.5">
          <img src="/sentinel-os.png" alt="Sentinel OS" className="h-4 w-auto rounded-sm" />
          <span className="text-[10px] text-[#333] font-mono tracking-wider uppercase">
            Sentinel OS
          </span>
        </div>
        <span className="text-[10px] text-[#333] font-mono tracking-wider">
          2026
        </span>
      </div>
    </footer>
  );
}
