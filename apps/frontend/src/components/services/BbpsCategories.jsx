import { useState } from "react";
import { useDispatch, useSelector } from "react-redux";
import { selectBiller } from "../../redux/slices/bbpsSlice";
import BbpsDynamicForm from "../forms/services/BbpsDynamicForm";
import {
  ArrowLeft,
  CreditCard,
  Zap,
  Wallet,
  TrendingUp,
  Shield,
} from "lucide-react";

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

  // Helper to get category icon
  const getCategoryIcon = (category) => {
    const icons = {
      Electricity: Zap,
      "Credit Card": CreditCard,
      Wallet: Wallet,
      Insurance: Shield,
      DTH: TrendingUp,
    };
    const Icon = icons[category] || CreditCard;
    return <Icon className="w-5 h-5 text-blue-500" />;
  };

  return (
    <>
      <div className="">
        <div className="space-y-6">
          {/* CATEGORY GRID */}
          {!selectedService && (
            <div className="space-y-8">
              {data.map((section, index) => (
                <div
                  key={index}
                  className="bg-white rounded-2xl border border-gray-100 shadow-xl hover:shadow-2xl transition-shadow duration-300 overflow-hidden"
                >
                  {/* Category Header */}
                  <div className="bg-gradient-to-r from-gray-50 to-white px-6 py-4 border-b border-gray-100">
                    <div className="flex items-center space-x-3">
                      <div className="bg-blue-100 p-2 rounded-lg">
                        {getCategoryIcon(section.category)}
                      </div>
                      <h2 className="text-xl font-bold text-gray-800">
                        {section.category}
                      </h2>
                      <span className="text-xs bg-blue-100 text-blue-600 px-2 py-1 rounded-full">
                        {section.services.length} Services
                      </span>
                    </div>
                  </div>

                  {/* Services Grid */}
                  <div className="p-6">
                    <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-4">
                      {section.services.map((item, i) => (
                        <div
                          key={i}
                          onClick={() => handleClick(item)}
                          className="group cursor-pointer bg-gradient-to-br from-white to-gray-50 hover:from-blue-50 hover:to-white border border-gray-200 hover:border-blue-300 rounded-xl transition-all duration-300 hover:shadow-lg hover:-translate-y-1 p-4 flex flex-col items-center justify-center text-center"
                        >
                          <div className="bg-white p-3 rounded-full shadow-md group-hover:shadow-lg group-hover:scale-110 transition-all duration-300">
                            <img
                              src={
                                item.image ||
                                "https://img.icons8.com/color/1200/image.jpg"
                              }
                              className="w-10 h-10 object-contain"
                              alt={item.name}
                            />
                          </div>
                          <p className="text-sm font-medium mt-3 text-gray-700 group-hover:text-blue-600 transition-colors">
                            {item.name}
                          </p>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}

          {/* FORM VIEW */}
          {selectedService && (
            <div className="bg-white rounded-2xl border border-gray-200 shadow-xl p-6 space-y-5 animate-fadeIn">
              {/* HEADER */}
              <div className="flex items-center justify-between pb-4 border-b border-gray-100">
                <button
                  onClick={() => {
                    setSelectedService(null);
                    dispatch(resetBiller());
                  }}
                  className="flex items-center gap-2 text-sm text-blue-600 hover:text-blue-800 font-medium transition-colors"
                >
                  <ArrowLeft size={18} />
                  Back to Categories
                </button>

                <div className="flex items-center gap-2 bg-blue-50 px-4 py-2 rounded-full">
                  <div className="bg-blue-500 p-1 rounded-full">
                    <CreditCard className="w-3 h-3 text-white" />
                  </div>
                  <h2 className="text-lg font-semibold text-gray-800">
                    {selectedService}
                  </h2>
                </div>
              </div>

              {/* CONTENT */}
              <div className="mt-2">
                {isLoading ? (
                  <div className="flex flex-col items-center justify-center py-12">
                    <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500"></div>
                    <p className="text-sm text-gray-500 mt-4 animate-pulse">
                      Loading billers...
                    </p>
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
      </div>

      <style jsx>{`
        @keyframes fadeIn {
          from {
            opacity: 0;
            transform: translateY(10px);
          }
          to {
            opacity: 1;
            transform: translateY(0);
          }
        }
        .animate-fadeIn {
          animation: fadeIn 0.3s ease-out;
        }
      `}</style>
    </>
  );
};

export default BbpsCategories;
