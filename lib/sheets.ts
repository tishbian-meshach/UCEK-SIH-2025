import { GoogleSpreadsheet } from "google-spreadsheet"
import { JWT } from "google-auth-library"
import type { Student, CreateTeamRequest, TeamMember, Team } from "./types"
import { v4 as uuidv4 } from "uuid"

let doc: GoogleSpreadsheet | null = null

async function getSpreadsheet(): Promise<GoogleSpreadsheet> {
  try {
    // Don't cache the document to avoid permission issues
    const serviceAccountAuth = new JWT({
      email: process.env.GOOGLE_SERVICE_ACCOUNT_EMAIL,
      key: process.env.GOOGLE_PRIVATE_KEY?.replace(/\\n/g, "\n"),
      scopes: ["https://www.googleapis.com/auth/spreadsheets"],
    })

    const spreadsheet = new GoogleSpreadsheet(process.env.SPREADSHEET_ID!, serviceAccountAuth)
    await spreadsheet.loadInfo()

    return spreadsheet
  } catch (error) {
    console.error("Error loading spreadsheet:", error)
    throw new Error(`Failed to load spreadsheet: ${error instanceof Error ? error.message : 'Unknown error'}`)
  }
}

export async function getStudents(dept?: string, year?: string, availableOnly = false): Promise<Student[]> {
  const doc = await getSpreadsheet()
  const sheet = doc.sheetsByTitle["Form Responses 1"]

  if (!sheet) {
    throw new Error("Form Responses 1 sheet not found")
  }

  const rows = await sheet.getRows()

  return rows
    .map((row) => ({
      regNo: row.get("University Register Number") || "",
      fullName: row.get("Full Name") || "",
      email: row.get("Email Address") || "",
      dept: row.get("Your Department") || "",
      year: row.get("Year ?") || "",
      status: (row.get("is Assigned to a team?") === "Yes" ? "Assigned" : "Available") as "Available" | "Assigned",
      assignedTeamId: row.get("AssignedTeamID") || "",
      password: row.get("Password") || "",
      createdAt: row.get("Timestamp") || "",
    }))
    .filter((student) => {
      // Filter out empty rows
      if (!student.regNo || !student.fullName) return false
      if (dept && student.dept !== dept) return false
      if (year && student.year !== year) return false
      if (availableOnly && student.status !== "Available") return false
      return true
    })
}

export async function getStudentByRegNo(regNo: string): Promise<Student | null> {
  const doc = await getSpreadsheet()
  const sheet = doc.sheetsByTitle["Form Responses 1"]

  if (!sheet) {
    throw new Error("Form Responses 1 sheet not found")
  }

  const rows = await sheet.getRows()
  const row = rows.find((r) => r.get("University Register Number") === regNo)

  if (!row) return null

  return {
    regNo: row.get("University Register Number") || "",
    fullName: row.get("Full Name") || "",
    email: row.get("Email Address") || "",
    dept: row.get("Your Department") || "",
    year: row.get("Year ?") || "",
    status: (row.get("is Assigned to a team?") === "Yes" ? "Assigned" : "Available") as "Available" | "Assigned",
    assignedTeamId: row.get("AssignedTeamID") || "",
    password: row.get("Password") || "",
    createdAt: row.get("Timestamp") || "",
  }
}

