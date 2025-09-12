import { NextRequest, NextResponse } from "next/server"
import { checkAvailability } from "@/lib/sheets"

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const regNo = searchParams.get("regNo")

    if (!regNo) {
      return NextResponse.json(
        { error: "Registration number is required" },
        { status: 400 }
      )
    }

    const available = await checkAvailability(regNo)

    return NextResponse.json({
      regNo,
      available
    })
  } catch (error) {
    console.error("Error checking availability:", error)
    return NextResponse.json(
      { 
        error: "Failed to check availability", 
        message: error instanceof Error ? error.message : "Unknown error" 
      },
      { status: 500 }
    )
  }
}
