/**
 * ERA local demo data layer.
 * Browser-only prototype: everything persists in localStorage under `era_*` keys.
 * NOT secure authentication — replace these services with API calls in a later sprint.
 */
const matcha = "/So_Matcha_Experience_Riyadh.png";
const stars = "/Stargazing_Experience_AlUla.png";
const tennis = "/Jeddah_Tennis.png";
const louvre = "/Louvre_Art_Experience_Paris.png";
const yoga = "/Alo_Yoga_Experience_London.png";
const pyramids = "/Pyramids_Equestrian_Egypt.png";

export type Role = "customer" | "provider";
export type ActivityType = "Sport" | "Wellness" | "Entertainment";
export type BookingStatus = "Confirmed" | "Completed";

export interface User {
  userId: string;
  fullName: string;
  username: string;
  email: string;
  /** Demo-only credential representation (plain text, local prototype). */
  demoPassword: string;
  role: Role;
}
export interface Activity {
  activityId: string;
  providerId: string;
  name: string;
  type: ActivityType;
  description: string;
  destination: string;
  location: string;
  date: string; // YYYY-MM-DD
  time: string; // HH:mm local event time
  availableCapacity: number;
  image: string | null;
  imageAlt?: string;
  isDeleted: boolean;
}
export interface Booking {
  bookingId: string;
  customerId: string;
  activityId: string;
  status: BookingStatus;
  numberOfParticipants: 1;
}
export interface DigitalTicket {
  ticketId: string;
  bookingId: string;
}
export interface DigitalActivityPassport {
  passportId: string;
  customerId: string;
}
export interface DigitalStamp {
  stampId: string;
  passportId: string;
  bookingId: string;
  activityId: string;
}

const K = {
  version: "era_seed_version",
  users: "era_users",
  session: "era_session",
  activities: "era_activities",
  bookings: "era_bookings",
  tickets: "era_tickets",
  passports: "era_passports",
  stamps: "era_stamps",
};
const SEED_VERSION = "1";

export const DEMO_CUSTOMER = { login: "customer@era.demo", password: "demo1234" };
export const DEMO_PROVIDER = { login: "provider@era.demo", password: "demo1234" };

const PROVIDER_ID = "usr_provider_demo";
const CUSTOMER_ID = "usr_customer_demo";

const seedUsers: User[] = [
  { userId: CUSTOMER_ID, fullName: "Layla Demo", username: "layla", email: DEMO_CUSTOMER.login, demoPassword: DEMO_CUSTOMER.password, role: "customer" },
  { userId: PROVIDER_ID, fullName: "ERA Experiences Demo", username: "era_provider", email: DEMO_PROVIDER.login, demoPassword: DEMO_PROVIDER.password, role: "provider" },
];