export async function createTeam(teamData: CreateTeamRequest): Promise<{ teamId: string; conflicts: string[] }> {
  const doc = await getSpreadsheet()
  const studentsSheet = doc.sheetsByTitle["Form Responses 1"]
  const teamsSheet = doc.sheetsByTitle["Teams"]

  if (!studentsSheet || !teamsSheet) {
    throw new Error("Required sheets not found")
  }

  const teamId = uuidv4()
  const allRegNos = [teamData.leader.regNo, ...teamData.members.map((m) => m.regNo)]

  // Check for duplicates in the request
  const uniqueRegNos = new Set(allRegNos)
  if (uniqueRegNos.size !== allRegNos.length) {
    throw new Error("Duplicate students in team request")
  }

  // Get all student rows and check availability
  const studentRows = await studentsSheet.getRows()
  const conflicts: string[] = []
  const teamMembers: TeamMember[] = []

  // Validate leader
  const leaderRow = studentRows.find((row) => row.get("University Register Number") === teamData.leader.regNo)
  if (!leaderRow) {
    throw new Error(`Leader with RegNo ${teamData.leader.regNo} not found`)
  }

  if (leaderRow.get("is Assigned to a team?") === "Yes") {
    conflicts.push(teamData.leader.regNo)
  } else {
    teamMembers.push({
      regNo: leaderRow.get("University Register Number"),
      fullName: leaderRow.get("Full Name"),
      email: leaderRow.get("Email Address"),
      dept: leaderRow.get("Your Department"),
      year: leaderRow.get("Year ?"),
      status: "Available" as const,
      assignedTeamId: "",
      password: leaderRow.get("Password") || "",
      github: teamData.leader.github,
      projectLink: teamData.leader.projectLink,
    })
  }

  // Validate members
  for (const member of teamData.members) {
    const memberRow = studentRows.find((row) => row.get("University Register Number") === member.regNo)
    if (!memberRow) {
      throw new Error(`Member with RegNo ${member.regNo} not found`)
    }

    if (memberRow.get("is Assigned to a team?") === "Yes") {
      conflicts.push(member.regNo)
    } else {
      teamMembers.push({
        regNo: memberRow.get("University Register Number"),
        fullName: memberRow.get("Full Name"),
        email: memberRow.get("Email Address"),
        dept: memberRow.get("Your Department"),
        year: memberRow.get("Year ?"),
        status: "Available" as const,
        assignedTeamId: "",
        password: memberRow.get("Password") || "",
        github: member.github,
        projectLink: member.projectLink,
      })
    }
  }

  if (conflicts.length > 0) {
    return { teamId: "", conflicts }
  }

  // Create team row data based on your exact Teams sheet structure
  const teamRowData: any = {
    "Team ID": teamId,
    "Team Name": teamData.teamName,
    "Problem Statement ID": teamData.problemStatementId,
  }

  // Add leader data
  const leader = teamMembers[0]
  teamRowData["Team Leader Reg NO"] = leader.regNo
  teamRowData["Team Leader Name"] = leader.fullName
  teamRowData["Team Leader github"] = leader.github || ""
  teamRowData["Team Leader project"] = leader.projectLink || ""

  // Add member data (up to 5 additional members)
  for (let i = 1; i < teamMembers.length && i <= 5; i++) {
    const member = teamMembers[i]
    const memberNum = i // Member-1, Member-2, etc.

    teamRowData[`Member-${memberNum} Reg NO`] = member.regNo
    teamRowData[`Member-${memberNum} Name`] = member.fullName
    teamRowData[`Member-${memberNum} github`] = member.github || ""
    teamRowData[`Member-${memberNum} project`] = member.projectLink || ""
  }

  // Fill empty member slots with empty strings if team has fewer than 5 members
  for (let i = teamMembers.length; i <= 5; i++) {
    const memberNum = i
    teamRowData[`Member-${memberNum} Reg NO`] = ""
    teamRowData[`Member-${memberNum} Name`] = ""
    teamRowData[`Member-${memberNum} github`] = ""
    teamRowData[`Member-${memberNum} project`] = ""
  }

  // Add team to Teams sheet
  await teamsSheet.addRow(teamRowData)

  // Update student statuses in Form Responses 1 sheet
  for (const member of teamMembers) {
    const studentRow = studentRows.find((row) => row.get("University Register Number") === member.regNo)
    if (studentRow) {
      studentRow.set("is Assigned to a team?", "Yes")
      // Add a new column for team ID if it doesn't exist
      if (studentRow.get("AssignedTeamID") !== undefined) {
        studentRow.set("AssignedTeamID", teamId)
      }
      await studentRow.save()
    }
  }

  return { teamId, conflicts: [] }
}

export async function checkAvailability(regNo: string): Promise<boolean> {
  const student = await getStudentByRegNo(regNo)
  return student ? student.status === "Available" : false
}

export async function authenticateStudent(regNo: string, password: string): Promise<Student | null> {
  try {
    const students = await getStudents()
    const student = students.find(s => s.regNo === regNo && s.password === password)
    return student || null
  } catch (error) {
    console.error("Error authenticating student:", error)
    return null
  }
}

export async function updateStudentPassword(regNo: string, password: string): Promise<boolean> {
  try {
    const doc = await getSpreadsheet()
    const sheet = doc.sheetsByTitle["Form Responses 1"]

    if (!sheet) {
      throw new Error("Form Responses 1 sheet not found")
    }

    const rows = await sheet.getRows()
    const row = rows.find((r) => r.get("University Register Number") === regNo)

    if (!row) {
      return false
    }

    // Update the password field
    row.set("Password", password)
    await row.save()

    return true
  } catch (error) {
    console.error("Error updating student password:", error)
    return false
  }
}

