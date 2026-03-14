import Image from "next/image";
import Link from "next/link";

export default function Navbar() {
  return (
    <nav className="fixed top-0 left-0 right-0 z-50 h-14 flex items-center justify-between px-6 lg:px-12 bg-[#0A0A0A]/90 backdrop-blur-md border-b border-[#1A1A1A]">
      <Link href="/">
        <Image
          src="/sentinel-os.png"
          alt="Sentinel OS"
          width={160}
          height={40}
          className="h-9 w-auto"
        />
      </Link>

      <Link
        href="/control"
        className="text-xs tracking-[0.1em] uppercase text-[#0A0A0A] bg-[#CDFF00] hover:bg-[#d8ff33] px-5 py-2 transition-colors duration-200 font-medium"
      >
        Launch
      </Link>
    </nav>
  );
}
