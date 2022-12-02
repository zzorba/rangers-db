import { GraphQLClient } from 'graphql-request';
import * as functions from 'firebase-functions';

import { getSdk } from './schema';

const client = new GraphQLClient(process.env.API_ENDPOINT || '', {
  headers: {
    'Content-Type': 'application/json',
    'X-Hasura-Admin-Secret': process.env.MASTER_KEY || functions.config().hasura.admin_secret,
  },
});

export default getSdk(client);
