import { toast } from "react-toastify";

export const handleSuccess = (message) => {
  toast.success(message, {
    position: "top-right", // ✅ Changed from default to top-right
   
  });
};

export const handleError = (message) => {
  toast.error(message, {
    position: "top-right", // ✅ Changed from default to top-right
    
  });
};
