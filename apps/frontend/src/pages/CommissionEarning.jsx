import { useEffect } from "react";
import { getCommissionEarnings } from "../redux/slices/commissionSlice";
import { useDispatch } from "react-redux";
function CommissionEarning() {
  const dispatch = useDispatch();
  useEffect(() => {
    dispatch(getCommissionEarnings());
  }, [dispatch]);

  return <div>CommissionEarning</div>;
}

export default CommissionEarning;
