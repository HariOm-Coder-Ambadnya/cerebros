import { GoogleGenerativeAI } from '@google/generative-ai';
import dotenv from 'dotenv';
dotenv.config();

async function testChat() {
    const genAI = new GoogleGenerativeAI(process.env.GOOGLE_API_KEY, { apiVersion: 'v1' });
    try {
        const model = genAI.getGenerativeModel({ model: 'gemini-1.5-flash' });
        const result = await model.generateContent("Say hello");
        console.log("Success:", result.response.text());
    } catch (err) {
        console.error("Error using v1:", err.message);
    }
}

async function testChatBeta() {
    const genAI = new GoogleGenerativeAI(process.env.GOOGLE_API_KEY); // defaults to v1beta usually
    try {
        const model = genAI.getGenerativeModel({ model: 'gemini-1.5-flash' });
        const result = await model.generateContent("Say hello");
        console.log("Success (v1beta):", result.response.text());
    } catch (err) {
        console.error("Error using v1beta:", err.message);
    }
}

testChat().then(() => testChatBeta());
