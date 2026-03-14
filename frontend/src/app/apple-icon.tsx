import { ImageResponse } from "next/og";

export const size = { width: 180, height: 180 };
export const contentType = "image/png";

export default function AppleIcon() {
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
        }}
      >
        <div
          style={{
            position: "absolute",
            width: "130px",
            height: "130px",
            borderRadius: "50%",
            background: "rgba(0,229,255,0.08)",
            display: "flex",
          }}
        />
        <div
          style={{
            width: "68px",
            height: "68px",
            background: "#00E5FF",
            transform: "rotate(45deg)",
            borderRadius: "10px",
            boxShadow: "0 0 40px rgba(0,229,255,0.6)",
            display: "flex",
          }}
        />
        <div
          style={{
            position: "absolute",
            width: "18px",
            height: "18px",
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
