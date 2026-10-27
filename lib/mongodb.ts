import { MongoClient, Db } from "mongodb";

declare global {
  var _mongoClientPromise: Promise<MongoClient> | undefined;
}

export async function getDb(): Promise<Db> {
  const uri = process.env.MONGODB_URI;
  if (!uri) {
    throw new Error(
      "MONGODB_URI environment variable is missing. Please define MONGODB_URI in your environment."
    );
  }

  const dbName = process.env.MONGODB_DB;

  if (!globalThis._mongoClientPromise) {
    const client = new MongoClient(uri);
    globalThis._mongoClientPromise = client.connect();
  }

  const client = await globalThis._mongoClientPromise;
  return client.db(dbName || undefined);
}
