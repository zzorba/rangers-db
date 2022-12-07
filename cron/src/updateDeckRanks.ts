import { Client } from 'pg';
const connectionString = process.env.CONNECTION_STRING;

const client = new Client(connectionString);
client.connect(function(err) {
  if (err) throw err;
  client.query('REFRESH MATERIALIZED VIEW rangers.deck_rank;')
});
