# Team Formation App

A Next.js application for creating and managing teams with Google Sheets as the backend. This app allows team leaders to create teams of 3-6 members with real-time availability checking and conflict resolution.

## Features

- **Team Creation**: Step-by-step wizard for creating teams
- **Google Sheets Integration**: Uses Google Sheets as database with service account authentication
- **Real-time Validation**: Prevents conflicts when multiple leaders try to select the same student
- **Filtering**: Filter students by department and year
- **Responsive Design**: Works on desktop and mobile devices
- **Concurrency Handling**: Prevents race conditions with proper conflict detection

## Tech Stack

- **Frontend**: Next.js 14, React, TypeScript, Tailwind CSS
- **Backend**: Next.js API Routes, Google Sheets API
- **Validation**: Zod for schema validation
- **UI Components**: React Select for dropdowns
- **Authentication**: Google Service Account

## Prerequisites

- Node.js 18 or higher
- Google Cloud Project with Sheets API enabled
- Google Service Account with JSON key

## Setup Instructions

### 1. Clone and Install

\`\`\`bash
git clone <repository-url>
cd team-formation-app
npm install
\`\`\`

### 2. Create Google Service Account

1. Go to [Google Cloud Console](https://console.cloud.google.com/)
2. Create a new project or select existing one
3. Enable Google Sheets API:
   - Go to "APIs & Services" > "Library"
   - Search for "Google Sheets API" and enable it
4. Create Service Account:
   - Go to "APIs & Services" > "Credentials"
   - Click "Create Credentials" > "Service Account"
   - Fill in the details and create
5. Generate Key:
   - Click on the created service account
   - Go to "Keys" tab
   - Click "Add Key" > "Create New Key" > "JSON"
   - Download the JSON file

### 3. Setup Google Sheets

1. Create a new Google Sheet
2. Create two sheets (tabs) named exactly:
   - `Students`
   - `Teams`
3. Import sample data:
   - Copy content from `sample_students.csv` to Students sheet
   - Copy content from `sample_teams.csv` to Teams sheet (optional)
4. Share the sheet with your service account email:
   - Click "Share" button
   - Add the service account email (found in your JSON key file)
   - Give "Editor" permissions

### 4. Environment Variables

1. Copy the example environment file:
\`\`\`bash
cp .env.local.example .env.local
\`\`\`

2. Fill in your environment variables:
\`\`\`env
GOOGLE_SERVICE_ACCOUNT_EMAIL=your-service-account@your-project.iam.gserviceaccount.com
GOOGLE_PRIVATE_KEY="-----BEGIN PRIVATE KEY-----\nYour private key here\n-----END PRIVATE KEY-----"
SPREADSHEET_ID=your-google-sheet-id
\`\`\`

**Important Notes:**
- Get the `SPREADSHEET_ID` from your Google Sheet URL: `https://docs.google.com/spreadsheets/d/{SPREADSHEET_ID}/edit`
- The `GOOGLE_PRIVATE_KEY` should include the full key with `\n` for newlines
- Make sure to wrap the private key in quotes

### 5. Run the Application

