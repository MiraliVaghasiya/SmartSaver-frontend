import { GoogleOAuthProvider } from "@react-oauth/google";
import { Routes, Route, Navigate } from "react-router-dom";
import Signup from "./pages/Signup";
import Dashboard from "./pages/Dashboard";
import Login from "./pages/Login";
import { useEffect, useState } from "react";
import RefreshHandler from "./RefreshHandler";
import Home from "./pages/Home";

function App() {
  const [isAuthenticated, setIsAuthenticated] = useState(false);

  // Check localStorage for token on page load
  useEffect(() => {
    const token = localStorage.getItem("token");
    setIsAuthenticated(!!token);
  }, []);

  // Private route logic
  const PrivateRoute = ({ element }) => {
    return isAuthenticated ? element : <Navigate to="/login" />;
  };

  return (
    <GoogleOAuthProvider
      clientId="889292981742-ucknqtugi62s3em7r185in1prat5revr.apps.googleusercontent.com"
      onScriptLoadSuccess={() => {
        console.log("Google OAuth script loaded successfully");
      }}
      onScriptLoadError={(error) => {
        console.error("Google OAuth script load error:", error);
      }}
    >
      <div>
        <RefreshHandler setIsAuthenticated={setIsAuthenticated} />
        <Routes>
          <Route path="/" element={<Navigate to="/home" />} />
          <Route path="/home" element={<Home />} />
          <Route
            path="/login"
            element={<Login setIsAuthenticated={setIsAuthenticated} />}
          />
          <Route
            path="/signup"
            element={<Signup setIsAuthenticated={setIsAuthenticated} />}
          />
          <Route
            path="/dashboard"
            element={<PrivateRoute element={<Dashboard />} />}
          />
        </Routes>
      </div>
    </GoogleOAuthProvider>
  );
}

export default App;
