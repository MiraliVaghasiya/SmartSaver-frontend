import axios from "axios";

const instance = axios.create({
  baseURL: "https://smart-saver-backend.vercel.app",
});

// Add a request interceptor
instance.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem("token");
    if (token) {
      config.headers.Authorization = `Bearer ${token}`; // 🛠 Fixed here
    }
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

export default instance;
