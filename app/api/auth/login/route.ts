import { NextRequest, NextResponse } from "next/server"
import { authenticateStudent, getTeamByMemberRegNo } from "@/lib/sheets"
import type { LoginRequest, LoginResponse } from "@/lib/types"

export async function POST(request: NextRequest) {
  try {
    const body: LoginRequest = await request.json()
    const { regNo, password } = body

    if (!regNo || !password) {
      return NextResponse.json<LoginResponse>({
        ok: false,
        message: "Registration number and password are required"
      }, { status: 400 })
    }

    // Authenticate student
    const student = await authenticateStudent(regNo, password)
    
    if (!student) {
      return NextResponse.json<LoginResponse>({
        ok: false,
        message: "Invalid registration number or password"
      }, { status: 401 })
    }

    // Check if student has a team
    const team = await getTeamByMemberRegNo(regNo)
    
    let role: "leader" | "member" | "none" = "none"
    
    if (team) {
      role = team.leader.regNo === regNo ? "leader" : "member"
    }

    return NextResponse.json<LoginResponse>({
      ok: true,
      message: "Login successful",
      student,
      team: team || undefined,
      role
    })

  } catch (error) {
    console.error("Login error:", error)
    return NextResponse.json<LoginResponse>({
      ok: false,
      message: "Internal server error"
    }, { status: 500 })
  }
}
