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
  isCurrentTeamMember?: boolean
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
  problemStatementId1?: string
  problemStatementId2?: string
  deptNeeded?: string
  pptLink1?: string
  pptLink2?: string
  leader: TeamMember
  members: TeamMember[]
  createdAt: string
  status: string
}

export interface CreateTeamRequest {
  teamName: string
  problemStatementId1: string
  problemStatementId2?: string
  leader: Member
  members: Member[]
  deptNeeded?: string
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

export interface JoinRequest {
  id: string
  studentName: string
  studentRegNo: string
  teamName: string
  teamId: string
  note: string
  githubPortfolioLink: string
  status: "Pending" | "Accepted" | "Rejected"
  accepted: boolean
  timestamp: string
}

export interface AvailableTeam {
  teamId: string
  teamName: string
  problemStatementId1: string
  problemStatementId2?: string
  deptNeeded?: string
  currentMemberCount: number
  maxMembers: number
  hasVacancy: boolean
  leader: {
    name: string
    dept: string
    year: string
  }
}

export interface CreateJoinRequestRequest {
  teamId: string
  note: string
  githubPortfolioLink: string
}

export interface CreateJoinRequestResponse {
  ok: boolean
  message: string
  requestId?: string
}
