import React, { useState, useEffect } from "react";
import "./style/Summary.css";
import "./Analysis.css";

const ElectricityMonthComparison = ({ datasets, onCompare }) => {
  const [selectedMonthYears, setSelectedMonthYears] = useState([]);
  const [comparisonResults, setComparisonResults] = useState(null);
  const [isOpen, setIsOpen] = useState(false);
  const [summaryData, setSummaryData] = useState(null);
  const [summaryType, setSummaryType] = useState(null);

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
          try {
            // Try different date formats
            let parts;
            if (label.includes("-")) {
              parts = label.split("-");
            } else if (label.includes("/")) {
              parts = label.split("/");
            } else if (label.includes(".")) {
              parts = label.split(".");
            } else {
              return; // Skip if format is not recognized
            }

            const monthNum = parseInt(parts[1]) - 1;
            const year = parts[2];

            if (!isNaN(monthNum) && monthNum >= 0 && monthNum < 12 && year) {
              const key = `${monthNames[monthNum]} ${year}`;
              monthYearSet.add(key);
            }
          } catch (error) {
            console.error("Error parsing date:", label, error);
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
      try {
        let parts;
        if (label.includes("-")) {
          parts = label.split("-");
        } else if (label.includes("/")) {
          parts = label.split("/");
        } else if (label.includes(".")) {
          parts = label.split(".");
        } else {
          return; // Skip if format is not recognized
        }

        const monthNum = parseInt(parts[1]) - 1;
        const labelYear = parts[2];

        if (monthNames[monthNum] === monthName && labelYear === year) {
          const value = parseFloat(data[index]);
          if (!isNaN(value)) {
            total += value;
          }
        }
      } catch (error) {
        console.error("Error processing data point:", label, error);
      }
    });
    return total;
  };

  // Get appliance breakdown for a specific (month, year) pair
  const getApplianceMonthYearTotal = (data, monthName, year) => {
    if (!data?.labels || !data?.datasets?.[0]?.data) return 0;
    let total = 0;

    data.labels.forEach((label, index) => {
      try {
        let parts;
        if (label.includes("-")) {
          parts = label.split("-");
        } else if (label.includes("/")) {
          parts = label.split("/");
        } else if (label.includes(".")) {
          parts = label.split(".");
        } else {
          return; // Skip if format is not recognized
        }

        const monthNum = parseInt(parts[1]) - 1;
        const labelYear = parts[2];

        if (monthNames[monthNum] === monthName && labelYear === year) {
          const value = parseFloat(data.datasets[0].data[index]);
          if (!isNaN(value)) {
            total += value;
          }
        }
      } catch (error) {
        console.error("Error processing appliance data point:", label, error);
      }
    });
    return total;
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
      // Appliance breakdowns for the month-year
      const applianceData = {
        fan: 0,
        refrigerator: 0,
        washingMachine: 0,
        heater: 0,
        lights: 0,
      };
      datasets.forEach((dataset) => {
        if (dataset?.analysis) {
          const {
            fanData,
            refrigeratorData,
            washingMachineData,
            heaterData,
            lightsData,
          } = dataset.analysis;
          applianceData.fan += getApplianceMonthYearTotal(
            fanData,
            monthName,
            year
          );
          applianceData.refrigerator += getApplianceMonthYearTotal(
            refrigeratorData,
            monthName,
            year
          );
          applianceData.washingMachine += getApplianceMonthYearTotal(
            washingMachineData,
            monthName,
            year
          );
          applianceData.heater += getApplianceMonthYearTotal(
            heaterData,
            monthName,
            year
          );
          applianceData.lights += getApplianceMonthYearTotal(
            lightsData,
            monthName,
            year
          );
        }
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

  return (
    <>
      <button
        className={`toggle-button electricity ${isOpen ? "open" : ""}`}
        onClick={() => setIsOpen(!isOpen)}
        aria-label="Toggle month comparison"
      >
        {isOpen ? "◀" : "▶"}
      </button>
      <div className={`month-comparison electricity ${isOpen ? "open" : ""}`}>
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
              <div className="monthly-totals">
                <h4>Monthly Totals:</h4>
                {comparisonResults.map((result) => (
                  <div key={result.monthYear} className="month-result">
                    <h5>
                      {result.monthYear} {result.hasData ? "" : "(N/A)"}:
                    </h5>
                    <p>Total: {result.total.toFixed(2)} kWh</p>
                    <p>Daily average: {result.dailyAverage.toFixed(2)} kWh</p>
                    {result.hasData && (
                      <div className="appliance-breakdown">
                        <h6>Appliance Breakdown:</h6>
                        <p>Fan: {result.appliances.fan.toFixed(2)} kWh</p>
                        <p>
                          Refrigerator:{" "}
                          {result.appliances.refrigerator.toFixed(2)} kWh
                        </p>
                        <p>
                          Washing Machine:{" "}
                          {result.appliances.washingMachine.toFixed(2)} kWh
                        </p>
                        <p>Heater: {result.appliances.heater.toFixed(2)} kWh</p>
                        <p>Lights: {result.appliances.lights.toFixed(2)} kWh</p>
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
                          {highest.total.toFixed(2)} kWh)
                        </p>
                        <p>
                          <strong>Lowest Usage:</strong> {lowest.monthYear} (
                          {lowest.total.toFixed(2)} kWh)
                        </p>
                        {highest.total > 0 && lowest.total > 0 && (
                          <p>
                            <strong>Difference:</strong> {difference.toFixed(2)}{" "}
                            kWh ({percentageDiff.toFixed(1)}%{" "}
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

export default ElectricityMonthComparison;
