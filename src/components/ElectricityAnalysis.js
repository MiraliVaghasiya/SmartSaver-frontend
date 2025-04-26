import React, { useState, useEffect, useRef } from "react";
import axiosInstance from "../utils/axios";
import { Line, Bar } from "react-chartjs-2";
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
} from "chart.js";
import "./style/Summary.css";
import "./Analysis.css";
import ElectricityMonthComparison from "./ElectricityMonthComparison";
import { jsPDF } from "jspdf";
import html2canvas from "html2canvas";

ChartJS.register(
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  BarElement,
  Title,
  Tooltip,
  Legend
);

// Update Calendar component
const Calendar = ({ data, month, year }) => {
  const getDaysInMonth = (month, year) => new Date(year, month, 0).getDate();
  const getFirstDayOfMonth = (month, year) =>
    new Date(year, month - 1, 1).getDay();

  const daysInMonth = getDaysInMonth(month, year);
  const firstDay = getFirstDayOfMonth(month, year);

  const getColorForUsage = (usage) => {
    if (!usage) return "#f5f5f5";
    const maxUsage = Math.max(...Object.values(data));
    const percentage = (usage / maxUsage) * 100;

    if (percentage <= 20) return "rgba(216, 180, 254, 0.4)";
    if (percentage <= 40) return "rgba(165, 180, 252, 0.5)";
    if (percentage <= 60) return "rgba(103, 232, 249, 0.6)";
    if (percentage <= 80) return "rgba(110, 231, 183, 0.7)";
    return "rgba(253, 186, 116, 0.8)";
  };

  const getUsageLevel = (usage) => {
    if (!usage) return "No Data";
    const maxUsage = Math.max(...Object.values(data));
    const percentage = (usage / maxUsage) * 100;

    if (percentage <= 20) return "Very Low Usage";
    if (percentage <= 40) return "Low Usage";
    if (percentage <= 60) return "Medium Usage";
    if (percentage <= 80) return "High Usage";
    return "Very High Usage";
  };

  const formatUsage = (usage) => {
    if (!usage) return "0";
    return usage.toFixed(1);
  };

  const generateCalendarDays = () => {
    const days = [];
    const totalSlots = Math.ceil((daysInMonth + firstDay) / 7) * 7;

    for (let i = 0; i < totalSlots; i++) {
      const dayNumber = i - firstDay + 1;
      const isValidDay = dayNumber > 0 && dayNumber <= daysInMonth;
      const usage = isValidDay ? data[dayNumber] : null;
      const usageLevel = isValidDay ? getUsageLevel(usage) : "";

      days.push(
        <div
          key={i}
          className="calendar-day"
          style={{
            backgroundColor: isValidDay
              ? getColorForUsage(usage)
              : "transparent",
          }}
          title={isValidDay ? `${usageLevel}: ${formatUsage(usage)} kWh` : ""}
        >
          {isValidDay && (
            <>
              <div className="day-number">{dayNumber}</div>
              <div className="usage-value">{formatUsage(usage)} kWh</div>
              <div className="usage-level">{usageLevel}</div>
            </>
          )}
        </div>
      );
    }
    return days;
  };

  // Get month name
  const monthName = new Date(year, month - 1, 1).toLocaleString("default", {
    month: "long",
  });

  return (
    <div className="calendar-container">
      <h3>{`${monthName} ${year}`}</h3>
      <div className="calendar-header">
        {["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"].map((day) => (
          <div key={day}>{day}</div>
        ))}
      </div>
      <div className="calendar-grid">{generateCalendarDays()}</div>
    </div>
  );
};

