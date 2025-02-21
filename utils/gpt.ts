const { OpenAI } = require("openai");
import "dotenv/config";

// Initialize the OpenAI client with your API key
const openai = new OpenAI({
  apiKey: process.env.CHATGPT_API_TOKEN, // Replace with your actual API key
});

// Function to interact with ChatGPT
async function getChatGPTSuggestion(prompt) {
  try {
    const response = await openai.chat.completions.create({
      model: "gpt-3.5-turbo", // Select a gpt model
      messages: [
        {
          role: "user",
          content: prompt, // Pass the error message as the prompt
        },
      ],
    });

    // Return the ChatGPT response
    return response.choices[0].message.content;
  } catch (apiError) {
    console.error("Error calling ChatGPT API:", apiError);
    return "Failed to get a suggestion from ChatGPT.";
  }
}

export async function generateGPTSolution(error: string) {
  console.log("Error faced: " + error);

  // Use ChatGPT to get a suggestion for fixing the error
  const suggestion = await getChatGPTSuggestion("Fix Error: " + error);
  console.info("ChatGPT Suggestion:", suggestion);
}
