import Link from "next/link";

const productLinks = [
  { href: "/how-it-works", label: "Technology" },
  { href: "/control", label: "Control Panel" },
  { href: "/sports", label: "Sports" },
  { href: "/live-feed", label: "Live Feed" },
];

const companyLinks = [
  { href: "#", label: "About" },
  { href: "#", label: "Careers" },
  { href: "#", label: "Contact" },
  { href: "#", label: "Press" },
];

const connectLinks = [
  { href: "#", label: "Twitter" },
  { href: "#", label: "GitHub" },
  { href: "#", label: "Discord" },
];

export default function Footer() {
  return (
    <footer className="border-t border-[#1A1A1A] mt-32">
      <div className="max-w-7xl mx-auto px-6 lg:px-12 py-16">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-12">
          <div>
            <div className="flex items-center gap-3 mb-5">
              <div className="w-5 h-5 border border-[#EDEDED] flex items-center justify-center">
                <div className="w-1.5 h-1.5 bg-[#CDFF00]" />
              </div>
              <span className="text-xs font-medium tracking-[0.2em] text-[#EDEDED] uppercase">
                SkySearch
              </span>
            </div>
            <p className="text-xs text-[#555] leading-relaxed max-w-[240px]">
              Autonomous AI-powered drone reconnaissance. Built for every DJI platform.
            </p>
          </div>

          <div>
            <h4 className="text-[10px] font-medium text-[#555] uppercase tracking-[0.2em] mb-5">
              Product
            </h4>
            <div className="flex flex-col gap-3">
              {productLinks.map((link) => (
                <Link
                  key={link.label}
                  href={link.href}
                  className="text-xs text-[#888] hover:text-[#EDEDED] transition-colors"
                >
                  {link.label}
                </Link>
              ))}
            </div>
          </div>

          <div>
            <h4 className="text-[10px] font-medium text-[#555] uppercase tracking-[0.2em] mb-5">
              Company
            </h4>
            <div className="flex flex-col gap-3">
              {companyLinks.map((link) => (
                <Link
                  key={link.label}
                  href={link.href}
                  className="text-xs text-[#888] hover:text-[#EDEDED] transition-colors"
                >
                  {link.label}
                </Link>
              ))}
            </div>
          </div>

          <div>
            <h4 className="text-[10px] font-medium text-[#555] uppercase tracking-[0.2em] mb-5">
              Connect
            </h4>
            <div className="flex flex-col gap-3">
              {connectLinks.map((link) => (
                <Link
                  key={link.label}
                  href={link.href}
                  className="text-xs text-[#888] hover:text-[#EDEDED] transition-colors"
                >
                  {link.label}
                </Link>
              ))}
            </div>
          </div>
        </div>

        <div className="border-t border-[#1A1A1A] mt-12 pt-8 flex flex-col sm:flex-row justify-between items-center gap-4">
          <p className="text-[10px] text-[#555] tracking-wider uppercase">
            &copy; 2026 SkySearch Systems
          </p>
          <p className="text-[10px] text-[#333] tracking-wider uppercase">
            Built for DJI platforms
          </p>
        </div>
      </div>
    </footer>
  );
}
