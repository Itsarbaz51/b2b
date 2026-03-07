function ButtonField({
  isOpen,
  name,
  icon: Icon,
  type = "button",
  isDisabled = false,
  btncss = "",
  isLoading = false,
}) {
  const baseClass =
    "flex items-center justify-center gap-2 px-4 py-2 rounded-lg transition";

  const defaultStyle =
    "bg-gradient-to-r from-cyan-500 via-blue-600 to-indigo-700 text-white hover:from-cyan-600 hover:via-blue-700 hover:to-indigo-900";

  return (
    <button
      type={type}
      disabled={isDisabled}
      onClick={!isDisabled ? isOpen : undefined}
      className={`${baseClass} ${
        btncss ? btncss : defaultStyle
      } ${isDisabled ? "opacity-60 cursor-not-allowed" : "cursor-pointer"}`}
    >
      {Icon && <Icon className="w-4 h-4" />}
      {isLoading ? "Loading..." : name}
    </button>
  );
}

export default ButtonField;
