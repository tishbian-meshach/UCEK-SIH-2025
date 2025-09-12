import type { Student, CreateTeamRequest } from "./types"
import { MIN_MEMBERS, MAX_MEMBERS } from "./config"

export interface ValidationResult {
  isValid: boolean
  errors: string[]
}

export interface ConflictCheckResult {
  hasConflicts: boolean
  conflicts: string[]
  availableStudents: Student[]
}

export function validateTeamName(teamName: string): ValidationResult {
  const errors: string[] = []

  if (!teamName || !teamName.trim()) {
    errors.push("Team name is required")
  } else if (teamName.trim().length < 2) {
    errors.push("Team name must be at least 2 characters long")
  } else if (teamName.trim().length > 100) {
    errors.push("Team name cannot exceed 100 characters")
  }

  return {
    isValid: errors.length === 0,
    errors,
  }
}

export function validateTeamSize(memberCount: number): ValidationResult {
  const errors: string[] = []

  if (memberCount < MIN_MEMBERS) {
    errors.push(`Team must have at least ${MIN_MEMBERS} members (including leader)`)
  } else if (memberCount > MAX_MEMBERS) {
    errors.push(`Team cannot exceed ${MAX_MEMBERS} members (including leader)`)
  }

  return {
    isValid: errors.length === 0,
    errors,
  }
}

export function validateNoDuplicates(regNos: string[]): ValidationResult {
  const errors: string[] = []
  const seen = new Set<string>()
  const duplicates = new Set<string>()

  for (const regNo of regNos) {
    if (regNo && seen.has(regNo)) {
      duplicates.add(regNo)
    }
    if (regNo) seen.add(regNo)
  }

  if (duplicates.size > 0) {
    errors.push(`Duplicate students found: ${Array.from(duplicates).join(", ")}`)
  }

  return {
    isValid: errors.length === 0,
    errors,
  }
}

export function validateGitHubUrl(url: string): ValidationResult {
  const errors: string[] = []

  if (url && url.trim()) {
    try {
      const parsedUrl = new URL(url)
      if (!parsedUrl.hostname.includes("github.com")) {
        errors.push("GitHub URL must be from github.com")
      }
    } catch {
      errors.push("Invalid GitHub URL format")
    }
  }

  return {
    isValid: errors.length === 0,
    errors,
  }
}

export function validateProjectUrl(url: string): ValidationResult {
  const errors: string[] = []

  if (url && url.trim()) {
    try {
      new URL(url)
    } catch {
      errors.push("Invalid project URL format")
    }
  }

  return {
    isValid: errors.length === 0,
    errors,
  }
}

export function validateTeamRequest(request: CreateTeamRequest): ValidationResult {
  const errors: string[] = []

  // Validate team name
  const teamNameValidation = validateTeamName(request.teamName)
  errors.push(...teamNameValidation.errors)

  // Validate leader
  if (!request.leader.regNo) {
    errors.push("Team leader is required")
  }

  // Validate GitHub URLs
  const leaderGitHubValidation = validateGitHubUrl(request.leader.github)
  errors.push(...leaderGitHubValidation.errors.map((e) => `Leader ${e}`))

  // Validate project URLs
  const leaderProjectValidation = validateProjectUrl(request.leader.projectLink)
  errors.push(...leaderProjectValidation.errors.map((e) => `Leader ${e}`))

  // Validate members
  request.members.forEach((member, index) => {
    if (member.regNo) {
      const memberGitHubValidation = validateGitHubUrl(member.github)
      errors.push(...memberGitHubValidation.errors.map((e) => `Member ${index + 2}: ${e}`))

      const memberProjectValidation = validateProjectUrl(member.projectLink)
      errors.push(...memberProjectValidation.errors.map((e) => `Member ${index + 2}: ${e}`))
    }
  })

  // Validate team size
  const filledMembers = request.members.filter((m) => m.regNo)
  const totalMembers = 1 + filledMembers.length
  const sizeValidation = validateTeamSize(totalMembers)
  errors.push(...sizeValidation.errors)

  // Validate no duplicates
  const allRegNos = [request.leader.regNo, ...filledMembers.map((m) => m.regNo)]
  const duplicateValidation = validateNoDuplicates(allRegNos)
  errors.push(...duplicateValidation.errors)

  return {
    isValid: errors.length === 0,
    errors,
  }
}

export function checkStudentConflicts(requestedRegNos: string[], allStudents: Student[]): ConflictCheckResult {
  const conflicts: string[] = []
  const availableStudents: Student[] = []

  for (const regNo of requestedRegNos) {
    const student = allStudents.find((s) => s.regNo === regNo)

    if (!student) {
      conflicts.push(`Student with RegNo ${regNo} not found`)
    } else if (student.status === "Assigned") {
      conflicts.push(regNo)
    } else {
      availableStudents.push(student)
    }
  }

  return {
    hasConflicts: conflicts.length > 0,
    conflicts,
    availableStudents,
  }
}

export function sanitizeInput(input: string): string {
  return input.trim().replace(/[<>]/g, "")
}

export function validateEmail(email: string): ValidationResult {
  const errors: string[] = []
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/

  if (email && !emailRegex.test(email)) {
    errors.push("Invalid email format")
  }

  return {
    isValid: errors.length === 0,
    errors,
  }
}
