import { useEffect } from "react";
import PageHeader from "../../components/ui/PageHeader";
import { useDispatch, useSelector } from "react-redux";
import { getBbpsCategories } from "../../redux/slices/bbpsSlice";
import { SERVICES } from "../../utils/constants";
import { usePermissions } from "../../hooks/usePermission";
import BbpsCategories from "../../components/services/BbpsCategories";
import RefreshToast from "../../components/ui/RefreshToast";

const BbpsPage = () => {
  const dispatch = useDispatch();

  const { canProcess, defaultProvider } = usePermissions(SERVICES.BBPS);
  const serviceProviderMappingId = defaultProvider?.serviceProviderMappingId;

  const { categories, isLoading } = useSelector((s) => s.bbps);

  const fetchRequests = () => {
    if (!serviceProviderMappingId || !canProcess) return;

    dispatch(getBbpsCategories({ serviceProviderMappingId }));
  };

  useEffect(() => {
    if (canProcess) fetchRequests();
  }, [serviceProviderMappingId, canProcess]);

  return (
    <div className="space-y-6">
      <PageHeader
        breadcrumb={["Dashboard", "Bill Payments"]}
        title="Bill Payments"
        description="Pay all your bills in one place"
      />

      {!canProcess ? (
        <div className="bg-white p-6 rounded-xl border text-center text-gray-500">
          You don’t have permission to access BBPS services.
        </div>
      ) : (
        <>
          <div className="flex justify-end">
            <RefreshToast
              isLoading={isLoading}
              onClick={fetchRequests}
              label="Refresh Bills"
            />
          </div>

          <BbpsCategories
            data={categories?.data}
            loading={isLoading}
            serviceProviderMappingId={serviceProviderMappingId} // ✅ FIX
          />
        </>
      )}
    </div>
  );
};

export default BbpsPage;
