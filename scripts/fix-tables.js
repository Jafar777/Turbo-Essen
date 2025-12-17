// scripts/fix-tables.js
import mongoose from 'mongoose';
import Restaurant from '@/models/Restaurant';
import 'dotenv/config';

async function fixRestaurantTables() {
  try {
    // Connect to MongoDB
    await mongoose.connect(process.env.MONGODB_URI);
    console.log('Connected to MongoDB');
    
    const restaurants = await Restaurant.find({});
    console.log(`Found ${restaurants.length} restaurants`);
    
    let updatedCount = 0;
    
    for (const restaurant of restaurants) {
      let needsUpdate = false;
      
      // If restaurant has tables array but they're invalid
      if (restaurant.tables && restaurant.tables.length > 0) {
        // Fix existing tables by ensuring they have number field
        restaurant.tables = restaurant.tables.map((table, index) => {
          if (!table.number) {
            needsUpdate = true;
            return {
              ...table,
              number: index + 1,
              chairs: table.chairs || 4,
              status: table.status || 'available',
              section: table.section || 'main'
            };
          }
          return table;
        });
      }
      // If restaurant doesn't have tables array but has totalTables
      else if (restaurant.totalTables) {
        needsUpdate = true;
        // Create tables array from totalTables
        restaurant.tables = Array.from({ length: restaurant.totalTables }, (_, i) => ({
          number: i + 1,
          chairs: 4,
          status: 'available',
          section: 'main'
        }));
      }
      // If neither tables nor totalTables exists
      else {
        needsUpdate = true;
        restaurant.totalTables = 10;
        restaurant.tables = Array.from({ length: 10 }, (_, i) => ({
          number: i + 1,
          chairs: 4,
          status: 'available',
          section: 'main'
        }));
      }
      
      if (needsUpdate) {
        try {
          await restaurant.save();
          updatedCount++;
          console.log(`Fixed restaurant: ${restaurant.name}`);
        } catch (saveError) {
          console.error(`Error saving restaurant ${restaurant.name}:`, saveError.message);
        }
      }
    }
    
    console.log(`Migration completed! Updated ${updatedCount} restaurants`);
    process.exit(0);
  } catch (error) {
    console.error('Migration failed:', error);
    process.exit(1);
  }
}

fixRestaurantTables();