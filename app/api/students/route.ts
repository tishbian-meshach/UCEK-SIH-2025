import { NextRequest, NextResponse } from "next/server"
import { getStudents } from "@/lib/sheets"
import { StudentFilterSchema } from "@/lib/validation"

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const dept = searchParams.get("dept") || undefined
    const year = searchParams.get("year") || undefined
    const availableOnly = searchParams.get("availableOnly") === "true"

    // Validate query parameters
    const validation = StudentFilterSchema.safeParse({ dept, year })
    if (!validation.success) {
      return NextResponse.json(
        { 
          error: "Invalid query parameters", 
          details: validation.error.errors 
        },
        { status: 400 }
      )
    }

    const students = await getStudents(dept, year, availableOnly)

    return NextResponse.json({
      students,
      count: students.length,
      filters: { dept, year, availableOnly }
    })
  } catch (error) {
    console.error("Error fetching students:", error)
    return NextResponse.json(
      { 
        error: "Failed to fetch students", 
        message: error instanceof Error ? error.message : "Unknown error" 
      },
      { status: 500 }
    )
  }
}
