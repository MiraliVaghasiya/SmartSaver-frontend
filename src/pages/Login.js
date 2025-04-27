import React, { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { ToastContainer } from "react-toastify";
import { handleError, handleSuccess } from "../utils";
import "react-toastify/dist/ReactToastify.css";
import { GoogleLogin } from "@react-oauth/google";
import ThreeShapes from "../components/ThreeShapes";
import "../index.css";

function Login({ setIsAuthenticated }) {
  const [loginInfo, setLoginInfo] = useState({ email: "", password: "" });
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();

  const handleChange = (e) => {
    setLoginInfo({ ...loginInfo, [e.target.name]: e.target.value });
  };

  // ✅ FIX: Set authentication state after successful login
  const handleLogin = async (e) => {
    e.preventDefault();
    if (!loginInfo.email || !loginInfo.password) {
      return handleError("Email and password are required");
    }

    setLoading(true);
    try {
      const response = await fetch(
        `https://smart-saver-backend.vercel.app/auth/login`,
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(loginInfo),
        }
      );

      const data = await response.json();
      setLoading(false);

      if (data.success) {
        handleSuccess("Login successful!");
        localStorage.setItem("token", data.jwtToken);
        localStorage.setItem(
          "loggedInUser",
          JSON.stringify({ name: data.name, email: data.email })
        );

        setIsAuthenticated(true); // ✅ Update state
        navigate("/dashboard");
      } else {
        handleError(data.message || "Login failed");
      }
    } catch (err) {
      setLoading(false);
      handleError("Something went wrong. Please try again!");
    }
  };

  // ✅ FIX: Ensure correct endpoint for Google login
  const handleGoogleLogin = (response) => {
    console.log("Google login response received:", response);

    if (!response.credential) {
      handleError("Google login failed: No credential received");
      return;
    }

    fetch(`https://smart-saver-backend.vercel.app/auth/google`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ credential: response.credential }),
    })
      .then((res) => {
        if (!res.ok) {
          throw new Error(`Server responded with status: ${res.status}`);
        }
        return res.json();
      })
      .then((data) => {
        console.log("Google login server response:", data);
        if (data.success) {
          handleSuccess("Google Login successful!");
          localStorage.setItem("token", data.jwtToken);
          localStorage.setItem(
            "loggedInUser",
            JSON.stringify({ name: data.name, email: data.email })
          );
          setIsAuthenticated(true); // ✅ Update authentication state
          navigate("/dashboard");
        } else {
          handleError(data.message || "Google Login failed. Try again.");
        }
      })
      .catch((error) => {
        console.error("Google login error:", error);
        handleError(`Something went wrong with Google Login: ${error.message}`);
      });
  };

  return (
    <>
      <div style={{ position: "fixed", width: "100vw", height: "100vh" }}>
        <ThreeShapes />
      </div>

      <div className="login">
        <div className="auth-container">
          <h1 className="auth-title">Login</h1>
          <form onSubmit={handleLogin} className="auth-form">
            <div className="input-group">
              <label htmlFor="email">Email</label>
              <input
                id="email"
                className="auth-input"
                type="email"
                name="email"
                placeholder="Enter your email"
                onChange={handleChange}
                required
              />
            </div>
            <div className="input-group">
              <label htmlFor="password">Password</label>
              <input
                id="password"
                className="auth-input"
                type="password"
                name="password"
                placeholder="Enter your password"
                onChange={handleChange}
                required
              />
            </div>
            <button className="auth-button" type="submit" disabled={loading}>
              {loading ? "Logging in..." : "Login"}
            </button>
            {/* Google Login Button */}
            <GoogleLogin
              onSuccess={handleGoogleLogin}
              onError={() => handleError("Google login failed")}
            />

            <p className="auth-link">
              Don't have an account? <Link to="/signup">Signup</Link>
            </p>
          </form>
        </div>

        <ToastContainer />
      </div>
    </>
  );
}

export default Login;
