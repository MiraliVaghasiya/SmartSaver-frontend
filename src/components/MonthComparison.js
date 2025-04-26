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
      return {
        monthYear,
        total: total || 0,
        dailyAverage: dailyAverage || 0,
        hasData: total > 0,
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
