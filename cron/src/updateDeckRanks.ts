import { Client } from 'pg';

async function refreshDecks() {
  const connectionString = process.env.CONNECTION_STRING;
  if (!connectionString) {
    throw new Error('No connection string!');
  }
  const client = new Client(connectionString);
  console.log('Starting update of deck ranks.');
  await client.connect();
  await client.query('REFRESH MATERIALIZED VIEW rangers.deck_rank;')
  await client.end();
  console.log('Success, time to sleep.')
}

refreshDecks();
