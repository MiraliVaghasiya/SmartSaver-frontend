import React, { useState, useEffect } from "react";
import "./style/Summary.css";
import "./Analysis.css";

const MonthComparison = ({ datasets, onCompare }) => {
  const [selectedMonthYears, setSelectedMonthYears] = useState([]);
  const [comparisonResults, setComparisonResults] = useState(null);
  const [isOpen, setIsOpen] = useState(false);

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

  // Get appliance breakdown for a specific (month, year) pair
  const getApplianceMonthYearTotal = (data, monthName, year) => {
    // Validate input data structure
    if (
      !data ||
      !data.labels ||
      !data.datasets ||
      !data.datasets[0] ||
      !data.datasets[0].data
    ) {
      console.warn("Invalid appliance data structure:", data);
      return 0;
    }

    let total = 0;
    const labels = data.labels;
    const values = data.datasets[0].data;

    // Ensure we have matching arrays
    if (labels.length !== values.length) {
      console.warn("Mismatch between labels and values length:", {
        labelsLength: labels.length,
        valuesLength: values.length,
      });
      return 0;
    }

    labels.forEach((label, index) => {
      try {
        // Handle different date formats
        let parts;
        if (label.includes("-")) {
          parts = label.split("-");
        } else if (label.includes("/")) {
          parts = label.split("/");
        } else if (label.includes(".")) {
          parts = label.split(".");
        } else {
          console.warn("Unrecognized date format:", label);
          return; // Skip if format is not recognized
        }

        // Ensure we have enough parts to extract month and year
        if (parts.length < 3) {
          console.warn("Invalid date format (missing parts):", label);
          return;
        }

        // Try to determine which part is the month and which is the year
        let monthNum, labelYear;

        // Check if the second part is a month number (01-12)
        if (parseInt(parts[1]) >= 1 && parseInt(parts[1]) <= 12) {
          monthNum = parseInt(parts[1]) - 1; // Convert to 0-based index
          labelYear = parts[2];
        }
        // Check if the first part is a month number (01-12)
        else if (parseInt(parts[0]) >= 1 && parseInt(parts[0]) <= 12) {
          monthNum = parseInt(parts[0]) - 1; // Convert to 0-based index
          labelYear = parts[2];
        } else {
          console.warn("Could not determine month from date parts:", parts);
          return;
        }

        // Validate month and year
        if (isNaN(monthNum) || monthNum < 0 || monthNum > 11) {
          console.warn("Invalid month number:", monthNum, "in label:", label);
          return;
        }

        if (monthNames[monthNum] === monthName && labelYear === year) {
          const value = parseFloat(values[index]);
          if (!isNaN(value)) {
            total += value;
          } else {
            console.warn(
              "Invalid data value at index",
              index,
              ":",
              values[index]
            );
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
        shower: 0,
        toilet: 0,
        dishwasher: 0,
        washingMachine: 0,
        sink: 0,
      };

      datasets.forEach((dataset) => {
        if (dataset?.analysis) {
          // Map the data fields to appliance names
          const applianceMapping = {
            bathingData: "shower",
            drinkingData: "toilet",
            dishwashingData: "dishwasher",
            washingClothesData: "washingMachine",
            cookingData: "sink",
          };

          // Process each appliance's data
          Object.entries(applianceMapping).forEach(
            ([dataField, applianceName]) => {
              const applianceDataField = dataset.analysis[dataField];
              if (applianceDataField) {
                const value = getApplianceMonthYearTotal(
                  applianceDataField,
                  monthName,
                  year
                );
                applianceData[applianceName] += value;
              }
            }
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
                          {highest.total.toFixed(2)} L)
                        </p>
                        <p>
                          <strong>Lowest Usage:</strong> {lowest.monthYear} (
                          {lowest.total.toFixed(2)} L)
                        </p>
                        {highest.total > 0 && lowest.total > 0 && (
                          <p>
                            <strong>Difference:</strong> {difference.toFixed(2)}{" "}
                            L ({percentageDiff.toFixed(1)}%{" "}
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
