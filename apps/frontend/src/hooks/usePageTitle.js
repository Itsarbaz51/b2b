import { useLocation } from "react-router-dom";
import { useEffect } from "react";
import { getNavbarConfig } from "../../index.js";

const usePageTitle = () => {
  const location = useLocation();

  useEffect(() => {
    const config = getNavbarConfig(location.pathname);

    document.title = config?.title ? `${config.title} | Pay` : "Pay";
  }, [location.pathname]);
};

export default usePageTitle;
