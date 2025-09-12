"use client"
import Select from "react-select"
import type { Student } from "../lib/types"

interface StudentOption {
  value: string
  label: string
  student: Student
  isDisabled: boolean
}

interface StudentSelectProps {
  students: Student[]
  selectedRegNo: string
  onSelect: (regNo: string) => void
  excludeRegNos?: string[]
  placeholder?: string
  isRequired?: boolean
}

export default function StudentSelect({
  students,
  selectedRegNo,
  onSelect,
  excludeRegNos = [],
  placeholder = "Select a student...",
  isRequired = false,
}: StudentSelectProps) {
  const options: StudentOption[] = students.map((student) => {
    const isExcluded = excludeRegNos.includes(student.regNo)
    const isAssigned = student.status === "Assigned"
    const isDisabled = isExcluded || isAssigned

    return {
      value: student.regNo,
      label: `${student.fullName} — ${student.regNo} — ${student.dept} Year ${student.year}`,
      student,
      isDisabled,
    }
  })

  const selectedOption = options.find((option) => option.value === selectedRegNo) || null

  const formatOptionLabel = (option: StudentOption) => (
    <div className="flex items-center justify-between">
      <span className={option.isDisabled ? "text-gray-400" : "text-gray-900"}>
        {option.student.fullName} — {option.student.regNo}
      </span>
      <div className="flex items-center space-x-2">
        <span className="text-xs text-gray-500">
          {option.student.dept} Year {option.student.year}
        </span>
        {option.student.status === "Assigned" && (
          <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-red-100 text-red-800">
            Not Available
          </span>
        )}
        {option.student.status === "Available" && !option.isDisabled && (
          <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-green-100 text-green-800">
            Available
          </span>
        )}
      </div>
    </div>
  )

  return (
    <div>
      <Select
        options={options}
        value={selectedOption}
        onChange={(option) => onSelect(option?.value || "")}
        isOptionDisabled={(option) => option.isDisabled}
        formatOptionLabel={formatOptionLabel}
        placeholder={placeholder}
        isClearable
        isSearchable
        className="react-select-container"
        classNamePrefix="react-select"
        styles={{
          option: (provided, state) => ({
            ...provided,
            backgroundColor: state.isDisabled
              ? "#f3f4f6"
              : state.isSelected
                ? "#3b82f6"
                : state.isFocused
                  ? "#eff6ff"
                  : "white",
            color: state.isDisabled ? "#9ca3af" : state.isSelected ? "white" : "#111827",
            cursor: state.isDisabled ? "not-allowed" : "pointer",
          }),
          control: (provided, state) => ({
            ...provided,
            borderColor: isRequired && !selectedRegNo ? "#ef4444" : state.isFocused ? "#3b82f6" : "#d1d5db",
            boxShadow: state.isFocused ? "0 0 0 1px #3b82f6" : "none",
            "&:hover": {
              borderColor: isRequired && !selectedRegNo ? "#ef4444" : "#9ca3af",
            },
          }),
        }}
      />
      {isRequired && !selectedRegNo && <p className="mt-1 text-sm text-red-600">This field is required</p>}
    </div>
  )
}
