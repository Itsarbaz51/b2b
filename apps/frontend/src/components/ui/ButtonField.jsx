import { useSelector } from "react-redux";

function ButtonField({ isOpen, name, icon: Icon, type, isDisabled, btncss }) {
  const loading = useSelector(
    (state) =>
      state.auth?.isLoading ||
      state.kyc?.isLoading ||
      state.user?.isLoading ||
      state.bank?.isLoading ||
      state.wallet?.isLoading ||
      state.commission?.isLoading
  );
  return (
    <button
      type={type}
      disabled={loading}
      className={`${
        btncss
          ? btncss
          : "px-8 h-fit w-fit  bg-black/90 text-center bg-gradient-to-r from-cyan-500 via-blue-600 to-indigo-700 hover:bg-gradient-to-r hover:from-cyan-600 hover:via-blue-700 hover:to-indigo-900 duration-300  text-white py-2 rounded-lg hover:bg-black cursor-pointer transition disabled:bg-gray-400"
      } flex justify-center items-center px-2 gap-2`}
      onClick={isOpen}
    >
      {/* Icon sirf tab dikhe jab pass ho */}
      {Icon && <Icon className="w-4 h-4" />}
      {loading ? "Loading..." : name}
    </button>
  );
}

export default ButtonField;
