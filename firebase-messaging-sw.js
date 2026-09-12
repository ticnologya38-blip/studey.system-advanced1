// ══════════════════════════════════════════════════════
// firebase-messaging-sw.js
// Service Worker مسؤول عن استقبال إشعارات Firebase Cloud Messaging
// وإظهارها حتى لو المتصفح/التبويب مقفول خالص.
// لازم يفضل في نفس مجلد index.html بالظبط وبنفس الاسم ده.
// ══════════════════════════════════════════════════════
importScripts('https://www.gstatic.com/firebasejs/10.12.2/firebase-app-compat.js');
importScripts('https://www.gstatic.com/firebasejs/10.12.2/firebase-messaging-compat.js');

// لازم يكون نفس بيانات FIREBASE_CONFIG الموجودة في index.html بالظبط
firebase.initializeApp({
  apiKey: "AIzaSyA0R7MR7809tW6tGbGBxbGPF7Tvoj_gbk8",
  authDomain: "stydy-system-advanced.firebaseapp.com",
  projectId: "stydy-system-advanced",
  storageBucket: "stydy-system-advanced.firebasestorage.app",
  messagingSenderId: "107855910147",
  appId: "1:107855910147:web:09ba425666c0496fae0536"
});

const messaging = firebase.messaging();

// لما يوصل إشعار والصفحة مقفولة/في الخلفية
messaging.onBackgroundMessage(function (payload) {
  const title = (payload.notification && payload.notification.title) || '📚 تذكير مذاكرة';
  const body = (payload.notification && payload.notification.body) || 'حان وقت المذاكرة!';
  self.registration.showNotification(title, {
    body: body,
    tag: 'study-reminder' // يمنع تكرار نفس الإشعار فوق بعضه
  });
});
