import { getDatabase } from './mongodb';

/**
 * Create all required indexes for the events collection
 * This should be run once during initial setup or deployment
 */
export async function setupMongoIndexes(): Promise<void> {
  try {
    const db = await getDatabase();
    const eventsCollection = db.collection('events');

    console.log('Creating MongoDB indexes...');

    // Index 1: createdAt (descending) - for date queries and cleanup
    await eventsCollection.createIndex(
      { createdAt: -1 },
      { name: 'idx_createdAt' }
    );
    console.log('✓ Created index: idx_createdAt');

    // Index 2: category - for filtering
    await eventsCollection.createIndex(
      { category: 1 },
      { name: 'idx_category' }
    );
    console.log('✓ Created index: idx_category');

    // Index 3: coords (2dsphere) - for geospatial queries
    await eventsCollection.createIndex(
      { coords: '2dsphere' },
      { name: 'idx_coords_2dsphere' }
    );
    console.log('✓ Created index: idx_coords_2dsphere');

    // Index 4: source_link (unique) - prevent duplicates
    await eventsCollection.createIndex(
      { source_link: 1 },
      { name: 'idx_source_link', unique: true }
    );
    console.log('✓ Created index: idx_source_link (unique)');

    // Compound index for common queries: category + createdAt
    await eventsCollection.createIndex(
      { category: 1, createdAt: -1 },
      { name: 'idx_category_createdAt' }
    );
    console.log('✓ Created index: idx_category_createdAt');

    console.log('All indexes created successfully!');
  } catch (error) {
    console.error('Error creating indexes:', error);
    throw error;
  }
}

/**
 * List all indexes on the events collection
 */
export async function listMongoIndexes(): Promise<void> {
  try {
    const db = await getDatabase();
    const eventsCollection = db.collection('events');

    const indexes = await eventsCollection.indexes();
    console.log('Current indexes on events collection:');
    console.log(JSON.stringify(indexes, null, 2));
  } catch (error) {
    console.error('Error listing indexes:', error);
    throw error;
  }
}

/**
 * Drop all indexes except _id (use with caution!)
 */
export async function dropMongoIndexes(): Promise<void> {
  try {
    const db = await getDatabase();
    const eventsCollection = db.collection('events');

    await eventsCollection.dropIndexes();
    console.log('All indexes dropped (except _id)');
  } catch (error) {
    console.error('Error dropping indexes:', error);
    throw error;
  }
}

// If running this file directly (for setup)
if (require.main === module) {
  setupMongoIndexes()
    .then(() => {
      console.log('Index setup complete');
      process.exit(0);
    })
    .catch((error) => {
      console.error('Index setup failed:', error);
      process.exit(1);
    });
}
