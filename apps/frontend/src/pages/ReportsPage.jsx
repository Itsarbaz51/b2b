import { useEffect, useState } from "react";
import { TrendingUp, Wallet, ArrowDownCircle, User } from "lucide-react";
import { useDispatch, useSelector } from "react-redux";
import PageHeader from "../components/ui/PageHeader";
import StateCard from "../components/ui/StateCard";
import { getReports } from "../redux/slices/reportSlice";
import ReportTable from "../components/tabels/ReportTable";
import { paisaToRupee } from "../utils/lib";

const ReportsPage = () => {
  const dispatch = useDispatch();
  const { reports, isLoading } = useSelector((s) => s.report);

  const [serviceWise, setServiceWise] = useState(false);
  const [userId, setUserId] = useState("");

  // FETCH API
  useEffect(() => {
    const params = {};

    if (serviceWise) params.service = true;
    if (userId) params.userId = userId;

    dispatch(getReports(params));
  }, [dispatch, serviceWise, userId]);

  const isArray = Array.isArray(reports);

  return (
    <div>
      <PageHeader
        breadcrumb={["Dashboard", "Reports"]}
        title="Reports & Profit"
        description="Monitor earnings, profit & service performance"
      />

      {/* FILTER BAR */}
      <div className="mt-6 flex flex-col md:flex-row gap-4">
        {/* Toggle */}
        <div className="flex gap-2">
          <button
            onClick={() => setServiceWise(false)}
            className={`px-4 py-2 rounded-lg ${
              !serviceWise
                ? "bg-blue-600 text-white"
                : "bg-gray-100 text-gray-600"
            }`}
          >
            Summary
          </button>

          <button
            onClick={() => setServiceWise(true)}
            className={`px-4 py-2 rounded-lg ${
              serviceWise
                ? "bg-blue-600 text-white"
                : "bg-gray-100 text-gray-600"
            }`}
          >
            Service Wise
          </button>
        </div>

        {/* User Filter */}
        <div className="flex gap-2 items-center">
          <User className="w-5 h-5 text-gray-400" />

          <input
            type="text"
            placeholder="Enter User ID"
            value={userId}
            onChange={(e) => setUserId(e.target.value)}
            className="px-4 py-2 border border-gray-200 rounded-lg"
          />

          {userId && (
            <button
              onClick={() => setUserId("")}
              className="px-3 py-2 bg-red-100 text-red-600 rounded-lg"
            >
              Clear
            </button>
          )}
        </div>
      </div>

      {/* SUMMARY CARDS */}
      {!isArray && reports && (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mt-8">
          <StateCard
            title="Total Credit"
            value={`₹${paisaToRupee(reports?.totalCredit) || 0}`}
            icon={Wallet}
            iconColor="text-green-600"
          />

          <StateCard
            title="Total Debit"
            value={`₹${paisaToRupee(reports?.totalDebit) || 0}`}
            icon={ArrowDownCircle}
            iconColor="text-red-600"
          />

          <StateCard
            title="Net Profit"
            value={`₹${paisaToRupee(reports?.netProfit) || 0}`}
            icon={TrendingUp}
            iconColor="text-purple-600"
          />
        </div>
      )}

      {/* SERVICE TABLE */}
      {isArray && (
        <div className="mt-8">
          <ReportTable data={reports} loading={isLoading} />
        </div>
      )}
    </div>
  );
};

export default ReportsPage;
