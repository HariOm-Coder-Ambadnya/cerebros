import { GoogleGenerativeAI } from '@google/generative-ai';
import dotenv from 'dotenv';
dotenv.config();

const modelsToTry = [
    'gemini-2.0-flash',
    'gemini-1.5-flash',
    'gemini-1.5-flash-8b',
    'gemini-1.5-pro'
];

async function checkLimits() {
    const genAI = new GoogleGenerativeAI(process.env.GOOGLE_API_KEY);
    for (const modelName of modelsToTry) {
        try {
            console.log(`Checking ${modelName}...`);
            const model = genAI.getGenerativeModel({ model: modelName });
            const result = await model.generateContent("test");
            console.log(`✅ ${modelName} works! Output: ${result.response.text().substring(0, 10)}`);
        } catch (err) {
            console.log(`❌ ${modelName} failed: ${err.message}`);
        }
    }
}

checkLimits();
