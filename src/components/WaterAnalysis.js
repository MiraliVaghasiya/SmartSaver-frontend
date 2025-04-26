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
  ArcElement,
  RadialLinearScale,
} from "chart.js";
import "./style/Summary.css";
import MonthComparison from "./MonthComparison";
import "./Analysis.css";
import { jsPDF } from "jspdf";
import html2canvas from "html2canvas";

// Register Chart.js components
ChartJS.register(
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  BarElement,
  Title,
  Tooltip,
  Legend,
  ArcElement,
  RadialLinearScale
);

// Create a Chart constructor for use in the PDF generation
const Chart = ChartJS;

// Add Calendar component
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
          title={isValidDay ? `${usageLevel}: ${formatUsage(usage)} L` : ""}
        >
          {isValidDay && (
            <>
              <div className="day-number">{dayNumber}</div>
              <div className="usage-value">{formatUsage(usage)} L</div>
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

const WaterAnalysis = ({
  setWaterData,
  setSummaryData,
  setSummaryType,
  setAllDatasetsStats,
}) => {
  const [file, setFile] = useState(null);
  const [chartData, setChartData] = useState(null);
  const [drinkingData, setDrinkingData] = useState(null);
  const [cookingData, setCookingData] = useState(null);
  const [bathingData, setBathingData] = useState(null);
  const [washingClothesData, setWashingClothesData] = useState(null);
  const [dishwashingData, setDishwashingData] = useState(null);
  const [waterConsumptionByActivityData, setWaterConsumptionByActivityData] =
    useState(null);
  const [datasets, setDatasets] = useState([]);
  const [selectedDataset, setSelectedDataset] = useState(null);
  const [summaryData, setSummaryDataState] = useState({
    totalWaterConsumption: 0,
    averageWaterUsage: 0,
    maxWaterUsage: "N/A",
    totalShowerConsumption: 0,
    totalToiletConsumption: 0,
    totalDishwasherConsumption: 0,
    totalWashingMachineConsumption: 0,
    totalSinkConsumption: 0,
    peakShowerDay: "N/A",
    peakToiletDay: "N/A",
    peakDishwasherDay: "N/A",
    peakWashingMachineDay: "N/A",
    peakSinkDay: "N/A",
    peakShowerUsage: 0,
    peakToiletUsage: 0,
    peakDishwasherUsage: 0,
    peakWashingMachineUsage: 0,
    peakSinkUsage: 0,
  });
  const [showSummary, setShowSummary] = useState(false);
  const fileInputRef = React.useRef(null);
  const [allDatasetsStats, setAllDatasetsStatsState] = useState({
    totalAverage: 0,
    totalStdDev: 0,
    dailyAverage: 0,
    dailyStdDev: 0,
    datasetCount: 0,
    applianceAverages: {},
  });
  const [isOpen, setIsOpen] = useState(false);
  const overviewChartRef = useRef(null);
  const pieChartRef = useRef(null);
  const barChartRef = useRef(null);
  const showerChartRef = useRef(null);
  const toiletChartRef = useRef(null);
  const dishwasherChartRef = useRef(null);
  const sinkChartRef = useRef(null);
  const washingMachineChartRef = useRef(null);
  const calendarRef = useRef(null);

  useEffect(() => {
    // Fetch water datasets for the current user when component mounts
    fetchWaterDatasets();
  }, []);

  const fetchWaterDatasets = async () => {
    try {
      const response = await axiosInstance.get("/dataset/datasets");
      const waterDatasets = response.data.filter(
        (dataset) => dataset.type === "water"
      );
      setDatasets(waterDatasets);

      // Calculate statistics from all datasets
      calculateAllDatasetsStats(waterDatasets);

      // If there are datasets, use the most recent one
      if (waterDatasets.length > 0) {
        const mostRecent = waterDatasets[0];
        setSelectedDataset(mostRecent._id);
        updateAnalysisData(mostRecent.analysis);
      }
    } catch (error) {
      console.error("Error fetching water datasets:", error);
      if (error.response?.status === 401) {
        // Handle unauthorized access
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
    // Update chart data
    setChartData(analysisData.chartData);
    setDrinkingData(analysisData.drinkingData);
    setCookingData(analysisData.cookingData);
    setBathingData(analysisData.bathingData);
    setWashingClothesData(analysisData.washingClothesData);
    setDishwashingData(analysisData.dishwashingData);
    setWaterConsumptionByActivityData(
      analysisData.waterConsumptionByActivityData
    );

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

    // Calculate and set summary data
    const summary = {
      totalWaterConsumption: calculateTotal(analysisData.chartData),
      averageWaterUsage: calculateAverage(analysisData.chartData),
      maxWaterUsage: findPeakDay(analysisData.chartData),
      totalShowerConsumption: calculateTotal(analysisData.bathingData),
      totalToiletConsumption: calculateTotal(analysisData.drinkingData),
      totalDishwasherConsumption: calculateTotal(analysisData.dishwashingData),
      totalWashingMachineConsumption: calculateTotal(
        analysisData.washingClothesData
      ),
      totalSinkConsumption: calculateTotal(analysisData.cookingData),
      peakShowerDay: findPeakDay(analysisData.bathingData),
      peakToiletDay: findPeakDay(analysisData.drinkingData),
      peakDishwasherDay: findPeakDay(analysisData.dishwashingData),
      peakWashingMachineDay: findPeakDay(analysisData.washingClothesData),
      peakSinkDay: findPeakDay(analysisData.cookingData),
      peakShowerUsage: findPeakUsage(analysisData.bathingData),
      peakToiletUsage: findPeakUsage(analysisData.drinkingData),
      peakDishwasherUsage: findPeakUsage(analysisData.dishwashingData),
      peakWashingMachineUsage: findPeakUsage(analysisData.washingClothesData),
      peakSinkUsage: findPeakUsage(analysisData.cookingData),
    };

    // Update state
    setSummaryDataState(summary);
    setWaterData(analysisData);
    setShowSummary(true);
    if (typeof setSummaryData === "function") setSummaryData(summary);
    if (typeof setSummaryType === "function") setSummaryType();
  };

  const handleFileChange = (e) => {
    setFile(e.target.files[0]);
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
        "/dataset/upload/water",
        formData,
        {
          headers: {
            "Content-Type": "multipart/form-data",
          },
        }
      );

      if (response.data) {
        const analysisData = response.data.analysis;

        // Update chart data
        setChartData(analysisData.chartData);
        setDrinkingData(analysisData.drinkingData);
        setCookingData(analysisData.cookingData);
        setBathingData(analysisData.bathingData);
        setWashingClothesData(analysisData.washingClothesData);
        setDishwashingData(analysisData.dishwashingData);
        setWaterConsumptionByActivityData(
          analysisData.waterConsumptionByActivityData
        );

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

        // Calculate and set summary data
        const summary = {
          totalWaterConsumption: calculateTotal(analysisData.chartData),
          averageWaterUsage: calculateAverage(analysisData.chartData),
          maxWaterUsage: findPeakDay(analysisData.chartData),
          totalShowerConsumption: calculateTotal(analysisData.bathingData),
          totalToiletConsumption: calculateTotal(analysisData.drinkingData),
          totalDishwasherConsumption: calculateTotal(
            analysisData.dishwashingData
          ),
          totalWashingMachineConsumption: calculateTotal(
            analysisData.washingClothesData
          ),
          totalSinkConsumption: calculateTotal(analysisData.cookingData),
          peakShowerDay: findPeakDay(analysisData.bathingData),
          peakToiletDay: findPeakDay(analysisData.drinkingData),
          peakDishwasherDay: findPeakDay(analysisData.dishwashingData),
          peakWashingMachineDay: findPeakDay(analysisData.washingClothesData),
          peakSinkDay: findPeakDay(analysisData.cookingData),
          peakShowerUsage: findPeakUsage(analysisData.bathingData),
          peakToiletUsage: findPeakUsage(analysisData.drinkingData),
          peakDishwasherUsage: findPeakUsage(analysisData.dishwashingData),
          peakWashingMachineUsage: findPeakUsage(
            analysisData.washingClothesData
          ),
          peakSinkUsage: findPeakUsage(analysisData.cookingData),
        };

        // Log the data for debugging
        console.log("Analysis Data:", analysisData);
        console.log("Calculated Summary:", summary);

        // Update state
        setSummaryDataState(summary);
        setWaterData(analysisData);
        setShowSummary(true);

        // Clear file input
        setFile(null);
        if (fileInputRef.current) {
          fileInputRef.current.value = "";
        }

        // Refresh datasets list
        fetchWaterDatasets();
      }
    } catch (error) {
      console.error("Error uploading file:", error);
      alert("Error uploading file. Please try again.");
    }
  };

  const getGraphType = (data) => {
    const max = Math.max(...data.datasets[0].data);
    const min = Math.min(...data.datasets[0].data);
    const range = max - min;

    if (range > 100) {
      return "Bar";
    } else if (range > 10) {
      return "Line";
    } else {
      return "Scatter";
    }
  };

  const formatNumber = (value) => {
    if (value === undefined || value === null) return "0.00";
    return Number(value).toFixed(2);
  };

  const getStatusBadge = (value, type = "total") => {
    const numValue = Number(value) || 0;

    // Different thresholds for different types of measurements (in Liters)
    const thresholds = {
      total: {
        low: 4000, // 4000L - Very efficient monthly usage
        medium: 6000, // 6000L - Average monthly usage
        high: 9000, // 9000L+ - High monthly usage
      },
      daily: {
        low: 130, // 130L - Efficient daily usage
        medium: 200, // 200L - Average daily usage
        high: 300, // 300L+ - High daily usage
      },
      shower: {
        low: 50, // 50L - Efficient shower
        medium: 80, // 80L - Average shower
        high: 120, // 120L+ - Long shower
      },
      toilet: {
        low: 30, // 30L - Efficient toilet usage
        medium: 50, // 50L - Average toilet usage
        high: 70, // 70L+ - High toilet usage
      },
      dishwasher: {
        low: 10, // 10L - Efficient cycle
        medium: 15, // 15L - Average cycle
        high: 20, // 20L+ - Inefficient cycle
      },
      washing: {
        low: 45, // 45L - Efficient cycle
        medium: 60, // 60L - Average cycle
        high: 80, // 80L+ - Inefficient cycle
      },
      sink: {
        low: 20, // 20L - Efficient usage
        medium: 35, // 35L - Average usage
        high: 50, // 50L+ - High usage
      },
    };

    const threshold = thresholds[type] || thresholds.total;

    if (numValue <= threshold.low) return "success";
    if (numValue <= threshold.medium) return "warning";
    return "danger";
  };

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
      return `${status} Consumption (${numValue.toFixed(
        0
      )}L vs. Avg ${allDatasetsStats.totalAverage.toFixed(0)}L)`;
    }

    // For daily consumption
    if (type === "daily" && allDatasetsStats.datasetCount > 0) {
      const status = getComparativeStatus(
        numValue,
        allDatasetsStats.dailyAverage,
        allDatasetsStats.dailyStdDev
      );
      return `${status} Consumption (${numValue.toFixed(
        0
      )}L vs. Avg ${allDatasetsStats.dailyAverage.toFixed(0)}L)`;
    }

    // Fallback to original thresholds for other types
    const thresholds = {
      total: { low: 4000, medium: 6000 },
      daily: { low: 130, medium: 200 },
      shower: { low: 50, medium: 80 },
      toilet: { low: 30, medium: 50 },
      dishwasher: { low: 10, medium: 15 },
      washing: { low: 45, medium: 60 },
      sink: { low: 20, medium: 35 },
    };

    const threshold = thresholds[type] || thresholds.total;

    if (numValue <= threshold.low)
      return `Low Consumption (≤${threshold.low}L)`;
    if (numValue <= threshold.medium)
      return `Average Consumption (≤${threshold.medium}L)`;
    return `High Consumption (>${threshold.medium}L)`;
  };

  // Add a new useEffect to handle data updates
  useEffect(() => {
    if (chartData && !showSummary) {
      setShowSummary(true);
    }
  }, [chartData]);

  // Add function to calculate statistics from all datasets
  const calculateAllDatasetsStats = (datasetsArray) => {
    if (!datasetsArray || datasetsArray.length === 0) return;

    let totalConsumptions = [];
    let dailyConsumptions = [];
    let applianceAverages = {};

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

        // Collect appliance-specific averages
        const applianceData =
          dataset.analysis.chartData.datasets[0].data.reduce(
            (acc, value, index) => {
              const label = dataset.analysis.chartData.labels[index];
              const parts = label.includes("-")
                ? label.split("-")
                : label.split("/");
              const day = parseInt(parts[0]);
              const month = parseInt(parts[1]);
              const year = parseInt(parts[2]) || 2024;

              acc[day] = value;
              return acc;
            },
            {}
          );
        applianceAverages = { ...applianceAverages, ...applianceData };
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

    setAllDatasetsStatsState({
      totalAverage: totalAvg,
      totalStdDev: totalStdDev,
      dailyAverage: dailyAvg,
      dailyStdDev: dailyStdDev,
      datasetCount: datasetsArray.length,
      applianceAverages,
    });
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
            {summaryData?.totalWaterConsumption.toFixed(0)}L vs{" "}
            {allDatasetsStats.totalAverage.toFixed(0)}L
          </li>
          <li>
            <strong>Your Daily Usage vs Average:</strong>{" "}
            {summaryData?.averageWaterUsage.toFixed(0)}L vs{" "}
            {allDatasetsStats.dailyAverage.toFixed(0)}L
          </li>
        </ul>
      </div>
    );
  };

  const handleComparisonResults = (results) => {
    // Handle comparison results if needed
    console.log("Comparison results:", results);
  };

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

    // Helper to handle page breaks
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

    // Title with Month and Year
    doc.setFontSize(24);
    doc.text("Water Consumption Analysis Report", pageWidth / 2, yPos, {
      align: "center",
    });
    yPos += 15;
    doc.setFontSize(18);
    doc.text(`${monthNames[month - 1]} ${year}`, pageWidth / 2, yPos, {
      align: "center",
    });
    yPos += 20;

    // Calculate total water consumption and other metrics
    const totalWater = chartData.datasets.reduce((total, dataset) => {
      if (!dataset || !dataset.data) return total;
      return (
        total + dataset.data.reduce((sum, val) => sum + (Number(val) || 0), 0)
      );
    }, 0);

    const hourlyTotals = chartData.labels.map((date, index) => ({
      date,
      total: chartData.datasets.reduce((sum, dataset) => {
        if (!dataset || !dataset.data || !dataset.data[index]) return sum;
        return sum + (Number(dataset.data[index]) || 0);
      }, 0),
    }));

    // Sort hourly totals for high and low consumption days
    const sortedHourlyTotals = [...hourlyTotals].sort(
      (a, b) => b.total - a.total
    );
    const top5HighDays = sortedHourlyTotals.slice(0, 5);
    const top5LowDays = sortedHourlyTotals.slice(-5).reverse();

    // Calculate category-wise totals with proper names
    const categoryTotals = {
      Bathing:
        bathingData?.datasets?.[0]?.data?.reduce(
          (sum, val) => sum + (Number(val) || 0),
          0
        ) || 0,
      Drinking:
        drinkingData?.datasets?.[0]?.data?.reduce(
          (sum, val) => sum + (Number(val) || 0),
          0
        ) || 0,
      Cooking:
        cookingData?.datasets?.[0]?.data?.reduce(
          (sum, val) => sum + (Number(val) || 0),
          0
        ) || 0,
      "Washing Clothes":
        washingClothesData?.datasets?.[0]?.data?.reduce(
          (sum, val) => sum + (Number(val) || 0),
          0
        ) || 0,
      Dishwashing:
        dishwashingData?.datasets?.[0]?.data?.reduce(
          (sum, val) => sum + (Number(val) || 0),
          0
        ) || 0,
    };

    // 1. Total Water Consumption
    checkPageBreak(20);
    doc.setFontSize(16);
    doc.text("1. Total Water Consumption", margin, yPos);
    yPos += 10;
    doc.setFontSize(12);
    doc.text(
      `Total Water Consumption: ${totalWater.toFixed(2)} Liters`,
      margin,
      yPos
    );
    yPos += 15;

    // Add Total Water Usage Graph (capture from ref)
    checkPageBreak(graphHeight + 20);
    doc.setFontSize(14);
    doc.text("Total Water Usage Over Time", margin, yPos);
    yPos += 10;
    let overviewImg = null;
    if (overviewChartRef.current) {
      overviewImg = await html2canvas(overviewChartRef.current, {
        scale: 2,
        useCORS: true,
        backgroundColor: "#ffffff",
      });
      doc.addImage(overviewImg, "PNG", margin, yPos, graphWidth, graphHeight);
      yPos += graphHeight + 20;
    }

    // 2. Category-wise Usage
    checkPageBreak(20 + Object.keys(categoryTotals).length * lineHeight);
    doc.setFontSize(16);
    doc.text("2. Category-wise Usage", margin, yPos);
    yPos += 10;
    doc.setFontSize(12);
    Object.entries(categoryTotals).forEach(([category, value]) => {
      checkPageBreak(lineHeight);
      const percentage = ((value / totalWater) * 100).toFixed(2);
      doc.text(
        `${category}: ${value.toFixed(2)} Liters (${percentage}% of total)`,
        margin,
        yPos
      );
      yPos += lineHeight;
    });
    yPos += 10;

    // Add Category-wise Usage Pie Chart (capture from ref)
    checkPageBreak(graphHeight + 20);
    doc.setFontSize(14);
    doc.text("Water Usage by Category", margin, yPos);
    yPos += 10;
    let pieImg = null;
    if (pieChartRef.current) {
      pieImg = await html2canvas(pieChartRef.current, {
        scale: 2,
        useCORS: true,
        backgroundColor: "#ffffff",
      });
      doc.addImage(pieImg, "PNG", margin, yPos, graphWidth, graphHeight);
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
        `${index + 1}. ${day.date}: ${day.total.toFixed(2)} Liters`,
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
        `${index + 1}. ${day.date}: ${day.total.toFixed(2)} Liters`,
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
    const zeroDays = hourlyTotals
      .filter((h) => h.total === 0)
      .map((h) => h.date);
    doc.text(
      `Days with no water usage: ${zeroDays.join(", ") || "None"}`,
      margin,
      yPos
    );
    yPos += 15;

    // 6. Average Water Usage
    checkPageBreak(20);
    doc.setFontSize(16);
    doc.text("6. Average Water Usage", margin, yPos);
    yPos += 10;
    doc.setFontSize(12);
    const avgUsage = totalWater / (chartData.labels.length || 1);
    doc.text(
      `Average Water Usage per Day: ${avgUsage.toFixed(2)} Liters`,
      margin,
      yPos
    );
    yPos += 15;

    // Add Daily Usage Bar Chart (capture from ref)
    checkPageBreak(graphHeight + 20);
    doc.setFontSize(14);
    doc.text("Daily Water Usage", margin, yPos);
    yPos += 10;
    let barImg = null;
    if (barChartRef.current) {
      barImg = await html2canvas(barChartRef.current, {
        scale: 2,
        useCORS: true,
        backgroundColor: "#ffffff",
      });
      doc.addImage(barImg, "PNG", margin, yPos, graphWidth, graphHeight);
      yPos += graphHeight + 20;
    }

    // 7. Percentage Contribution by Activity
    checkPageBreak(20 + Object.keys(categoryTotals).length * lineHeight);
    doc.setFontSize(16);
    doc.text("7. Percentage Contribution by Activity", margin, yPos);
    yPos += 10;
    doc.setFontSize(12);
    Object.entries(categoryTotals).forEach(([category, value]) => {
      checkPageBreak(lineHeight);
      const percentage = ((value / totalWater) * 100).toFixed(2);
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
        name: "Shower",
        total: summaryData?.totalShowerConsumption,
        peakDay: summaryData?.peakShowerDay,
        peakUsage: summaryData?.peakShowerUsage,
        unit: "L",
      },
      {
        name: "Toilet",
        total: summaryData?.totalToiletConsumption,
        peakDay: summaryData?.peakToiletDay,
        peakUsage: summaryData?.peakToiletUsage,
        unit: "L",
      },
      {
        name: "Dishwasher",
        total: summaryData?.totalDishwasherConsumption,
        peakDay: summaryData?.peakDishwasherDay,
        peakUsage: summaryData?.peakDishwasherUsage,
        unit: "L",
      },
      {
        name: "Washing Machine",
        total: summaryData?.totalWashingMachineConsumption,
        peakDay: summaryData?.peakWashingMachineDay,
        peakUsage: summaryData?.peakWashingMachineUsage,
        unit: "L",
      },
      {
        name: "Sink",
        total: summaryData?.totalSinkConsumption,
        peakDay: summaryData?.peakSinkDay,
        peakUsage: summaryData?.peakSinkUsage,
        unit: "L",
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
        `Total Usage vs Average: ${totalWater.toFixed(
          2
        )}L vs ${allDatasetsStats.totalAverage.toFixed(2)}L`,
        margin,
        yPos
      );
      yPos += lineHeight;
      doc.text(
        `Daily Usage vs Average: ${avgUsage.toFixed(
          2
        )}L vs ${allDatasetsStats.dailyAverage.toFixed(2)}L`,
        margin,
        yPos
      );
      yPos += lineHeight;
      const difference = (
        ((totalWater - allDatasetsStats.totalAverage) /
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

    // 9. Next Month's Water Requirement Forecast
    checkPageBreak(30);
    doc.setFontSize(16);
    doc.text("9. Next Month's Water Requirement Forecast", margin, yPos);
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
        `Forecasted Water Usage: ${forecast.toFixed(2)} Liters`,
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
      hourlyTotals,
      avgUsage
    );
    recommendations.forEach((rec) => {
      checkPageBreak(lineHeight);
      doc.text(`• ${rec}`, margin, yPos);
      yPos += lineHeight;
    });

    // Add Shower Usage Chart
    checkPageBreak(graphHeight + 20);
    doc.setFontSize(14);
    doc.text("Shower Usage", margin, yPos);
    yPos += 10;
    if (showerChartRef.current) {
      const showerImg = await html2canvas(showerChartRef.current, {
        scale: 2,
        useCORS: true,
        backgroundColor: "#ffffff",
      });
      doc.addImage(showerImg, "PNG", margin, yPos, graphWidth, graphHeight);
      yPos += graphHeight + 20;
    }

    // Add Toilet Usage Chart
    checkPageBreak(graphHeight + 20);
    doc.setFontSize(14);
    doc.text("Toilet Usage", margin, yPos);
    yPos += 10;
    if (toiletChartRef.current) {
      const toiletImg = await html2canvas(toiletChartRef.current, {
        scale: 2,
        useCORS: true,
        backgroundColor: "#ffffff",
      });
      doc.addImage(toiletImg, "PNG", margin, yPos, graphWidth, graphHeight);
      yPos += graphHeight + 20;
    }

    // Add Dishwasher Usage Chart
    checkPageBreak(graphHeight + 20);
    doc.setFontSize(14);
    doc.text("Dishwasher Usage", margin, yPos);
    yPos += 10;
    if (dishwasherChartRef.current) {
      const dishwasherImg = await html2canvas(dishwasherChartRef.current, {
        scale: 2,
        useCORS: true,
        backgroundColor: "#ffffff",
      });
      doc.addImage(dishwasherImg, "PNG", margin, yPos, graphWidth, graphHeight);
      yPos += graphHeight + 20;
    }

    // Add Sink Usage Chart
    checkPageBreak(graphHeight + 20);
    doc.setFontSize(14);
    doc.text("Sink Usage", margin, yPos);
    yPos += 10;
    if (sinkChartRef.current) {
      const sinkImg = await html2canvas(sinkChartRef.current, {
        scale: 2,
        useCORS: true,
        backgroundColor: "#ffffff",
      });
      doc.addImage(sinkImg, "PNG", margin, yPos, graphWidth, graphHeight);
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

    // Save the PDF
    doc.save(`water_consumption_analysis_${monthNames[month - 1]}_${year}.pdf`);
  };

  // Helper function to analyze trends
  const analyzeTrends = (hourlyTotals) => {
    const nonZeroTotals = hourlyTotals.filter((h) => h.total > 0);
    const avg =
      nonZeroTotals.reduce((sum, h) => sum + h.total, 0) / nonZeroTotals.length;
    const variance =
      nonZeroTotals.reduce((sum, h) => sum + Math.pow(h.total - avg, 2), 0) /
      nonZeroTotals.length;
    const stdDev = Math.sqrt(variance);

    let trend = "Stable";
    if (stdDev > avg * 0.5) {
      trend = "Highly Variable";
    } else if (stdDev > avg * 0.2) {
      trend = "Moderately Variable";
    }

    return (
      `Usage Pattern: ${trend}\n` +
      `Average Daily Usage: ${avg.toFixed(2)} Liters\n` +
      `Standard Deviation: ${stdDev.toFixed(2)} Liters\n` +
      `Days with Zero Usage: ${
        hourlyTotals.filter((h) => h.total === 0).length
      }`
    );
  };

  // Helper function to generate recommendations
  const generateRecommendations = (categoryTotals, hourlyTotals, avgUsage) => {
    const recommendations = [];

    // Analyze peak usage
    const peakHours = hourlyTotals.filter((h) => h.total > avgUsage * 1.5);
    if (peakHours.length > 0) {
      recommendations.push(
        "Consider spreading out water usage to avoid peak consumption periods"
      );
    }

    // Analyze category usage
    Object.entries(categoryTotals).forEach(([category, value]) => {
      const percentage =
        (value / hourlyTotals.reduce((sum, h) => sum + h.total, 0)) * 100;
      if (percentage > 40) {
        recommendations.push(
          `High ${category} usage detected (${percentage.toFixed(
            1
          )}%) - Consider implementing ${category.toLowerCase()}-specific conservation measures`
        );
      }
    });

    // Add general recommendations
    recommendations.push(
      "Consider installing water-efficient fixtures",
      "Regular maintenance of water systems to prevent leaks",
      "Consider rainwater harvesting for non-potable uses",
      "Monitor usage patterns and adjust habits accordingly"
    );

    return recommendations;
  };

  return (
    <div className="water-analysis-container">
      <MonthComparison
        datasets={datasets}
        onCompare={handleComparisonResults}
      />

      <div className="download-section">
        <button
          className="download-button"
          onClick={generatePDFReport}
          disabled={!chartData}
        ></button>
      </div>

      <h1>Water Analysis</h1>
      <div className="analysis-controls">
        <div className="dataset-selector">
          <select
            id="dataset-select"
            value={selectedDataset || ""}
            onChange={handleDatasetChange}
          >
            <option value="">Select a dataset</option>
            {datasets.map((dataset, index) => {
              // Extract date from dataset
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
            className="file-upload"
            onChange={handleFileChange}
            ref={fileInputRef}
            accept=".csv,.xlsx,.xls"
          />
          <button className="file-upload-button" onClick={handleUpload}>
            Upload & Analyze
          </button>
        </div>
      </div>

      {chartData && (
        <div className="water-analysis-graph">
          <div className="analysis-section">
            <h2 className="section-title">Overview</h2>
            <div className="section-content">
              <div className="inner-row">
                <h3>Total Water Usage</h3>
                <p>
                  This graph shows the breakdown of water consumption by
                  different utilities over time.
                </p>
                <div className="total-water-usage-graph" ref={overviewChartRef}>
                  {chartData && chartData.labels && (
                    <Line
                      data={{
                        labels: chartData.labels,
                        datasets: [
                          {
                            label: "Bathing",
                            data: bathingData?.datasets[0]?.data || [],
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
                            label: "Washing Clothes",
                            data: washingClothesData?.datasets[0]?.data || [],
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
                            label: "Dishwashing",
                            data: dishwashingData?.datasets[0]?.data || [],
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
                            label: "Drinking",
                            data: drinkingData?.datasets[0]?.data || [],
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
                            label: "Cooking",
                            data: cookingData?.datasets[0]?.data || [],
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
                              text: "Water Usage (Liters)",
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
                                  label += context.parsed.y.toFixed(1) + " L";
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

          <div className="analysis-section">
            <h2 className="section-title">Monthly Usage Calendar</h2>
            <div className="section-content">
              <p>
                Daily water consumption overview with color-coded intensity.
              </p>
              {chartData && chartData.labels && (
                <>
                  <div ref={calendarRef}>
                    <Calendar
                      data={chartData.datasets[0].data.reduce(
                        (acc, value, index) => {
                          // Parse the date from the label (assuming format: "DD-MM-YYYY" or "DD/MM/YYYY")
                          const label = chartData.labels[index];
                          const parts = label.includes("-")
                            ? label.split("-")
                            : label.split("/");
                          const day = parseInt(parts[0]);
                          const month = parseInt(parts[1]);
                          const year = parseInt(parts[2]) || 2024;

                          acc[day] = value;
                          return acc;
                        },
                        {}
                      )}
                      month={(() => {
                        // Get month from the first label
                        const firstLabel = chartData.labels[0];
                        const parts = firstLabel.includes("-")
                          ? firstLabel.split("-")
                          : firstLabel.split("/");
                        return parseInt(parts[1]);
                      })()}
                      year={(() => {
                        // Get year from the first label
                        const firstLabel = chartData.labels[0];
                        const parts = firstLabel.includes("-")
                          ? firstLabel.split("-")
                          : firstLabel.split("/");
                        return parseInt(parts[2]) || 2024;
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

          <div className="analysis-section">
            <h2 className="section-title">Bathroom</h2>
            <div className="section-content">
              <div style={{ display: "flex", marginBottom: "20px" }}>
                <div style={{ width: "50%" }}>
                  <div className="inner-row" ref={showerChartRef}>
                    <h3>Shower Usage</h3>
                    <p>Water consumption during showers.</p>
                    {bathingData &&
                      bathingData.labels &&
                      bathingData.datasets && (
                        <Bar
                          key={JSON.stringify(bathingData)}
                          data={bathingData}
                        />
                      )}
                  </div>
                </div>
                <div style={{ width: "50%" }}>
                  <div className="inner-row" ref={toiletChartRef}>
                    <h3>Toilet Usage</h3>
                    <p>Water consumption for toilet flushing.</p>
                    {drinkingData &&
                      drinkingData.labels &&
                      drinkingData.datasets && (
                        <Bar
                          key={JSON.stringify(drinkingData)}
                          data={drinkingData}
                        />
                      )}
                  </div>
                </div>
              </div>
            </div>
          </div>

          <div className="analysis-section">
            <h2 className="section-title">Kitchen</h2>
            <div className="section-content">
              <div style={{ display: "flex", marginBottom: "20px" }}>
                <div style={{ width: "50%" }}>
                  <div className="inner-row" ref={dishwasherChartRef}>
                    <h3>Dishwasher Usage</h3>
                    <p>Water consumption during dishwashing cycles.</p>
                    {dishwashingData &&
                      dishwashingData.labels &&
                      dishwashingData.datasets && (
                        <Bar
                          key={JSON.stringify(dishwashingData)}
                          data={dishwashingData}
                        />
                      )}
                  </div>
                </div>
                <div style={{ width: "50%" }}>
                  <div className="inner-row" ref={sinkChartRef}>
                    <h3>Sink Usage</h3>
                    <p>Water consumption from kitchen sink.</p>
                    {cookingData &&
                      cookingData.labels &&
                      cookingData.datasets && (
                        <Bar
                          key={JSON.stringify(cookingData)}
                          data={cookingData}
                        />
                      )}
                  </div>
                </div>
              </div>
            </div>
          </div>

          <div className="analysis-section">
            <h2 className="section-title">Laundry</h2>
            <div className="section-content">
              <div style={{ display: "flex", marginBottom: "20px" }}>
                <div style={{ width: "50%" }}>
                  <div className="inner-row" ref={washingMachineChartRef}>
                    <h3>Washing Machine Usage</h3>
                    <p>Water consumption during laundry cycles.</p>
                    {washingClothesData &&
                      washingClothesData.labels &&
                      washingClothesData.datasets && (
                        <Bar
                          key={JSON.stringify(washingClothesData)}
                          data={washingClothesData}
                        />
                      )}
                  </div>
                </div>
              </div>
            </div>
          </div>

          <div className="analysis-section">
            <h2 className="section-title">Detailed Analysis</h2>
            <div className="summary-section">
              <h3>Analysis Summary</h3>
              <div className="summary-content">
                <div className="summary-section">
                  <h4>Overall Usage</h4>
                  <ul>
                    <li className="flex-between">
                      <div>
                        <strong>Total Water:</strong>
                        <div>
                          <span className="value">
                            {formatNumber(summaryData?.totalWaterConsumption)} L
                          </span>
                        </div>
                      </div>
                      <span
                        className={`status-badge ${getStatusBadge(
                          summaryData?.totalWaterConsumption,
                          "total"
                        )}`}
                      >
                        {getStatusMessage(
                          summaryData?.totalWaterConsumption,
                          "total"
                        )}
                      </span>
                    </li>
                    <li className="flex-between">
                      <div>
                        <strong>Daily Average:</strong>
                        <div>
                          <span className="value">
                            {formatNumber(summaryData?.averageWaterUsage)} L
                          </span>
                        </div>
                      </div>
                      <span
                        className={`status-badge ${getStatusBadge(
                          summaryData?.averageWaterUsage,
                          "daily"
                        )}`}
                      >
                        {getStatusMessage(
                          summaryData?.averageWaterUsage,
                          "daily"
                        )}
                      </span>
                    </li>
                    <li>
                      <strong>Peak Usage Day:</strong>
                      <div>
                        <span className="value">
                          {summaryData?.maxWaterUsage || "N/A"}
                        </span>
                      </div>
                    </li>
                  </ul>
                </div>

                <div className="summary-section">
                  <h4>Appliance Breakdown</h4>
                  <div className="breakdown-grid">
                    <div>
                      <ul>
                        <li>
                          <strong>Shower:</strong>
                          <div>
                            <span className="value">
                              {formatNumber(
                                summaryData?.totalShowerConsumption
                              )}{" "}
                              L
                            </span>
                          </div>
                        </li>
                        <li>
                          <strong>Toilet:</strong>
                          <div>
                            <span className="value">
                              {formatNumber(
                                summaryData?.totalToiletConsumption
                              )}{" "}
                              L
                            </span>
                          </div>
                        </li>
                        <li>
                          <strong>Dishwasher:</strong>
                          <div>
                            <span className="value">
                              {formatNumber(
                                summaryData?.totalDishwasherConsumption
                              )}{" "}
                              L
                            </span>
                          </div>
                        </li>
                      </ul>
                    </div>
                    <div>
                      <ul>
                        <li>
                          <strong>Washing Machine:</strong>
                          <div>
                            <span className="value">
                              {formatNumber(
                                summaryData?.totalWashingMachineConsumption
                              )}{" "}
                              L
                            </span>
                          </div>
                        </li>
                        <li>
                          <strong>Sink:</strong>
                          <div>
                            <span className="value">
                              {formatNumber(summaryData?.totalSinkConsumption)}{" "}
                              L
                            </span>
                          </div>
                        </li>
                      </ul>
                    </div>
                  </div>
                </div>

                <div className="summary-section">
                  <h4>Key Insights</h4>
                  <ul className="insights-list">
                    <li>
                      <strong>Most Water-Intensive Appliance:</strong>
                      <span className="insight-badge">
                        {(() => {
                          const consumptions = {
                            Shower:
                              Number(summaryData?.totalShowerConsumption) || 0,
                            Toilet:
                              Number(summaryData?.totalToiletConsumption) || 0,
                            Dishwasher:
                              Number(summaryData?.totalDishwasherConsumption) ||
                              0,
                            "Washing Machine":
                              Number(
                                summaryData?.totalWashingMachineConsumption
                              ) || 0,
                            Sink:
                              Number(summaryData?.totalSinkConsumption) || 0,
                          };
                          const maxAppliance = Object.entries(
                            consumptions
                          ).reduce((a, b) => (a[1] > b[1] ? a : b));
                          return `${maxAppliance[0]} (${formatNumber(
                            maxAppliance[1]
                          )} L)`;
                        })()}
                      </span>
                    </li>
                    <li>
                      <strong>Usage Status:</strong>
                      <span
                        className={`status-badge ${getStatusBadge(
                          summaryData?.averageWaterUsage,
                          "daily"
                        )}`}
                      >
                        {getStatusMessage(
                          summaryData?.averageWaterUsage,
                          "daily"
                        )}
                      </span>
                    </li>
                  </ul>
                </div>

                {renderComparativeAnalysis()}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Standalone Summary Section */}
      {!chartData && showSummary && (
        <div className="standalone-summary">
          <div className="summary-section">
            <h3>Analysis Summary</h3>
            <div className="summary-content">
              <div className="summary-section">
                <h4>Overall Usage</h4>
                <ul>
                  <li className="flex-between">
                    <div>
                      <strong>Total Water:</strong>
                      <div>
                        <span className="value">
                          {formatNumber(summaryData?.totalWaterConsumption)} L
                        </span>
                      </div>
                    </div>
                    <span
                      className={`status-badge ${getStatusBadge(
                        summaryData?.totalWaterConsumption,
                        "total"
                      )}`}
                    >
                      {getStatusMessage(
                        summaryData?.totalWaterConsumption,
                        "total"
                      )}
                    </span>
                  </li>
                  <li className="flex-between">
                    <div>
                      <strong>Daily Average:</strong>
                      <div>
                        <span className="value">
                          {formatNumber(summaryData?.averageWaterUsage)} L
                        </span>
                      </div>
                    </div>
                    <span
                      className={`status-badge ${getStatusBadge(
                        summaryData?.averageWaterUsage,
                        "daily"
                      )}`}
                    >
                      {getStatusMessage(
                        summaryData?.averageWaterUsage,
                        "daily"
                      )}
                    </span>
                  </li>
                  <li>
                    <strong>Peak Usage Day:</strong>
                    <div>
                      <span className="value">
                        {summaryData?.maxWaterUsage || "N/A"}
                      </span>
                    </div>
                  </li>
                </ul>
              </div>

              <div className="summary-section">
                <h4>Appliance Breakdown</h4>
                <div className="breakdown-grid">
                  <div>
                    <ul>
                      <li>
                        <strong>Shower:</strong>
                        <div>
                          <span className="value">
                            {formatNumber(summaryData?.totalShowerConsumption)}{" "}
                            L
                          </span>
                        </div>
                      </li>
                      <li>
                        <strong>Toilet:</strong>
                        <div>
                          <span className="value">
                            {formatNumber(summaryData?.totalToiletConsumption)}{" "}
                            L
                          </span>
                        </div>
                      </li>
                      <li>
                        <strong>Dishwasher:</strong>
                        <div>
                          <span className="value">
                            {formatNumber(
                              summaryData?.totalDishwasherConsumption
                            )}{" "}
                            L
                          </span>
                        </div>
                      </li>
                    </ul>
                  </div>
                  <div>
                    <ul>
                      <li>
                        <strong>Washing Machine:</strong>
                        <div>
                          <span className="value">
                            {formatNumber(
                              summaryData?.totalWashingMachineConsumption
                            )}{" "}
                            L
                          </span>
                        </div>
                      </li>
                      <li>
                        <strong>Sink:</strong>
                        <div>
                          <span className="value">
                            {formatNumber(summaryData?.totalSinkConsumption)} L
                          </span>
                        </div>
                      </li>
                    </ul>
                  </div>
                </div>
              </div>

              <div className="summary-section">
                <h4>Key Insights</h4>
                <ul className="insights-list">
                  <li>
                    <strong>Most Water-Intensive Appliance:</strong>
                    <span className="insight-badge">
                      {(() => {
                        const consumptions = {
                          Shower:
                            Number(summaryData?.totalShowerConsumption) || 0,
                          Toilet:
                            Number(summaryData?.totalToiletConsumption) || 0,
                          Dishwasher:
                            Number(summaryData?.totalDishwasherConsumption) ||
                            0,
                          "Washing Machine":
                            Number(
                              summaryData?.totalWashingMachineConsumption
                            ) || 0,
                          Sink: Number(summaryData?.totalSinkConsumption) || 0,
                        };
                        const maxAppliance = Object.entries(
                          consumptions
                        ).reduce((a, b) => (a[1] > b[1] ? a : b));
                        return `${maxAppliance[0]} (${formatNumber(
                          maxAppliance[1]
                        )} L)`;
                      })()}
                    </span>
                  </li>
                  <li>
                    <strong>Usage Status:</strong>
                    <span
                      className={`status-badge ${getStatusBadge(
                        summaryData?.averageWaterUsage,
                        "daily"
                      )}`}
                    >
                      {getStatusMessage(
                        summaryData?.averageWaterUsage,
                        "daily"
                      )}
                    </span>
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

export default WaterAnalysis;
