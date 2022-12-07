import * as admin from 'firebase-admin';
import * as functions from 'firebase-functions';

async function grantModeratorRole(email: string) {
  const user = await admin.auth().getUserByEmail(email);
  if (user.customClaims && user.customClaims.moderator === true) {
    return;
  }
  return admin.auth().setCustomUserClaims(user.uid, {
    moderator: true
  });
}

export const addAdmin = functions.https.onCall((data, context) => {
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
