import { GoogleGenerativeAI } from '@google/generative-ai';
import dotenv from 'dotenv';
dotenv.config();

async function testWorkingModel() {
    const genAI = new GoogleGenerativeAI(process.env.GOOGLE_API_KEY);
    try {
        const modelStr = process.env.GEMINI_CHAT_MODEL || 'gemini-2.0-flash';
        console.log(`Final testing model: ${modelStr}...`);
        const model = genAI.getGenerativeModel({ model: modelStr });
        const result = await model.generateContent("Say 'I am working now'");
        console.log("Success:", result.response.text());
    } catch (err) {
        console.error("Test Failed: ", err.message);
    }
}

testWorkingModel();
