// frontend/src/components/ui/Spinner.jsx
export default function Spinner({ size = 24, className = '' }) {
  return (
    <span
      className={`inline-block border-2 border-brand-500 border-t-transparent rounded-full animate-spin ${className}`}
      style={{ width: size, height: size }}
    />
  );
}