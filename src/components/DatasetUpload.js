import React, { useState } from "react";
import axios from "axios";
import { Line, Bar, Pie } from "react-chartjs-2";
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  BarElement,
  Title,
  Tooltip,
  Legend,
  ArcElement,
} from "chart.js";

ChartJS.register(
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  BarElement,
  Title,
  Tooltip,
  Legend,
  ArcElement
);

const DatasetUpload = () => {
  const [file, setFile] = useState(null);
  const [chartData, setChartData] = useState(null);
  const [analysis, setAnalysis] = useState(null);
  const [loading, setLoading] = useState(false);

  const handleFileChange = (e) => {
    setFile(e.target.files[0]);
  };

  const handleUpload = async () => {
    if (!file) {
      alert("Please select a file first!");
      return;
    }
    setLoading(true);
    const formData = new FormData();
    formData.append("dataset", file);

    try {
      const response = await axios.post(
        "http://localhost:8080/dataset/upload",
        formData,
        {
          headers: { "Content-Type": "multipart/form-data" },
        }
      );
      console.log("Upload response:", response.data);

      if (response.data.success) {
        processData(response.data.usagePerDay);
        setAnalysis(response.data.summary);
      } else {
        throw new Error("Upload failed.");
      }
    } catch (error) {
      console.error("Error uploading file:", error);
      alert("An error occurred while uploading.");
    } finally {
      setLoading(false);
    }
  };

  const processData = (usagePerDay) => {
    const labels = Object.keys(usagePerDay);
    const waterUsage = labels.map((day) => usagePerDay[day].waterUsage);
    const electricityUsage = labels.map(
      (day) => usagePerDay[day].electricityUsage
    );
    const gasUsage = labels.map((day) => usagePerDay[day].gasUsage);

    setChartData({
      labels,
      datasets: [
        {
          label: "Water Usage (Liters)",
          data: waterUsage,
          backgroundColor: "blue",
        },
        {
          label: "Electricity Usage (kWh)",
          data: electricityUsage,
          backgroundColor: "yellow",
        },
        { label: "Gas Usage (m³)", data: gasUsage, backgroundColor: "gray" },
      ],
    });
  };

  return (
    <div>
      <input type="file" onChange={handleFileChange} />
      <button onClick={handleUpload} disabled={!file || loading}>
        Upload & Analyze
      </button>

      {chartData && (
        <div>
          <h3>Consumption Analysis</h3>
          <Bar key={JSON.stringify(chartData)} data={chartData} />
          <Line key={JSON.stringify(chartData)} data={chartData} />
          <Pie key={JSON.stringify(chartData)} data={chartData} />
        </div>
      )}
    </div>
  );
};

export default DatasetUpload;
