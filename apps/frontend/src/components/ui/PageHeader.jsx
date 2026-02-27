import { Link } from "react-router-dom";

const PageHeader = ({ breadcrumb = [], title = "", description = "" }) => {
  return (
    <div>
      {/* Breadcrumb */}
      <div className="flex items-center mb-4 text-sm text-gray-600">
        {breadcrumb.map((item, idx) => (
          <span key={idx} className="flex items-center">
            <Link
            to={'/dashboard'}
              className={`${
                idx === breadcrumb.length - 1 ? "text-gray-900 font-medium" : ""
              }`}
            >
              {item}
            </Link>
            {idx < breadcrumb.length - 1 && (
              <span className="mx-2 text-gray-400">/</span>
            )}
          </span>
        ))}
      </div>

      {/* Title + Description */}
      <div>
        <h1 className="text-3xl font-bold text-gray-900 mb-2">{title}</h1>
        {description && <p className="text-gray-600">{description}</p>}
      </div>
    </div>
  );
};

export default PageHeader;
