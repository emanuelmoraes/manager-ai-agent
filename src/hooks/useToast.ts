import { toast, ToastOptions } from 'react-toastify';

export const useToast = () => {
  const defaultOptions: ToastOptions = {
    position: 'top-right',
    autoClose: 3000,
    hideProgressBar: false,
    closeOnClick: true,
    pauseOnHover: true,
    draggable: true,
    theme: 'dark',
  };

  const notifySuccess = (message: string, options?: ToastOptions) => {
    toast.success(message, { ...defaultOptions, ...options });
  };

  const notifyError = (message: string, options?: ToastOptions) => {
    toast.error(message, { ...defaultOptions, ...options });
  };

  const notifyInfo = (message: string, options?: ToastOptions) => {
    toast.info(message, { ...defaultOptions, ...options });
  };

  const notifyWarning = (message: string, options?: ToastOptions) => {
    toast.warning(message, { ...defaultOptions, ...options });
  };

  return {
    notifySuccess,
    notifyError,
    notifyInfo,
    notifyWarning,
  };
};
