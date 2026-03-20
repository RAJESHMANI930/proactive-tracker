import { initializeApp } from 'firebase/app';
import { getFirestore, collection, query, where, getDocs, updateDoc, doc } from 'firebase/firestore';

// In production, you would securely store these in Environment Variables in Vercel.
const firebaseConfig = {
  apiKey: process.env.VITE_FIREBASE_API_KEY || "AIzaSyAcr4dPTqW8LYzCp8D9dnRfda5pVSCF5_8",
  authDomain: process.env.VITE_FIREBASE_AUTH_DOMAIN || "proactive-tracker-9d693.firebaseapp.com",
  projectId: process.env.VITE_FIREBASE_PROJECT_ID || "proactive-tracker-9d693",
  storageBucket: process.env.VITE_FIREBASE_STORAGE_BUCKET || "proactive-tracker-9d693.firebasestorage.app",
  messagingSenderId: process.env.VITE_FIREBASE_MESSAGING_SENDER_ID || "988926796216",
  appId: process.env.VITE_FIREBASE_APP_ID || "1:988926796216:web:a2fe1721b84b45d607af4d"
};

const app = initializeApp(firebaseConfig);
const db = getFirestore(app);

export default async function handler(req, res) {
  if (req.method !== 'GET' && req.method !== 'POST') {
    return res.status(405).json({ error: 'Method Not Allowed' });
  }

  try {
    const tasksRef = collection(db, 'tasks');
    const nowLocal = new Date();
    // Tasks due within the next 30 minutes
    const triggerWindowEndTime = new Date(nowLocal.getTime() + 30 * 60000);
    // Ignore tasks that were due hours ago to prevent bulk spamming if the cron paused
    const triggerWindowStartTime = new Date(nowLocal.getTime() - 2 * 60 * 60000);

    // Query for tasks that are pending and haven't fired webhook yet.
    // We filter Top/High and the exact datetime in memory to avoid needing complex Firestore indexes initially.
    const q = query(
      tasksRef, 
      where('status', '==', 'Pending'),
      where('webhookFired', '==', false)
    );

    const snapshot = await getDocs(q);
    const notificationsToSend = [];
    const docsToUpdate = [];

    snapshot.forEach(document => {
      const task = document.data();
      const id = document.id;

      if (task.priority === 'Top' || task.priority === 'High') {
        if (task.deadline) {
          const deadlineDate = new Date(task.deadline.seconds * 1000);
          
          if (deadlineDate <= triggerWindowEndTime && deadlineDate >= triggerWindowStartTime) {
            notificationsToSend.push({ id, ...task });
            docsToUpdate.push(id);
          }
        }
      }
    });

    // Make.com Webhook Integration
    const MAKE_WEBHOOK_URL = process.env.MAKE_WEBHOOK_URL;
    
    if (notificationsToSend.length > 0) {
      if (MAKE_WEBHOOK_URL) {
        const payload = {
          message: `URGENT: ${notificationsToSend.length} Priority Tasks Due Soon!`,
          tasks: notificationsToSend,
          timestamp: new Date().toISOString()
        };

        const response = await fetch(MAKE_WEBHOOK_URL, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(payload)
        });

        if (!response.ok) {
           throw new Error(`Make.com webhook failed: ${response.statusText}`);
        }
      } else {
        console.log("[SIMULATION] Would trigger Make webhook for:", notificationsToSend.length, "tasks.");
      }

      // Mark tasks as webhookFired = true so they don't fire again logically.
      const successfulUpdates = [];
      for (const id of docsToUpdate) {
        await updateDoc(doc(db, 'tasks', id), { webhookFired: true });
        successfulUpdates.push(id);
      }

      return res.status(200).json({ 
        success: true, 
        message: `Fired webhook for ${notificationsToSend.length} tasks and marked them as fired.`,
        updatedTaskIds: successfulUpdates
      });
    } else {
      return res.status(200).json({ success: true, message: 'No urgent high-priority deadline tasks found in the window.' });
    }

  } catch (error) {
    console.error('Webhook Engine Error:', error);
    return res.status(500).json({ success: false, error: 'Internal Server Error' });
  }
}
