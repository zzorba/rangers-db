import { GraphQLClient } from 'graphql-request';

import { getSdk } from './schema';

const client = new GraphQLClient(process.env.API_ENDPOINT || '', {
  headers: {
    'Content-Type': 'application/json',
    'X-Hasura-Admin-Secret': process.env.MASTER_KEY || '',
  },
});

export default getSdk(client);
