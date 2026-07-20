// Shown while backoffice sections load. Keeps the shell chrome visible.
export default function Loading() {
  return (
    <div className="flex items-center justify-center py-24">
      <div
        className="w-8 h-8 rounded-full"
        style={{
          border: "3px solid rgba(14,165,164,0.18)",
          borderTopColor: "var(--color-teal)",
          animation: "dl-spin 0.8s linear infinite",
        }}
      />
    </div>
  );
}
