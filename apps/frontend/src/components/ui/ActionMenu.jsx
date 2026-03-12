import { useState, useRef, useEffect } from "react";
import { MoreVertical } from "lucide-react";

const ActionMenu = ({ items = [] }) => {
  const [open, setOpen] = useState(false);
  const ref = useRef();

  // close menu outside click
  useEffect(() => {
    const handleClickOutside = (e) => {
      if (ref.current && !ref.current.contains(e.target)) {
        setOpen(false);
      }
    };

    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  return (
    <div className="relative inline-block" ref={ref}>
      {/* Trigger */}
      <button
        onClick={() => setOpen(!open)}
        className="p-2 rounded hover:bg-gray-100"
      >
        <MoreVertical className="w-4 h-4" />
      </button>

      {/* Menu */}
      {open && (
        <div className="absolute right-0 mt-2 w-44 bg-white border border-gray-300 rounded-lg shadow-lg z-50">
          {items.map((item, index) => {
            const Icon = item.icon;

            return (
              <button
                key={index}
                onClick={() => {
                  item.onClick();
                  setOpen(false);
                }}
                className={`w-full flex items-center gap-3 px-4 py-2 text-sm hover:bg-gray-50 ${
                  item.danger ? "text-red-600 hover:bg-red-50" : "text-gray-700"
                }`}
              >
                {Icon && <Icon className="w-4 h-4" />}
                {item.label}
              </button>
            );
          })}
        </div>
      )}
    </div>
  );
};

export default ActionMenu;
