import React from "react";

function HeaderSection({ title, tagLine, icon: Icon, totalCount }) {
  return (
    <div className="bg-gradient-to-r from-cyan-500 via-blue-600 to-indigo-700 text-white p-8 rounded-2xl shadow-xl mb-8 relative overflow-hidden">
      <div className="relative z-10">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <h1 className="text-4xl font-bold mb-2 tracking-tight">{title}</h1>
            <p className="text-blue-100 text-lg">{tagLine}</p>
          </div>

          {/* Agar icon aur totalCount diye gaye ho tabhi render hoga */}
          {Icon && totalCount && (
            <div className="flex items-center space-x-6">
              <div className="flex items-center space-x-2 bg-white/15 backdrop-blur-sm rounded-full px-4 py-2 border border-white/20">
                <Icon className="w-5 h-5" />
                <span className="text-sm font-medium">{totalCount}</span>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

export default HeaderSection;
