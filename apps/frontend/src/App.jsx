import { useEffect } from "react";
import { RouterProvider } from "react-router-dom";
import { createRouter } from "./routes/routes";
import { Provider, useSelector, useDispatch } from "react-redux";
import store from "./redux/store.js";
import { ToastContainer } from "react-toastify";
import { verifyAuth } from "./redux/slices/authSlice";
import { InputSelect } from "./components/ui/Input_select.jsx";

const AppContent = () => {
  const dispatch = useDispatch();
  const { isLoading } = useSelector((state) => state.auth);

  useEffect(() => {
    dispatch(verifyAuth());
  }, [dispatch]);

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  const router = createRouter();

  return <RouterProvider router={router} />;
};

const App = () => (
  <Provider store={store}>
    <ToastContainer
      position="top-right"
      autoClose={3000}
      hideProgressBar={false}
      newestOnTop={true}
      closeOnClick
      pauseOnHover
    />
    <AppContent />
    <InputSelect />
  </Provider>
);

export default App;
