import React, { useEffect } from "react";
import { useDispatch } from "react-redux";
function FundRequest() {
  const dispatch = useDispatch;
  useEffect(() => {dispatch()}, [dispatch]);
  return <div>FundRequest</div>;
}

export default FundRequest;
