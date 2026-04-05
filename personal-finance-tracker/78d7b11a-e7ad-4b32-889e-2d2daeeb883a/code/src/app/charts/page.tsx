"use client";

import { useState, useEffect, useCallback } from "react";
import { PieChart } from "@/components/PieChart";
import { BarChart } from "@/components/BarChart";
import MonthPicker from "@/components/MonthPicker";
import LoadingSpinner from "@/components/LoadingSpinner";
import ErrorDisplay from "@/components/ErrorDisplay";
import { PieChartDataPoint, BarChartDataPoint, ApiError } from "@/lib/types";
import { isApiError } from "@/lib/types";

interface PieChartResponse {
  data: PieChartDataPoint[];
}

interface BarChartResponse {
  data: BarChartDataPoint[];
}

export default function ChartsPage() {
  const [selectedMonth, setSelectedMonth] = useState<string>(() => {
    const now = new Date();
    return `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, "0")}`;
  });

  const [monthsCount, setMonthsCount] = useState<number>(6);
  const [pieData, setPieData] = useState<PieChartDataPoint[]>([]);
  const [barData, setBarData] = useState<BarChartDataPoint[]>([]);
  const [isLoadingPie, setIsLoadingPie] = useState<boolean>(true);
  const [isLoadingBar, setIsLoadingBar] = useState<boolean>(true);
  const [pieError, setPieError] = useState<string | null>(null);
  const [barError, setBarError] = useState<string | null>(null);
  const [selectedCategory, setSelectedCategory] = useState<string | null>(null);

  const fetchPieChartData = useCallback(async () => {
    setIsLoadingPie(true);
    setPieError(null);
    try {
      const response = await fetch(`/api/charts/pie?month=${selectedMonth}`);
      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || "Failed to load pie chart data");
      }
      const result: PieChartResponse = await response.json();
      setPieData(result.data);
    } catch (err) {
      setPieError(err instanceof Error ? err.message : "Unknown error occurred");
    } finally {
      setIsLoadingPie(false);
    }
  }, [selectedMonth]);

  const fetchBarChartData = useCallback(async () => {
    setIsLoadingBar(true);
    setBarError(null);
    try {
      const response = await fetch(`/api/charts/bar?months=${monthsCount}`);
      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || "Failed to load bar chart data");
      }
      const result: BarChartResponse = await response.json();
      setBarData(result.data);
    } catch (err) {
      setBarError(err instanceof Error ? err.message : "Unknown error occurred");
    } finally {
      setIsLoadingBar(false);
    }
  }, [monthsCount]);

  useEffect(() => {
    fetchPieChartData();
  }, [fetchPieChartData]);

  useEffect(() => {
    fetchBarChartData();
  }, [fetchBarChartData]);

  const handleSliceClick = (data: PieChartDataPoint) => {
    setSelectedCategory(data.name);
  };

  const handleMonthCountChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    setMonthsCount(Number(e.target.value));
  };

  const handleRetryPie = () => {
    fetchPieChartData();
  };

  const handleRetryBar = () => {
    fetchBarChartData();
  };

  return (
    <div className="min-h-screen bg-gray-50 p-4 md:p-6">
      <div className="max-w-7xl mx-auto">
        <header className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900">Financial Charts</h1>
          <p className="text-gray-600 mt-2">
            Visualize your spending patterns and income distribution
          </p>
        </header>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8">
          {/* Pie Chart Section */}
          <div className="bg-white rounded-xl shadow p-4 md:p-6">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between mb-6 gap-4">
              <div>
                <h2 className="text-xl font-semibold text-gray-800">
                  Expense Breakdown
                </h2>
                <p className="text-gray-500 text-sm mt-1">
                  Categorical distribution for selected month
                </p>
              </div>
              <div className="flex items-center gap-3">
                <label className="text-sm font-medium text-gray-700">
                  Month:
                </label>
                <MonthPicker
                  value={selectedMonth}
                  onChange={setSelectedMonth}
                  className="w-40"
                  min="2020-01"
                  max={new Date().toISOString().slice(0, 7)}
                />
              </div>
            </div>

            {isLoadingPie ? (
              <div className="h-80 flex items-center justify-center">
                <LoadingSpinner size="lg" />
              </div>
            ) : pieError ? (
              <div className="h-80 flex items-center justify-center">
                <ErrorDisplay
                  message={pieError}
                  onRetry={handleRetryPie}
                  title="Failed to load chart"
                />
              </div>
            ) : pieData.length === 0 ? (
              <div className="h-80 flex flex-col items-center justify-center text-gray-500">
                <div className="text-4xl mb-2">📊</div>
                <p className="text-lg">No data for selected month</p>
                <p className="text-sm mt-1">
                  Add transactions to see expense breakdown
                </p>
              </div>
            ) : (
              <>
                <div className="h-80">
                  <PieChart data={pieData} onSliceClick={handleSliceClick} />
                </div>
                {selectedCategory && (
                  <div className="mt-4 p-3 bg-blue-50 rounded-lg border border-blue-100">
                    <p className="text-sm text-blue-800">
                      Selected category:{" "}
                      <span className="font-medium">{selectedCategory}</span>
                    </p>
                    <button
                      onClick={() => setSelectedCategory(null)}
                      className="text-sm text-blue-600 hover:text-blue-800 mt-1"
                    >
                      Clear selection
                    </button>
                  </div>
                )}
              </>
            )}
          </div>

          {/* Bar Chart Section */}
          <div className="bg-white rounded-xl shadow p-4 md:p-6">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between mb-6 gap-4">
              <div>
                <h2 className="text-xl font-semibold text-gray-800">
                  Income vs Expenses
                </h2>
                <p className="text-gray-500 text-sm mt-1">
                  Monthly comparison over time
                </p>
              </div>
              <div className="flex items-center gap-3">
                <label className="text-sm font-medium text-gray-700">
                  Period:
                </label>
                <select
                  value={monthsCount}
                  onChange={handleMonthCountChange}
                  className="w-32 px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none transition"
                >
                  <option value={3}>Last 3 months</option>
                  <option value={6}>Last 6 months</option>
                  <option value={12}>Last 12 months</option>
                </select>
              </div>
            </div>

            {isLoadingBar ? (
              <div className="h-80 flex items-center justify-center">
                <LoadingSpinner size="lg" />
              </div>
            ) : barError ? (
              <div className="h-80 flex items-center justify-center">
                <ErrorDisplay
                  message={barError}
                  onRetry={handleRetryBar}
                  title="Failed to load chart"
                />
              </div>
            ) : barData.length === 0 ? (
              <div className="h-80 flex flex-col items-center justify-center text-gray-500">
                <div className="text-4xl mb-2">📈</div>
                <p className="text-lg">No data for selected period</p>
                <p className="text-sm mt-1">
                  Add transactions to see monthly trends
                </p>
              </div>
            ) : (
              <div className="h-80">
                <BarChart data={barData} />
              </div>
            )}
          </div>
        </div>

        {/* Insights Section */}
        <div className="bg-white rounded-xl shadow p-6">
          <h3 className="text-lg font-semibold text-gray-800 mb-4">
            Chart Insights
          </h3>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="p-4 bg-blue-50 rounded-lg">
              <div className="text-blue-600 font-medium mb-1">
                Expense Categories
              </div>
              <p className="text-sm text-gray-600">
                Click on any pie slice to highlight a specific spending
                category. This helps identify where your money goes each month.
              </p>
            </div>
            <div className="p-4 bg-green-50 rounded-lg">
              <div className="text-green-600 font-medium mb-1">
                Monthly Trends
              </div>
              <p className="text-sm text-gray-600">
                The bar chart shows income (green) vs expenses (red) over time.
                Aim for green bars to be higher than red bars for positive cash
                flow.
              </p>
            </div>
            <div className="p-4 bg-purple-50 rounded-lg">
              <div className="text-purple-600 font-medium mb-1">Data Range</div>
              <p className="text-sm text-gray-600">
                Adjust the time period to analyze different windows. Use 3
                months for recent trends, 12 months for annual patterns.
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}