\`\`\`bash
npm run dev
\`\`\`

Open [http://localhost:3000](http://localhost:3000) to view the application.

## Usage

### Creating a Team

1. **Team Details**: Enter your team name
2. **Filter Students**: Optionally filter by department and year
3. **Select Leader**: Choose the team leader (required)
4. **Add Members**: Select 2-5 additional team members
5. **Review & Submit**: Review your team and submit

### Team Size Configuration

You can modify team size constraints in `lib/config.ts`:

\`\`\`typescript
export const MIN_MEMBERS = 3 // Leader + 2 members minimum
export const MAX_MEMBERS = 6 // Leader + 5 members maximum
export const OPTIONAL_SLOTS = 2 // Last 2 slots are optional
\`\`\`

## API Endpoints

### Students

- `GET /api/students?dept=CS&year=3` - Get students with optional filters
- `GET /api/students/available?dept=CS&year=3` - Get only available students
- `GET /api/students/[regNo]` - Get specific student
- `GET /api/check-availability?regNo=REG123` - Check if student is available

### Teams

- `POST /api/teams` - Create a new team
- `GET /api/teams/[teamId]` - Get team details

### Example API Usage

**Create Team:**
\`\`\`bash
curl -X POST http://localhost:3000/api/teams \
  -H "Content-Type: application/json" \
  -d '{
    "teamName": "Team Rocket",
    "leader": {
      "regNo": "REG123",
      "github": "https://github.com/john",
      "projectLink": "https://project.com"
    },
    "members": [
      {
        "regNo": "REG124",
        "github": "https://github.com/jane",
        "projectLink": "https://project2.com"
      }
    ]
  }'
\`\`\`

**Success Response:**
\`\`\`json
{
  "ok": true,
  "teamId": "uuid-here",
  "message": "Team created successfully"
}
\`\`\`

**Conflict Response (409):**
\`\`\`json
{
  "ok": false,
  "message": "Some students are already assigned",
  "conflicts": ["REG124", "REG125"]
}
\`\`\`

## Google Sheets Structure

### Students Sheet Columns

| Column | Description | Example |
|--------|-------------|---------|
| RegNo | Unique registration number | REG001 |
| FullName | Student's full name | John Doe |
| Email | Student's email | john@uni.edu |
| Dept | Department code | CS |
| Year | Academic year | 3 |
| Status | Available or Assigned | Available |
| AssignedTeamID | Team ID if assigned | team-123 |
| CreatedAt | Timestamp | 2024-01-01T00:00:00Z |

### Teams Sheet Columns

The Teams sheet stores one row per team with columns for each member:

- `TeamID`, `TeamName`, `CreatedAt`
- `Leader_Name`, `Leader_RegNo`, `Leader_Email`, `Leader_Dept`, `Leader_Year`, `Leader_Github`, `Leader_ProjectLink`
- `Member2_Name`, `Member2_RegNo`, `Member2_Email`, `Member2_Dept`, `Member2_Year`, `Member2_Github`, `Member2_ProjectLink`
- ... (up to Member6)

## Testing

### Manual Testing Steps

1. **Setup Test Data**:
   - Import sample data with some students marked as "Assigned"
   - Verify the sheets are properly formatted

2. **Test Team Creation**:
   - Try creating a team with available students ✅
   - Try selecting an already assigned student (should show conflict) ❌
   - Try creating a team with duplicate students (should show error) ❌
   - Test minimum/maximum team size validation

3. **Test Concurrency**:
   - Open two browser windows
   - Try to select the same student simultaneously
   - Verify conflict detection works

4. **Test Filtering**:
   - Filter by department and verify student list updates
   - Filter by year and verify student list updates
   - Check available student count display

## Troubleshooting

### Common Issues

1. **"Students sheet not found"**
   - Ensure your Google Sheet has a tab named exactly "Students"
   - Check that the service account has access to the sheet

2. **"Authentication failed"**
   - Verify your service account email and private key
   - Ensure the private key includes proper newline characters (`\n`)
   - Check that the service account has access to the Google Sheet

3. **"Failed to fetch students"**
   - Check your internet connection
   - Verify the SPREADSHEET_ID is correct
   - Ensure Google Sheets API is enabled in your Google Cloud project

4. **Students not showing as available**
   - Check the "Status" column in your Students sheet
   - Ensure values are exactly "Available" or "Assigned" (case-sensitive)

### Debug Mode

Add console logging to debug issues:

\`\`\`typescript
// In lib/sheets.ts
console.log("Fetched students:", students)
console.log("Available count:", availableCount)
\`\`\`

## Deployment

### Vercel Deployment

1. Push your code to GitHub
2. Connect your repository to Vercel
3. Add environment variables in Vercel dashboard
4. Deploy

### Environment Variables for Production

Make sure to add these in your deployment platform:
- `GOOGLE_SERVICE_ACCOUNT_EMAIL`
- `GOOGLE_PRIVATE_KEY`
- `SPREADSHEET_ID`

## Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Test thoroughly
5. Submit a pull request

## License

MIT License - see LICENSE file for details.
