import dotenv from 'dotenv';
dotenv.config();

console.log("GOOGLE_API_KEY exists:", !!process.env.GOOGLE_API_KEY);
console.log("GEMINI_API_KEY exists:", !!process.env.GEMINI_API_KEY);
if (process.env.GOOGLE_API_KEY === process.env.GEMINI_API_KEY) {
    console.log("They are the SAME.");
} else {
    console.log("They are DIFFERENT.");
}
