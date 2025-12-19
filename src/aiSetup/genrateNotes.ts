import { GoogleGenAI } from "@google/genai";

// google gemini ai setup.
const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY });

// Single-session clinical note prompt




// Multi-session narrative report prompt
function cleanAndParseJson(rawText: string) {
  if (!rawText) {
    throw new Error("Empty AI response");
  }

  // Remove accidental code fences if model adds them
  const cleaned = rawText
    .trim()
    .replace(/^```json/i, "")
    .replace(/^```/i, "")
    .replace(/```$/i, "")
    .trim();

  try {
    return JSON.parse(cleaned);
  } catch (error) {
    console.error("❌ JSON Parse Failed");
    console.error(cleaned);
    throw new Error("AI returned invalid JSON");
  }
}




export async function generateNotesWithAi({
  clientProfile,
  sessionData,
  therapistNotes,
}) {
  try {
const prompt = `

You are a Clinical Documentation Assistant for an early intensive developmental and behavioral
intervention agency in Minnesota specializing in DIRFloortime. Your task is to synthesize three
distinct data sources into a professional, concise, and clinically accurate SOAP note for a data
collection individual treatment plan development and progress monitoring observation of the
client and their DIRFloortime provider during their individual intervention session. Source 1:
Client Profile: Contains client's interests, strengths, learning style, areas of challenge, family
context, sensory processing, communication, and safety considerations. Source 2: Session
Data: Structured progress and session data (e.g., date of session, start time, end time, duration,
session type, client, session provider, individuals present during this session, activities engaged
in, strategies used, and percentage based progress data on specific goals). Source 3:
Provider’s observations: Raw, shorthand observations and narrative from today's session and
client variables. Constraints:
Use professional clinical terminology (e.g., "Client reports" instead of "Client said").
Maintain a neutral, objective tone.
Use neuroaffirming language.
If data for a specific SOAP section is missing, do not hallucinate; simply omit or state "Not
discussed this session."
Focus heavily on the "provider’s observations, client variables, activities engaged in, and
strategies used" for the Subjective and Objective sections.
Interpret common clinical abbreviations



IMPORTANT:
- RETURN ONLY VALID JSON
- DO NOT include markdown, asterisks, numbering artifacts like [1], or commentary
- DO NOT include explanations outside the JSON object

========================
CLIENT PROFILE
========================
Name: ${clientProfile?.name || "N/A"}
Age: ${clientProfile?.age || "N/A"}
Diagnosis: ${clientProfile?.diagnosis || "N/A"}
Current FEDC Level: ${clientProfile?.currentFEDCLevel || "N/A"}

========================
SESSION INFORMATION
========================
Date: ${sessionData?.date || "N/A"}
Duration (minutes): ${sessionData?.duration || "N/A"}
Observed FEDC Level: ${sessionData?.fedcLevel || "N/A"}

========================
THERAPIST NOTES
========================
${therapistNotes || "None"}

========================
GOAL DATA
========================
${sessionData?.goals?.map((goal, index) => {
 const sl = goal.supportLevel || {};

const supportLevels = [
  sl.independent
    ? `Independent (Trials: ${sl.independent.count}, Success: ${sl.independent.success}, Missed: ${sl.independent.missed})`
    : null,
  sl.minimal
    ? `Minimal (Trials: ${sl.minimal.count}, Success: ${sl.minimal.success}, Miss: ${sl.minimal.miss})`
    : null,
  sl.modrate
    ? `Moderate (Trials: ${sl.modrate.count}, Success: ${sl.modrate.success}, Miss: ${sl.modrate.miss})`
    : null,
]
  .filter(Boolean)
  .join(" | ") || "Not recorded";


  return `
Goal Index: ${index + 1}
Goal Name: ${goal.goal || "Unnamed Goal"}
Category: ${goal.category || "N/A"}
Performance Percentage: ${goal.performance || 0}
Trials: ${goal.counter || 0}
Support Levels: ${supportLevels}
Mastery Percentage: ${goal.criteriaForMastery?.masteryPercentage || "N/A"}
Mastery Sessions: ${goal.criteriaForMastery?.acrossSession || "N/A"}
Mastery Support Level: ${goal.criteriaForMastery?.supportLevel || "N/A"}
`;
}).join("\n") || "No goals set"}

========================
CLIENT VARIABLES
========================
${sessionData?.clientVariables?.map((cv, i) =>
  `${i + 1}. ${cv.variable}: ${cv.description}`
).join("\n") || "None reported"}

========================
ACTIVITIES ENGAGED
========================
${sessionData?.activities?.join(", ") || "None"}

========================
SUPPORTS OBSERVED
========================
${sessionData?.supportsObserved?.join(", ") || "None"}

========================
PROVIDER OBSERVATION
========================
${sessionData?.providerObservation || "None"}

Please generate a professional clinical note with the following sections:

1. PRESENTATION & ENGAGEMENT: Describe how the child presented, their initial regulation state, and engagement level.

2. INTERACTIONS & AFFECT: Detail the quality of interactions, affective responses, and relational dynamics during the session.

3. FEDC OBSERVATIONS: Provide specific observations about functional emotional developmental capacities demonstrated during the session, referencing the DIR/Floortime framework.

4. plan : Outline clinical recommendations and next steps for therapy.

Important guidelines:
- Use professional, clinical language appropriate for medical documentation
- Be specific and objective
- Reference DIR/Floortime principles and FEDC levels appropriately
- Include observations from the therapist notes
- Mention goal progress where relevant
- Note any client variables that impacted the session
- Keep each section concise but comprehensive (2-4 sentences each)
- Do not include speculation or information not supported by the provided data
- Use person-first language
- Maintain HIPAA compliance - do not invent details
========================
OUTPUT FORMAT (STRICT)
========================

Return a single JSON object with EXACTLY this structure:

{
  "clientDetails": {
    "name": "",
    "age": "",
    "diagnosis": "",
    "currentFEDCLevel": {
    }
  },
  "sessionDetails": {
    "date": "",
    "durationMinutes": "",
    "observedFEDCLevel": ""
  },
  "clinicalNote": {
    "presentationAndEngagement": "",
    "interactionsAndAffect": "",
    "fedcObservations": "",
    "goalProgress": [
      {
        "goalNumber": 1,
        "goalName": "",
        "performancePercentage": "",
        "trials": 0,
        "supportLevels": {
          "independent": 0,
          "minimal": 0,
          "moderate": 0
        },
        "masteryCriteria": "",
        "clinicalInterpretation": ""
      }
    ],
    "plan": "",
    "changesInTreatmentOrDiagnosis": ""
  }
}

`;


    const response = await ai.models.generateContent({
      model: "gemini-2.5-flash",
      contents: prompt,
    });

    const rawText = response.text || "";
   const cleanedNote = cleanAndParseJson(rawText);

    // ✅ PARSE TEXT → STRUCTURED OBJECT
    // const parsedNote = parseClinicalNote(rawText);
     console.log(rawText);
     
   return cleanedNote
      
    
  } catch (error) {
    console.error("Gemini error:", error);
    throw error;
  }
}

