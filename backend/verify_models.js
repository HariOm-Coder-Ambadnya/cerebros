import axios from 'axios';
import dotenv from 'dotenv';
dotenv.config();

async function check() {
    const key = process.env.GOOGLE_API_KEY;
    try {
        const url = `https://generativelanguage.googleapis.com/v1beta/models?key=${key}`;
        const response = await axios.get(url);
        const models = response.data.models.map(m => m.name.replace('models/', ''));

        console.log("--- AVAILABLE CHAT MODELS ---");
        const chatModels = response.data.models
            .filter(m => m.supportedGenerationMethods.includes('generateContent'))
            .map(m => m.name.replace('models/', ''));
        console.log(chatModels);

        if (chatModels.includes('gemini-1.5-flash')) {
            console.log("✅ gemini-1.5-flash is available.");
        } else {
            console.log("❌ gemini-1.5-flash is MISSING.");
        }
    } catch (err) {
        console.error("Error checking models:", err.message);
    }
}
check();
