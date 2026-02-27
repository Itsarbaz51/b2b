const StateCard = ({
  title,
  value,
  subText,
  icon: Icon,
  iconBg = "bg-gray-100",
  iconColor = "text-gray-600",
}) => {
  return (
    <div className="bg-white p-6 rounded-xl shadow-lg border border-gray-100 hover:shadow-xl transition-all duration-300 transform hover:-translate-y-1">
      <div className="flex items-center justify-between">
        <div>
          <p className="text-sm font-medium text-gray-600 mb-1">{title}</p>
          <p className={`text-3xl font-bold ${iconColor}`}>{value}</p>
          {subText && <p className="text-xs text-gray-500 mt-1">{subText}</p>}
        </div>
        <div className={`${iconBg} p-3 rounded-full`}>
          {Icon && <Icon className={`h-8 w-8 ${iconColor}`} />}
        </div>
      </div>
    </div>
  );
};

export default StateCard;
