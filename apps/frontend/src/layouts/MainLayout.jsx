import { Outlet } from "react-router-dom";
import Sidebar from "../components/Sidebar";
import Navbar from "../components/Navbar";
import Footer from "../components/Footer";
import usePageTitle from "../hooks/usePageTitle";

const MainLayout = () => {
  usePageTitle();
  return (
    <div className="">
      {/* {loading && <Loader />}  */}
      <Sidebar />
      <div className="ml-64 flex flex-col h-screen">
        <Navbar />
        <div className="flex-1 bg-linear-to-br from-gray-50 via-blue-50 to-indigo-100 p-6 overflow-auto">
          <Outlet />
          <Footer />
        </div>
      </div>
    </div>
  );
};

export default MainLayout;
