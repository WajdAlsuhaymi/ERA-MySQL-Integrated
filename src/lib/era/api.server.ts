/** ERA MySQL API. Server-only. Do not import into client components. */
import mysql, { type Pool, type PoolConnection, type RowDataPacket, type ResultSetHeader } from 'mysql2/promise';
import bcrypt from 'bcryptjs';
import { createHmac, timingSafeEqual } from 'node:crypto';

let pool: Pool | undefined;
function db() {
  if (!pool) {
    if (!process.env.DB_NAME || !process.env.DB_USER) throw new Error('Missing DB_NAME / DB_USER in .env');
    pool = mysql.createPool({
      host: process.env.DB_HOST || '127.0.0.1', port: Number(process.env.DB_PORT || 3306),
      user: process.env.DB_USER, password: process.env.DB_PASSWORD,
      database: process.env.DB_NAME, dateStrings: true,
      waitForConnections: true, connectionLimit: 10,
    });
  }
  return pool;
}
const COOKIE = 'era_session';
const ERR_LOGIN = "We couldn't match those details. Please check and try again.";
const TTL = 15 * 60 * 1000; // 15 minutes of inactivity
const sql = async (statement: string, params: unknown[] = []) => {
  const [rows] = await db().execute(statement, params);
  return rows as RowDataPacket[];
};
type Identity = { id: number; role: 'customer' | 'provider' };
const tableFor = (r: Identity['role']) => r === 'customer' ? 'Customer' : 'ServiceProvider';
const idString = (i: Identity) => `${i.role}:${i.id}`;
function sessionSecret() {
  const secret = process.env.ERA_SESSION_SECRET;
  if (!secret || secret.length < 32) throw new Error('ERA_SESSION_SECRET must be at least 32 characters long in .env');
  return secret;
}
function sign(s: string) { return createHmac('sha256', sessionSecret()).update(s).digest('hex'); }
function parseSession(request: Request): Identity | null {
  const value = request.headers.get('cookie')?.split(';').map(s => s.trim()).find(s => s.startsWith(`${COOKIE}=`))?.slice(COOKIE.length + 1);
  if (!value) return null;
  const parts = value.split('.');
  if (parts.length !== 2 || parts[1].length !== 64) return null;
  const expected = Buffer.from(sign(parts[0]), 'hex');
  const actual = Buffer.from(parts[1], 'hex');
  if (expected.length !== actual.length || !timingSafeEqual(expected, actual)) return null;
  try {
    const obj = JSON.parse(Buffer.from(parts[0], 'base64url').toString('utf8'));
    if (!['customer', 'provider'].includes(obj.role) || !Number.isSafeInteger(obj.id) || obj.id < 1 || Date.now() > obj.exp) return null;
    return { role: obj.role, id: obj.id };
  } catch { return null; }
}
function sessionCookie(who: Identity, request: Request) {
  const payload = Buffer.from(JSON.stringify({ ...who, exp: Date.now() + TTL })).toString('base64url');
  const secure = new URL(request.url).protocol === 'https:' ? '; Secure' : '';
  return `${COOKIE}=${payload}.${sign(payload)}; HttpOnly; SameSite=Strict; Path=/; Max-Age=900${secure}`;
}
function removeCookie() { return `${COOKIE}=; HttpOnly; SameSite=Strict; Path=/; Max-Age=0`; }
function json(data: unknown, status = 200, cookie?: string) {
  const headers: Record<string,string> = { 'Content-Type':'application/json; charset=utf-8', 'Cache-Control':'no-store', 'X-Content-Type-Options':'nosniff' };
  if (cookie) headers['Set-Cookie'] = cookie;
  return new Response(JSON.stringify(data), { status, headers });
}
function invalid(err: string, status = 400) { return json({ ok:false, error:err },status); }
function ownInput(value: unknown) { return value && typeof value === 'object' && !Array.isArray(value) ? value as Record<string,unknown> : {}; }
function str(v: unknown) { return typeof v === 'string' ? v.trim() : ''; }
function numberId(value: unknown) { const n = Number(value); return Number.isSafeInteger(n) && n > 0 ? n : null; }
function dataUser(row: RowDataPacket, role: Identity['role']) {
  return { userId: idString({id: Number(row.userID),role}), fullName: row.fullName, username:row.username, email:row.email, role };
}
function activityOf(a: RowDataPacket) {
  return { activityId: String(a.activityID), providerId: `provider:${a.providerID}`, name:a.activityName,
    type:a.type, description:a.description, destination:a.destination, location:a.location,
    date:String(a.date).slice(0,10), time:String(a.time).slice(0,5), availableCapacity:Number(a.availableCapacity),
    image:a.image || null, imageAlt:a.imageAlt || undefined, isDeleted:!!a.isDeleted };
}
function bookingOf(b: RowDataPacket) { return { bookingId:String(b.bookingID),customerId:`customer:${b.customerID}`, activityId:String(b.activityID),status:b.status,numberOfParticipants:1 }; }
function ticketOf(t: RowDataPacket) { return {ticketId:String(t.ticketID), bookingId:String(t.bookingID), ticketCode:t.ticketCode}; }
function stampOf(s: RowDataPacket) { return {stampId:String(s.stampID),passportId:String(s.passportID),bookingId:String(s.bookingID),activityId:String(s.activityID)}; }
function validProfile(data: Record<string, unknown>) {
  const errors: Record<string,string> = {};
  const fullName = str(data.fullName), username=str(data.username), email=str(data.email).toLowerCase();
  if (!fullName || fullName.length > 100) errors.fullName='Please enter a full name (up to 100 characters).';
  if (!username || username.length > 50) errors.username='Please enter a username (up to 50 characters).';
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email) || email.length > 255) errors.email='Please enter a valid email address.';
  return { fullName, username, email, errors };
}
function validActivity(data: Record<string,unknown>, creating: boolean) {
  const errors: Record<string,string> = {};
  const fields = ['name','description','destination','location'] as const;
  for (const field of fields) if (!str(data[field])) errors[field] = `${field} is required.`;
  if (str(data.name).length > 150) errors.name='Activity name is too long.';
  if (str(data.destination).length > 100) errors.destination='Destination is too long.';
  if (str(data.location).length > 255) errors.location='Location is too long.';
  if (!['Sport','Wellness','Entertainment'].includes(str(data.type))) errors.type='Choose an activity type.';
  const date = str(data.date), time = str(data.time);
  if (!/^\d{4}-\d\d-\d\d$/.test(date) || Number.isNaN(Date.parse(date))) errors.date='Enter a valid date.';
  if (!/^([01]\d|2[0-3]):[0-5]\d$/.test(time)) errors.time='Enter a valid time.';
  const cap = Number(data.availableCapacity);
  if (data.availableCapacity === "" || data.availableCapacity == null || !Number.isSafeInteger(cap) || cap < (creating ? 1 : 0)) errors.availableCapacity = creating ? 'Capacity must be a positive whole number.' : 'Remaining capacity must be zero or a positive whole number.';
  return { errors, values: [str(data.name),str(data.type),str(data.description),str(data.destination),str(data.location),date,time,cap] };
}
async function uniqueIdentity(conn: PoolConnection, username:string,email:string, except?:Identity) {
  for (const role of ['customer','provider'] as const) {
    const table = tableFor(role);
    const params: unknown[]=[username,email];
    let clause='';
    if (except?.role === role) { clause=' AND userID <> ?'; params.push(except.id); }
    const [rows] = await conn.execute<RowDataPacket[]>(`SELECT username,email FROM ${table} WHERE (LOWER(username)=LOWER(?) OR LOWER(email)=LOWER(?))${clause} LIMIT 1`,params);
    if (rows.length) return { field: rows[0].username.toLowerCase()===username.toLowerCase()?'username':'email' };
  }
  return null;
}
async function withIdentityLock<T>(fn: (conn:PoolConnection)=>Promise<T>) {
  const conn = await db().getConnection();
  let locked=false;
  try {
    const [rows] = await conn.query<RowDataPacket[]>("SELECT GET_LOCK('era_identity_changes', 10) AS acquired");
    if (rows[0]?.acquired !== 1) throw new Error('Identity registration is busy; try again.');
    locked=true;
    return await fn(conn);
  } finally {
    if (locked) await conn.query("SELECT RELEASE_LOCK('era_identity_changes')").catch(()=>{});
    conn.release();
  }
}
async function snapshot(who:Identity | null) {
  if (!who) return { user:null, users:[], activities:[],bookings:[],tickets:[],passports:[],stamps:[] };
  const rows = await sql(`SELECT userID,fullName,username,email FROM ${tableFor(who.role)} WHERE userID=?`,[who.id]);
  if (!rows.length) return { user:null, users:[], activities:[],bookings:[],tickets:[],passports:[],stamps:[] };
  const user = dataUser(rows[0],who.role);
  const bookings = await sql(who.role==='provider' ?
    'SELECT b.* FROM Booking b JOIN Activity a ON a.activityID=b.activityID WHERE a.providerID=? ORDER BY b.bookingID DESC' :
    'SELECT * FROM Booking WHERE customerID=? ORDER BY bookingID DESC',[who.id]);
  const acts = await sql(who.role === 'provider' ?
    'SELECT * FROM Activity WHERE isDeleted=FALSE OR providerID=? ORDER BY activityID' :
    'SELECT * FROM Activity WHERE isDeleted=FALSE OR activityID IN (SELECT activityID FROM Booking WHERE customerID=?) ORDER BY activityID',[who.id]);
  const tickets = bookings.length ? await sql(`SELECT * FROM DigitalTicket WHERE bookingID IN (${bookings.map(()=>'?').join(',')})`, bookings.map(b=>b.bookingID)) : [];
  const passport = who.role==='customer' ? await sql('SELECT * FROM DigitalActivityPassport WHERE customerID=?',[who.id]) : [];
  const stamps = who.role==='customer' ? await sql('SELECT s.*, b.activityID FROM DigitalStamp s JOIN Booking b ON s.bookingID=b.bookingID JOIN DigitalActivityPassport p ON s.passportID=p.passportID WHERE p.customerID=?',[who.id]) : [];
  const users = who.role==='provider' && bookings.length ? await sql(`SELECT userID,fullName FROM Customer WHERE userID IN (${[...new Set(bookings.map(b=>b.customerID))].map(()=>'?').join(',')})`, [...new Set(bookings.map(b=>b.customerID))]) : [];
  return { user, users:[user,...users.map(u=>({userId:`customer:${u.userID}`,fullName:u.fullName,username:'',email:'',role:'customer'}))],
    activities: acts.map(activityOf), bookings:bookings.map(bookingOf), tickets:tickets.map(ticketOf),
    passports:passport.map(p=>({passportId:String(p.passportID),customerId:`customer:${p.customerID}`})), stamps:stamps.map(stampOf) };
}
export async function handleEraGet(request:Request) {
  try {
    const who=parseSession(request);
    return json({ok:true,snapshot:await snapshot(who)},200,who?sessionCookie(who,request):undefined);
  } catch(e) { console.error('ERA snapshot error',e); return invalid('Database unavailable. Check MySQL and .env configuration.',503); }
}
export async function handleEraPost(request:Request) {
  const origin=request.headers.get('origin');
  const site=request.headers.get('sec-fetch-site');
  if (origin !== new URL(request.url).origin && site !== 'same-origin') return invalid('Cross-origin request blocked.',403);
  if (!request.headers.get('content-type')?.includes('application/json')) return invalid('Expected JSON body.',415);
  try {
    const body=ownInput(await request.json());
    const action=str(body.action), input=ownInput(body.payload);
    let who=parseSession(request);
    if (action==='logout') return json({ok:true,snapshot:await snapshot(null)},200,removeCookie());
    if (action==='login') {
      const identifier=str(input.identifier).toLowerCase(),password=String(input.password||'');
      let account: {role:Identity['role']; id:number}|null=null;
      for (const role of ['customer','provider'] as const) {
        const rs=await sql(`SELECT userID,passwordHash FROM ${tableFor(role)} WHERE LOWER(username)=? OR LOWER(email)=? LIMIT 1`,[identifier,identifier]);
        if (rs.length && await bcrypt.compare(password,rs[0].passwordHash)) {account={role,id:Number(rs[0].userID)};break;}
      }
      if (!account) return invalid(ERR_LOGIN,401);
      return json({ok:true,snapshot:await snapshot(account)},200,sessionCookie(account,request));
    }
    if (action==='signup') {
      const {fullName,username,email,errors}=validProfile(input);
      const password=String(input.password||'');
      if (password.length<8 || !/[A-Z]/.test(password) || !/[a-z]/.test(password) || !/\d/.test(password)) errors.password='Use at least 8 characters, an uppercase letter, a lowercase letter, and a number.';
      if (password!==input.confirm) errors.confirm='Passwords do not match.';
      if (!['customer','provider'].includes(str(input.role))) errors.role='Please choose an account type.';
      if (Object.keys(errors).length) return json({ok:false,errors},400);
      const role = str(input.role) as Identity['role'];
      const result = await withIdentityLock(async conn=>{
        const duplicate=await uniqueIdentity(conn,username,email);
        if (duplicate) return {ok:false as const,errors:{[duplicate.field]:`This ${duplicate.field} is already taken.`}};
        const hash=await bcrypt.hash(password,12);
        const [r]=await conn.execute<ResultSetHeader>(`INSERT INTO ${tableFor(role)} (fullName,username,email,passwordHash) VALUES (?,?,?,?)`,[fullName,username,email,hash]);
        return {ok:true as const,account:{id:r.insertId,role}};
      });
      if (!result.ok) return json(result,409);
      return json({ok:true,snapshot:await snapshot(result.account)},200,sessionCookie(result.account,request));
    }
    if (!who) return invalid('Please log in again.',401);
    const self=await sql(`SELECT userID FROM ${tableFor(who.role)} WHERE userID=?`,[who.id]);
    if (!self.length) return invalid('Please log in again.',401);
    if (action==='updateProfile') {
      const {fullName,username,email,errors}=validProfile(input);
      if (Object.keys(errors).length) return json({ok:false,errors},400);
      const result=await withIdentityLock(async conn=>{
        const duplicate=await uniqueIdentity(conn,username,email,who!);
        if (duplicate) return {ok:false as const,errors:{[duplicate.field]:`This ${duplicate.field} is already taken.`}};
        await conn.execute(`UPDATE ${tableFor(who!.role)} SET fullName=?,username=?,email=? WHERE userID=?`,[fullName,username,email,who!.id]);
        return {ok:true as const};
      });
      if (!result.ok) return json(result,409);
    } else if (action==='createActivity' || action==='updateActivity') {
      if (who.role!=='provider') return invalid('Service Provider access required.',403);
      const isNew=action==='createActivity';
      const {values,errors}=validActivity(input,isNew);
      if (Object.keys(errors).length) return json({ok:false,errors},400);
      if (isNew) {
        await db().execute('INSERT INTO Activity (providerID,activityName,type,description,destination,location,`date`,`time`,availableCapacity) VALUES (?,?,?,?,?,?,?,?,?)',[who.id,...values]);
      } else {
        const id=numberId(input.activityId);
        if (!id) return invalid('Invalid activity.',400);
        const [res] = await db().execute<ResultSetHeader>('UPDATE Activity SET activityName=?,type=?,description=?,destination=?,location=?,`date`=?,`time`=?,availableCapacity=? WHERE activityID=? AND providerID=? AND isDeleted=FALSE',[...values,id,who.id]);
        if (res.affectedRows===0) return invalid('You can only edit your own active activities.',403);
      }
    } else if (action==='deleteActivity') {
      if (who.role!=='provider') return invalid('Service Provider access required.',403);
      const id=numberId(input.activityId);
      if (!id) return invalid('Invalid activity.',400);
      const [res]=await db().execute<ResultSetHeader>('UPDATE Activity SET isDeleted=TRUE WHERE activityID=? AND providerID=? AND isDeleted=FALSE',[id,who.id]);
      if (res.affectedRows===0) return invalid('Activity not found or not yours.',404);
    } else if (action==='createBooking') {
      if (who.role!=='customer') return invalid('Customer access required.',403);
      const id=numberId(input.activityId);
      if (!id) return invalid('Invalid activity.',400);
      // Triggers atomically reserve ONE seat and create ONE ticket.
      await db().execute('INSERT INTO Booking (customerID,activityID) VALUES (?,?)',[who.id,id]);
    } else if (action==='confirmCompletion') {
      if (who.role!=='provider') return invalid('Service Provider access required.',403);
      const id=numberId(input.bookingId);
      if (!id) return invalid('Invalid booking.',400);
      const [res]=await db().execute<ResultSetHeader>(`UPDATE Booking b JOIN Activity a ON a.activityID=b.activityID SET b.status='Completed' WHERE b.bookingID=? AND a.providerID=? AND b.status='Confirmed'`,[id,who.id]);
      if (!res.affectedRows) return invalid('Booking not found, not yours, or already completed.',400);
    } else return invalid('Unknown action.',404);
    return json({ok:true,snapshot:await snapshot(who)},200,sessionCookie(who,request));
  } catch(e) {
    console.error('ERA operation error',e);
    const err=e as {errno?:number;code?:string;message?:string};
    if (err.errno===1644) return invalid(err.message || 'Operation rejected by database rules.',409);
    if (err.code==='ER_DUP_ENTRY') return invalid('That username or email is already registered.',409);
    return invalid('Database operation failed. Please check MySQL connection and server logs.',503);
  }
}
