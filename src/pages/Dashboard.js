// In your Dashboard component
import React, { useState, useEffect } from "react";
import WaterAnalysis from "../components/WaterAnalysis";
import ElectricityAnalysis from "../components/ElectricityAnalysis";
import ChatBot from "../components/ChatBot";
import { ToastContainer } from "react-toastify";
import "../components/style/Dashboard.css";
import { Line, Bar, Scatter } from "react-chartjs-2";
import axiosInstance from "../utils/axios";

const Dashboard = () => {
  const [waterData, setWaterData] = useState(null);
  const [electricityData, setElectricityData] = useState(null);
  const [selectedOption, setSelectedOption] = useState(null);
  const [selectedFilePath, setSelectedFilePath] = useState(null);
  const [userData, setUserData] = useState({
    username: "",
    email: "",
    displayName: "",
  });
  const [summaryData, setSummaryData] = useState(null);
  const [summaryType, setSummaryType] = useState(null);
  const [allDatasetsStats, setAllDatasetsStats] = useState(null);

  useEffect(() => {
    const fetchUserData = async () => {
      try {
        const token = localStorage.getItem("token");
        if (token) {
          const response = await axiosInstance.get("/dashboard/users/profile");
          const user = response.data;

          // Set display name based on available data
          let displayName = "";
          if (user.username && user.username.trim() !== "") {
            displayName = user.username;
          } else if (user.email) {
            // Extract name from email (everything before @)
            displayName = user.email.split("@")[0];
          }

          setUserData({
            ...user,
            displayName: displayName,
          });
        }
      } catch (error) {
        console.error("Error fetching user data:", error);
        // Try to get user info from localStorage as fallback
        try {
          const localUser = JSON.parse(localStorage.getItem("loggedInUser"));
          if (localUser) {
            const displayName =
              localUser.username || localUser.email?.split("@")[0] || "User";
            setUserData({
              username: localUser.username || "",
              email: localUser.email || "",
              displayName: displayName,
            });
          }
        } catch (localError) {
          console.error("Error getting local user data:", localError);
        }
        if (error.response?.status === 401) {
          handleLogout();
        }
      }
    };

    const storedFilePath = localStorage.getItem("electricityFilePath");
    if (storedFilePath) {
      setSelectedFilePath(storedFilePath);
    }

    fetchUserData();
  }, []);

  const handleLogout = () => {
    localStorage.removeItem("token");
    localStorage.removeItem("loggedInUser");
    window.location.href = "/login";
  };

  const handleOptionChange = (option) => {
    setSelectedOption(option);
  };

  const handleBack = () => {
    window.history.back();
  };

  const handleFilePathChange = (filePath) => {
    setSelectedFilePath(filePath);
    localStorage.setItem("electricityFilePath", filePath);
  };

  return (
    <div className="dashboard-container">
      <header className="header_dashboard">
        <div className="header-container">
          <div className="logo-section">
            <h1 className="header-text">SmartSaver Dashboard</h1>
          </div>
          <div className="nav-links">
            <button
              className={`nav-button ${
                selectedOption === "water" ? "active" : ""
              }`}
              onClick={() => handleOptionChange("water")}
            >
              Water
            </button>
            <button
              className={`nav-button ${
                selectedOption === "electricity" ? "active" : ""
              }`}
              onClick={() => handleOptionChange("electricity")}
            >
              Electricity
            </button>
          </div>
          <div className="user-profile">
            <div className="user-info">
              <span className="username">{userData.displayName}</span>
            </div>
            <button className="logout-button" onClick={handleLogout}>
              Logout
            </button>
          </div>
        </div>
      </header>

      <div className="dashboard-content">
        {selectedOption === "water" && (
          <WaterAnalysis
            setWaterData={setWaterData}
            setSummaryData={setSummaryData}
            setSummaryType={() => setSummaryType("water")}
            setAllDatasetsStats={setAllDatasetsStats}
          />
        )}
        {selectedOption === "electricity" && (
          <ElectricityAnalysis
            setElectricityData={setElectricityData}
            handleFilePathChange={handleFilePathChange}
            selectedFilePath={selectedFilePath}
            setSummaryData={setSummaryData}
            setSummaryType={() => setSummaryType("electricity")}
            setAllDatasetsStats={setAllDatasetsStats}
          />
        )}
        {!selectedOption && (
          <div className="welcome-message">
            <h2>Welcome to SmartSaver</h2>
            <p>
              Please select Water or Electricity analysis from the navigation
              menu
            </p>
          </div>
        )}
      </div>

      <ChatBot
        summaryData={{ ...summaryData, allDatasetsStats }}
        type={summaryType}
      />

      <ToastContainer />
    </div>
  );
};

export default Dashboard;
