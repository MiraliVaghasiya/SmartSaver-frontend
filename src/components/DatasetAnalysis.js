import React, { useState } from "react";
import { Line, Bar, Pie } from "react-chartjs-2";
import * as XLSX from "xlsx";
import {
    Chart as ChartJS,
    CategoryScale,      // ✅ Register the missing Category Scale
    LinearScale,
    PointElement,
    LineElement,
    BarElement,
    Title,
    Tooltip,
    Legend,
    ArcElement
  } from "chart.js";
  
  ChartJS.register(
    CategoryScale,   // ✅ This fixes the "category" scale error
    LinearScale,
    PointElement,
    LineElement,
    BarElement,
    Title,
    Tooltip,
    Legend,
    ArcElement
  );
  

const DatasetAnalysis = ( {data}) => {
  const [fileData, setFileData] = useState(null);
  const [chartData, setChartData] = useState(null);
  const [analysisType, setAnalysisType] = useState("bar");
  const [columns, setColumns] = useState([]);
  const [selectedX, setSelectedX] = useState("");
  const [selectedY, setSelectedY] = useState("");

  const handleFileChange = (e) => {
    const file = e.target.files[0];
    if (!file) return;

    const reader = new FileReader();
    reader.readAsArrayBuffer(file);
    reader.onload = (event) => {
      const data = new Uint8Array(event.target.result);
      const workbook = XLSX.read(data, { type: "array" });

      // Get first sheet data
      const sheetName = workbook.SheetNames[0];
      const sheet = workbook.Sheets[sheetName];

      // Convert to JSON with headers
      const jsonData = XLSX.utils.sheet_to_json(sheet, { header: 1 });

      if (jsonData.length > 0) {
        setColumns(jsonData[0]); // First row contains headers
        setFileData(jsonData.slice(1)); // Rest contains data
      }
    };
  };

  const processData = () => {
    if (!selectedX || !selectedY) {
      alert("Please select X and Y columns for analysis!");
      return;
    }

    const xIndex = columns.indexOf(selectedX);
    const yIndex = columns.indexOf(selectedY);

    if (xIndex === -1 || yIndex === -1) {
      alert("Invalid column selection.");
      return;
    }

    const labels = fileData.map((row) => row[xIndex]);
    const values = fileData.map((row) => parseFloat(row[yIndex]) || 0);

    setChartData({
        labels,
        datasets: [
          {
            label: `${selectedY} vs ${selectedX}`,  // ✅ Fixed template literal
            data: values,
            backgroundColor: "rgba(75, 192, 192, 0.6)",
            borderColor: "black",
            borderWidth: 1,
          },
        ],
      });
  };
  

  return (
    <div style={{ textAlign: "center", padding: "20px" }}>
      <h2>Upload Dataset for Analysis</h2>
      <input type="file" accept=".csv, .xlsx" onChange={handleFileChange} />
      {data && <Line data={data} />}
      {columns.length > 0 && (
        <div>
          <h3>Select Analysis Type</h3>
          <select onChange={(e) => setAnalysisType(e.target.value)}>
            <option value="bar">Bar Chart</option>
            <option value="line">Line Chart</option>
            <option value="pie">Pie Chart</option>
          </select>

          <h3>Select X-Axis & Y-Axis</h3>
          <label>X-Axis: </label>
          <select onChange={(e) => setSelectedX(e.target.value)}>
            <option value="">Select X-Axis</option>
            {columns.map((col, index) => (
              <option key={index} value={col}>
                {col}
              </option>
            ))}
          </select>

          <label> Y-Axis: </label>
          <select onChange={(e) => setSelectedY(e.target.value)}>
            <option value="">Select Y-Axis</option>
            {columns.map((col, index) => (
              <option key={index} value={col}>
                {col}
              </option>
            ))}
          </select>

          <button onClick={processData}>Generate Graph</button>
        </div>
      )}

      {chartData && (
        <div>
          <h3>{selectedY} vs {selectedX}</h3>
          {analysisType === "bar" && <Bar data={chartData} />}
          {analysisType === "line" && <Line data={chartData} />}
          {analysisType === "pie" && <Pie data={chartData} />}
        </div>
      )}
    </div>
  );
};

export default DatasetAnalysis;