import { z } from "zod"
import { MIN_MEMBERS, MAX_MEMBERS } from "./config"

export const MemberSchema = z.object({
  regNo: z.string().min(1, "Registration number is required"),
  github: z.string().url("Invalid GitHub URL").optional().or(z.literal("")),
  projectLink: z.string().url("Invalid project URL").optional().or(z.literal("")),
})

export const CreateTeamSchema = z.object({
  teamName: z.string().min(1, "Team name is required").max(100, "Team name too long"),
  problemStatementId1: z.string().min(1, "Problem Statement ID 1 is required"),
  problemStatementId2: z.string().optional(),
  leader: MemberSchema,
  members: z.array(MemberSchema).max(MAX_MEMBERS - 1, `Maximum ${MAX_MEMBERS - 1} additional members allowed`),
  deptNeeded: z.string().optional(),
  createdBy: z.string().optional(),
})

export const StudentFilterSchema = z.object({
  dept: z.string().optional(),
  year: z.string().optional(),
})

export function validateTeamSize(memberCount: number): { valid: boolean; message?: string } {
  if (memberCount < MIN_MEMBERS) {
    return {
      valid: false,
      message: `Team must have at least ${MIN_MEMBERS} members (including leader)`,
    }
  }

  if (memberCount > MAX_MEMBERS) {
    return {
      valid: false,
      message: `Team cannot exceed ${MAX_MEMBERS} members (including leader)`,
    }
  }

  return { valid: true }
}

export function validateNoDuplicates(regNos: string[]): { valid: boolean; message?: string } {
  const uniqueRegNos = new Set(regNos)

  if (uniqueRegNos.size !== regNos.length) {
    return {
      valid: false,
      message: "Duplicate students found in team",
    }
  }

  return { valid: true }
}
