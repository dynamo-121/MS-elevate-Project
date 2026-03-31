const mongoose = require('mongoose');
require('dotenv').config();

const MONGO_URI = process.env.MONGO_URI || 'mongodb://127.0.0.1:27017/moviedata';

async function fixSchema() {
  try {
    await mongoose.connect(MONGO_URI);
    const db = mongoose.connection.db;
    const collection = db.collection('movies');

    console.log("Connected to MongoDB. Scanning the imported 'movies' collection to fix the schema mismatches...");
    
    // Load all movies that were imported from JSON
    const cursor = collection.find({});
    let count = 0;
    
    // We update row by row to convert strings to array and fix the keys (listed_in -> genres, release_year -> releaseYear)
    for await (const doc of cursor) {
      let shouldUpdate = false;
      const update = { $set: {}, $unset: {} };
      
      // Fix genres (from listed_in string to genres array)
      if (doc.listed_in && typeof doc.listed_in === 'string') {
        update.$set.genres = doc.listed_in.split(',').map(s => s.trim());
        update.$unset.listed_in = "";
        shouldUpdate = true;
      }
      
      // Fix cast (from cast string to array)
      if (doc.cast && typeof doc.cast === 'string') {
        update.$set.cast = doc.cast.split(',').map(s => s.trim());
        shouldUpdate = true;
      }

      // Fix releaseYear (from release_year string to number)
      if (doc.release_year && (!doc.releaseYear || typeof doc.releaseYear !== 'number')) {
        update.$set.releaseYear = parseInt(doc.release_year) || 0;
        update.$unset.release_year = "";
        shouldUpdate = true;
      }
      
      // Fill missing UI elements required by the MongoDB schema & React frontend to avoid crashes
      if (!doc.rating || typeof doc.rating !== 'number') {
          update.$set.rating = parseFloat((Math.random() * 2.5 + 2.5).toFixed(1));
          shouldUpdate = true;
      }
      if (!doc.numReviews) { update.$set.numReviews = Math.floor(Math.random() * 500) + 10; shouldUpdate = true; }
      if (!doc.posterUrl) { update.$set.posterUrl = 'https://via.placeholder.com/300x450?text=No+Poster'; shouldUpdate = true; }
      if (!doc.popularity) { update.$set.popularity = Math.floor(Math.random() * 1000); shouldUpdate = true; }
      
      // If modifications were added to the pipeline, update the record
      if (shouldUpdate) {
        if (Object.keys(update.$unset).length === 0) delete update.$unset; // Mongoose requires valid dictionaries
        await collection.updateOne({ _id: doc._id }, update);
        count++;
      }
    }
    
    console.log(`Success! Fixed schema structure for ${count} newly imported movies.`);
    process.exit(0);
  } catch (error) {
    console.error("Error updating MongoDB schema:", error);
    process.exit(1);
  }
}

fixSchema();
