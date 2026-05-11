/**
 * Service: fetchQuestions
 * -----------------------
 * Calls the Gemini API to generate interview questions for a given job title.
 * - Sends a POST request with a prompt asking for 3 thoughtful questions.
 * - Extracts the text response from the API.
 * - Splits the text into individual questions and filters out empty lines.
 *
 * @param title - The job title (e.g., "Customer Success Manager")
 * @returns An array of interview questions as strings
 */


import fetch from "node-fetch";



export const fetchQuestions = async (title: string): Promise<string[]> => {
  // Make a POST request to Gemini API with the job title prompt
  const response = await fetch(
    "https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent?key=" +
      process.env.GEMINI_API_KEY,
    {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        contents: [
          {
            parts: [
              { text: `Generate 3 thoughtful interview questions for the role: ${title}` },
            ],
          },
        ],
      }),
    }
  );

  // Parse the JSON response (Gemini returns candidates with content parts)
  const data: any = await response.json();

  // Safely extract the text from the first candidate response
  const text = data?.candidates?.[0]?.content?.parts?.[0]?.text || "";

  // Split the text into lines and filter out empty strings
  return text.split("\n").filter((q: string) => q.trim());
};

