import { MongoClient } from 'mongodb';
import dotenv from 'dotenv';
dotenv.config();

async function check() {
    const client = new MongoClient(process.env.MONGODB_URI);
    try {
        await client.connect();
        // ❌ WRONG: client.db()
        // ✅ CORRECT: Match the app's config
        const db = client.db('cerebro');
        const collection = db.collection('documents');

        const doc = await collection.findOne({});
        if (!doc) {
            console.log("❌ No documents found in database 'cerebro', collection 'documents'");
            return;
        }

        console.log("✅ Found document: ", doc.documentName);
        console.log("📏 Vector Dimension: ", doc.embedding.length);

    } catch (err) {
        console.error(err);
    } finally {
        await client.close();
    }
}

check();
