// Shown by Next.js while any customer route is loading. Keeps the phone frame
// filled with a soft skeleton so tapping a card gives instant feedback.
export default function Loading() {
  return (
    <div
      className="h-full w-full flex items-center justify-center"
      style={{ background: "#EAF7F5" }}
    >
      <div
        className="w-10 h-10 rounded-full"
        style={{
          border: "3px solid rgba(14,165,164,0.18)",
          borderTopColor: "var(--color-teal)",
          animation: "dl-spin 0.8s linear infinite",
        }}
      />
    </div>
  );
}