const ElectricityAnalysis = ({
  setElectricityData,
  handleFilePathChange,
  selectedFilePath,
  setSummaryData,
  setSummaryType,
  setAllDatasetsStats,
}) => {
  const [file, setFile] = useState(null);
  const fileInputRef = useRef(null);
  const [selectedDataset, setSelectedDataset] = useState(null);
  const defaultChartData = {
    labels: [],
    datasets: [
      {
        label: "No Data",
        data: [],
        backgroundColor: "rgba(75, 192, 192, 0.2)",
        borderColor: "rgba(75, 192, 192, 1)",
        borderWidth: 1,
      },
    ],
  };

  const [chartData, setChartData] = useState(defaultChartData);
  const [fanData, setFanData] = useState(defaultChartData);
  const [refrigeratorData, setRefrigeratorData] = useState(defaultChartData);
  const [washingMachineData, setWashingMachineData] =
    useState(defaultChartData);
  const [heaterData, setHeaterData] = useState(defaultChartData);
  const [lightsData, setLightsData] = useState(defaultChartData);
  const [datasets, setDatasets] = useState([]);
  const [summaryDataState, setSummaryDataState] = useState(null);
  const [showSummary, setShowSummary] = useState(false);
  const [allDatasetsStats, setAllDatasetsStatsState] = useState({
    totalAverage: 0,
    totalStdDev: 0,
    dailyAverage: 0,
    dailyStdDev: 0,
    datasetCount: 0,
    applianceAverages: {
      fan: 0,
      refrigerator: 0,
      washingMachine: 0,
      heater: 0,
      lights: 0,
    },
  });

  const overviewChartRef = useRef(null);
  const calendarRef = useRef(null);
  const fanChartRef = useRef(null);
  const refrigeratorChartRef = useRef(null);
  const washingMachineChartRef = useRef(null);
  const heaterChartRef = useRef(null);
  const lightsChartRef = useRef(null);

  useEffect(() => {
    // Only fetch datasets on initial load
    fetchInitialData();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const generateSummaryFromData = (analysisData) => {
    if (!analysisData) return null;

    // Calculate totals from chart data
    const calculateTotal = (data) => {
      if (!data?.datasets?.[0]?.data) return 0;
      return data.datasets[0].data.reduce(
        (sum, val) => sum + (Number(val) || 0),
        0
      );
    };

    const calculateAverage = (data) => {
      if (!data?.datasets?.[0]?.data) return 0;
      const total = calculateTotal(data);
      return total / (data.datasets[0].data.length || 1);
    };

    const findPeakDay = (data) => {
      if (!data?.datasets?.[0]?.data || !data?.labels) return "N/A";
      const maxIndex = data.datasets[0].data.indexOf(
        Math.max(...data.datasets[0].data)
      );
      return data.labels[maxIndex] || "N/A";
    };

    const findPeakUsage = (data) => {
      if (!data?.datasets?.[0]?.data) return 0;
      return Math.max(...data.datasets[0].data);
    };

    const summary = {
      // Overall Usage
      totalElectricityConsumption: calculateTotal(analysisData.chartData),
      averageElectricityUsage: calculateAverage(analysisData.chartData),
      maxElectricityUsage: findPeakDay(analysisData.chartData),
      maxElectricityUsageValue: findPeakUsage(analysisData.chartData),

      // Appliance specific data
      totalFanConsumption: calculateTotal(analysisData.fanData),
      peakFanDay: findPeakDay(analysisData.fanData),
      peakFanUsage: findPeakUsage(analysisData.fanData),

      totalRefrigeratorConsumption: calculateTotal(
        analysisData.refrigeratorData
      ),
      peakRefrigeratorDay: findPeakDay(analysisData.refrigeratorData),
      peakRefrigeratorUsage: findPeakUsage(analysisData.refrigeratorData),

      totalWashingMachineConsumption: calculateTotal(
        analysisData.washingMachineData
      ),
      peakWashingMachineDay: findPeakDay(analysisData.washingMachineData),
      peakWashingMachineUsage: findPeakUsage(analysisData.washingMachineData),

      totalHeaterConsumption: calculateTotal(analysisData.heaterData),
      peakHeaterDay: findPeakDay(analysisData.heaterData),
      peakHeaterUsage: findPeakUsage(analysisData.heaterData),

      totalLightsConsumption: calculateTotal(analysisData.lightsData),
      peakLightsDay: findPeakDay(analysisData.lightsData),
      peakLightsUsage: findPeakUsage(analysisData.lightsData),
    };

    return summary;
  };

  // Add function to calculate statistics from all datasets
  const calculateAllDatasetsStats = (datasetsArray) => {
    if (!datasetsArray || datasetsArray.length === 0) return;

    let totalConsumptions = [];
    let dailyConsumptions = [];
    let applianceConsumptions = {
      fan: [],
      refrigerator: [],
      washingMachine: [],
      heater: [],
      lights: [],
    };

    // Collect consumption data from all datasets
    datasetsArray.forEach((dataset) => {
      if (dataset.analysis && dataset.analysis.chartData) {
        const total = dataset.analysis.chartData.datasets[0].data.reduce(
          (sum, val) => sum + (Number(val) || 0),
          0
        );
        const daily =
          total / (dataset.analysis.chartData.datasets[0].data.length || 1);

        totalConsumptions.push(total);
        dailyConsumptions.push(daily);

        // Collect appliance-specific data
        if (dataset.analysis.fanData) {
          const fanTotal = dataset.analysis.fanData.datasets[0].data.reduce(
            (sum, val) => sum + (Number(val) || 0),
            0
          );
          applianceConsumptions.fan.push(fanTotal);
        }
        if (dataset.analysis.refrigeratorData) {
          const refrigeratorTotal =
            dataset.analysis.refrigeratorData.datasets[0].data.reduce(
              (sum, val) => sum + (Number(val) || 0),
              0
            );
          applianceConsumptions.refrigerator.push(refrigeratorTotal);
        }
        if (dataset.analysis.washingMachineData) {
          const washingTotal =
            dataset.analysis.washingMachineData.datasets[0].data.reduce(
              (sum, val) => sum + (Number(val) || 0),
              0
            );
          applianceConsumptions.washingMachine.push(washingTotal);
        }
        if (dataset.analysis.heaterData) {
          const heaterTotal =
            dataset.analysis.heaterData.datasets[0].data.reduce(
              (sum, val) => sum + (Number(val) || 0),
              0
            );
          applianceConsumptions.heater.push(heaterTotal);
        }
        if (dataset.analysis.lightsData) {
          const lightsTotal =
            dataset.analysis.lightsData.datasets[0].data.reduce(
              (sum, val) => sum + (Number(val) || 0),
              0
            );
          applianceConsumptions.lights.push(lightsTotal);
        }
      }
    });

    // Calculate averages
    const totalAvg =
      totalConsumptions.reduce((a, b) => a + b, 0) / totalConsumptions.length;
    const dailyAvg =
      dailyConsumptions.reduce((a, b) => a + b, 0) / dailyConsumptions.length;

    // Calculate standard deviations
    const totalStdDev = Math.sqrt(
      totalConsumptions.reduce((sq, n) => sq + Math.pow(n - totalAvg, 2), 0) /
        totalConsumptions.length
    );
    const dailyStdDev = Math.sqrt(
      dailyConsumptions.reduce((sq, n) => sq + Math.pow(n - dailyAvg, 2), 0) /
        dailyConsumptions.length
    );

    // Calculate appliance averages
    const applianceAverages = {
      fan:
        applianceConsumptions.fan.reduce((a, b) => a + b, 0) /
        applianceConsumptions.fan.length,
      refrigerator:
        applianceConsumptions.refrigerator.reduce((a, b) => a + b, 0) /
        applianceConsumptions.refrigerator.length,
      washingMachine:
        applianceConsumptions.washingMachine.reduce((a, b) => a + b, 0) /
        applianceConsumptions.washingMachine.length,
      heater:
        applianceConsumptions.heater.reduce((a, b) => a + b, 0) /
        applianceConsumptions.heater.length,
      lights:
        applianceConsumptions.lights.reduce((a, b) => a + b, 0) /
        applianceConsumptions.lights.length,
    };

    const stats = {
      totalAverage: totalAvg,
      totalStdDev: totalStdDev,
      dailyAverage: dailyAvg,
      dailyStdDev: dailyStdDev,
      datasetCount: datasetsArray.length,
      applianceAverages,
    };

    setAllDatasetsStatsState(stats);
    if (typeof setAllDatasetsStats === "function") {
      setAllDatasetsStats(stats);
    }
  };

  // Modify the fetchInitialData function to calculate stats
  const fetchInitialData = async () => {
    try {
      const response = await axiosInstance.get("/dataset/datasets");
      const electricityDatasets = response.data.filter(
        (dataset) => dataset.type === "electricity"
      );
      setDatasets(electricityDatasets);

      // Calculate statistics from all datasets
      calculateAllDatasetsStats(electricityDatasets);

      if (electricityDatasets.length > 0) {
        const mostRecent = electricityDatasets[0];
        setSelectedDataset(mostRecent._id);
        updateAnalysisData(mostRecent.analysis);
      }
    } catch (error) {
      console.error("Error fetching initial datasets:", error);
      if (error.response?.status === 401) {
        window.location.href = "/login";
      }
    }
  };

  const handleDatasetChange = async (e) => {
    const datasetId = e.target.value;
    setSelectedDataset(datasetId);

    if (datasetId) {
      try {
        const selectedDataset = datasets.find(
          (dataset) => dataset._id === datasetId
        );
        if (selectedDataset && selectedDataset.analysis) {
          updateAnalysisData(selectedDataset.analysis);
        }
      } catch (error) {
        console.error("Error changing dataset:", error);
      }
    }
  };

  // New function to update analysis data
  const updateAnalysisData = (analysisData) => {
    if (!analysisData) return;

    // Set all the data from the analysis
    setChartData(analysisData.chartData || defaultChartData);
    setFanData(analysisData.fanData || defaultChartData);
    setRefrigeratorData(analysisData.refrigeratorData || defaultChartData);
    setWashingMachineData(analysisData.washingMachineData || defaultChartData);
    setHeaterData(analysisData.heaterData || defaultChartData);
    setLightsData(analysisData.lightsData || defaultChartData);

    const generatedSummary = generateSummaryFromData(analysisData);
    setSummaryDataState(generatedSummary);
    setElectricityData(analysisData);
    setShowSummary(true);
    if (typeof setSummaryData === "function") setSummaryData(generatedSummary);
    if (typeof setSummaryType === "function") setSummaryType();
  };

  const handleFileChange = (e) => {
    const selectedFile = e.target.files[0];
    if (selectedFile) {
      setFile(selectedFile);
      setShowSummary(false);
    }
  };

  const handleUpload = async () => {
    if (!file) {
      alert("Please select a file first!");
      return;
    }

    const formData = new FormData();
    formData.append("dataset", file);

    try {
      const response = await axiosInstance.post(
        "/dataset/upload/electricity",
        formData,
        {
          headers: {
            "Content-Type": "multipart/form-data",
          },
        }
      );

      if (response.data && response.data.analysis) {
        // Clear file input
        setFile(null);
        if (fileInputRef.current) {
          fileInputRef.current.value = "";
        }

        // Refresh datasets list
        const datasetsResponse = await axiosInstance.get("/dataset/datasets");
        const electricityDatasets = datasetsResponse.data
          .filter((dataset) => dataset.type === "electricity")
          .map((dataset) => {
            if (dataset.analysis?.chartData?.labels?.[0]) {
              const label = dataset.analysis.chartData.labels[0];
              const parts = label.includes("-")
                ? label.split("-")
                : label.split("/");

              if (parts.length >= 3) {
                let monthNum, year;

                // Determine month and year from the date parts
                if (parseInt(parts[1]) >= 1 && parseInt(parts[1]) <= 12) {
                  monthNum = parseInt(parts[1]);
                  year = parts[2];
                } else if (
                  parseInt(parts[0]) >= 1 &&
                  parseInt(parts[0]) <= 12
                ) {
                  monthNum = parseInt(parts[0]);
                  year = parts[2];
                }

                // Handle year format
                if (year < 100) {
                  year = year >= 25 ? 2000 + year : 1900 + year;
                }

                // Update the label with the correct format
                dataset.analysis.chartData.labels[0] = `01/${monthNum
                  .toString()
                  .padStart(2, "0")}/${year}`;
              }
            }
            return dataset;
          });

        setDatasets(electricityDatasets);

        // Select the newly uploaded dataset
        if (electricityDatasets.length > 0) {
          const newlyUploadedDataset = electricityDatasets[0];
          setSelectedDataset(newlyUploadedDataset._id);
          updateAnalysisData(newlyUploadedDataset.analysis);
        }

        // Calculate statistics
        calculateAllDatasetsStats(electricityDatasets);
      }
    } catch (error) {
      console.error("Error uploading file:", error);
      alert("Error uploading file. Please try again.");
    }
  };

  const getStatusBadge = (value, type = "total") => {
    const numValue = Number(value) || 0;

    // Different thresholds for different types of measurements (in kWh)
    const thresholds = {
      total: {
        low: 250, // 250 kWh - Very efficient monthly usage
        medium: 500, // 500 kWh - Average monthly usage
        high: 750, // 750+ kWh - High monthly usage
      },
      daily: {
        low: 8, // 8 kWh - Efficient daily usage
        medium: 15, // 15 kWh - Average daily usage
        high: 25, // 25+ kWh - High daily usage
      },
      fan: {
        low: 0.5, // 0.5 kWh - Efficient daily fan usage
        medium: 1.2, // 1.2 kWh - Average daily fan usage
        high: 2.0, // 2.0+ kWh - High daily fan usage
      },
      refrigerator: {
        low: 1.5, // 1.5 kWh - Energy efficient refrigerator daily
        medium: 2.5, // 2.5 kWh - Average refrigerator daily
        high: 4.0, // 4.0+ kWh - Inefficient refrigerator daily
      },
      washing: {
        low: 1.0, // 1.0 kWh - Efficient washing cycle
        medium: 2.0, // 2.0 kWh - Average washing cycle
        high: 3.0, // 3.0+ kWh - Inefficient washing cycle
      },
      heater: {
        low: 3.0, // 3.0 kWh - Efficient daily heater usage
        medium: 6.0, // 6.0 kWh - Average daily heater usage
        high: 10.0, // 10.0+ kWh - High daily heater usage
      },
      lights: {
        low: 0.5, // 0.5 kWh - LED lights daily usage
        medium: 1.5, // 1.5 kWh - Mixed LED/traditional daily
        high: 3.0, // 3.0+ kWh - Inefficient lighting daily
      },
    };

    const threshold = thresholds[type] || thresholds.total;

    if (numValue <= threshold.low) return "success";
    if (numValue <= threshold.medium) return "warning";
    return "danger";
  };

  // Modify getStatusMessage to use comparative analysis
  const getStatusMessage = (value, type = "total") => {
    const numValue = Number(value) || 0;

    // Function to determine status based on standard deviations from mean
    const getComparativeStatus = (value, mean, stdDev) => {
      const zScore = (value - mean) / stdDev;
      if (zScore < -0.5) return "Low";
      if (zScore > 0.5) return "High";
      return "Average";
    };

    // For total consumption
    if (type === "total" && allDatasetsStats.datasetCount > 0) {
      const status = getComparativeStatus(
        numValue,
        allDatasetsStats.totalAverage,
        allDatasetsStats.totalStdDev
      );
      return `<span style="color: black">${status} Consumption (${numValue.toFixed(
        1
      )} kWh vs. Avg ${allDatasetsStats.totalAverage.toFixed(1)} kWh)</span>`;
    }

    // For daily consumption
    if (type === "daily" && allDatasetsStats.datasetCount > 0) {
      const status = getComparativeStatus(
        numValue,
        allDatasetsStats.dailyAverage,
        allDatasetsStats.dailyStdDev
      );
      return `<span style="color: black">${status} Consumption (${numValue.toFixed(
        1
      )} kWh vs. Avg ${allDatasetsStats.dailyAverage.toFixed(1)} kWh)</span>`;
    }

    // For appliance-specific consumption
    if (
      allDatasetsStats.datasetCount > 0 &&
      allDatasetsStats.applianceAverages[type]
    ) {
      const avgValue = allDatasetsStats.applianceAverages[type];
      const status =
        numValue < avgValue * 0.8
          ? "Low"
          : numValue > avgValue * 1.2
          ? "High"
          : "Average";
      return `<span style="color: black">${status} Consumption (${numValue.toFixed(
        1
      )} kWh vs. Avg ${avgValue.toFixed(1)} kWh)</span>`;
    }

    // Fallback to original thresholds
    const thresholds = {
      total: { low: 250, medium: 500 },
      daily: { low: 8, medium: 15 },
      fan: { low: 0.5, medium: 1.2 },
      refrigerator: { low: 1.5, medium: 2.5 },
      washing: { low: 1.0, medium: 2.0 },
      heater: { low: 3.0, medium: 6.0 },
      lights: { low: 0.5, medium: 1.5 },
    };

    const threshold = thresholds[type] || thresholds.total;
    if (numValue <= threshold.low)
      return `<span style="color: black">Low Consumption (≤${threshold.low} kWh)</span>`;
    if (numValue <= threshold.medium)
      return `<span style="color: black">Average Consumption (≤${threshold.medium} kWh)</span>`;
    return `<span style="color: black">High Consumption (>${threshold.medium} kWh)</span>`;
  };

  // Add comparative analysis section to the summary
  const renderComparativeAnalysis = () => {
    if (allDatasetsStats.datasetCount < 2) return null;

    return (
      <div className="summary-section">
        <h4>Comparative Analysis</h4>
        <ul className="insights-list">
          <li>
            <strong>Dataset Comparison:</strong> Analysis based on{" "}
            {allDatasetsStats.datasetCount} datasets
          </li>
          <li>
            <strong>Your Total Usage vs Average:</strong>{" "}
            {summaryDataState?.totalElectricityConsumption.toFixed(1)} kWh vs{" "}
            {allDatasetsStats.totalAverage.toFixed(1)} kWh
          </li>
          <li>
            <strong>Your Daily Usage vs Average:</strong>{" "}
            {summaryDataState?.averageElectricityUsage.toFixed(1)} kWh vs{" "}
            {allDatasetsStats.dailyAverage.toFixed(1)} kWh
          </li>
        </ul>
      </div>
    );
  };

  const handleComparisonResults = (results) => {
    // Handle comparison results if needed
    console.log("Comparison results:", results);
  };

  // Helper function to generate recommendations for electricity
  const generateRecommendations = (categoryTotals, dailyTotals, avgUsage) => {
    const recommendations = [];

    // Analyze peak usage
    const peakDays = dailyTotals.filter((h) => h.total > avgUsage * 1.5);
    if (peakDays.length > 0) {
      recommendations.push(
        "Consider spreading out electricity usage to avoid peak consumption days."
      );
    }

    // Analyze category usage
    Object.entries(categoryTotals).forEach(([category, value]) => {
      const percentage =
        (value / dailyTotals.reduce((sum, h) => sum + h.total, 0)) * 100;
      if (percentage > 40) {
        recommendations.push(
          `High ${category} usage detected (${percentage.toFixed(
            1
          )}%) - Consider implementing ${category.toLowerCase()}-specific energy-saving measures.`
        );
      }
    });

    // Add general recommendations
    recommendations.push(
      "Switch to energy-efficient appliances where possible.",
      "Turn off lights and appliances when not in use.",
      "Unplug devices to avoid phantom loads.",
      "Use LED bulbs for lighting.",
      "Consider using smart plugs or timers for major appliances.",
      "Monitor usage patterns and adjust habits accordingly."
    );

    return recommendations;
  };

  // PDF Report Generation for Electricity
  const generatePDFReport = async () => {
    if (!chartData || !chartData.datasets || !chartData.labels) {
      alert("No data available to generate report");
      return;
    }

    const doc = new jsPDF();
    const pageWidth = doc.internal.pageSize.getWidth();
    const pageHeight = doc.internal.pageSize.getHeight();
    const margin = 20;
    let yPos = 20;
    const lineHeight = 7;
    const graphWidth = pageWidth - 2 * margin;
    const graphHeight = 100;
    const checkPageBreak = (extra = 0) => {
      if (yPos + extra > pageHeight - margin) {
        doc.addPage();
        yPos = margin;
      }
    };

    // Get month and year from the first label
    const firstLabel = chartData.labels[0];
    const parts = firstLabel.includes("-")
      ? firstLabel.split("-")
      : firstLabel.split("/");
    const month = parseInt(parts[1]);
    const year = parseInt(parts[2]) || 2024;
    const monthNames = [
      "January",
      "February",
      "March",
      "April",
      "May",
      "June",
      "July",
      "August",
      "September",
      "October",
      "November",
      "December",
    ];

    // Title
    doc.setFontSize(24);
    doc.text("Electricity Consumption Analysis Report", pageWidth / 2, yPos, {
      align: "center",
    });
    yPos += 15;
    doc.setFontSize(18);
    doc.text(`${monthNames[month - 1]} ${year}`, pageWidth / 2, yPos, {
      align: "center",
    });
    yPos += 20;

    // Calculate total electricity consumption and other metrics
    const totalElectricity = chartData.datasets.reduce((total, dataset) => {
      if (!dataset || !dataset.data) return total;
      return (
        total + dataset.data.reduce((sum, val) => sum + (Number(val) || 0), 0)
      );
    }, 0);

    const dailyTotals = chartData.labels.map((date, index) => ({
      date,
      total: chartData.datasets.reduce((sum, dataset) => {
        if (!dataset || !dataset.data || !dataset.data[index]) return sum;
        return sum + (Number(dataset.data[index]) || 0);
      }, 0),
    }));

    const sortedDailyTotals = [...dailyTotals].sort(
      (a, b) => b.total - a.total
    );
    const top5HighDays = sortedDailyTotals.slice(0, 5);
    const top5LowDays = sortedDailyTotals.slice(-5).reverse();

    // Category-wise totals
    const categoryTotals = {
      Fan:
        fanData?.datasets?.[0]?.data?.reduce(
          (sum, val) => sum + (Number(val) || 0),
          0
        ) || 0,
      Refrigerator:
        refrigeratorData?.datasets?.[0]?.data?.reduce(
          (sum, val) => sum + (Number(val) || 0),
          0
        ) || 0,
      "Washing Machine":
        washingMachineData?.datasets?.[0]?.data?.reduce(
          (sum, val) => sum + (Number(val) || 0),
          0
        ) || 0,
      Heater:
        heaterData?.datasets?.[0]?.data?.reduce(
          (sum, val) => sum + (Number(val) || 0),
          0
        ) || 0,
      Lights:
        lightsData?.datasets?.[0]?.data?.reduce(
          (sum, val) => sum + (Number(val) || 0),
          0
        ) || 0,
    };

    // 1. Total Electricity Consumption
    checkPageBreak(20);
    doc.setFontSize(16);
    doc.text("1. Total Electricity Consumption", margin, yPos);
    yPos += 10;
    doc.setFontSize(12);
    doc.text(
      `Total Electricity Consumption: ${totalElectricity.toFixed(2)} kWh`,
      margin,
      yPos
    );
    yPos += 15;

    // Add Overview Line Chart
    checkPageBreak(graphHeight + 20);
    doc.setFontSize(14);
    doc.text("Total Electricity Usage Over Time", margin, yPos);
    yPos += 10;
    if (overviewChartRef.current) {
      const overviewImg = await html2canvas(overviewChartRef.current, {
        scale: 2,
        useCORS: true,
        backgroundColor: "#ffffff",
      });
      doc.addImage(overviewImg, "PNG", margin, yPos, graphWidth, graphHeight);
      yPos += graphHeight + 20;
    }

    // Add Calendar Visualization
    checkPageBreak(graphHeight + 40);
    doc.setFontSize(14);
    doc.text("Monthly Usage Calendar", margin, yPos);
    yPos += 10;
    if (calendarRef.current) {
      const calendarImg = await html2canvas(calendarRef.current, {
        scale: 2,
        useCORS: true,
        backgroundColor: "#ffffff",
      });
      doc.addImage(
        calendarImg,
        "PNG",
        margin,
        yPos,
        graphWidth,
        graphHeight + 40
      );
      yPos += graphHeight + 50;
    }

    // 2. Category-wise Usage
    checkPageBreak(20 + Object.keys(categoryTotals).length * lineHeight);
    doc.setFontSize(16);
    doc.text("2. Category-wise Usage", margin, yPos);
    yPos += 10;
    doc.setFontSize(12);
    Object.entries(categoryTotals).forEach(([category, value]) => {
      checkPageBreak(lineHeight);
      const percentage = ((value / totalElectricity) * 100).toFixed(2);
      doc.text(
        `${category}: ${value.toFixed(2)} kWh (${percentage}% of total)`,
        margin,
        yPos
      );
      yPos += lineHeight;
    });
    yPos += 10;

    // Add Fan Usage Chart
    checkPageBreak(graphHeight + 20);
    doc.setFontSize(14);
    doc.text("Fan Usage", margin, yPos);
    yPos += 10;
    if (fanChartRef.current) {
      const fanImg = await html2canvas(fanChartRef.current, {
        scale: 2,
        useCORS: true,
        backgroundColor: "#ffffff",
      });
      doc.addImage(fanImg, "PNG", margin, yPos, graphWidth, graphHeight);
      yPos += graphHeight + 20;
    }

    // Add Refrigerator Usage Chart
    checkPageBreak(graphHeight + 20);
    doc.setFontSize(14);
    doc.text("Refrigerator Usage", margin, yPos);
    yPos += 10;
    if (refrigeratorChartRef.current) {
      const refrigeratorImg = await html2canvas(refrigeratorChartRef.current, {
        scale: 2,
        useCORS: true,
        backgroundColor: "#ffffff",
      });
      doc.addImage(
        refrigeratorImg,
        "PNG",
        margin,
        yPos,
        graphWidth,
        graphHeight
      );
      yPos += graphHeight + 20;
    }

    // Add Washing Machine Usage Chart
    checkPageBreak(graphHeight + 20);
    doc.setFontSize(14);
    doc.text("Washing Machine Usage", margin, yPos);
    yPos += 10;
    if (washingMachineChartRef.current) {
      const washingImg = await html2canvas(washingMachineChartRef.current, {
        scale: 2,
        useCORS: true,
        backgroundColor: "#ffffff",
      });
      doc.addImage(washingImg, "PNG", margin, yPos, graphWidth, graphHeight);
      yPos += graphHeight + 20;
    }

    // Add Heater Usage Chart
    checkPageBreak(graphHeight + 20);
    doc.setFontSize(14);
    doc.text("Heater Usage", margin, yPos);
    yPos += 10;
    if (heaterChartRef.current) {
      const heaterImg = await html2canvas(heaterChartRef.current, {
        scale: 2,
        useCORS: true,
        backgroundColor: "#ffffff",
      });
      doc.addImage(heaterImg, "PNG", margin, yPos, graphWidth, graphHeight);
      yPos += graphHeight + 20;
    }

    // Add Lights Usage Chart
    checkPageBreak(graphHeight + 20);
    doc.setFontSize(14);
    doc.text("Lights Usage", margin, yPos);
    yPos += 10;
    if (lightsChartRef.current) {
      const lightsImg = await html2canvas(lightsChartRef.current, {
        scale: 2,
        useCORS: true,
        backgroundColor: "#ffffff",
      });
      doc.addImage(lightsImg, "PNG", margin, yPos, graphWidth, graphHeight);
      yPos += graphHeight + 20;
    }

    // 3. Top 5 High Consumption Days
    checkPageBreak(20 + top5HighDays.length * lineHeight);
    doc.setFontSize(16);
    doc.text("3. Top 5 High Consumption Days", margin, yPos);
    yPos += 10;
    doc.setFontSize(12);
    top5HighDays.forEach((day, index) => {
      checkPageBreak(lineHeight);
      doc.text(
        `${index + 1}. ${day.date}: ${day.total.toFixed(2)} kWh`,
        margin,
        yPos
      );
      yPos += lineHeight;
    });
    yPos += 10;

    // 4. Top 5 Low Consumption Days
    checkPageBreak(20 + top5LowDays.length * lineHeight);
    doc.setFontSize(16);
    doc.text("4. Top 5 Low Consumption Days", margin, yPos);
    yPos += 10;
    doc.setFontSize(12);
    top5LowDays.forEach((day, index) => {
      checkPageBreak(lineHeight);
      doc.text(
        `${index + 1}. ${day.date}: ${day.total.toFixed(2)} kWh`,
        margin,
        yPos
      );
      yPos += lineHeight;
    });
    yPos += 10;

    // 5. Zero Consumption Days
    checkPageBreak(20);
    doc.setFontSize(16);
    doc.text("5. Zero Consumption Days", margin, yPos);
    yPos += 10;
    doc.setFontSize(12);
    const zeroDays = dailyTotals
      .filter((h) => h.total === 0)
      .map((h) => h.date);
    doc.text(
      `Days with no electricity usage: ${zeroDays.join(", ") || "None"}`,
      margin,
      yPos
    );
    yPos += 15;

    // 6. Average Electricity Usage
    checkPageBreak(20);
    doc.setFontSize(16);
    doc.text("6. Average Electricity Usage", margin, yPos);
    yPos += 10;
    doc.setFontSize(12);
    const avgUsage = totalElectricity / (chartData.labels.length || 1);
    doc.text(
      `Average Electricity Usage per Day: ${avgUsage.toFixed(2)} kWh`,
      margin,
      yPos
    );
    yPos += 15;

    // 7. Percentage Contribution by Appliance
    checkPageBreak(20 + Object.keys(categoryTotals).length * lineHeight);
    doc.setFontSize(16);
    doc.text("7. Percentage Contribution by Appliance", margin, yPos);
    yPos += 10;
    doc.setFontSize(12);
    Object.entries(categoryTotals).forEach(([category, value]) => {
      checkPageBreak(lineHeight);
      const percentage = ((value / totalElectricity) * 100).toFixed(2);
      doc.text(`${category}: ${percentage}%`, margin, yPos);
      yPos += lineHeight;
    });
    yPos += 15;

    // 7b. Appliance Breakdown (detailed)
    checkPageBreak(60);
    doc.setFontSize(16);
    doc.text("8. Appliance Breakdown", margin, yPos);
    yPos += 10;
    doc.setFontSize(12);
    const applianceSummary = [
      {
        name: "Fan",
        total: summaryDataState?.totalFanConsumption,
        peakDay: summaryDataState?.peakFanDay,
        peakUsage: summaryDataState?.peakFanUsage,
        unit: "kWh",
      },
      {
        name: "Refrigerator",
        total: summaryDataState?.totalRefrigeratorConsumption,
        peakDay: summaryDataState?.peakRefrigeratorDay,
        peakUsage: summaryDataState?.peakRefrigeratorUsage,
        unit: "kWh",
      },
      {
        name: "Washing Machine",
        total: summaryDataState?.totalWashingMachineConsumption,
        peakDay: summaryDataState?.peakWashingMachineDay,
        peakUsage: summaryDataState?.peakWashingMachineUsage,
        unit: "kWh",
      },
      {
        name: "Heater",
        total: summaryDataState?.totalHeaterConsumption,
        peakDay: summaryDataState?.peakHeaterDay,
        peakUsage: summaryDataState?.peakHeaterUsage,
        unit: "kWh",
      },
      {
        name: "Lights",
        total: summaryDataState?.totalLightsConsumption,
        peakDay: summaryDataState?.peakLightsDay,
        peakUsage: summaryDataState?.peakLightsUsage,
        unit: "kWh",
      },
    ];
    applianceSummary.forEach((appliance) => {
      checkPageBreak(18);
      doc.setFont(undefined, "bold");
      doc.text(`${appliance.name}:`, margin, yPos);
      doc.setFont(undefined, "normal");
      yPos += 7;
      doc.text(
        `  Total Usage: ${appliance.total?.toFixed(2) ?? "N/A"} ${
          appliance.unit
        }`,
        margin + 5,
        yPos
      );
      yPos += 6;
      doc.text(
        `  Peak Usage Day: ${appliance.peakDay ?? "N/A"}`,
        margin + 5,
        yPos
      );
      yPos += 6;
      doc.text(
        `  Usage on Peak Day: ${appliance.peakUsage?.toFixed(2) ?? "N/A"} ${
          appliance.unit
        }`,
        margin + 5,
        yPos
      );
      yPos += 6;
    });
    yPos += 5;

    // 8. Comparative Analysis
    checkPageBreak(30);
    doc.setFontSize(16);
    doc.text("8. Comparative Analysis", margin, yPos);
    yPos += 10;
    doc.setFontSize(12);
    if (allDatasetsStats.datasetCount > 1) {
      doc.text(
        `Total Usage vs Average: ${totalElectricity.toFixed(
          2
        )}kWh vs ${allDatasetsStats.totalAverage.toFixed(2)}kWh`,
        margin,
        yPos
      );
      yPos += lineHeight;
      doc.text(
        `Daily Usage vs Average: ${avgUsage.toFixed(
          2
        )}kWh vs ${allDatasetsStats.dailyAverage.toFixed(2)}kWh`,
        margin,
        yPos
      );
      yPos += lineHeight;
      const difference = (
        ((totalElectricity - allDatasetsStats.totalAverage) /
          allDatasetsStats.totalAverage) *
        100
      ).toFixed(2);
      doc.text(`Difference from Average: ${difference}%`, margin, yPos);
      yPos += lineHeight;
    } else {
      doc.text("Not enough data for comparative analysis", margin, yPos);
      yPos += lineHeight;
    }
    yPos += 10;

    // 9. Next Month's Electricity Requirement Forecast
    checkPageBreak(30);
    doc.setFontSize(16);
    doc.text("9. Next Month's Electricity Requirement Forecast", margin, yPos);
    yPos += 10;
    doc.setFontSize(12);
    const lastThreeMonths = datasets.slice(0, 3);
    if (lastThreeMonths.length > 0) {
      const forecast =
        lastThreeMonths.reduce((sum, dataset) => {
          const total =
            dataset.analysis?.chartData?.datasets?.reduce((acc, ds) => {
              if (!ds || !ds.data) return acc;
              return (
                acc + ds.data.reduce((sum, val) => sum + (Number(val) || 0), 0)
              );
            }, 0) || 0;
          return sum + total;
        }, 0) / lastThreeMonths.length;
      doc.text(
        `Forecasted Electricity Usage: ${forecast.toFixed(2)} kWh`,
        margin,
        yPos
      );
      yPos += lineHeight;
      doc.text(
        `Based on ${lastThreeMonths.length} previous month(s) of data`,
        margin,
        yPos
      );
      yPos += lineHeight;
    } else {
      doc.text("Not enough historical data for forecasting", margin, yPos);
      yPos += lineHeight;
    }
    yPos += 10;

    // 10. Recommendations
    checkPageBreak(20);
    doc.setFontSize(16);
    doc.text("10. Recommendations", margin, yPos);
    yPos += 10;
    doc.setFontSize(12);
    const recommendations = generateRecommendations(
      categoryTotals,
      dailyTotals,
      avgUsage
    );
    recommendations.forEach((rec) => {
      checkPageBreak(lineHeight);
      doc.text(`• ${rec}`, margin, yPos);
      yPos += lineHeight;
    });

    // Save the PDF
    doc.save(
      `electricity_consumption_analysis_${monthNames[month - 1]}_${year}.pdf`
    );
  };

  return (
    <div className="electricity-analysis-container">
      <ElectricityMonthComparison
        datasets={datasets}
        onCompare={handleComparisonResults}
      />

      <div className="download-section">
        <button
          className="download-button"
          onClick={generatePDFReport}
          disabled={
            !chartData || !chartData.labels || chartData.labels.length === 0
          }
        ></button>
      </div>

      <h1>Electricity Analysis</h1>
      <div className="analysis-controls">
        <div className="dataset-selector">
          <select
            id="dataset-select"
            value={selectedDataset || ""}
            onChange={handleDatasetChange}
          >
            <option value="">Select a dataset</option>
            {datasets.map((dataset, index) => {
              let displayDate = "";
              if (
                dataset.analysis &&
                dataset.analysis.chartData &&
                dataset.analysis.chartData.labels &&
                dataset.analysis.chartData.labels.length > 0
              ) {
                try {
                  // Get the first date from the chart data
                  const dateStr = dataset.analysis.chartData.labels[0];
                  // Split the date string and extract month number and year
                  const parts = dateStr.includes("-")
                    ? dateStr.split("-")
                    : dateStr.split("/");
                  let monthNum, year;

                  // Check if the part is a month number (01-12)
                  if (parts.length >= 3) {
                    if (parseInt(parts[1]) >= 1 && parseInt(parts[1]) <= 12) {
                      monthNum = parseInt(parts[1]);
                      year = parts[2]; // Use actual year from data
                    } else if (
                      parseInt(parts[0]) >= 1 &&
                      parseInt(parts[0]) <= 12
                    ) {
                      monthNum = parseInt(parts[0]);
                      year = parts[2]; // Use actual year from data
                    }

                    // Handle year parsing
                    if (year < 100) {
                      year = year >= 25 ? 2000 + year : 1900 + year;
                    }

                    // Convert month number to month name
                    const monthNames = [
                      "January",
                      "February",
                      "March",
                      "April",
                      "May",
                      "June",
                      "July",
                      "August",
                      "September",
                      "October",
                      "November",
                      "December",
                    ];
                    const monthName = monthNames[monthNum - 1] || "January";
                    displayDate = `${monthName}-${year}`;
                  }
                } catch (error) {
                  console.error("Error parsing date:", error);
                  displayDate = "Unknown Date";
                }
              }

              return (
                <option key={dataset._id} value={dataset._id}>
                  Dataset {index + 1} - {displayDate}
                </option>
              );
            })}
          </select>
        </div>
        <div className="upload-controls">
          <input
            type="file"
            className="file-uplod"
            onChange={handleFileChange}
            ref={fileInputRef}
            accept=".csv,.xlsx,.xls"
          />
          <button className="file-upload-button" onClick={handleUpload}>
            Upload & Analyze
          </button>
        </div>
      </div>

      {/* Message when no data is uploaded */}
      {(!showSummary ||
        !chartData ||
        !chartData.labels ||
        chartData.labels.length === 0) && (
        <div
          className="no-data-message"
          style={{ textAlign: "center", marginTop: "20px" }}
        >
          <p>Please upload a dataset to view the analysis.</p>
        </div>
      )}

      {/* Charts Section - Only show when there is actual data */}
      {chartData && chartData.labels && chartData.labels.length > 0 && (
        <div className="electricity-analysis-graph">
          {/* Overview Section */}
          <div
            className="analysis-section"
            style={{
              overflow: "hidden",
            }}
          >
            <h2 className="section-title">Overview</h2>
            <div
              className="section-content"
              style={{
                width: "100%",
                overflow: "hidden",
                height: "calc(100% - 40px)",
                margin: "0 auto",
              }}
            >
              <div
                style={{
                  width: "100%",
                  height: "100%",
                }}
              >
                <div
                  className="inner-row"
                  style={{
                    width: "100%",
                    overflowX: "auto",
                    overflowY: "hidden",
                    marginBottom: "20px",
                    padding: "20px",
                  }}
                >
                  <h3>Total Electricity Usage</h3>
                  <p>
                    This graph shows the breakdown of electricity consumption by
                    different utilities over time.
                  </p>
                  <div
                    style={{
                      width: "100%",
                      minWidth: "800px",
                      position: "relative",
                      paddingBottom: "20px",
                      height: "calc(100% - 80px)",
                    }}
                    ref={overviewChartRef}
                  >
                    {chartData && chartData.labels && (
                      <Line
                        data={{
                          labels: chartData.labels,
                          datasets: [
                            {
                              label: "Fan",
                              data: fanData?.datasets[0]?.data || [],
                              fill: true,
                              tension: 0.3,
                              backgroundColor: "rgba(187, 157, 255, 0.5)",
                              borderColor: "rgba(187, 157, 255, 1)",
                              pointRadius: 3,
                              pointBackgroundColor: "rgba(187, 157, 255, 1)",
                              borderWidth: 1,
                              order: 1,
                            },
                            {
                              label: "Washing Machine",
                              data: washingMachineData?.datasets[0]?.data || [],
                              fill: true,
                              tension: 0.3,
                              backgroundColor: "rgba(255, 220, 130, 0.5)",
                              borderColor: "rgba(255, 220, 130, 1)",
                              pointRadius: 3,
                              pointBackgroundColor: "rgba(255, 220, 130, 1)",
                              borderWidth: 1,
                              order: 2,
                            },
                            {
                              label: "Heater",
                              data: heaterData?.datasets[0]?.data || [],
                              fill: true,
                              tension: 0.3,
                              backgroundColor: "rgba(255, 190, 140, 0.5)",
                              borderColor: "rgba(255, 190, 140, 1)",
                              pointRadius: 3,
                              pointBackgroundColor: "rgba(255, 190, 140, 1)",
                              borderWidth: 1,
                              order: 3,
                            },
                            {
                              label: "Refrigerator",
                              data: refrigeratorData?.datasets[0]?.data || [],
                              fill: true,
                              tension: 0.3,
                              backgroundColor: "rgba(255, 170, 180, 0.5)",
                              borderColor: "rgba(255, 170, 180, 1)",
                              pointRadius: 3,
                              pointBackgroundColor: "rgba(255, 170, 180, 1)",
                              borderWidth: 1,
                              order: 4,
                            },
                            {
                              label: "Lights",
                              data: lightsData?.datasets[0]?.data || [],
                              fill: true,
                              tension: 0.3,
                              backgroundColor: "rgba(140, 220, 220, 0.5)",
                              borderColor: "rgba(140, 220, 220, 1)",
                              pointRadius: 3,
                              pointBackgroundColor: "rgba(140, 220, 220, 1)",
                              borderWidth: 1,
                              order: 5,
                            },
                          ],
                        }}
                        options={{
                          responsive: true,
                          maintainAspectRatio: false,
                          interaction: {
                            mode: "nearest",
                            axis: "x",
                            intersect: false,
                          },
                          scales: {
                            x: {
                              grid: {
                                display: true,
                                color: "rgba(0, 0, 0, 0.05)",
                              },
                              ticks: {
                                maxRotation: 45,
                                minRotation: 45,
                                color: "#666",
                                font: {
                                  size: 10,
                                },
                              },
                            },
                            y: {
                              stacked: true,
                              grid: {
                                display: true,
                                color: "rgba(0, 0, 0, 0.05)",
                              },
                              ticks: {
                                color: "#666",
                                font: {
                                  size: 11,
                                },
                              },
                              title: {
                                display: true,
                                text: "Electricity Usage (kWh)",
                                color: "#666",
                                font: {
                                  size: 12,
                                  weight: "normal",
                                },
                              },
                            },
                          },
                          plugins: {
                            tooltip: {
                              mode: "index",
                              intersect: false,
                              backgroundColor: "rgba(255, 255, 255, 0.95)",
                              titleColor: "#000",
                              bodyColor: "#666",
                              borderColor: "#ddd",
                              borderWidth: 1,
                              padding: 10,
                              displayColors: true,
                              callbacks: {
                                title: function (context) {
                                  return context[0].label;
                                },
                                label: function (context) {
                                  let label = context.dataset.label || "";
                                  if (label) {
                                    label += ": ";
                                  }
                                  if (context.parsed.y !== null) {
                                    label +=
                                      context.parsed.y.toFixed(1) + " kWh";
                                  }
                                  return label;
                                },
                              },
                            },
                            legend: {
                              position: "top",
                              align: "center",
                              labels: {
                                usePointStyle: true,
                                padding: 15,
                                boxWidth: 8,
                                boxHeight: 8,
                                color: "#666",
                                font: {
                                  size: 11,
                                },
                              },
                            },
                          },
                        }}
                        style={{
                          height: "400px",
                          width: "100%",
                          background: "white",
                          padding: "15px",
                          borderRadius: "8px",
                          boxShadow: "0 2px 4px rgba(0,0,0,0.05)",
                        }}
                      />
                    )}
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Monthly Calendar View */}
          <div className="analysis-section">
            <h2 className="section-title">Monthly Usage Calendar</h2>
            <div className="section-content">
              <p>
                Daily electricity consumption overview with color-coded
                intensity.
              </p>
              {chartData && chartData.labels && chartData.labels.length > 0 && (
                <>
                  <div ref={calendarRef}>
                    <Calendar
                      data={(() => {
                        const dailyData = {};
                        chartData.labels.forEach((label, index) => {
                          const parts = label.includes("-")
                            ? label.split("-")
                            : label.split("/");
                          const day = parseInt(parts[0]);
                          if (
                            !isNaN(day) &&
                            chartData.datasets[0].data[index] !== undefined
                          ) {
                            dailyData[day] = parseFloat(
                              chartData.datasets[0].data[index]
                            );
                          }
                        });
                        return dailyData;
                      })()}
                      month={(() => {
                        const firstLabel = chartData.labels[0];
                        const parts = firstLabel.includes("-")
                          ? firstLabel.split("-")
                          : firstLabel.split("/");
                        return parseInt(parts[1]) || 1;
                      })()}
                      year={(() => {
                        const firstLabel = chartData.labels[0];
                        const parts = firstLabel.includes("-")
                          ? firstLabel.split("-")
                          : firstLabel.split("/");
                        return parseInt(parts[2]) || new Date().getFullYear();
                      })()}
                    />
                  </div>
                  <div
                    style={{
                      display: "flex",
                      gap: 16,
                      marginTop: 16,
                      flexWrap: "wrap",
                    }}
                  >
                    <div className="legend-item">
                      <span
                        className="legend-color"
                        style={{ background: "rgba(216, 180, 254, 0.4)" }}
                      ></span>
                      Very Low Usage
                    </div>
                    <div className="legend-item">
                      <span
                        className="legend-color"
                        style={{ background: "rgba(165, 180, 252, 0.5)" }}
                      ></span>
                      Low Usage
                    </div>
                    <div className="legend-item">
                      <span
                        className="legend-color"
                        style={{ background: "rgba(103, 232, 249, 0.6)" }}
                      ></span>
                      Medium Usage
                    </div>
                    <div className="legend-item">
                      <span
                        className="legend-color"
                        style={{ background: "rgba(110, 231, 183, 0.7)" }}
                      ></span>
                      High Usage
                    </div>
                    <div className="legend-item">
                      <span
                        className="legend-color"
                        style={{ background: "rgba(253, 186, 116, 0.8)" }}
                      ></span>
                      Very High Usage
                    </div>
                  </div>
                </>
              )}
            </div>
          </div>

          {/* Major Appliances Section */}
          <div className="analysis-section">
            <h2 className="section-title">Major Appliances</h2>
            <div className="section-content">
              <div style={{ display: "flex", marginBottom: "20px" }}>
                <div style={{ width: "50%" }}>
                  <div className="inner-row" ref={fanChartRef}>
                    <h3>Fan Usage</h3>
                    <p>Power consumption for cooling and ventilation.</p>
                    {fanData && fanData.labels && fanData.datasets && (
                      <Bar key={JSON.stringify(fanData)} data={fanData} />
                    )}
                  </div>
                </div>
                <div style={{ width: "50%" }}>
                  <div className="inner-row" ref={refrigeratorChartRef}>
                    <h3>Refrigerator Usage</h3>
                    <p>Power consumption for refrigeration.</p>
                    {refrigeratorData &&
                      refrigeratorData.labels &&
                      refrigeratorData.datasets && (
                        <Bar
                          key={JSON.stringify(refrigeratorData)}
                          data={refrigeratorData}
                        />
                      )}
                  </div>
                </div>
              </div>
              <div style={{ display: "flex", marginBottom: "20px" }}>
                <div style={{ width: "50%" }}>
                  <div className="inner-row" ref={washingMachineChartRef}>
                    <h3>Washing Machine Usage</h3>
                    <p>Power consumption for laundry cycles.</p>
                    {washingMachineData &&
                      washingMachineData.labels &&
                      washingMachineData.datasets && (
                        <Bar
                          key={JSON.stringify(washingMachineData)}
                          data={washingMachineData}
                        />
                      )}
                  </div>
                </div>
                <div style={{ width: "50%" }}>
                  <div className="inner-row" ref={heaterChartRef}>
                    <h3>Heater Usage</h3>
                    <p>Power consumption for heating.</p>
                    {heaterData && heaterData.labels && heaterData.datasets && (
                      <Bar key={JSON.stringify(heaterData)} data={heaterData} />
                    )}
                  </div>
                </div>
              </div>
              <div style={{ display: "flex", marginBottom: "20px" }}>
                <div style={{ width: "50%" }}>
                  <div className="inner-row" ref={lightsChartRef}>
                    <h3>Lighting Usage</h3>
                    <p>Power consumption for all lighting fixtures.</p>
                    {lightsData && lightsData.labels && lightsData.datasets && (
                      <Bar key={JSON.stringify(lightsData)} data={lightsData} />
                    )}
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Analysis Summary Section */}
          <div className="analysis-section">
            <h2 className="section-title">Detailed Analysis</h2>
            <div className="summary-section">
              <h3>Analysis Summary</h3>
              {summaryDataState && (
                <div className="summary-content">
                  {/* Overall Usage Section */}
                  <div className="summary-section">
                    <h4>Overall Usage</h4>
                    <ul>
                      <li className="flex-between">
                        <div>
                          <strong>Total Electricity:</strong>
                          <div>
                            <span className="value">
                              {summaryDataState.totalElectricityConsumption.toFixed(
                                2
                              )}{" "}
                              kWh
                            </span>
                          </div>
                        </div>
                        <span
                          className={`status-badge ${getStatusBadge(
                            summaryDataState?.totalElectricityConsumption,
                            "total"
                          )}`}
                          dangerouslySetInnerHTML={{
                            __html: getStatusMessage(
                              summaryDataState?.totalElectricityConsumption,
                              "total"
                            ),
                          }}
                        ></span>
                      </li>
                      <li className="flex-between">
                        <div>
                          <strong>Daily Average:</strong>
                          <div>
                            <span className="value">
                              {summaryDataState.averageElectricityUsage.toFixed(
                                2
                              )}{" "}
                              kWh
                            </span>
                          </div>
                        </div>
                        <span
                          className={`status-badge ${getStatusBadge(
                            summaryDataState?.averageElectricityUsage,
                            "daily"
                          )}`}
                          dangerouslySetInnerHTML={{
                            __html: getStatusMessage(
                              summaryDataState?.averageElectricityUsage,
                              "daily"
                            ),
                          }}
                        ></span>
                      </li>
                      <li>
                        <strong>Peak Usage Day:</strong>
                        <div>
                          <span className="value">
                            {summaryDataState.maxElectricityUsage}
                          </span>
                        </div>
                      </li>
                    </ul>
                  </div>

                  {/* Appliance Breakdown Section */}
                  <div className="summary-section">
                    <h4>Appliance Breakdown</h4>
                    <div className="breakdown-grid">
                      <div>
                        <ul>
                          <li>
                            <strong>Fan:</strong>
                            <div>
                              <span className="value">
                                {summaryDataState.totalFanConsumption.toFixed(
                                  2
                                )}{" "}
                                kWh
                              </span>
                              <span className="date-info">
                                Peak: {summaryDataState.peakFanDay}
                              </span>
                              <span className="date-info">
                                Usage on peak day:{" "}
                                {summaryDataState.peakFanUsage.toFixed(2)} kWh
                              </span>
                            </div>
                          </li>
                          <li>
                            <strong>Refrigerator:</strong>
                            <div>
                              <span className="value">
                                {summaryDataState.totalRefrigeratorConsumption.toFixed(
                                  2
                                )}{" "}
                                kWh
                              </span>
                              <span className="date-info">
                                Peak: {summaryDataState.peakRefrigeratorDay}
                              </span>
                              <span className="date-info">
                                Usage on peak day:{" "}
                                {summaryDataState.peakRefrigeratorUsage.toFixed(
                                  2
                                )}{" "}
                                kWh
                              </span>
                            </div>
                          </li>
                          <li>
                            <strong>Washing Machine:</strong>
                            <div>
                              <span className="value">
                                {summaryDataState.totalWashingMachineConsumption.toFixed(
                                  2
                                )}{" "}
                                kWh
                              </span>
                              <span className="date-info">
                                Peak: {summaryDataState.peakWashingMachineDay}
                              </span>
                              <span className="date-info">
                                Usage on peak day:{" "}
                                {summaryDataState.peakWashingMachineUsage.toFixed(
                                  2
                                )}{" "}
                                kWh
                              </span>
                            </div>
                          </li>
                        </ul>
                      </div>
                      <div>
                        <ul>
                          <li>
                            <strong>Heater:</strong>
                            <div>
                              <span className="value">
                                {summaryDataState.totalHeaterConsumption.toFixed(
                                  2
                                )}{" "}
                                kWh
                              </span>
                              <span className="date-info">
                                Peak: {summaryDataState.peakHeaterDay}
                              </span>
                              <span className="date-info">
                                Usage on peak day:{" "}
                                {summaryDataState.peakHeaterUsage.toFixed(2)}{" "}
                                kWh
                              </span>
                            </div>
                          </li>
                          <li>
                            <strong>Lights:</strong>
                            <div>
                              <span className="value">
                                {summaryDataState.totalLightsConsumption.toFixed(
                                  2
                                )}{" "}
                                kWh
                              </span>
                              <span className="date-info">
                                Peak: {summaryDataState.peakLightsDay}
                              </span>
                              <span className="date-info">
                                Usage on peak day:{" "}
                                {summaryDataState.peakLightsUsage.toFixed(2)}{" "}
                                kWh
                              </span>
                            </div>
                          </li>
                        </ul>
                      </div>
                    </div>
                  </div>

                  {/* Key Insights Section */}
                  <div className="summary-section">
                    <h4>Key Insights</h4>
                    <ul className="insights-list">
                      <li>
                        <strong>Most Energy-Intensive Appliance:</strong>{" "}
                        <span className="insight-badge">
                          {(() => {
                            const consumptions = {
                              Fan: summaryDataState?.totalFanConsumption || 0,
                              Refrigerator:
                                summaryDataState?.totalRefrigeratorConsumption ||
                                0,
                              "Washing Machine":
                                summaryDataState?.totalWashingMachineConsumption ||
                                0,
                              Heater:
                                summaryDataState?.totalHeaterConsumption || 0,
                              Lights:
                                summaryDataState?.totalLightsConsumption || 0,
                            };
                            const maxAppliance = Object.entries(
                              consumptions
                            ).reduce((a, b) => (a[1] > b[1] ? a : b));
                            return `${
                              maxAppliance[0]
                            } (${maxAppliance[1].toFixed(2)} kWh)`;
                          })()}
                        </span>
                      </li>
                      <li>
                        <strong>Usage Status:</strong>{" "}
                        <span
                          className={`status-badge ${getStatusBadge(
                            summaryDataState?.averageElectricityUsage,
                            "daily"
                          )}`}
                          dangerouslySetInnerHTML={{
                            __html: getStatusMessage(
                              summaryDataState?.averageElectricityUsage,
                              "daily"
                            ),
                          }}
                        ></span>
                      </li>
                    </ul>
                  </div>

                  {renderComparativeAnalysis()}
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Standalone Summary Section for when there's no chart data */}
      {!chartData && summaryDataState && showSummary && (
        <div className="standalone-summary" style={{ marginTop: "20px" }}>
          <div className="summary-section">
            <h3>Analysis Summary</h3>
            <div className="summary-content">
              {/* Overall Usage Section */}
              <div className="summary-section">
                <h4>Overall Usage</h4>
                <ul>
                  <li className="flex-between">
                    <div>
                      <strong>Total Electricity:</strong>
                      <div>
                        <span className="value">
                          {summaryDataState.totalElectricityConsumption.toFixed(
                            2
                          )}{" "}
                          kWh
                        </span>
                      </div>
                    </div>
                    <span
                      className={`status-badge ${getStatusBadge(
                        summaryDataState?.totalElectricityConsumption,
                        "total"
                      )}`}
                      dangerouslySetInnerHTML={{
                        __html: getStatusMessage(
                          summaryDataState?.totalElectricityConsumption,
                          "total"
                        ),
                      }}
                    ></span>
                  </li>
                  <li className="flex-between">
                    <div>
                      <strong>Daily Average:</strong>
                      <div>
                        <span className="value">
                          {summaryDataState.averageElectricityUsage.toFixed(2)}{" "}
                          kWh
                        </span>
                      </div>
                    </div>
                    <span
                      className={`status-badge ${getStatusBadge(
                        summaryDataState?.averageElectricityUsage,
                        "daily"
                      )}`}
                      dangerouslySetInnerHTML={{
                        __html: getStatusMessage(
                          summaryDataState?.averageElectricityUsage,
                          "daily"
                        ),
                      }}
                    ></span>
                  </li>
                  <li>
                    <strong>Peak Usage Day:</strong>
                    <div>
                      <span className="value">
                        {summaryDataState.maxElectricityUsage}
                      </span>
                    </div>
                  </li>
                </ul>
              </div>

              {/* Appliance Breakdown Section */}
              <div className="summary-section">
                <h4>Appliance Breakdown</h4>
                <div className="breakdown-grid">
                  <div>
                    <ul>
                      <li>
                        <strong>Fan:</strong>
                        <div>
                          <span className="value">
                            {summaryDataState.totalFanConsumption.toFixed(2)}{" "}
                            kWh
                          </span>
                          <span className="date-info">
                            Peak: {summaryDataState.peakFanDay}
                          </span>
                          <span className="date-info">
                            Usage on peak day:{" "}
                            {summaryDataState.peakFanUsage.toFixed(2)} kWh
                          </span>
                        </div>
                      </li>
                      <li>
                        <strong>Refrigerator:</strong>
                        <div>
                          <span className="value">
                            {summaryDataState.totalRefrigeratorConsumption.toFixed(
                              2
                            )}{" "}
                            kWh
                          </span>
                          <span className="date-info">
                            Peak: {summaryDataState.peakRefrigeratorDay}
                          </span>
                          <span className="date-info">
                            Usage on peak day:{" "}
                            {summaryDataState.peakRefrigeratorUsage.toFixed(2)}{" "}
                            kWh
                          </span>
                        </div>
                      </li>
                      <li>
                        <strong>Washing Machine:</strong>
                        <div>
                          <span className="value">
                            {summaryDataState.totalWashingMachineConsumption.toFixed(
                              2
                            )}{" "}
                            kWh
                          </span>
                          <span className="date-info">
                            Peak: {summaryDataState.peakWashingMachineDay}
                          </span>
                          <span className="date-info">
                            Usage on peak day:{" "}
                            {summaryDataState.peakWashingMachineUsage.toFixed(
                              2
                            )}{" "}
                            kWh
                          </span>
                        </div>
                      </li>
                    </ul>
                  </div>
                  <div>
                    <ul>
                      <li>
                        <strong>Heater:</strong>
                        <div>
                          <span className="value">
                            {summaryDataState.totalHeaterConsumption.toFixed(2)}{" "}
                            kWh
                          </span>
                          <span className="date-info">
                            Peak: {summaryDataState.peakHeaterDay}
                          </span>
                          <span className="date-info">
                            Usage on peak day:{" "}
                            {summaryDataState.peakHeaterUsage.toFixed(2)} kWh
                          </span>
                        </div>
                      </li>
                      <li>
                        <strong>Lights:</strong>
                        <div>
                          <span className="value">
                            {summaryDataState.totalLightsConsumption.toFixed(2)}{" "}
                            kWh
                          </span>
                          <span className="date-info">
                            Peak: {summaryDataState.peakLightsDay}
                          </span>
                          <span className="date-info">
                            Usage on peak day:{" "}
                            {summaryDataState.peakLightsUsage.toFixed(2)} kWh
                          </span>
                        </div>
                      </li>
                    </ul>
                  </div>
                </div>
              </div>

              {/* Key Insights Section */}
              <div className="summary-section">
                <h4>Key Insights</h4>
                <ul className="insights-list">
                  <li>
                    <strong>Most Energy-Intensive Appliance:</strong>{" "}
                    <span className="insight-badge">
                      {(() => {
                        const consumptions = {
                          Fan: summaryDataState?.totalFanConsumption || 0,
                          Refrigerator:
                            summaryDataState?.totalRefrigeratorConsumption || 0,
                          "Washing Machine":
                            summaryDataState?.totalWashingMachineConsumption ||
                            0,
                          Heater: summaryDataState?.totalHeaterConsumption || 0,
                          Lights: summaryDataState?.totalLightsConsumption || 0,
                        };
                        const maxAppliance = Object.entries(
                          consumptions
                        ).reduce((a, b) => (a[1] > b[1] ? a : b));
                        return `${maxAppliance[0]} (${maxAppliance[1].toFixed(
                          2
                        )} kWh)`;
                      })()}
                    </span>
                  </li>
                  <li>
                    <strong>Usage Status:</strong>{" "}
                    <span
                      className={`status-badge ${getStatusBadge(
                        summaryDataState?.averageElectricityUsage,
                        "daily"
                      )}`}
                      dangerouslySetInnerHTML={{
                        __html: getStatusMessage(
                          summaryDataState?.averageElectricityUsage,
                          "daily"
                        ),
                      }}
                    ></span>
                  </li>
                </ul>
              </div>

              {renderComparativeAnalysis()}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default ElectricityAnalysis;
