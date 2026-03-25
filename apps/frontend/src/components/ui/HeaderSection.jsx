import CloseBtn from "./CloseBtn";

function HeaderSection({ title, tagLine, icon: Icon, totalCount, isClose }) {
  return (
    <div className="relative overflow-hidden bg-linear-to-r from-blue-600 via-blue-700 to-indigo-700 text-white p-8 shadow-xl mb-8 rounded-t-2xl">
      <div className="absolute inset-0 bg-black opacity-10 pointer-events-none"></div>
      <div className="absolute top-0 right-0 w-64 h-64 bg-white opacity-10 rounded-full -mr-32 -mt-32 pointer-events-none"></div>

      <div className="absolute bottom-0 left-0 w-48 h-48 bg-white opacity-20 rounded-full -ml-24 -mb-24 pointer-events-none"></div>

      {/* Content */}
      <div className="relative z-10">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <h1 className="text-4xl font-bold mb-2 tracking-tight">{title}</h1>
            <p className="text-blue-100 text-lg">{tagLine}</p>
          </div>

          {/* Icon + Count */}
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

      {/* 🔥 FIX: always clickable */}
      {isClose && (
        <div className="absolute top-4 right-4 z-50">
          <CloseBtn isClose={isClose} />
        </div>
      )}
    </div>
  );
}

export default HeaderSection;
