import { ImageResponse } from "next/og";

export const size = { width: 192, height: 192 };
export const contentType = "image/png";

export default function Icon() {
  return new ImageResponse(
    (
      <div
        style={{
          width: "100%",
          height: "100%",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          background: "#06060C",
          borderRadius: "32px",
        }}
      >
        {/* Outer glow ring */}
        <div
          style={{
            position: "absolute",
            width: "140px",
            height: "140px",
            borderRadius: "50%",
            background: "rgba(0,229,255,0.08)",
            display: "flex",
          }}
        />
        {/* Diamond ◆ */}
        <div
          style={{
            width: "72px",
            height: "72px",
            background: "#00E5FF",
            transform: "rotate(45deg)",
            borderRadius: "10px",
            boxShadow: "0 0 40px rgba(0,229,255,0.6)",
            display: "flex",
          }}
        />
        {/* Inner white dot */}
        <div
          style={{
            position: "absolute",
            width: "20px",
            height: "20px",
            background: "white",
            transform: "rotate(45deg)",
            borderRadius: "3px",
            display: "flex",
          }}
        />
      </div>
    ),
    { ...size }
  );
}