const seedActivities: Activity[] = [
  { activityId: "act_riyadh_matcha", providerId: PROVIDER_ID, name: "Matcha Making Experience With So Matcha", type: "Entertainment", destination: "Riyadh, Saudi Arabia", location: "Al Samhaniya, Riyadh, Saudi Arabia", date: "2026-12-17", time: "16:00", availableCapacity: 70, image: matcha, imageAlt: "Matcha preparation in a traditional Saudi courtyard at Al Samhaniya, Riyadh", isDeleted: false,
    description: "Enjoy a hands-on matcha-making experience with So Matcha in the beautiful heritage setting of Al Samhaniya, Riyadh. Learn how to prepare your own matcha while exploring the charm of traditional Saudi architecture." },
  { activityId: "act_alula_stars", providerId: PROVIDER_ID, name: "Stargazing Experience in AlUla", type: "Wellness", destination: "AlUla, Saudi Arabia", location: "AlUla Desert, AlUla, Saudi Arabia", date: "2026-11-18", time: "20:00", availableCapacity: 30, image: stars, imageAlt: "Night sky full of stars above the AlUla desert rock formations", isDeleted: false,
    description: "Experience the magic of AlUla's night sky with a peaceful stargazing session surrounded by breathtaking desert landscapes. Discover stars and constellations while enjoying the beauty and tranquility of nature." },
  { activityId: "act_jeddah_tennis", providerId: PROVIDER_ID, name: "Rooftop Tennis Experience", type: "Sport", destination: "Jeddah, Saudi Arabia", location: "Al-Balad Historic District, Jeddah, Saudi Arabia", date: "2026-12-01", time: "17:00", availableCapacity: 20, image: tennis, imageAlt: "Tennis court on a heritage rooftop overlooking Al-Balad, Jeddah", isDeleted: false,
    description: "Enjoy a unique rooftop tennis experience in the heart of Historic Jeddah. Play tennis on the rooftop of a traditional heritage house while taking in beautiful views of Al-Balad's historic architecture, combining sports, culture, and heritage in one unforgettable experience." },
  { activityId: "act_paris_louvre", providerId: PROVIDER_ID, name: "Painting Experience at the Louvre", type: "Entertainment", destination: "Paris, France", location: "Louvre Museum, Paris, France", date: "2026-11-28", time: "11:00", availableCapacity: 15, image: louvre, imageAlt: "Easel and paints inside the Louvre Museum, Paris", isDeleted: false,
    description: "Discover your artistic side with a unique painting experience at the Louvre Museum in Paris. Get inspired by Leonardo da Vinci's iconic Mona Lisa and create your own artwork while surrounded by centuries of art, history, and culture." },
  { activityId: "act_london_yoga", providerId: PROVIDER_ID, name: "Yoga & Pilates Experience with ALO", type: "Wellness", destination: "London, United Kingdom", location: "Tower of London, London, United Kingdom", date: "2026-11-30", time: "09:00", availableCapacity: 23, image: yoga, imageAlt: "Yoga mats laid out before the Tower of London", isDeleted: false,
    description: "Experience a unique yoga and Pilates session with ALO in the historic setting of the Tower of London. Enjoy mindful movement, relaxation, and wellness while surrounded by centuries of British history and stunning architecture." },
  { activityId: "act_giza_horse", providerId: PROVIDER_ID, name: "Horseback Riding at the Pyramids", type: "Sport", destination: "Giza, Greater Cairo, Egypt", location: "Giza Pyramids, Giza, Greater Cairo, Egypt", date: "2026-12-05", time: "17:00", availableCapacity: 20, image: pyramids, imageAlt: "Horse rider in the desert near the Pyramids of Giza", isDeleted: false,
    description: "Enjoy an unforgettable horseback riding experience near the iconic Pyramids of Giza. Ride through the desert landscape while admiring the ancient pyramids and discovering the beauty of Egypt's rich history and cultural heritage." },
];

/* ---------- persistence ---------- */
const hasStorage = () => typeof window !== "undefined" && !!window.localStorage;
function read<T>(key: string, fallback: T): T {
  if (!hasStorage()) return fallback;
  try {
    const raw = localStorage.getItem(key);
    return raw ? (JSON.parse(raw) as T) : fallback;
  } catch {
    return fallback;
  }
}
function write(key: string, value: unknown) {
  localStorage.setItem(key, JSON.stringify(value));
  emit();
}

let version = 0;
const listeners = new Set<() => void>();
function emit() {
  version++;
  listeners.forEach((l) => l());
}
export function subscribe(l: () => void) {
  listeners.add(l);
  return () => listeners.delete(l);
}
export const getVersion = () => version;

export function initStore() {
  if (!hasStorage()) return;
  if (localStorage.getItem(K.version) === SEED_VERSION) return;
  localStorage.setItem(K.users, JSON.stringify(seedUsers));
  localStorage.setItem(K.activities, JSON.stringify(seedActivities));
  localStorage.setItem(K.passports, JSON.stringify([{ passportId: "psp_" + CUSTOMER_ID, customerId: CUSTOMER_ID }]));
  localStorage.setItem(K.bookings, "[]");
  localStorage.setItem(K.tickets, "[]");
  localStorage.setItem(K.stamps, "[]");
  localStorage.setItem(K.version, SEED_VERSION);
  emit();
}

const uid = (p: string) =>
  `${p}-${Date.now().toString(36).toUpperCase()}${Math.random().toString(36).slice(2, 6).toUpperCase()}`;

type Result<T> = { ok: true; data: T } | { ok: false; error: string };

