import { X } from "lucide-react";

function CloseBtn({
  isClose,
  disabled = false,
  title = "Close",
  variant = "icon",
  children = "Cancel",
}) {
  const baseStyles = `
    duration-300 cursor-pointer focus:outline-none focus:ring-2 focus:ring-black/20
    disabled:opacity-50 disabled:cursor-not-allowed transition-all
  `;

  const variantStyles = {
    icon: "bg-black/10 p-1 h-fit rounded hover:bg-black/15",
    text: "px-4 py-2 border border-gray-300 text-gray-700 rounded-md hover:bg-gray-50",
  };

  return (
    <button
      type="button"
      onClick={isClose}
      disabled={disabled}
      title={title}
      className={`${baseStyles} ${variantStyles[variant]}`}
      aria-label={title}
    >
      {variant === "icon" ? <X className="w-4 h-4" /> : children}
    </button>
  );
}

export default CloseBtn;
