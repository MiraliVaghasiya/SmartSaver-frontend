import React, { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { ToastContainer } from "react-toastify";
import { handleError, handleSuccess } from "../utils";
import "react-toastify/dist/ReactToastify.css";
import ThreeShapes from "../components/ThreeShapes";
import { GoogleLogin } from "@react-oauth/google";
import "../index.css";

function Signup({ setIsAuthenticated }) {
  const [signupInfo, setSignupInfo] = useState({
    name: "",
    email: "",
    password: "",
  });
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();

  const handleChange = (e) => {
    setSignupInfo({ ...signupInfo, [e.target.name]: e.target.value });
  };

  const handleSignup = async (e) => {
    e.preventDefault();
    if (!signupInfo.name || !signupInfo.email || !signupInfo.password) {
      return handleError("All fields are required");
    }

    setLoading(true);
    try {
      const response = await fetch(
        `https://smart-saver-backend-hv6p5zke2-miralivaghasiyas-projects.vercel.app//auth/signup`,
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(signupInfo),
        }
      );

      const result = await response.json();
      setLoading(false);

      if (result.success) {
        handleSuccess("Signup successful!");
        localStorage.setItem("token", result.jwtToken);
        setTimeout(() => navigate("/dashboard"), 1000);
      } else {
        handleError(result.message || "Signup failed");
      }
    } catch (err) {
      setLoading(false);
      handleError("Something went wrong. Please try again!");
    }
  };

  const handleGoogleSignup = (response) => {
    fetch(
      `https://smart-saver-backend-hv6p5zke2-miralivaghasiyas-projects.vercel.app//auth/google`,
      {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ credential: response.credential }),
      }
    )
      .then((res) => res.json())
      .then((data) => {
        if (data.success) {
          handleSuccess("Google Login successful!");
          localStorage.setItem("token", data.jwtToken);
          localStorage.setItem(
            "loggedInUser",
            JSON.stringify({ name: data.name, email: data.email })
          );
          setIsAuthenticated(true);
          navigate("/dashboard");
        } else {
          handleError("Google Login failed. Try again.");
        }
      })
      .catch(() => handleError("Something went wrong with Google Login!"));
  };

  return (
    <>
      <div style={{ position: "fixed", width: "100vw", height: "100vh" }}>
        <ThreeShapes />
      </div>
      <div className="signup">
        <div className="auth-container">
          <h1 className="auth-title">Signup</h1>
          <form onSubmit={handleSignup} className="auth-form">
            <div className="input-group">
              <label htmlFor="name">Name</label>
              <input
                id="name"
                className="auth-input"
                type="text"
                name="name"
                placeholder="Enter your name"
                onChange={handleChange}
                required
              />
            </div>
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
              {loading ? "Signing Up..." : "Signup"}
            </button>

            {/* Google Signup Button */}
            <div className="google-login-container">
              <GoogleLogin
                onSuccess={handleGoogleSignup} // ✅ Fixed onSuccess
                onError={() => handleError("Google login failed")} // ✅ Proper error handling
              />
            </div>

            <p className="auth-link">
              Already have an account? <Link to="/login">Login</Link>
            </p>
          </form>
        </div>
      </div>
      <ToastContainer />
    </>
  );
}

export default Signup;