/* ---------- auth ---------- */
export const getUsers = () => read<User[]>(K.users, []);
export function getCurrentUser(): User | null {
  const id = read<string | null>(K.session, null);
  return id ? getUsers().find((u) => u.userId === id) ?? null : null;
}
export function login(identifier: string, password: string): Result<User> {
  const id = identifier.trim().toLowerCase();
  const user = getUsers().find((u) => u.email.toLowerCase() === id || u.username.toLowerCase() === id);
  if (!user || user.demoPassword !== password) return { ok: false, error: "We couldn't match those details. Please check and try again." };
  write(K.session, user.userId);
  return { ok: true, data: user };
}
export function logout() {
  localStorage.removeItem(K.session);
  emit();
}
const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
export function validateProfile(p: { fullName: string; username: string; email: string }, selfId?: string) {
  const errors: Record<string, string> = {};
  if (!p.fullName.trim()) errors.fullName = "Please enter your full name.";
  if (!p.username.trim()) errors.username = "Please choose a username.";
  if (!p.email.trim()) errors.email = "Please enter your email.";
  else if (!EMAIL_RE.test(p.email.trim())) errors.email = "Please enter a valid email address.";
  const others = getUsers().filter((u) => u.userId !== selfId);
  if (!errors.username && others.some((u) => u.username.toLowerCase() === p.username.trim().toLowerCase())) errors.username = "This username is already taken.";
  if (!errors.email && others.some((u) => u.email.toLowerCase() === p.email.trim().toLowerCase())) errors.email = "An account with this email already exists.";
  return errors;
}
export function signup(input: { fullName: string; username: string; email: string; password: string; confirm: string; role: Role | "" }): Result<User> | { ok: false; errors: Record<string, string> } {
  const errors = validateProfile(input);
  if (!input.password) errors.password = "Please create a password.";
  else if (input.password.length < 6) errors.password = "Use at least 6 characters.";
  if (input.confirm !== input.password) errors.confirm = "Passwords do not match.";
  if (!input.role) errors.role = "Please choose an account type.";
  if (Object.keys(errors).length) return { ok: false, errors };
  const user: User = { userId: uid("usr"), fullName: input.fullName.trim(), username: input.username.trim(), email: input.email.trim(), demoPassword: input.password, role: input.role as Role };
  write(K.users, [...getUsers(), user]);
  if (user.role === "customer") ensurePassport(user.userId);
  write(K.session, user.userId);
  return { ok: true, data: user };
}
export function updateProfile(userId: string, p: { fullName: string; username: string; email: string }) {
  const errors = validateProfile(p, userId);
  if (Object.keys(errors).length) return { ok: false as const, errors };
  write(K.users, getUsers().map((u) => (u.userId === userId ? { ...u, fullName: p.fullName.trim(), username: p.username.trim(), email: p.email.trim() } : u)));
  return { ok: true as const };
}
export const getUser = (id: string) => getUsers().find((u) => u.userId === id) ?? null;

/* ---------- activities ---------- */
export const getAllActivities = () => read<Activity[]>(K.activities, []);
export const getActivity = (id: string) => getAllActivities().find((a) => a.activityId === id) ?? null;
export const getActiveActivities = () => getAllActivities().filter((a) => !a.isDeleted);
export const getProviderActivities = (providerId: string) => getActiveActivities().filter((a) => a.providerId === providerId);
export const bookedCount = (activityId: string) => getBookings().filter((b) => b.activityId === activityId).length;
export const remaining = (a: Activity) => Math.max(0, a.availableCapacity - bookedCount(a.activityId));

export type ActivityInput = Omit<Activity, "activityId" | "providerId" | "image" | "isDeleted" | "imageAlt" | "availableCapacity"> & { availableCapacity: string | number };
export function validateActivity(i: ActivityInput, minCapacity = 1) {
  const e: Record<string, string> = {};
  if (!i.name.trim()) e.name = "Activity name is required.";
  if (!["Sport", "Wellness", "Entertainment"].includes(i.type)) e.type = "Choose an activity type.";
  if (!i.description.trim()) e.description = "Description is required.";
  if (!i.destination.trim()) e.destination = "Destination is required.";
  if (!i.location.trim()) e.location = "Location is required.";
  if (!/^\d{4}-\d{2}-\d{2}$/.test(i.date) || isNaN(Date.parse(i.date))) e.date = "Enter a valid date.";
  if (!/^\d{2}:\d{2}$/.test(i.time)) e.time = "Enter a valid time.";
  const cap = Number(i.availableCapacity);
  if (!Number.isInteger(cap) || cap < 1) e.availableCapacity = "Capacity must be a positive whole number.";
  else if (cap < minCapacity) e.availableCapacity = `Capacity cannot be lower than the ${minCapacity} seats already booked.`;
  return e;
}
export function createActivity(providerId: string, i: ActivityInput) {
  const errors = validateActivity(i);
  if (Object.keys(errors).length) return { ok: false as const, errors };
  const a: Activity = { ...trimInput(i), activityId: uid("ACT"), providerId, image: null, isDeleted: false };
  write(K.activities, [...getAllActivities(), a]);
  return { ok: true as const, data: a };
}
function trimInput(i: ActivityInput) {
  return { name: i.name.trim(), type: i.type, description: i.description.trim(), destination: i.destination.trim(), location: i.location.trim(), date: i.date, time: i.time, availableCapacity: Number(i.availableCapacity) };
}
export function updateActivity(providerId: string, activityId: string, i: ActivityInput) {
  const a = getActivity(activityId);
  if (!a || a.isDeleted || a.providerId !== providerId) return { ok: false as const, errors: { form: "You can only edit your own activities." } };
  const errors = validateActivity(i, Math.max(1, bookedCount(activityId)));
  if (Object.keys(errors).length) return { ok: false as const, errors };
  write(K.activities, getAllActivities().map((x) => (x.activityId === activityId ? { ...x, ...trimInput(i) } : x)));
  return { ok: true as const };
}
export function softDeleteActivity(providerId: string, activityId: string) {
  const a = getActivity(activityId);
  if (!a || a.providerId !== providerId) return false;
  write(K.activities, getAllActivities().map((x) => (x.activityId === activityId ? { ...x, isDeleted: true } : x)));
  return true;
}

