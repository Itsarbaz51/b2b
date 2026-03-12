import { createContext, useContext, useState } from "react";
import DialogToast from "../components/ui/Toast";

const ToastContext = createContext();

export const useToast = () => useContext(ToastContext);

export const ToastProvider = ({ children }) => {
  const [dialog, setDialog] = useState(null);

  const showDialog = (message, type = "info") => {
    setDialog({ message, type });
  };

  const closeDialog = () => {
    setDialog(null);
  };

  return (
    <ToastContext.Provider value={{ showDialog }}>
      {children}

      {dialog && (
        <DialogToast
          type={dialog.type}
          message={dialog.message}
          onClose={closeDialog}
        />
      )}
    </ToastContext.Provider>
  );
};