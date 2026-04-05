"use client";

import { useEffect, useState } from "react";

interface MonthPickerProps {
  value: string; // YYYY-MM format
  onChange: (value: string) => void;
  className?: string;
  min?: string;
  max?: string;
}

export default function MonthPicker({ value, onChange, className = "", min, max }: MonthPickerProps) {
  const [inputValue, setInputValue] = useState(value);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    setInputValue(value);
  }, [value]);

  const validateMonth = (monthStr: string): boolean => {
    const regex = /^\d{4}-(0[1-9]|1[0-2])$/;
    if (!regex.test(monthStr)) {
      setError("Format must be YYYY-MM");
      return false;
    }

    if (min && monthStr < min) {
      setError(`Must be after ${min}`);
      return false;
    }

    if (max && monthStr > max) {
      setError(`Must be before ${max}`);
      return false;
    }

    setError(null);
    return true;
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const newValue = e.target.value;
    setInputValue(newValue);
    
    if (validateMonth(newValue)) {
      onChange(newValue);
    }
  };

  const handleBlur = () => {
    if (!validateMonth(inputValue)) {
      // Revert to previous valid value
      setInputValue(value);
      setError(null);
    }
  };

  const handlePrevMonth = () => {
    const date = new Date(`${value}-01`);
    date.setMonth(date.getMonth() - 1);
    const newMonth = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, "0")}`;
    if (validateMonth(newMonth)) {
      onChange(newMonth);
    }
  };

  const handleNextMonth = () => {
    const date = new Date(`${value}-01`);
    date.setMonth(date.getMonth() + 1);
    const newMonth = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, "0")}`;
    if (validateMonth(newMonth)) {
      onChange(newMonth);
    }
  };

  const formatMonthDisplay = (monthStr: string) => {
    const [year, month] = monthStr.split("-");
    return new Date(parseInt(year), parseInt(month) - 1).toLocaleDateString("en-US", {
      month: "long",
      year: "numeric",
    });
  };

  return (
    <div className={`space-y-2 ${className}`}>
      <div className="flex items-center gap-2">
        <button
          type="button"
          onClick={handlePrevMonth}
          className="p-2 rounded-md border border-gray-300 hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2"
          aria-label="Previous month"
        >
          <svg
            className="w-5 h-5 text-gray-600"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
            xmlns="http://www.w3.org/2000/svg"
          >
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
          </svg>
        </button>
        
        <div className="relative flex-1">
          <input
            type="month"
            value={inputValue}
            onChange={handleChange}
            onBlur={handleBlur}
            className="w-full px-4 py-2 border border-gray-300 rounded-md shadow-sm focus:ring-blue-500 focus:border-blue-500 text-center font-medium"
            aria-label="Select month"
            min={min}
            max={max}
          />
          <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
            <span className="text-gray-900 font-medium bg-white px-2">
              {formatMonthDisplay(value)}
            </span>
          </div>
        </div>

        <button
          type="button"
          onClick={handleNextMonth}
          className="p-2 rounded-md border border-gray-300 hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2"
          aria-label="Next month"
        >
          <svg
            className="w-5 h-5 text-gray-600"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
            xmlns="http://www.w3.org/2000/svg"
          >
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
          </svg>
        </button>
      </div>
      
      {error && (
        <p className="text-sm text-red-600 text-center" role="alert">
          {error}
        </p>
      )}
    </div>
  );
}