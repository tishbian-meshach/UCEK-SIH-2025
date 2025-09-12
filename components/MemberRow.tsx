"use client"
import StudentSelect from "./StudentSelect"
import type { Student } from "../lib/types"
import { validateGitHubUrl, validateProjectUrl } from "../lib/validation-utils"
import { useState } from "react"

interface MemberData {
  regNo: string
  github: string
  projectLink: string
}

interface MemberRowProps {
  label: string
  students: Student[]
  memberData: MemberData
  onMemberChange: (data: MemberData) => void
  excludeRegNos?: string[]
  isRequired?: boolean
  isOptional?: boolean
  currentTeamRegNos?: string[]
}

export default function MemberRow({
  label,
  students,
  memberData,
  onMemberChange,
  excludeRegNos = [],
  isRequired = false,
  isOptional = false,
  currentTeamRegNos = [],
}: MemberRowProps) {
  const selectedStudent = students.find((s) => s.regNo === memberData.regNo)
  const [githubError, setGithubError] = useState("")
  const [projectError, setProjectError] = useState("")

  const handleStudentSelect = (regNo: string) => {
    onMemberChange({
      ...memberData,
      regNo,
    })
  }

  const handleFieldChange = (field: "github" | "projectLink", value: string) => {
    onMemberChange({
      ...memberData,
      [field]: value,
    })

    // Real-time validation
    if (field === "github") {
      const validation = validateGitHubUrl(value)
      setGithubError(validation.errors[0] || "")
    } else if (field === "projectLink") {
      const validation = validateProjectUrl(value)
      setProjectError(validation.errors[0] || "")
    }
  }

  return (
    <div className="space-y-4 p-4 border border-gray-200 rounded-lg bg-gray-50">
      <div className="flex items-center justify-between">
        <h4 className="text-md font-medium text-gray-900">
          {label}
          {isRequired && <span className="text-red-500 ml-1">*</span>}
          {isOptional && <span className="text-gray-500 ml-1">(Optional)</span>}
        </h4>
      </div>

      <div>
        <label className="block text-sm font-medium text-gray-700 mb-2">Student</label>
        <StudentSelect
          students={students}
          selectedRegNo={memberData.regNo}
          onSelect={handleStudentSelect}
          excludeRegNos={excludeRegNos}
          placeholder={`Select ${label.toLowerCase()}...`}
          isRequired={isRequired}
          currentTeamRegNos={currentTeamRegNos}
        />
      </div>

      {selectedStudent && (
        <>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Registration No.</label>
              <input
                type="text"
                value={selectedStudent.regNo}
                disabled
                className="w-full px-3 py-2 border border-gray-300 rounded-md bg-gray-100 text-gray-600"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Department</label>
              <input
                type="text"
                value={selectedStudent.dept}
                disabled
                className="w-full px-3 py-2 border border-gray-300 rounded-md bg-gray-100 text-gray-600"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Year</label>
              <input
                type="text"
                value={selectedStudent.year}
                disabled
                className="w-full px-3 py-2 border border-gray-300 rounded-md bg-gray-100 text-gray-600"
              />
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                GitHub Profile <span className="text-gray-500 text-xs">(Optional)</span>
              </label>
              <input
                type="url"
                value={memberData.github}
                onChange={(e) => handleFieldChange("github", e.target.value)}
                placeholder="https://github.com/username"
                className={`w-full px-3 py-2 border rounded-md shadow-sm focus:outline-none focus:ring-2 ${
                  githubError ? "border-red-300 focus:border-red-500" : "border-gray-300 focus:border-blue-500"
                }`}
              />
              {githubError && <p className="mt-1 text-sm text-red-600">{githubError}</p>}
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Your Best Work Project Link <span className="text-gray-500 text-xs">(Optional)</span>
              </label>
              <input
                type="url"
                value={memberData.projectLink}
                onChange={(e) => handleFieldChange("projectLink", e.target.value)}
                placeholder="https://your-best-project.com"
                className={`w-full px-3 py-2 border rounded-md shadow-sm focus:outline-none focus:ring-2 ${
                  projectError ? "border-red-300 focus:border-red-500" : "border-gray-300 focus:border-blue-500"
                }`}
              />
              {projectError && <p className="mt-1 text-sm text-red-600">{projectError}</p>}
            </div>
          </div>
        </>
      )}
    </div>
  )
}
