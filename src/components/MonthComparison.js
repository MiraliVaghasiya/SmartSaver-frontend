import React, { useState, useEffect, useRef } from "react";
import "./style/Summary.css";
import "./Analysis.css";
import { Line } from "react-chartjs-2";
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  Title,
  Tooltip,
  Legend,
} from "chart.js";

// Register Chart.js components
ChartJS.register(
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  Title,
  Tooltip,
  Legend
);

const MonthComparison = ({ datasets, onCompare }) => {
  const [selectedMonthYears, setSelectedMonthYears] = useState([]);
  const [comparisonResults, setComparisonResults] = useState(null);
  const [isOpen, setIsOpen] = useState(false);
  const comparisonChartRef = useRef(null);

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

  // Get all available (month, year) pairs from all datasets
  const getAvailableMonthYears = () => {
    const monthYearSet = new Set();
    datasets.forEach((dataset) => {
      if (dataset?.analysis?.chartData?.labels) {
        dataset.analysis.chartData.labels.forEach((label) => {
          const parts = label.includes("-")
            ? label.split("-")
            : label.split("/");
          const monthNum = parseInt(parts[1]) - 1;
          const year = parts[2];
          if (!isNaN(monthNum) && year) {
            const key = `${monthNames[monthNum]} ${year}`;
            monthYearSet.add(key);
          }
        });
      }
    });
    // Sort by year then month
    return Array.from(monthYearSet).sort((a, b) => {
      const [monthA, yearA] = a.split(" ");
      const [monthB, yearB] = b.split(" ");
      if (yearA !== yearB) return parseInt(yearA) - parseInt(yearB);
      return monthNames.indexOf(monthA) - monthNames.indexOf(monthB);
    });
  };

  // Get total for a specific (month, year) pair
  const getMonthYearTotal = (dataset, monthName, year) => {
    if (
      !dataset?.analysis?.chartData?.labels ||
      !dataset?.analysis?.chartData?.datasets?.[0]?.data
    ) {
      return 0;
    }
    let total = 0;
    const labels = dataset.analysis.chartData.labels;
    const data = dataset.analysis.chartData.datasets[0].data;
    labels.forEach((label, index) => {
      const parts = label.includes("-") ? label.split("-") : label.split("/");
      const monthNum = parseInt(parts[1]) - 1;
      const labelYear = parts[2];
      if (monthNames[monthNum] === monthName && labelYear === year) {
        total += parseFloat(data[index]) || 0;
      }
    });
    return total;
  };

  // Get appliance totals for a specific (month, year) pair
  const getApplianceMonthYearTotal = (dataset, monthName, year) => {
    if (!dataset?.analysis)
      return {
        shower: 0,
        toilet: 0,
        dishwasher: 0,
        washingMachine: 0,
        sink: 0,
      };

    const getTotal = (data) => {
      if (!data?.labels || !data?.datasets?.[0]?.data) return 0;
      let total = 0;
      data.labels.forEach((label, index) => {
        const parts = label.includes("-") ? label.split("-") : label.split("/");
        const monthNum = parseInt(parts[1]) - 1;
        const labelYear = parts[2];
        if (monthNames[monthNum] === monthName && labelYear === year) {
          total += parseFloat(data.datasets[0].data[index]) || 0;
        }
      });
      return total;
    };

    return {
      shower: getTotal(dataset.analysis.bathingData),
      toilet: getTotal(dataset.analysis.drinkingData),
      dishwasher: getTotal(dataset.analysis.dishwashingData),
      washingMachine: getTotal(dataset.analysis.washingClothesData),
      sink: getTotal(dataset.analysis.cookingData),
    };
  };

  const handleMonthYearSelect = (monthYear) => {
    if (selectedMonthYears.includes(monthYear)) {
      setSelectedMonthYears(selectedMonthYears.filter((m) => m !== monthYear));
    } else {
      setSelectedMonthYears([...selectedMonthYears, monthYear]);
    }
  };

  const compareMonths = () => {
    if (selectedMonthYears.length < 2) {
      alert("Please select at least two months to compare");
      return;
    }
    const results = selectedMonthYears.map((monthYear) => {
      const [monthName, year] = monthYear.split(" ");
      const total = datasets.reduce(
        (sum, dataset) => sum + getMonthYearTotal(dataset, monthName, year),
        0
      );
      const daysInMonth = new Date(
        parseInt(year),
        monthNames.indexOf(monthName) + 1,
        0
      ).getDate();
      const dailyAverage = total / daysInMonth;

      // Get appliance breakdowns for the month-year
      const applianceData = {
        shower: 0,
        toilet: 0,
        dishwasher: 0,
        washingMachine: 0,
        sink: 0,
      };

      datasets.forEach((dataset) => {
        const totals = getApplianceMonthYearTotal(dataset, monthName, year);
        applianceData.shower += totals.shower;
        applianceData.toilet += totals.toilet;
        applianceData.dishwasher += totals.dishwasher;
        applianceData.washingMachine += totals.washingMachine;
        applianceData.sink += totals.sink;
      });

      return {
        monthYear,
        total: total || 0,
        dailyAverage: dailyAverage || 0,
        hasData: total > 0,
        appliances: applianceData,
      };
    });
    setComparisonResults(results);
    if (onCompare) {
      onCompare(results);
    }
  };

  // Prepare chart data for the comparison
  const getComparisonChartData = () => {
    if (!comparisonResults || comparisonResults.length < 2) return null;

    const labels = comparisonResults.map((result) => result.month);
    const datasets = [
      {
        label: "Water Usage (L)",
        data: comparisonResults.map((result) => result.totalUsage),
        fill: true,
        tension: 0.3,
        backgroundColor: "rgba(66, 153, 225, 0.2)",
        borderColor: "rgba(66, 153, 225, 1)",
        pointRadius: 4,
        pointBackgroundColor: "rgba(66, 153, 225, 1)",
        borderWidth: 2,
      },
    ];

    return {
      labels,
      datasets,
    };
  };

  return (
    <>
      <button
        className={`toggle-button ${isOpen ? "open" : ""}`}
        onClick={() => setIsOpen(!isOpen)}
        aria-label="Toggle month comparison"
      >
        {isOpen ? "◀" : "▶"}
      </button>
      <div className={`month-comparison ${isOpen ? "open" : ""}`}>
        <div className="comparison-header">
          <h2>Compare Months</h2>
        </div>
        <div className="comparison-content">
          <div className="month-grid">
            {getAvailableMonthYears().map((monthYear) => {
              const isSelected = selectedMonthYears.includes(monthYear);
              return (
                <button
                  key={monthYear}
                  onClick={() => handleMonthYearSelect(monthYear)}
                  className={`month-button ${isSelected ? "selected" : ""}`}
                >
                  {monthYear}
                </button>
              );
            })}
          </div>
          <button
            className="compare-button"
            onClick={compareMonths}
            disabled={selectedMonthYears.length < 2}
          >
            Compare Selected Months
          </button>
          {comparisonResults && (
            <div className="comparison-results">
              <h3>📊 Comparison Results</h3>

              {/* Monthly Comparison Area Graph */}
              {comparisonResults.length >= 2 && (
                <div className="monthly-comparison-graph">
                  <h4>Monthly Water Usage Comparison</h4>
                  <div className="comparison-chart-container">
                    <Line
                      data={getComparisonChartData()}
                      options={{
                        responsive: true,
                        maintainAspectRatio: false,
                        scales: {
                          y: {
                            beginAtZero: true,
                            title: {
                              display: true,
                              text: "Water Usage (L)",
                            },
                          },
                          x: {
                            title: {
                              display: true,
                              text: "Month",
                            },
                          },
                        },
                        plugins: {
                          legend: {
                            position: "top",
                          },
                          tooltip: {
                            mode: "index",
                            intersect: false,
                            callbacks: {
                              label: function (context) {
                                return `Usage: ${context.parsed.y.toFixed(
                                  2
                                )} L`;
                              },
                            },
                          },
                        },
                      }}
                    />
                  </div>
                </div>
              )}

              <div className="monthly-totals">
                <h4>Monthly Totals:</h4>
                {comparisonResults.map((result) => (
                  <div key={result.monthYear} className="month-result">
                    <h5>
                      {result.monthYear} {result.hasData ? "" : "(N/A)"}:
                    </h5>
                    <p>Total: {result.total.toFixed(2)} liters</p>
                    <p>
                      Daily average: {result.dailyAverage.toFixed(2)} liters
                    </p>
                    {result.hasData && (
                      <div className="appliance-breakdown">
                        <h6>Appliance Breakdown:</h6>
                        <p>Shower: {result.appliances.shower.toFixed(2)} L</p>
                        <p>Toilet: {result.appliances.toilet.toFixed(2)} L</p>
                        <p>
                          Dishwasher: {result.appliances.dishwasher.toFixed(2)}{" "}
                          L
                        </p>
                        <p>
                          Washing Machine:{" "}
                          {result.appliances.washingMachine.toFixed(2)} L
                        </p>
                        <p>Sink: {result.appliances.sink.toFixed(2)} L</p>
                      </div>
                    )}
                  </div>
                ))}
              </div>
              {comparisonResults.length >= 2 && (
                <div className="comparison-analysis">
                  <h4>Analysis:</h4>
                  {(() => {
                    const sorted = [...comparisonResults].sort(
                      (a, b) => b.total - a.total
                    );
                    const highest = sorted[0];
                    const lowest = sorted[sorted.length - 1];
                    const difference = highest.total - lowest.total;
                    const percentageDiff =
                      (difference / lowest.total) * 100 || 0;
                    return (
                      <>
                        <p>
                          <strong>Highest Usage:</strong> {highest.monthYear} (
                          {highest.total.toFixed(2)} liters)
                        </p>
                        <p>
                          <strong>Lowest Usage:</strong> {lowest.monthYear} (
                          {lowest.total.toFixed(2)} liters)
                        </p>
                        {highest.total > 0 && lowest.total > 0 && (
                          <p>
                            <strong>Difference:</strong> {difference.toFixed(2)}{" "}
                            liters ({percentageDiff.toFixed(1)}%{" "}
                            {difference > 0 ? "increase" : "decrease"})
                          </p>
                        )}
                      </>
                    );
                  })()}
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    </>
  );
};

export default MonthComparison;
