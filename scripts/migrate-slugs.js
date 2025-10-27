// scripts/migrate-slugs.js
import mongoose from 'mongoose';
import { config } from 'dotenv';
import Restaurant from '../models/Restaurant.js';

config();

async function migrateSlugs() {
  try {
    await mongoose.connect(process.env.MONGODB_URI);
    console.log('Connected to MongoDB');

    const restaurants = await Restaurant.find({ slug: { $exists: false } });
    console.log(`Found ${restaurants.length} restaurants without slugs`);

    for (const restaurant of restaurants) {
      let slug = restaurant.name
        .toLowerCase()
        .replace(/[^a-z0-9 -]/g, '')
        .replace(/\s+/g, '-')
        .replace(/-+/g, '-')
        .trim('-');

      // Check for duplicates and add counter if needed
      let counter = 1;
      let originalSlug = slug;
      let slugExists = await Restaurant.findOne({ slug, _id: { $ne: restaurant._id } });
      
      while (slugExists) {
        slug = `${originalSlug}-${counter}`;
        slugExists = await Restaurant.findOne({ slug, _id: { $ne: restaurant._id } });
        counter++;
      }

      restaurant.slug = slug;
      await restaurant.save();
      console.log(`Updated ${restaurant.name} with slug: ${slug}`);
    }

    console.log('Migration completed successfully');
    process.exit(0);
  } catch (error) {
    console.error('Migration failed:', error);
    process.exit(1);
  }
}

migrateSlugs();