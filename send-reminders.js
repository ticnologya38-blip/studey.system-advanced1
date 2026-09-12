// ══════════════════════════════════════════════════════
// send-reminders.js
// بيشتغل كل 15 دقيقة عبر GitHub Actions (مجانًا تمامًا).
// بيفحص كل مستخدم في Firestore، ولو جه ميعاد تذكيره وماتبعتلوش
// النهارده، بيبعتله إشعار push حقيقي عن طريق Firebase Cloud Messaging
// حتى لو الموقع مقفول خالص عنده.
// ══════════════════════════════════════════════════════
const admin = require('firebase-admin');

const serviceAccount = JSON.parse(process.env.FIREBASE_SERVICE_ACCOUNT);
admin.initializeApp({ credential: admin.credential.cert(serviceAccount) });
const db = admin.firestore();

// كل المستخدمين في نفس التوقيت (مصر) بافتراض إن التطبيق ده لطلاب مصريين
function nowInCairo() {
  const fmt = new Intl.DateTimeFormat('en-GB', {
    timeZone: 'Africa/Cairo',
    hour: '2-digit', minute: '2-digit', hour12: false,
    year: 'numeric', month: '2-digit', day: '2-digit'
  });
  const parts = fmt.formatToParts(new Date());
  const get = (t) => parts.find((p) => p.type === t).value;
  return { hhmm: `${get('hour')}:${get('minute')}`, date: `${get('year')}-${get('month')}-${get('day')}` };
}

async function main() {
  const { hhmm, date } = nowInCairo();
  const snap = await db.collection('users').get();
  let sent = 0;

  const jobs = [];
  snap.forEach((doc) => {
    const u = doc.data();
    if (!u.fcmToken || !u.notifTime) return;
    if (u.fcmLastSentDate === date) return;      // اتبعتله النهارده خلاص
    if (u.notifTime > hhmm) return;                // لسه ماجاش ميعاده

    // لو فات ميعاده بأكتر من ساعة، متبعتلوش دلوقتي (يبقى فات على يومه أصلًا)
    const [nh, nm] = u.notifTime.split(':').map(Number);
    const [ch, cm] = hhmm.split(':').map(Number);
    if ((ch * 60 + cm) - (nh * 60 + nm) > 60) return;

    jobs.push(
      admin.messaging()
        .send({
          token: u.fcmToken,
          notification: {
            title: '📚 تذكير مذاكرة!',
            body: 'حان وقت المذاكرة — افتح التطبيق وشوف خطتك النهارده'
          }
        })
        .then(() => { sent++; return doc.ref.update({ fcmLastSentDate: date }); })
        .catch((err) => {
          console.error('فشل الإرسال لـ', doc.id, err.message);
          // التوكين بقى غير صالح (المستخدم مسح بيانات المتصفح أو غيّر جهاز) — نمسحه عشان منحاولش تاني
          if (err.code === 'messaging/registration-token-not-registered') {
            return doc.ref.update({ fcmToken: admin.firestore.FieldValue.delete() });
          }
        })
    );
  });

  await Promise.all(jobs);
  console.log(`تم الفحص — ${sent} إشعار اتبعت من إجمالي ${snap.size} مستخدم`);
}

main()
  .then(() => process.exit(0))
  .catch((e) => { console.error(e); process.exit(1); });
