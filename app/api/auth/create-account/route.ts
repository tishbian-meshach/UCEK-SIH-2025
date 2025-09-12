import { NextRequest, NextResponse } from "next/server"
import { getStudentByRegNo, updateStudentPassword } from "@/lib/sheets"

interface CreateAccountRequest {
  regNo: string
  email: string
  password: string
  confirmPassword: string
}

interface CreateAccountResponse {
  ok: boolean
  message: string
  student?: any
}

export async function POST(request: NextRequest) {
  try {
    const body: CreateAccountRequest = await request.json()
    const { regNo, email, password, confirmPassword } = body

    // Validation
    if (!regNo || !email || !password || !confirmPassword) {
      return NextResponse.json<CreateAccountResponse>({
        ok: false,
        message: "All fields are required"
      }, { status: 400 })
    }

    if (!email.includes("@")) {
      return NextResponse.json<CreateAccountResponse>({
        ok: false,
        message: "Please enter a valid email address"
      }, { status: 400 })
    }

    if (password.length < 6) {
      return NextResponse.json<CreateAccountResponse>({
        ok: false,
        message: "Password must be at least 6 characters long"
      }, { status: 400 })
    }

    if (password !== confirmPassword) {
      return NextResponse.json<CreateAccountResponse>({
        ok: false,
        message: "Passwords do not match"
      }, { status: 400 })
    }

    // Check if student exists in the form responses
    const student = await getStudentByRegNo(regNo)

    if (!student) {
      return NextResponse.json<CreateAccountResponse>({
        ok: false,
        message: "Registration number not found. Please make sure you have filled the registration form first."
      }, { status: 404 })
    }

    // Verify that the email matches the registration record
    if (student.email.toLowerCase() !== email.toLowerCase()) {
      return NextResponse.json<CreateAccountResponse>({
        ok: false,
        message: "Email address does not match the registration record. Please use the email address you provided during registration."
      }, { status: 400 })
    }

    // Check if student already has a password
    if (student.password && student.password.trim() !== "") {
      return NextResponse.json<CreateAccountResponse>({
        ok: false,
        message: "Account already exists for this registration number. Please use the login page."
      }, { status: 409 })
    }

    // Update the student's password in the sheet
    const success = await updateStudentPassword(regNo, password)
    
    if (!success) {
      return NextResponse.json<CreateAccountResponse>({
        ok: false,
        message: "Failed to create account. Please try again."
      }, { status: 500 })
    }

    return NextResponse.json<CreateAccountResponse>({
      ok: true,
      message: "Account created successfully! You can now sign in.",
      student: {
        regNo: student.regNo,
        fullName: student.fullName,
        dept: student.dept,
        year: student.year
      }
    })

  } catch (error) {
    console.error("Create account error:", error)
    return NextResponse.json<CreateAccountResponse>({
      ok: false,
      message: "Internal server error"
    }, { status: 500 })
  }
}
