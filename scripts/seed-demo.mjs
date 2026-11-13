/** Run once with: npm run seed:demo. Never deletes existing records. */
import mysql from 'mysql2/promise';
import bcrypt from 'bcryptjs';

const db = await mysql.createConnection({
  host: process.env.DB_HOST || '127.0.0.1', port: Number(process.env.DB_PORT || 3306),
  user: process.env.DB_USER, password: process.env.DB_PASSWORD,
  database: process.env.DB_NAME || 'era_db',
});
try {
  const [providers] = await db.execute("SELECT userID FROM ServiceProvider WHERE email='provider@era.demo'");
  let providerId=providers[0]?.userID;
  if (!providerId) {
    const [r] = await db.execute('INSERT INTO ServiceProvider (fullName,username,email,passwordHash) VALUES (?,?,?,?)',
      ['ERA Experiences Demo','era_provider','provider@era.demo',await bcrypt.hash('demo1234',12)]);
    providerId = r.insertId;
  }
  const [customers] = await db.execute("SELECT userID FROM Customer WHERE email='customer@era.demo'");
  if (!customers.length) await db.execute('INSERT INTO Customer (fullName,username,email,passwordHash) VALUES (?,?,?,?)',
    ['Layla Demo','layla','customer@era.demo',await bcrypt.hash('demo1234',12)]);

  const [acts] = await db.execute('SELECT COUNT(*) AS n FROM Activity');
  if (Number(acts[0].n)===0) {
    const activities = [
      ['Matcha Making Experience With So Matcha','Entertainment','Enjoy a hands-on matcha-making experience with So Matcha in the beautiful heritage setting of Al Samhaniya, Riyadh. Learn how to prepare your own matcha while exploring the charm of traditional Saudi architecture.','Riyadh, Saudi Arabia','Al Samhaniya, Riyadh, Saudi Arabia','2026-12-17','16:00',70,'/So_Matcha_Experience_Riyadh.png','Matcha preparation in a traditional Saudi courtyard at Al Samhaniya, Riyadh'],
      ['Stargazing Experience in AlUla','Wellness',"Experience the magic of AlUla's night sky with a peaceful stargazing session surrounded by breathtaking desert landscapes. Discover stars and constellations while enjoying the beauty and tranquility of nature.",'AlUla, Saudi Arabia','AlUla Desert, AlUla, Saudi Arabia','2026-11-18','20:00',30,'/Stargazing_Experience_AlUla.png','Night sky full of stars above the AlUla desert rock formations'],
      ['Rooftop Tennis Experience','Sport','Enjoy a unique rooftop tennis experience in the heart of Historic Jeddah. Play tennis on the rooftop of a traditional heritage house while taking in beautiful views of Al-Balad historic architecture, combining sports, culture, and heritage in one unforgettable experience.','Jeddah, Saudi Arabia','Al-Balad Historic District, Jeddah, Saudi Arabia','2026-12-01','17:00',20,'/Jeddah_Tennis.png','Tennis court on a heritage rooftop overlooking Al-Balad, Jeddah'],
      ['Painting Experience at the Louvre','Entertainment',"Discover your artistic side with a unique painting experience at the Louvre Museum in Paris. Get inspired by Leonardo da Vinci's iconic Mona Lisa and create your own artwork while surrounded by centuries of art, history, and culture.",'Paris, France','Louvre Museum, Paris, France','2026-11-28','11:00',15,'/Louvre_Art_Experience_Paris.png','Easel and paints inside the Louvre Museum, Paris'],
      ['Yoga & Pilates Experience with ALO','Wellness','Experience a unique yoga and Pilates session with ALO in the historic setting of the Tower of London. Enjoy mindful movement, relaxation, and wellness while surrounded by centuries of history and stunning architecture.','London, United Kingdom','Tower of London, London, United Kingdom','2026-11-30','09:00',23,'/Alo_Yoga_Experience_London.png','Yoga mats laid out before the Tower of London'],
      ['Horseback Riding at the Pyramids','Sport',"Enjoy an unforgettable horseback riding experience near the iconic Pyramids of Giza. Ride through the desert while admiring the ancient pyramids and discovering the beauty of Egypt's rich heritage.",'Giza, Greater Cairo, Egypt','Giza Pyramids, Giza, Greater Cairo, Egypt','2026-12-05','17:00',20,'/Pyramids_Equestrian_Egypt.png','Horse rider in the desert near the Pyramids of Giza'],
    ];
    for (const row of activities) await db.execute('INSERT INTO Activity (providerID, activityName,type,description,destination,location,`date`,`time`,availableCapacity,image,imageAlt) VALUES (?,?,?,?,?,?,?,?,?,?,?)',[providerId,...row]);
    console.log('Seeded 6 ERA demo experiences.');
  }
  console.log('Demo account credentials: customer@era.demo and provider@era.demo / demo1234');
  console.log('Finished without deleting any existing rows.');
} finally { await db.end(); }
