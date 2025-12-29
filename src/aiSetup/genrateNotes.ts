import { GoogleGenAI } from "@google/genai";

// google gemini ai setup.
const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY });



import { VertexAI } from "@google-cloud/vertexai";

const vertexAI = new VertexAI({
  project: "dir-dataflow",
  location: "us-central1",
});

const model = vertexAI.getGenerativeModel({
  model: "gemini-2.5-flash",
  generationConfig: {
    temperature: 0.4,
    maxOutputTokens: 4096, // Increased for longer responses
  },
});

export async function generateNotesWithAi(aiRequest: any) {
  try {
    const FULL_PROMPT = `You are a Clinical Documentation Assistant for an early intensive developmental and behavioral intervention agency in Minnesota specializing in DIRFloortime.

Your task is to synthesize three distinct data sources into a professional, concise, and clinically accurate SOAP note for a data collection individual treatment plan development and progress monitoring observation of the client and their DIRFloortime provider during their individual intervention session.

**Source 1: Client Profile**
Contains client's interests, strengths, learning style, areas of challenge, family context, sensory processing, communication, and safety considerations.

**Source 2: Session Data**
Structured progress and session data (e.g., date of session, start time, end time, duration, session type, client, session provider, individuals present during this session, activities engaged in, strategies used, and percentage-based progress data on specific goals).

**Source 3: Provider's Observations**
Raw, shorthand observations and narrative from today's session and client variables.

**CONSTRAINTS:**
- Use professional clinical terminology (e.g., "Client reports" instead of "Client said")
- Maintain a neutral, objective tone
- Use neuroaffirming language
- If data for a specific SOAP section is missing, do not hallucinate; simply omit or state "Not discussed this session"
- Focus heavily on the "provider's observations, client variables, activities engaged in, and strategies used" for the Subjective and Objective sections
- Interpret common clinical abbreviations



**CRITICAL RULES (MANDATORY):**
- OUTPUT VALID JSON ONLY
- DO NOT include markdown code blocks (\`\`\`json)
- DO NOT include explanations before or after the JSON
- DO NOT include commentary
- DO NOT include text outside JSON
- DO NOT hallucinate data
- If data is missing, use empty string "" or 0
- DO NOT change JSON keys
- COMPLETE ALL SECTIONS
- Use the exact field names from the schema below

**YOU MUST FOLLOW THIS EXACT JSON SCHEMA:**

{
  "session_metadata": {
    "client_name": "",
    "date": "",
    "session_type": "",
    "duration_minutes": 0,
    "start_time": "",
    "end_time": "",
    "location": "Clinic",
    "provider": ""
  },

  "soap_note": {
    "subjective": "",

    "objective": {
      "session_context": "",
      "observations": "",

      "data_and_progress": {
        "strategies_implemented": [],
        "activities": [],

        "goals": [
          {
            "goal_name": "",
            "fedc_level": "",
            "circles_or_opportunities": 0,

            "performance": {
              "independent": {
                "count": 0,
                "success": 0,
                "miss": 0,
                "success_percent": 0,
                
              },
              "minimal_support": {
                "count": 0,
                "success": 0,
                "miss": 0,
                "success_percent": 0,
               
              },
              "moderate_support": {
                "count": 0,
                "success": 0,
                "miss": 0,
                "success_percent": 0,
              
              }
            },

            "totals": {
              "total_trials": 0,
              "total_success": 0,
              "total_miss": 0,
              "overall_accuracy_percent": 0
            },

            "engagement_summary": "",
            "performance_summary": ""
          }
        ]
      }
    },

    "assessment": "",
    "plan": ""
  }
}


**EXAMPLE SOAP NOTE (FOR REFERENCE ONLY - DO NOT COPY):**

Client Name: Leo
Date: 10/25/2025
Session Type: EIDBI ITP H0032UB
Duration: 45 Minutes
Start: 10:01am
End: 10:46am
Location: Clinic
Provider: [user name and credentials]

S (Subjective):
Provider reported that the Client has recently been ill but appeared to have improved energy levels during the session. Provider noted the Client continues to exhibit an intermittent residual cough.

O (Objective):
Session Context:
Client participated in an individual session with the Provider present in the clinical setting; Writer observed remotely via telehealth.

Observations:
Client presented with elevated arousal and initial dysregulation. Upon noticing the remote observation setup, Client attempted to terminate the connection by closing the laptop multiple times. Client engaged in rapid gross motor movement, traversing stairs and pacing through the environment. He sought visual and vestibular sensory input by toggling light switches and moving continuously.

Client utilized non-verbal communication and sequencing skills to indicate a desire to transition outdoors; specifically, Client stood by the exit and retrieved the Provider's shoes to signal intent. Following this interaction, Client transitioned to a seated position on the steps. The Provider utilized strategies of joining and following the Client's lead, engaging in tactile sensory play. This involved rubbing a bristle block and a standard block against various parts of the Client's body to provide deep pressure and tactile input.

Data & Progress:
- Strategies Implemented: Affect attunement, pacing, scaffolding, joining, and following the Client's lead.
- Activities: Sensory play and cause-and-effect play.
- Goal 1 (Back and Forth Social Interactions - FEDC 3): Client engaged in 5 circles of communication.
  ○ Performance: 33% with moderate support; 0% with minimal support; 0% independent.
- Goal 2 (Regulation Strategies - FEDC 1):
  ○ Performance: Client demonstrated 100% success rate across moderate, minimal, and independent opportunity levels.

A (Assessment):
Client demonstrated challenges with initial regulation, likely influenced by residual physiological symptoms of illness and sensitivity to the virtual observation setup (closing laptop). Despite high arousal, Client effectively utilized purposeful non-verbal communication (FEDC 3) to signal needs (retrieving shoes). The Client responded positively to the Provider's use of affect attunement and sensory-based strategies (tactile pressure with blocks), shifting from dysregulated wandering to sustained engagement and shared attention (FEDC 1 & 2). While regulation data (Goal 2) indicates high success when accommodations are present, the data for reciprocal social interactions (Goal 1) suggests the Client required significant scaffolding (moderate support) to maintain circles of communication during this session.

P (Plan):
Continue individual DIRFloortime intervention. Continue to collect and monitor data to inform the treatment plan. Monitor Client's health status and energy levels as he recovers from illness. Focus on expanding circles of communication (FEDC 3) within high-preference sensory play activities once regulation is stabilized.

**NOW GENERATE THE SOAP NOTE USING ONLY THE DATA BELOW:**

========================
SOURCE 1: CLIENT PROFILE
========================
${JSON.stringify(aiRequest.SOURCE_1_CLIENT_PROFILE, null, 2)}

========================
SOURCE 2: SESSION DATA
========================
${JSON.stringify(aiRequest.SOURCE_2_SESSION_DATA, null, 2)}

========================
SOURCE 3: PROVIDER OBSERVATIONS
========================
${JSON.stringify(aiRequest.SOURCE_3_PROVIDER_OBSERVATIONS, null, 2)}

**REMINDER: Output ONLY the JSON object, no markdown, no explanation, no extra text.**`;

    const result = await model.generateContent({
      contents: [
        {
          role: "user",
          parts: [{ text: FULL_PROMPT }],
        },
      ],
    });

    const rawText =
      result.response.candidates?.[0]?.content?.parts?.[0]?.text || "";

    if (!rawText) {
      throw new Error("Empty AI response");
    }

    console.log("🧠 RAW SOAP NOTE GENERATED:\n", rawText);

    return {
      soapNoteText: rawText.trim(),
    };
  } catch (error) {
    console.error("❌ Vertex AI error:", error);
    throw error;
  }
}


// import { GoogleAuth } from "google-auth-library";
// import * as fs from "fs";

// export async function testAuth() {
//   const keyFile =
//     "D:/vivek Sharma/revel-backend/src/aiSetup/vertex-service-account.json";
//   const credentials = JSON.parse(fs.readFileSync(keyFile, "utf-8"));

//   const auth = new GoogleAuth({
//     credentials,
//     scopes: ["https://www.googleapis.com/auth/cloud-platform"],
//   });

//   try {
//     const client = await auth.getClient();
//     const projectId = await auth.getProjectId();
//     console.log("✅ Authentication successful");
//     console.log("Project ID:", projectId);
//   } catch (err) {
//     console.error("❌ Authentication failed:", err);
//   }
// }
