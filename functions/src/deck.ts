import * as functions from 'firebase-functions';


export const upgrade = functions.https.onCall((data, context) => {
  if (!context.auth || context.auth.token.moderator !== true) {
    return {
      error: 'Request not authorized. User must be a moderator to fulfill request.',
    };
  }
  const email = data.email;
  return grantModeratorRole(email).then(() => {
    return {
      success: true,
      data: {
        message: `Request fulfilled! ${email} is now a moderator.`,
      }
    };
  });
});

const hasuraEventSecret = await hasuraEventSecretF;
if (hasuraEventSecret !== event.headers['hasura-event-secret']) {
  return {
    statusCode: 403,
    body: JSON.stringify({
      message: 'Request is not authorized',
      extensions: [
        { code: 'missing_secret' },
      ],
    }),
  };
}
const body: RequestBody = JSON.parse(event.body || '{}');

const hasuraApi = process.env.HASURA_API_ENDPOINT;
const hasuraAdminSecret = await hasuraAdminSecretF;
if (!hasuraAdminSecret || !hasuraApi) {
  return {
    statusCode: 404,
    body: JSON.stringify({
      message: 'Could not reach servers at this time, please try again.',
      extensions: [
        { code: 'config_error' },
      ],
    }),
  }
}
const hasuraClient = getHasuraApi(new GraphQLClient(hasuraApi, { headers: { 'x-hasura-admin-secret': hasuraAdminSecret }}));

const userId = body.session_variables['x-hasura-user-id'];
if (!userId) {
  return {
    statusCode: 403,
    body: JSON.stringify({
      message: 'Missing x-hasura-user-id session_variable',
      extensions: [
        { code: 'auth_error' },
      ],
    }),
  };
}

try {
  await hasuraClient.removeCognitoUser({ id: userId });
  return {
    statusCode: 200,
    body: JSON.stringify({
      success: true,
    }),
  };
} catch (e: any) {
  console.error('Unknown error: ', e.message);
  return {
    statusCode: 404,
    body: JSON.stringify({
      message: `Error when trying to remove account.`,
      extensions: [
        { code: 'internal_error' },
      ],
    }),
  };
}