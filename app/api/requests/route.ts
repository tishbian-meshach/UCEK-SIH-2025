import { NextRequest, NextResponse } from "next/server"
import { createJoinRequest, getStudentByRegNo } from "@/lib/sheets"
import type { CreateJoinRequestRequest, CreateJoinRequestResponse } from "@/lib/types"

export async function POST(request: NextRequest) {
  try {
    const body: CreateJoinRequestRequest & { studentRegNo?: string } = await request.json()
    const { teamId, note, githubPortfolioLink, studentRegNo } = body

    // Validation
    if (!teamId || !note?.trim()) {
      return NextResponse.json<CreateJoinRequestResponse>({
        ok: false,
        message: "Team ID and skills description are required"
      }, { status: 400 })
    }

    // Get student info from request or try to determine from context
    let currentStudentRegNo = studentRegNo
    let currentStudentName = ""

    // If studentRegNo not provided, we need to get it from session/auth
    // For now, we'll require it to be passed from the frontend
    if (!currentStudentRegNo) {
      return NextResponse.json<CreateJoinRequestResponse>({
        ok: false,
        message: "Student registration number is required"
      }, { status: 400 })
    }

    // Get student details
    const student = await getStudentByRegNo(currentStudentRegNo)
    if (!student) {
      return NextResponse.json<CreateJoinRequestResponse>({
        ok: false,
        message: "Student not found"
      }, { status: 404 })
    }

    currentStudentName = student.fullName

    // Validate URL if provided
    if (githubPortfolioLink && githubPortfolioLink.trim()) {
      try {
        new URL(githubPortfolioLink.trim())
      } catch {
        return NextResponse.json<CreateJoinRequestResponse>({
          ok: false,
          message: "Please provide a valid URL for GitHub/Portfolio link"
        }, { status: 400 })
      }
    }

    // Create join request
    const requestId = await createJoinRequest({
      teamId,
      note: note.trim(),
      githubPortfolioLink: githubPortfolioLink?.trim() || "",
      studentRegNo: currentStudentRegNo,
      studentName: currentStudentName
    })

    if (!requestId) {
      return NextResponse.json<CreateJoinRequestResponse>({
        ok: false,
        message: "Failed to create join request"
      }, { status: 500 })
    }

    return NextResponse.json<CreateJoinRequestResponse>({
      ok: true,
      message: "Join request created successfully",
      requestId: requestId
    })

  } catch (error) {
    console.error("Error creating join request:", error)
    return NextResponse.json<CreateJoinRequestResponse>({
      ok: false,
      message: "Internal server error"
    }, { status: 500 })
  }
}
