export default function GlassCard({
  children,
  className = "",
  hover = true,
}: {
  children: React.ReactNode;
  className?: string;
  hover?: boolean;
}) {
  return (
    <div
      className={`bg-[#111] border border-[#1A1A1A] p-8 transition-colors duration-200 ${
        hover ? "hover:border-[#2A2A2A] cursor-pointer" : ""
      } ${className}`}
    >
      {children}
    </div>
  );
}
