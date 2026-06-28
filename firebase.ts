export const firebaseConfigTemplate = {
  apiKey: 'YOUR_FIREBASE_API_KEY',
  authDomain: 'your-project.firebaseapp.com',
  projectId: 'your-project-id',
  storageBucket: 'your-project.appspot.com',
  messagingSenderId: 'your-sender-id',
  appId: 'your-app-id',
};

export const firebaseCollections = ['users', 'products', 'orders', 'approvals', 'delivery_tasks', 'payments'];

export const firebaseAuthProviders = ['Phone OTP', 'Google', 'Facebook'];

export const firebaseSetupChecklist = [
  'Firebase console me naya project create karein',
  'Authentication providers enable karein',
  'Firestore collections banayein',
  'Cloud Messaging token app me save karein',
  'Security rules role-based access ke hisaab se likhein',
];
