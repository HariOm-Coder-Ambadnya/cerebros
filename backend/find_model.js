import { GoogleGenerativeAI } from '@google/generative-ai';
import dotenv from 'dotenv';
dotenv.config();

const modelsToTry = [
    'gemini-1.5-flash',
    'gemini-1.5-flash-latest',
    'gemini-1.5-flash-001',
    'gemini-1.5-flash-002',
    'gemini-1.5-pro',
    'gemini-pro'
];

async function findWorkingModel() {
    const genAI = new GoogleGenerativeAI(process.env.GOOGLE_API_KEY);
    for (const modelName of modelsToTry) {
        try {
            console.log(`Testing model: ${modelName}...`);
            const model = genAI.getGenerativeModel({ model: modelName });
            const result = await model.generateContent("hello");
            const text = await result.response.text();
            console.log(`✅ Success with ${modelName}: ${text.substring(0, 50).replace(/\n/g, ' ')}...`);
            // Wait a bit to avoid rate limits
            await new Promise(r => setTimeout(r, 2000));
        } catch (err) {
            console.log(`❌ Failed with ${modelName}: ${err.message}`);
        }
    }
}

findWorkingModel();
