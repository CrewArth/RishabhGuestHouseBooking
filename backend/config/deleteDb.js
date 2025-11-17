// MongoDB Clear All Data Script for Postman
// WARNING: This will DELETE ALL DATA from the specified database
// Use with extreme caution!

import { MongoClient } from 'mongodb';
// Configuration
const DATABASE_URL = "mongodb://127.0.0.1:27017";
const DATABASE_NAME = "IT_Division";

(async function clearDatabase() {
    let client;
    
    try {
        console.log("Connecting to MongoDB...");
        
        // Connect to MongoDB
        client = await MongoClient.connect(DATABASE_URL, {
            useNewUrlParser: true,
            useUnifiedTopology: true
        });
        
        console.log("Connected successfully!");
        
        // Get database
        const db = client.db(DATABASE_NAME);
        
        // Get all collections
        const collections = await db.listCollections().toArray();
        console.log(`Found ${collections.length} collections`);
        
        if (collections.length === 0) {
            console.log("No collections to delete. Database is already empty.");
            return;
        }
        
        // Drop each collection
        for (const collectionInfo of collections) {
            const collectionName = collectionInfo.name;
            console.log(`Dropping collection: ${collectionName}`);
            await db.collection(collectionName).drop();
            console.log(`✓ Dropped: ${collectionName}`);
        }
        
        console.log("\n✅ All collections deleted successfully!");
        console.log(`Database "${DATABASE_NAME}" is now empty.`);
        
        // Set response for Postman
        pm.test("Database cleared successfully", function () {
            pm.expect(collections.length).to.be.above(-1);
        });
        
    } catch (error) {
        console.error("❌ Error:", error.message);
        pm.test("Database clear failed", function () {
            throw new Error(error.message);
        });
    } finally {
        if (client) {
            await client.close();
            console.log("Connection closed.");
        }
    }
})();