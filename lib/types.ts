export interface Student {
  regNo: string
  fullName: string
  email: string
  dept: string
  year: string
  status: "Available" | "Assigned"
  assignedTeamId: string
  password: string
  createdAt?: string
}

export interface Member {
  regNo: string
  github: string
  projectLink: string
}

export interface TeamMember extends Student {
  github: string
  projectLink: string
}

export interface Team {
  teamId: string
  teamName: string
  problemStatementId: string
  leader: TeamMember
  members: TeamMember[]
  createdAt: string
  status: string
}

export interface CreateTeamRequest {
  teamName: string
  problemStatementId: string
  leader: Member
  members: Member[]
  createdBy?: string
}

export interface CreateTeamResponse {
  ok: boolean
  teamId?: string
  message: string
  conflicts?: string[]
}

export interface LoginRequest {
  regNo: string
  password: string
}

export interface LoginResponse {
  ok: boolean
  message: string
  student?: Student
  team?: Team
  role?: "leader" | "member" | "none"
}

export interface TeamDetails extends Team {
  isLeader: boolean
  canEdit: boolean
}
