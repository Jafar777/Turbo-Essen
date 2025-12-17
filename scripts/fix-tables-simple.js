// scripts/fix-tables-simple.js
import mongoose from 'mongoose';
import 'dotenv/config';

async function fixRestaurantTables() {
  try {
    // Connect to MongoDB
    await mongoose.connect(process.env.MONGODB_URI);
    console.log('Connected to MongoDB');
    
    // Get the restaurant collection directly
    const db = mongoose.connection.db;
    const restaurants = await db.collection('restaurants').find({}).toArray();
    
    console.log(`Found ${restaurants.length} restaurants`);
    
    let updatedCount = 0;
    
    for (const restaurant of restaurants) {
      let needsUpdate = false;
      const updateData = {};
      
      console.log(`Checking restaurant: ${restaurant.name} (ID: ${restaurant._id})`);
      
      // Check if tables array exists and is valid
      if (restaurant.tables && Array.isArray(restaurant.tables) && restaurant.tables.length > 0) {
        // Check if tables have number field
        const invalidTables = restaurant.tables.filter(table => !table.number);
        if (invalidTables.length > 0) {
          console.log(`Found ${invalidTables.length} tables without number field`);
          needsUpdate = true;
          // Fix tables by adding number field
          updateData.tables = restaurant.tables.map((table, index) => ({
            ...table,
            number: index + 1,
            chairs: table.chairs || 4,
            status: table.status || 'available',
            section: table.section || 'main'
          }));
        }
      } 
      // If no tables array but has totalTables
      else if (restaurant.totalTables) {
        console.log(`Creating tables array from totalTables: ${restaurant.totalTables}`);
        needsUpdate = true;
        updateData.tables = Array.from({ length: restaurant.totalTables }, (_, i) => ({
          number: i + 1,
          chairs: 4,
          status: 'available',
          section: 'main'
        }));
      }
      // If neither tables nor totalTables
      else {
        console.log('Creating default tables (10)');
        needsUpdate = true;
        updateData.totalTables = 10;
        updateData.tables = Array.from({ length: 10 }, (_, i) => ({
          number: i + 1,
          chairs: 4,
          status: 'available',
          section: 'main'
        }));
      }
      
      if (needsUpdate) {
        try {
          await db.collection('restaurants').updateOne(
            { _id: restaurant._id },
            { $set: updateData }
          );
          updatedCount++;
          console.log(`✓ Updated restaurant: ${restaurant.name}`);
        } catch (saveError) {
          console.error(`✗ Error updating restaurant ${restaurant.name}:`, saveError.message);
        }
      } else {
        console.log(`✓ Restaurant ${restaurant.name} already has valid tables`);
      }
    }
    
    console.log(`\nMigration completed! Updated ${updatedCount} restaurants`);
    await mongoose.disconnect();
    process.exit(0);
  } catch (error) {
    console.error('Migration failed:', error);
    await mongoose.disconnect();
    process.exit(1);
  }
}

// Execute the function
fixRestaurantTables();