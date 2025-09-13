import { NextRequest, NextResponse } from "next/server"
import { GoogleSpreadsheet } from "google-spreadsheet"
import { JWT } from "google-auth-library"

async function getSpreadsheet(): Promise<GoogleSpreadsheet> {
  const serviceAccountAuth = new JWT({
    email: process.env.GOOGLE_SERVICE_ACCOUNT_EMAIL,
    key: process.env.GOOGLE_PRIVATE_KEY?.replace(/\\n/g, "\n"),
    scopes: ["https://www.googleapis.com/auth/spreadsheets"],
  })

  const spreadsheet = new GoogleSpreadsheet(process.env.SPREADSHEET_ID!, serviceAccountAuth)
  await spreadsheet.loadInfo()
  return spreadsheet
}

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const studentRegNo = searchParams.get('studentRegNo')

    const doc = await getSpreadsheet()
    const requestsSheet = doc.sheetsByTitle["Requests"]

    if (!requestsSheet) {
      return NextResponse.json({
        ok: false,
        message: "Requests sheet not found",
        availableSheets: Object.keys(doc.sheetsByTitle)
      })
    }

    const rows = await requestsSheet.getRows()
    
    // Get header info
    const headers = requestsSheet.headerValues

    // Get all rows data
    const allData = rows.map(row => {
      const rowData: any = {}
      headers.forEach(header => {
        rowData[header] = row.get(header)
      })
      return rowData
    })

    // Filter for specific student if provided
    const studentData = studentRegNo 
      ? allData.filter(row => row["Student Reg No"] === studentRegNo)
      : allData

    return NextResponse.json({
      ok: true,
      message: "Debug data retrieved",
      headers: headers,
      totalRows: rows.length,
      studentRegNo: studentRegNo,
      studentRequests: studentData,
      allData: allData // Show all data for debugging
    })

  } catch (error) {
    console.error("Debug API error:", error)
    return NextResponse.json({
      ok: false,
      message: "Error retrieving debug data",
      error: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 })
  }
}
