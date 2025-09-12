"use client"
import { useState, useEffect } from "react"
import { useRouter } from "next/navigation"
import Link from "next/link"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { ArrowLeft, Users, CheckCircle, AlertCircle } from "lucide-react"
import Footer from "@/components/Footer"

import MemberRow from "@/components/MemberRow"
import ValidationMessage from "@/components/ValidationMessage"
import type { Student, CreateTeamRequest, CreateTeamResponse } from "@/lib/types"

import { MIN_MEMBERS, MAX_MEMBERS } from "@/lib/config"

interface MemberData {
  regNo: string
  github: string
  projectLink: string
}

export default function CreateTeamPage() {
  const router = useRouter()
  const [students, setStudents] = useState<Student[]>([])
  const [loading, setLoading] = useState(true)
  const [submitting, setSubmitting] = useState(false)
  const [error, setError] = useState("")
  const [success, setSuccess] = useState("")

  // Team form data
  const [teamName, setTeamName] = useState("")
  const [problemStatementId1, setProblemStatementId1] = useState("")
  const [problemStatementId2, setProblemStatementId2] = useState("")
  const [needOtherDept, setNeedOtherDept] = useState(false)
  const [deptNeeded, setDeptNeeded] = useState<string[]>([])
  const [leader, setLeader] = useState<MemberData>({ regNo: "", github: "", projectLink: "" })
  const [members, setMembers] = useState<MemberData[]>([
    { regNo: "", github: "", projectLink: "" }, // Member 1 - mandatory
    { regNo: "", github: "", projectLink: "" }, // Member 2 - mandatory
    { regNo: "", github: "", projectLink: "" }, // Member 3 - mandatory
    { regNo: "", github: "", projectLink: "" }, // Member 4 - optional
    { regNo: "", github: "", projectLink: "" }  // Member 5 - optional
  ])

  // Check authentication and load students on component mount
  useEffect(() => {
    // Check if user is logged in
    const storedStudent = localStorage.getItem("student")
    const storedRole = localStorage.getItem("role")

    if (!storedStudent) {
      router.push("/login")
      return
    }

    // Only allow users without teams to create teams
    if (storedRole !== "none") {
      router.push("/dashboard")
      return
    }

    loadStudents()
  }, [])

  const loadStudents = async () => {
    try {
      setLoading(true)
      const response = await fetch(`/api/students`)
      if (!response.ok) throw new Error("Failed to load students")

      const data = await response.json()
      // Show all students (both available and assigned)
      const allStudents = data.students || []
      setStudents(allStudents)
    } catch (err) {
      setError("Failed to load students. Please try again.")
      console.error("Error loading students:", err)
    } finally {
      setLoading(false)
    }
  }



  const updateMember = (index: number, data: MemberData) => {
    const updated = [...members]
    updated[index] = data
    setMembers(updated)
  }

  const getExcludedRegNos = () => {
    const regNos = [leader.regNo, ...members.map(m => m.regNo)].filter(Boolean)
    return regNos
  }

  const validateForm = () => {
    // Validate team name
    if (!teamName.trim()) {
      setError("Team name is required")
      return false
    }

    // Validate problem statement ID 1
    if (!problemStatementId1.trim()) {
      setError("Problem Statement ID 1 is required")
      return false
    }

    // Validate leader
    if (!leader.regNo) {
      setError("Team leader is required")
      return false
    }

    // Validate mandatory members (first 3 members)
    for (let i = 0; i < 3; i++) {
      if (!members[i].regNo) {
        setError(`Member ${i + 1} is required`)
        return false
      }
    }

    // Check minimum team size (leader + 3 mandatory members = 4 minimum)
    const totalMembers = 1 + members.filter(m => m.regNo).length
    if (totalMembers < 4) {
      setError("Team must have at least 4 members (1 leader + 3 members)")
      return false
    }

    if (totalMembers > MAX_MEMBERS) {
      setError(`Team cannot have more than ${MAX_MEMBERS} members`)
      return false
    }

    return true
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    
    if (!validateForm()) return

    setSubmitting(true)
    setError("")
    setSuccess("")

    try {
      const teamRequest: CreateTeamRequest = {
        teamName,
        leader,
        members: members.filter(m => m.regNo),
        problemStatementId1,
        problemStatementId2,
        deptNeeded: needOtherDept ? deptNeeded.join(", ") : ""
      }

      const response = await fetch("/api/teams", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(teamRequest)
      })

      const result: CreateTeamResponse = await response.json()

      if (result.ok) {
        setSuccess(`Team "${teamName}" created successfully! Team ID: ${result.teamId}`)
        // Reset form
        setTeamName("")
        setProblemStatementId1("")
        setProblemStatementId2("")
        setNeedOtherDept(false)
        setDeptNeeded([])
        setLeader({ regNo: "", github: "", projectLink: "" })
        setMembers([
          { regNo: "", github: "", projectLink: "" },
          { regNo: "", github: "", projectLink: "" },
          { regNo: "", github: "", projectLink: "" },
          { regNo: "", github: "", projectLink: "" },
          { regNo: "", github: "", projectLink: "" }
        ])
        // Reload students to update availability
        await loadStudents()
      } else {
        if (result.conflicts && result.conflicts.length > 0) {
          setError(`Conflicts detected: ${result.conflicts.join(", ")} are already assigned to other teams.`)
        } else {
          setError(result.message || "Failed to create team")
        }
      }
    } catch (err) {
      setError("Network error. Please try again.")
      console.error("Error creating team:", err)
    } finally {
      setSubmitting(false)
    }
  }

  const totalMembers = 1 + members.filter(m => m.regNo).length
  const availableCount = students.filter(s => s.status === "Available").length
  const totalStudents = students.length

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 flex flex-col">
      <div className="flex-1">
        <div className="container mx-auto px-4 py-8">
        {/* Header */}
        <div className="mb-8">
          <Link href="/" className="inline-flex items-center text-blue-600 hover:text-blue-800 mb-4">
            <ArrowLeft className="mr-2 h-4 w-4" />
            Back to Home
          </Link>
          <h1 className="text-3xl font-bold text-gray-900 mb-2">Create New Team</h1>
          <p className="text-gray-600">
            Create a team of {MIN_MEMBERS}-{MAX_MEMBERS} members with real-time availability checking
          </p>
        </div>

        {/* Alerts */}
        {error && (
          <Alert className="mb-6 border-red-200 bg-red-50">
            <AlertCircle className="h-4 w-4 text-red-600" />
            <AlertDescription className="text-red-800">{error}</AlertDescription>
          </Alert>
        )}

        {success && (
          <Alert className="mb-6 border-green-200 bg-green-50">
            <CheckCircle className="h-4 w-4 text-green-600" />
            <AlertDescription className="text-green-800">{success}</AlertDescription>
          </Alert>
        )}

        <div className="max-w-4xl mx-auto">
          {/* Team Summary Card */}
          <Card className="mb-6">
            <CardHeader>
              <CardTitle className="flex items-center">
                <Users className="mr-2 h-5 w-5" />
                Team Summary
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
                <div className="text-center">
                  <div className="text-2xl font-bold text-blue-600">{totalMembers}</div>
                  <div className="text-gray-600">Total Members</div>
                </div>
                <div className="text-center">
                  <div className="text-2xl font-bold text-gray-600">{MIN_MEMBERS}-{MAX_MEMBERS}</div>
                  <div className="text-gray-600">Team Size Range</div>
                </div>
                <div className="text-center">
                  <div className="text-2xl font-bold text-green-600">{availableCount}</div>
                  <div className="text-gray-600">Available Students</div>
                  <div className="text-xs text-gray-500 mt-1">({totalStudents} total)</div>
                </div>
                <div className="text-center">
                  <div className={`text-2xl font-bold ${
                    totalMembers >= MIN_MEMBERS && totalMembers <= MAX_MEMBERS
                      ? "text-green-600"
                      : "text-red-600"
                  }`}>
                    {totalMembers >= MIN_MEMBERS && totalMembers <= MAX_MEMBERS
                      ? "✓ Valid"
                      : totalMembers < MIN_MEMBERS
                        ? "Too Few"
                        : "Too Many"
                    }
                  </div>
                  <div className="text-gray-600">Status</div>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Main Content - Team Form */}
          <div>
            <Card>
              <CardHeader>
                <CardTitle>Team Details</CardTitle>
                <CardDescription>
                  Enter team information and select members
                </CardDescription>
              </CardHeader>
              <CardContent>
                {loading ? (
                  <div className="text-center py-8">
                    <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto"></div>
                    <p className="mt-2 text-gray-600">Loading students...</p>
                  </div>
                ) : (
                  <form onSubmit={handleSubmit} className="space-y-6">
                    {/* Team Name */}
                    <div>
                      <label htmlFor="teamName" className="block text-sm font-medium text-gray-700 mb-2">
                        Team Name <span className="text-red-500">*</span>
                      </label>
                      <input
                        type="text"
                        id="teamName"
                        value={teamName}
                        onChange={(e) => setTeamName(e.target.value)}
                        className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                        placeholder="Enter team name..."
                        required
                      />
                    </div>

                    {/* Problem Statement ID 1 */}
                    <div>
                      <div className="flex items-center justify-between mb-2">
                        <label htmlFor="problemStatementId1" className="block text-sm font-medium text-gray-700">
                          Problem Statement ID 1 <span className="text-red-500">*</span>
                        </label>
                        <a
                          href="https://tishbian-meshach.github.io/SIH_PS_2025/"
                          target="_blank"
                          rel="noopener noreferrer"
                          className="text-sm text-blue-600 hover:text-blue-800 underline"
                        >
                          Choose from here
                        </a>
                      </div>
                      <input
                        type="text"
                        id="problemStatementId1"
                        value={problemStatementId1}
                        onChange={(e) => setProblemStatementId1(e.target.value)}
                        className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                        placeholder="Enter problem statement ID 1..."
                        required
                      />
                    </div>

                    {/* Problem Statement ID 2 (Optional) */}
                    <div>
                      <div className="flex items-center justify-between mb-2">
                        <label htmlFor="problemStatementId2" className="block text-sm font-medium text-gray-700">
                          Problem Statement ID 2 <span className="text-gray-500">(Optional)</span>
                        </label>
                        <a
                          href="https://tishbian-meshach.github.io/SIH_PS_2025/"
                          target="_blank"
                          rel="noopener noreferrer"
                          className="text-sm text-blue-600 hover:text-blue-800 underline"
                        >
                          Choose from here
                        </a>
                      </div>
                      <input
                        type="text"
                        id="problemStatementId2"
                        value={problemStatementId2}
                        onChange={(e) => setProblemStatementId2(e.target.value)}
                        className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                        placeholder="Enter problem statement ID 2 (optional)..."
                      />
                    </div>

                    {/* Department Needed - Highlighted */}
                    <div className="bg-yellow-50 border-2 border-yellow-200 rounded-lg p-4">
                      <div className="mb-4">
                        <label className="flex items-center">
                          <input
                            type="checkbox"
                            checked={needOtherDept}
                            onChange={(e) => {
                              setNeedOtherDept(e.target.checked)
                              if (!e.target.checked) {
                                setDeptNeeded([])
                              }
                            }}
                            className="mr-3 h-5 w-5 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
                          />
                          <span className="text-lg font-semibold text-gray-800">
                            🤝 Need other department members?
                          </span>
                        </label>
                        <p className="text-sm text-gray-600 mt-2 ml-8">
                          Check this if your team needs members from different departments for diverse skills
                        </p>
                      </div>

                      {needOtherDept && (
                        <div className="ml-8">
                          <label className="block text-sm font-medium text-gray-700 mb-3">
                            Select Departments Needed (Multiple allowed)
                          </label>
                          <div className="space-y-2">
                            {["CSE", "ECE", "EEE", "MECH", "Cyber Security"].map((dept) => (
                              <label key={dept} className="flex items-center">
                                <input
                                  type="checkbox"
                                  checked={deptNeeded.includes(dept)}
                                  onChange={(e) => {
                                    if (e.target.checked) {
                                      setDeptNeeded([...deptNeeded, dept])
                                    } else {
                                      setDeptNeeded(deptNeeded.filter(d => d !== dept))
                                    }
                                  }}
                                  className="mr-2 h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
                                />
                                <span className="text-sm font-medium text-gray-700">{dept}</span>
                              </label>
                            ))}
                          </div>
                          {deptNeeded.length > 0 && (
                            <div className="mt-3 p-2 bg-blue-50 rounded-md">
                              <p className="text-sm text-blue-800">
                                <strong>Selected:</strong> {deptNeeded.join(", ")}
                              </p>
                            </div>
                          )}
                        </div>
                      )}
                    </div>

                    {/* Team Leader */}
                    <MemberRow
                      label="Team Leader"
                      students={students}
                      memberData={leader}
                      onMemberChange={setLeader}
                      excludeRegNos={getExcludedRegNos().filter(regNo => regNo !== leader.regNo)}
                      isRequired={true}
                    />

                    {/* Team Members */}
                    <div className="space-y-4">
                      <div className="flex items-center justify-between">
                        <h3 className="text-lg font-medium text-gray-900">Team Members</h3>
                        <div className="text-sm text-gray-600">
                          Members 1-3 are <span className="font-medium text-red-600">mandatory</span>,
                          Members 4-5 are <span className="font-medium text-blue-600">optional</span>
                        </div>
                      </div>

                      {members.map((member, index) => (
                        <div key={index} className="relative">
                          <MemberRow
                            label={`Member ${index + 1}${index >= 3 ? ' (Optional)' : ''}`}
                            students={students}
                            memberData={member}
                            onMemberChange={(data) => updateMember(index, data)}
                            excludeRegNos={getExcludedRegNos().filter(regNo => regNo !== member.regNo)}
                            isRequired={index < 3}
                            isOptional={index >= 3}
                          />
                        </div>
                      ))}
                    </div>

                    {/* Submit Button */}
                    <div className="flex justify-end space-x-4 pt-6 border-t">
                      <Link href="/">
                        <Button type="button" variant="outline">
                          Cancel
                        </Button>
                      </Link>
                      <Button
                        type="submit"
                        disabled={submitting || totalMembers < MIN_MEMBERS || totalMembers > MAX_MEMBERS}
                        className="bg-blue-600 hover:bg-blue-700"
                      >
                        {submitting ? (
                          <>
                            <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                            Creating Team...
                          </>
                        ) : (
                          <>
                            <Users className="mr-2 h-4 w-4" />
                            Create Team
                          </>
                        )}
                      </Button>
                    </div>
                  </form>
                )}
              </CardContent>
            </Card>
          </div>
        </div>
        </div>
      </div>
      <Footer />
    </div>
  )
}
