import { useLocation } from "react-router-dom";
import { useEffect } from "react";
import { navbarTitleConfig } from "../../index.js";

const usePageTitle = () => {
  const location = useLocation();

  useEffect(() => {
    const path = location.pathname;

    // Exact match
    let config = navbarTitleConfig[path];

    // Dynamic route handle (e.g. /profile/:id)
    if (!config) {
      const dynamicRoute = Object.keys(navbarTitleConfig).find((route) => {
        if (route.includes(":")) {
          const baseRoute = route.split("/:")[0];
          return path.startsWith(baseRoute);
        }
        return false;
      });

      config = navbarTitleConfig[dynamicRoute];
    }

    if (config?.title) {
      document.title = `${config.title} | Pay`;
    } else {
      document.title = "Pay";
    }
  }, [location.pathname]);
};

export default usePageTitle;