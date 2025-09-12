// Run: node scripts/setup-indexes.js
// Requires: MONGODB_URI in env and uses db name "sense_fragrances"

const { MongoClient } = require('mongodb')

async function main() {
  const uri = process.env.MONGODB_URI
  if (!uri) {
    console.error('Missing MONGODB_URI environment variable')
    process.exit(1)
  }

  const client = new MongoClient(uri, { maxPoolSize: 5 })
  await client.connect()
  const db = client.db('sense_fragrances')

  console.log('Creating indexes...')

  // Products indexes
  await db.collection('products').createIndexes([
    { key: { isActive: 1, createdAt: -1 }, name: 'products_isActive_createdAt' },
    { key: { category: 1, isActive: 1, createdAt: -1 }, name: 'products_category_isActive_createdAt' },
  ])

  // Orders indexes
  await db.collection('orders').createIndexes([
    { key: { userId: 1, createdAt: -1 }, name: 'orders_userId_createdAt' },
    { key: { createdAt: -1 }, name: 'orders_createdAt' },
    { key: { id: 1 }, name: 'orders_id', unique: true },
  ])

  console.log('Indexes created successfully')
  await client.close()
}

main().catch((err) => {
  console.error(err)
  process.exit(1)
})


