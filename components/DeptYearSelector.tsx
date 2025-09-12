"use client"
import { DEPARTMENTS, YEARS } from "../lib/config"

interface DeptYearSelectorProps {
  selectedDept: string
  selectedYear: string
  onDeptChange: (dept: string) => void
  onYearChange: (year: string) => void
  availableCount?: number
}

export default function DeptYearSelector({
  selectedDept,
  selectedYear,
  onDeptChange,
  onYearChange,
  availableCount,
}: DeptYearSelectorProps) {
  return (
    <div className="space-y-4">
      <h3 className="text-lg font-semibold text-gray-900">Filter Students</h3>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div>
          <label htmlFor="dept" className="block text-sm font-medium text-gray-700 mb-2">
            Department
          </label>
          <select
            id="dept"
            value={selectedDept}
            onChange={(e) => onDeptChange(e.target.value)}
            className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
          >
            <option value="">All Departments</option>
            {DEPARTMENTS.map((dept) => (
              <option key={dept} value={dept}>
                {dept}
              </option>
            ))}
          </select>
        </div>

        <div>
          <label htmlFor="year" className="block text-sm font-medium text-gray-700 mb-2">
            Year
          </label>
          <select
            id="year"
            value={selectedYear}
            onChange={(e) => onYearChange(e.target.value)}
            className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
          >
            <option value="">All Years</option>
            {YEARS.map((year) => (
              <option key={year} value={year}>
                Year {year}
              </option>
            ))}
          </select>
        </div>
      </div>

      {typeof availableCount === "number" && (
        <div className="text-sm text-gray-600">
          <span className="font-medium">{availableCount}</span> available students
          {selectedDept && ` in ${selectedDept}`}
          {selectedYear && ` (Year ${selectedYear})`}
        </div>
      )}
    </div>
  )
}
