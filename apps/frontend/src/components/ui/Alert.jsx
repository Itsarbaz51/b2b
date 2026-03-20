// components/ui/Alert.jsx
import React, { useEffect, useState } from "react";
import {
  AlertCircle,
  CheckCircle,
  Info,
  XCircle,
  X,
  RefreshCw,
} from "lucide-react";

const Alert = ({
  type = "error",
  title,
  message,
  onRetry,
  onClose,
  autoClose = false,
  autoCloseDelay = 5000,
  showIcon = true,
  showCloseButton = true,
  className = "",
}) => {
  const [isVisible, setIsVisible] = useState(true);

  useEffect(() => {
    if (autoClose && onClose) {
      const timer = setTimeout(() => {
        setIsVisible(false);
        setTimeout(onClose, 300);
      }, autoCloseDelay);
      return () => clearTimeout(timer);
    }
  }, [autoClose, autoCloseDelay, onClose]);

  const handleClose = () => {
    setIsVisible(false);
    setTimeout(() => {
      if (onClose) onClose();
    }, 300);
  };

  const config = {
    error: {
      bg: "bg-red-50",
      border: "border-red-200",
      titleColor: "text-red-800",
      messageColor: "text-red-700",
      icon: AlertCircle,
      iconColor: "text-red-400",
      buttonBg: "bg-red-600 hover:bg-red-700",
      closeButtonColor: "text-red-400 hover:text-red-500",
    },
    success: {
      bg: "bg-green-50",
      border: "border-green-200",
      titleColor: "text-green-800",
      messageColor: "text-green-700",
      icon: CheckCircle,
      iconColor: "text-green-400",
      buttonBg: "bg-green-600 hover:bg-green-700",
      closeButtonColor: "text-green-400 hover:text-green-500",
    },
    warning: {
      bg: "bg-yellow-50",
      border: "border-yellow-200",
      titleColor: "text-yellow-800",
      messageColor: "text-yellow-700",
      icon: AlertCircle,
      iconColor: "text-yellow-400",
      buttonBg: "bg-yellow-600 hover:bg-yellow-700",
      closeButtonColor: "text-yellow-400 hover:text-yellow-500",
    },
    info: {
      bg: "bg-blue-50",
      border: "border-blue-200",
      titleColor: "text-blue-800",
      messageColor: "text-blue-700",
      icon: Info,
      iconColor: "text-blue-400",
      buttonBg: "bg-blue-600 hover:bg-blue-700",
      closeButtonColor: "text-blue-400 hover:text-blue-500",
    },
  };

  const {
    bg,
    border,
    titleColor,
    messageColor,
    icon: Icon,
    iconColor,
    buttonBg,
    closeButtonColor,
  } = config[type];

  return (
    <div
      className={`
        ${bg} 
        ${border} 
        border 
        rounded-lg 
        p-4 
        shadow-lg
        transition-all 
        duration-300 
        ease-in-out
        ${isVisible ? "opacity-100 translate-y-0" : "opacity-0 -translate-y-2"}
        ${className}
      `}
      role="alert"
    >
      <div className="flex">
        {showIcon && (
          <div className="shrink-0">
            <Icon className={`h-5 w-5 ${iconColor}`} aria-hidden="true" />
          </div>
        )}
        <div className={`flex-1 ${showIcon ? "ml-3" : ""}`}>
          {title && (
            <h3 className={`text-sm font-medium ${titleColor} mb-1`}>
              {title}
            </h3>
          )}
          <div className={`text-sm ${messageColor}`}>
            <p>{message}</p>
          </div>
          {onRetry && (
            <div className="mt-4">
              <button
                type="button"
                onClick={onRetry}
                className={`
                  inline-flex 
                  items-center 
                  px-3 
                  py-2 
                  border 
                  border-transparent 
                  text-sm 
                  leading-4 
                  font-medium 
                  rounded-md 
                  text-white 
                  ${buttonBg}
                  focus:outline-none 
                  focus:ring-2 
                  focus:ring-offset-2 
                  focus:ring-${type === "error" ? "red" : type === "success" ? "green" : type === "warning" ? "yellow" : "blue"}-500
                  transition
                `}
              >
                <RefreshCw className="h-4 w-4 mr-2" />
                Try Again
              </button>
            </div>
          )}
        </div>
        {showCloseButton && (
          <div className="ml-auto pl-3">
            <div className="-mx-1.5 -my-1.5">
              <button
                type="button"
                onClick={handleClose}
                className={`
                  inline-flex 
                  rounded-md 
                  p-1.5 
                  focus:outline-none 
                  focus:ring-2 
                  focus:ring-offset-2 
                  focus:ring-offset-${bg}
                  ${closeButtonColor}
                `}
              >
                <span className="sr-only">Dismiss</span>
                <X className="h-5 w-5" aria-hidden="true" />
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default Alert;
