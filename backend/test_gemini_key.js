import { GoogleGenerativeAI } from '@google/generative-ai';
import dotenv from 'dotenv';
dotenv.config();

async function testGeminiKey() {
    console.log("Testing GEMINI_API_KEY (from system env)...");
    const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);
    try {
        const model = genAI.getGenerativeModel({ model: 'gemini-1.5-flash' });
        const result = await model.generateContent("hello");
        console.log(`✅ GEMINI_API_KEY SUCCEEDED: ${result.response.text().substring(0, 20)}`);
    } catch (err) {
        console.log(`❌ GEMINI_API_KEY FAILED: ${err.message}`);
    }
}

testGeminiKey();
