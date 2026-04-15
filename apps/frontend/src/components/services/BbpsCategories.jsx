import { useState } from "react";
import { useDispatch, useSelector } from "react-redux";
import { selectBiller } from "../../redux/slices/bbpsSlice";
import BbpsDynamicForm from "../forms/services/BbpsDynamicForm";
import { ArrowLeft } from "lucide-react";

const BbpsCategories = ({ data = [], serviceProviderMappingId }) => {
  const dispatch = useDispatch();
  const [selectedService, setSelectedService] = useState(null);

  const { billDetails, isLoading } = useSelector((s) => s.bbps);

  const formatCategory = (s) =>
    s.replace(/-/g, " ").replace(/\b\w/g, (c) => c.toUpperCase());

  const handleClick = (item) => {
    setSelectedService(item.name);

    dispatch(
      selectBiller({
        biller: formatCategory(item.name),
        serviceProviderMappingId,
      }),
    );
  };

  return (
    <div className="space-y-6">
      {/* 🔥 CATEGORY GRID */}
      {!selectedService && (
        <div className="space-y-6">
          {data.map((section, index) => (
            <div
              key={index}
              className="bg-white rounded-2xl border border-gray-200 shadow-sm p-6"
            >
              <h2 className="text-lg font-semibold text-gray-800 mb-5">
                {section.category}
              </h2>

              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                {section.services.map((item, i) => (
                  <div
                    key={i}
                    onClick={() => handleClick(item)}
                    className="group cursor-pointer bg-gray-50 hover:bg-blue-50 border border-gray-200 hover:border-blue-300 transition-all duration-200 p-4 rounded-xl flex flex-col items-center justify-center text-center"
                  >
                    <div className="bg-white p-3 rounded-full shadow-sm group-hover:scale-105 transition">
                      <img
                        src={
                          item.image ||
                          "https://img.icons8.com/color/1200/image.jpg"
                        }
                        className="w-8 h-8 object-contain"
                      />
                    </div>

                    <p className="text-sm font-medium mt-3 text-gray-700 group-hover:text-blue-600">
                      {item.name}
                    </p>
                  </div>
                ))}
              </div>
            </div>
          ))}
        </div>
      )}

      {/* 🔥 FORM VIEW */}
      {selectedService && (
        <div className="bg-white rounded-2xl border border-gray-200 shadow-sm p-6 space-y-5">
          {/* HEADER */}
          <div className="flex items-center justify-between">
            <button
              onClick={() => setSelectedService(null)}
              className="flex items-center gap-2 text-sm text-blue-600 hover:text-blue-800"
            >
              <ArrowLeft size={16} />
              Back
            </button>

            <h2 className="text-lg font-semibold text-gray-800">
              {selectedService}
            </h2>
          </div>

          {/* CONTENT */}
          <div className="mt-2">
            {isLoading ? (
              <div className="text-sm text-gray-500 animate-pulse">
                Loading billers...
              </div>
            ) : (
              <BbpsDynamicForm
                billers={billDetails || []}
                serviceProviderMappingId={serviceProviderMappingId}
              />
            )}
          </div>
        </div>
      )}
    </div>
  );
};

export default BbpsCategories;
