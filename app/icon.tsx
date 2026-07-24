import { ImageResponse } from "next/og";

export const size = { width: 32, height: 32 };
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
          background: "#1C1813",
          borderRadius: 7,
        }}
      >
        <div
          style={{
            width: 22,
            height: 22,
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            borderRadius: 5,
            background: "#F2B134",
            color: "#241804",
            fontSize: 16,
            fontWeight: 800,
            fontFamily: "system-ui, sans-serif",
          }}
        >
          P
        </div>
      </div>
    ),
    { ...size }
  );
}