export async function getTeamByMemberRegNo(regNo: string): Promise<Team | null> {
  try {
    const doc = await getSpreadsheet()
    const teamsSheet = doc.sheetsByTitle["Teams"]

    if (!teamsSheet) {
      throw new Error("Teams sheet not found")
    }

    const rows = await teamsSheet.getRows()

    // Find team where the regNo appears as leader or any member
    const teamRow = rows.find(row => {
      const leaderRegNo = row.get("Team Leader Reg NO")
      const member1RegNo = row.get("Member-1 Reg NO")
      const member2RegNo = row.get("Member-2 Reg NO")
      const member3RegNo = row.get("Member-3 Reg NO")
      const member4RegNo = row.get("Member-4 Reg NO")
      const member5RegNo = row.get("Member-5 Reg NO")

      return leaderRegNo === regNo ||
             member1RegNo === regNo ||
             member2RegNo === regNo ||
             member3RegNo === regNo ||
             member4RegNo === regNo ||
             member5RegNo === regNo
    })

    if (!teamRow) return null

    // Get leader details from students sheet
    const leaderStudent = await getStudentByRegNo(teamRow.get("Team Leader Reg NO"))
    if (!leaderStudent) return null

    // Build team object
    const team: Team = {
      teamId: teamRow.get("Team ID") || "",
      teamName: teamRow.get("Team Name") || "",
      problemStatementId: teamRow.get("Problem Statement ID") || "",
      leader: {
        ...leaderStudent,
        github: teamRow.get("Team Leader github") || "",
        projectLink: teamRow.get("Team Leader project") || "",
      },
      members: [],
      createdAt: "",
      status: "Active"
    }

    // Add members
    for (let i = 1; i <= 5; i++) {
      const memberRegNo = teamRow.get(`Member-${i} Reg NO`)

      if (memberRegNo) {
        const memberStudent = await getStudentByRegNo(memberRegNo)
        if (memberStudent) {
          team.members.push({
            ...memberStudent,
            github: teamRow.get(`Member-${i} github`) || "",
            projectLink: teamRow.get(`Member-${i} project`) || "",
          })
        }
      }
    }

    return team
  } catch (error) {
    console.error("Error getting team by member regNo:", error)
    return null
  }
}

export async function updateTeam(teamId: string, teamData: {
  teamName: string
  problemStatementId: string
  leader: {
    regNo: string
    github: string
    projectLink: string
  }
  members: Array<{
    regNo: string
    github: string
    projectLink: string
  }>
}): Promise<any> {
  try {
    const doc = await getSpreadsheet()
    const teamsSheet = doc.sheetsByTitle["Teams"]

    if (!teamsSheet) {
      console.error("Teams sheet not found")
      return null
    }

    const rows = await teamsSheet.getRows()

    // Find the team row by Team ID
    for (const row of rows) {
      if (row.get("Team ID") === teamId) {
        // Update team basic info
        row.set("Team Name", teamData.teamName)
        row.set("Problem Statement ID", teamData.problemStatementId)

        // Update leader info
        row.set("Team Leader github", teamData.leader.github || "")
        row.set("Team Leader project", teamData.leader.projectLink || "")

        // Update members info (up to 5 members)
        for (let i = 0; i < 5; i++) {
          const member = teamData.members[i]
          const memberIndex = i + 1

          if (member) {
            row.set(`Member-${memberIndex} github`, member.github || "")
            row.set(`Member-${memberIndex} project`, member.projectLink || "")
          }
        }

        await row.save()

        // Return updated team data
        return {
          teamId: row.get("Team ID"),
          teamName: row.get("Team Name"),
          problemStatementId: row.get("Problem Statement ID"),
          leader: {
            regNo: row.get("Team Leader Reg NO"),
            name: row.get("Team Leader Name"),
            github: row.get("Team Leader github"),
            projectLink: row.get("Team Leader project")
          },
          members: teamData.members.map((member, index) => ({
            regNo: member.regNo,
            name: row.get(`Member-${index + 1} Name`),
            github: member.github,
            projectLink: member.projectLink
          }))
        }
      }
    }

    return null // Team not found
  } catch (error) {
    console.error("Error updating team:", error)
    return null
  }
}
