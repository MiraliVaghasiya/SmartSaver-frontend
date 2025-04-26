import axios from "axios";

const instance = axios.create({
  baseURL:
    "https://smart-saver-backend-hv6p5zke2-miralivaghasiyas-projects.vercel.app/0",
});

// Add a request interceptor
instance.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem("token");
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

export default instance;
