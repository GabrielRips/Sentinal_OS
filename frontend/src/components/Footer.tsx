export default function Footer() {
  return (
    <footer className="border-t border-[#1A1A1A]">
      <div className="max-w-7xl mx-auto px-6 lg:px-12 py-6 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="w-4 h-4 border border-[#333] flex items-center justify-center">
            <div className="w-1 h-1 bg-[#CDFF00]" />
          </div>
          <span className="text-[10px] text-[#333] font-mono tracking-wider uppercase">
            SkySearch &mdash; Sentinal OS
          </span>
        </div>
        <span className="text-[10px] text-[#333] font-mono tracking-wider">
          2026
        </span>
      </div>
    </footer>
  );
}
