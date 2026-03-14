import Link from "next/link";

export default function Navbar() {
  return (
    <nav className="fixed top-0 left-0 right-0 z-50 h-14 flex items-center justify-between px-4 lg:px-6 bg-[#141A24]/95 backdrop-blur-md border-b border-[#2B3342]">
      <Link href="/">
        <img
          src="/sentinel-os.png"
          alt="Sentinel OS"
          style={{ height: "24px", width: "auto" }}
        />
      </Link>

      <Link
        href="/control"
        className="text-[11px] tracking-[0.12em] uppercase text-[#0F141D] bg-[#F4F7FC] hover:bg-white px-4 py-1.5 transition-colors duration-200 font-semibold border border-[#2B3342]"
      >
        Launch
      </Link>
    </nav>
  );
}
