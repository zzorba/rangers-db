import * as firebaseAdmin from 'firebase-admin';
import * as functions from 'firebase-functions';

firebaseAdmin.initializeApp();

import * as admin from './admin';
import * as social from './social';
import client from './graphql/client';

exports.admin = admin;
exports.social = social;

exports.processSignUp = functions.auth.user().onCreate(async(user) => {
  try {
    const data = await client.createUser({ id: user.uid });
    const customClaims = {
      'https://hasura.io/jwt/claims': {
        'x-hasura-default-role': "rangers_user",
        'x-hasura-allowed-roles': ["rangers_user"],
        'x-hasura-user-id': user.uid,
      },
    };
    await firebaseAdmin.auth().setCustomUserClaims(user.uid, customClaims)
    return data;
  } catch (e) {
    if (e instanceof Error) {
      throw new functions.https.HttpsError('invalid-argument', e.message);
    }
    throw new functions.https.HttpsError('unknown', 'Unknown error');
  }
});

exports.processDelete = functions.auth.user().onDelete(async(user) => {
  try {
    const data = await client.deleteUser({ id: user.uid });
    return data;
  } catch (e) {
    if (e instanceof Error) {
      throw new functions.https.HttpsError('invalid-argument', e.message);
    }
    throw new functions.https.HttpsError('unknown', 'Unknown error');
  }
})