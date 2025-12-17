// scripts/migrate-tables.js
import mongoose from 'mongoose';
import Restaurant from '@/models/Restaurant';
import dbConnect from '@/lib/dbConnect';

async function migrateTables() {
  try {
    await dbConnect();
    
    const restaurants = await Restaurant.find({});
    console.log(`Found ${restaurants.length} restaurants to migrate`);
    
    for (const restaurant of restaurants) {
      // If restaurant doesn't have tables array, create it
      if (!restaurant.tables || restaurant.tables.length === 0) {
        const totalTables = restaurant.totalTables || 10;
        restaurant.tables = Array.from({ length: totalTables }, (_, i) => ({
          number: i + 1,
          chairs: 4,
          status: 'available',
          section: 'main'
        }));
        
        await restaurant.save();
        console.log(`Migrated restaurant: ${restaurant.name} with ${totalTables} tables`);
      }
    }
    
    console.log('Migration completed successfully!');
    process.exit(0);
  } catch (error) {
    console.error('Migration failed:', error);
    process.exit(1);
  }
}

migrateTables();