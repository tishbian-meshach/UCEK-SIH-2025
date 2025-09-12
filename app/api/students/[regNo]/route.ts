import { NextRequest, NextResponse } from "next/server"
import { getStudentByRegNo } from "@/lib/sheets"

export async function GET(
  request: NextRequest,
  { params }: { params: { regNo: string } }
) {
  try {
    const { regNo } = params

    if (!regNo) {
      return NextResponse.json(
        { error: "Registration number is required" },
        { status: 400 }
      )
    }

    const student = await getStudentByRegNo(regNo)

    if (!student) {
      return NextResponse.json(
        { error: "Student not found" },
        { status: 404 }
      )
    }

    return NextResponse.json(student)
  } catch (error) {
    console.error("Error fetching student:", error)
    return NextResponse.json(
      { 
        error: "Failed to fetch student", 
        message: error instanceof Error ? error.message : "Unknown error" 
      },
      { status: 500 }
    )
  }
}