/* ---------- bookings & tickets ---------- */
export const getBookings = () => read<Booking[]>(K.bookings, []);
export const getBooking = (id: string) => getBookings().find((b) => b.bookingId === id) ?? null;
export const getCustomerBookings = (cid: string) => getBookings().filter((b) => b.customerId === cid).reverse();
export const getProviderBookings = (pid: string) => {
  const ids = new Set(getAllActivities().filter((a) => a.providerId === pid).map((a) => a.activityId));
  return getBookings().filter((b) => ids.has(b.activityId)).reverse();
};
export const getTickets = () => read<DigitalTicket[]>(K.tickets, []);
export const getTicket = (id: string) => getTickets().find((t) => t.ticketId === id) ?? null;
export const getTicketForBooking = (bid: string) => getTickets().find((t) => t.bookingId === bid) ?? null;

let bookingLock = false;
export function createBooking(customerId: string, activityId: string): Result<{ booking: Booking; ticket: DigitalTicket }> {
  if (bookingLock) return { ok: false, error: "Your booking is already being processed." };
  bookingLock = true;
  try {
    const user = getUser(customerId);
    if (!user || user.role !== "customer") return { ok: false, error: "Please log in with a customer account to book." };
    const a = getActivity(activityId);
    if (!a || a.isDeleted) return { ok: false, error: "This activity is no longer available." };
    if (remaining(a) < 1) return { ok: false, error: "This activity is fully booked." };
    const booking: Booking = { bookingId: uid("BK"), customerId, activityId, status: "Confirmed", numberOfParticipants: 1 };
    const ticket: DigitalTicket = { ticketId: uid("TK"), bookingId: booking.bookingId };
    write(K.bookings, [...getBookings(), booking]);
    write(K.tickets, [...getTickets(), ticket]);
    return { ok: true, data: { booking, ticket } };
  } finally {
    bookingLock = false;
  }
}

/* ---------- passport & stamps ---------- */
export const getPassports = () => read<DigitalActivityPassport[]>(K.passports, []);
export function ensurePassport(customerId: string) {
  const existing = getPassports().find((p) => p.customerId === customerId);
  if (existing) return existing;
  const p = { passportId: "psp_" + customerId, customerId };
  write(K.passports, [...getPassports(), p]);
  return p;
}
export const getStamps = () => read<DigitalStamp[]>(K.stamps, []);
export const getPassportStamps = (passportId: string) => getStamps().filter((s) => s.passportId === passportId);

export function confirmCompletion(providerId: string, bookingId: string): Result<DigitalStamp> {
  const b = getBooking(bookingId);
  if (!b) return { ok: false, error: "Booking not found." };
  const a = getActivity(b.activityId);
  if (!a || a.providerId !== providerId) return { ok: false, error: "You can only confirm bookings for your own activities." };
  const existing = getStamps().find((s) => s.bookingId === bookingId);
  if (b.status === "Completed" && existing) return { ok: false, error: "This booking is already completed." };
  write(K.bookings, getBookings().map((x) => (x.bookingId === bookingId ? { ...x, status: "Completed" as const } : x)));
  if (existing) return { ok: true, data: existing };
  const passport = ensurePassport(b.customerId);
  const stamp: DigitalStamp = { stampId: uid("ST"), passportId: passport.passportId, bookingId, activityId: a.activityId };
  write(K.stamps, [...getStamps(), stamp]);
  return { ok: true, data: stamp };
}

/* ---------- formatting (no timezone shifts) ---------- */
const MONTHS = ["January", "February", "March", "April", "May", "June", "July", "August", "September", "October", "November", "December"];
export function formatDate(d: string) {
  const [y, m, day] = d.split("-").map(Number);
  if (!y || !m || !day) return d;
  return `${day} ${MONTHS[m - 1]} ${y}`;
}
export function formatTime(t: string) {
  const [h = NaN, m = 0] = t.split(":").map(Number);
  if (isNaN(h)) return t;
  const suffix = h >= 12 ? "PM" : "AM";
  return `${h % 12 || 12}:${String(m).padStart(2, "0")} ${suffix}`;
}
