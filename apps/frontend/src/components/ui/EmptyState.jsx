// components/ui/EmptyState.jsx
import { Search, Users, Loader } from "lucide-react";

const EmptyState = ({ type = "empty", search = "" }) => {
  let title = "";
  let message = "";
  let Icon = Users;

  switch (type) {
    case "loading":
      title = "Loading members...";
      message = "Please wait while we fetch the data.";
      Icon = Loader;
      break;
    case "search":
      title = `No results found for "${search}"`;
      message = "Try a different name, email, or phone number.";
      Icon = Search;
      break;
    case "empty":
    default:
      title = "No members found";
      message = "Start by adding a new member.";
      Icon = Users;
      break;
  }

  return (
    <div className="py-20 text-center">
      <div className="flex flex-col items-center justify-center space-y-4 text-gray-500">
        <Icon className="w-10 h-10 animate-pulse text-gray-400" />
        <div>
          <h3 className="text-lg font-semibold">{title}</h3>
          <p className="text-sm">{message}</p>
        </div>
      </div>
    </div>
  );
};

export default EmptyState;
