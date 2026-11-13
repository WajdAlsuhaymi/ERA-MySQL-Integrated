/**
 * ERA client-side READ CACHE of the MySQL backend.
 * Mutations always go through authenticated /api/era requests.
 * Browser localStorage is never the source of truth for users/bookings/activities.
 */
export type Role = 'customer' | 'provider';
export type ActivityType = 'Sport' | 'Wellness' | 'Entertainment';
export type BookingStatus = 'Confirmed' | 'Completed';
export interface User { userId:string; fullName:string; username:string; email:string; role:Role }
export interface Activity { activityId:string; providerId:string; name:string; type:ActivityType; description:string; destination:string; location:string; date:string; time:string; availableCapacity:number; image:string|null; imageAlt?:string; isDeleted:boolean }
export interface Booking { bookingId:string; customerId:string; activityId:string; status:BookingStatus; numberOfParticipants:1 }
export interface DigitalTicket { ticketId:string; bookingId:string; ticketCode?:string }
export interface DigitalActivityPassport { passportId:string; customerId:string }
export interface DigitalStamp { stampId:string; passportId:string; bookingId:string; activityId:string }
export type ActivityInput = Pick<Activity,'name'|'type'|'description'|'destination'|'location'|'date'|'time'> & {availableCapacity:string|number};
export const DEMO_CUSTOMER = { login:'customer@era.demo',password:'demo1234' };
export const DEMO_PROVIDER = { login:'provider@era.demo',password:'demo1234' };

type Snapshot = {user:User|null;users:User[];activities:Activity[];bookings:Booking[];tickets:DigitalTicket[];passports:DigitalActivityPassport[];stamps:DigitalStamp[]};
const empty = ():Snapshot => ({user:null,users:[],activities:[],bookings:[],tickets:[],passports:[],stamps:[]});
let state:Snapshot = empty();
let version=0;
let loading:Promise<void>|null=null;
let lastError:string|null=null;
const listeners=new Set<()=>void>();
function emit(){version++; listeners.forEach(l=>l());}
function applySnapshot(snapshot:Snapshot){state=snapshot;lastError=null;emit();}
export const subscribe=(l:()=>void)=>{listeners.add(l);return ()=>listeners.delete(l);};
export const getVersion=()=>version;
export const getLoadError=()=>lastError;

export async function initStore():Promise<void> {
  if (!loading) loading = (async()=>{
    try {
      const response=await fetch('/api/era',{credentials:'same-origin',cache:'no-store'});
      const body=await response.json();
      if (!response.ok || !body.ok) throw new Error(body.error||'Cannot load ERA data.');
      applySnapshot(body.snapshot);
    } catch(e){ lastError=e instanceof Error?e.message:'Cannot load database.';emit();throw e; }
  })().finally(()=>{ loading=null; });
  return loading;
}

type APIResult={ok:boolean;error?:string;errors?:Record<string,string>;snapshot?:Snapshot};
async function mutate(action:string,payload:Record<string,unknown>={}):Promise<APIResult>{
  try {
    const response=await fetch('/api/era',{method:'POST',credentials:'same-origin',headers:{'Content-Type':'application/json'},body:JSON.stringify({action,payload})});
    const body:APIResult=await response.json();
    if (body.ok && body.snapshot) applySnapshot(body.snapshot);
    return body;
  }catch(e){return {ok:false,error:e instanceof Error?e.message:'Cannot contact database.'};}
}
export const getUsers=()=>state.users;
export const getUser=(id:string)=>state.users.find(u=>u.userId===id)??null;
export const getCurrentUser=()=>state.user;
export async function login(identifier:string,password:string){
  const r=await mutate('login',{identifier,password});
  return r.ok&&state.user?{ok:true as const,data:state.user}:{ok:false as const,error:r.error||'Login failed.'};
}
export async function signup(input:{fullName:string;username:string;email:string;password:string;confirm:string;role:Role|''}){
  const r=await mutate('signup',input);
  return r.ok&&state.user?{ok:true as const,data:state.user}:{ok:false as const,errors:r.errors||{form:r.error||'Registration failed.'}};
}
export async function logout(){await mutate('logout');state=empty();emit();}
export async function updateProfile(_userId:string,info:{fullName:string;username:string;email:string}){
  const r=await mutate('updateProfile',info);
  return r.ok?{ok:true as const}:{ok:false as const,errors:r.errors||{form:r.error||'Update failed.'}};
}
export const getAllActivities=()=>state.activities;
export const getActivity=(id:string)=>state.activities.find(a=>a.activityId===id)??null;
export const getActiveActivities=()=>state.activities.filter(a=>!a.isDeleted);
export const getProviderActivities=(providerId:string)=>getActiveActivities().filter(a=>a.providerId===providerId);
export const bookedCount=(id:string)=>state.bookings.filter(b=>b.activityId===id).length;
/** MySQL stores remaining seats, and the Booking trigger decrements it once per booking. */
export const remaining=(a:Activity)=>Math.max(0,a.availableCapacity);
export async function createActivity(_providerId:string,input:ActivityInput){
  const r=await mutate('createActivity',input);
  return r.ok?{ok:true as const}:{ok:false as const,errors:r.errors||{form:r.error||'Cannot create activity.'}};
}
export async function updateActivity(_providerId:string,activityId:string,input:ActivityInput){
  const r=await mutate('updateActivity',{...input,activityId});
  return r.ok?{ok:true as const}:{ok:false as const,errors:r.errors||{form:r.error||'Cannot update activity.'}};
}
export async function softDeleteActivity(_providerId:string,activityId:string){
  const r=await mutate('deleteActivity',{activityId});
  return r.ok?{ok:true as const}:{ok:false as const,error:r.error||'Cannot delete activity.'};
}
export const getBookings=()=>state.bookings;
export const getBooking=(id:string)=>state.bookings.find(b=>b.bookingId===id)??null;
export const getCustomerBookings=(id:string)=>state.bookings.filter(b=>b.customerId===id);
export const getProviderBookings=(_id:string)=>state.bookings;
export const getTickets=()=>state.tickets;
export const getTicket=(id:string)=>state.tickets.find(t=>t.ticketId===id)??null;
export const getTicketForBooking=(id:string)=>state.tickets.find(t=>t.bookingId===id)??null;
export async function createBooking(customerId:string,activityId:string){
  const before=new Set(state.bookings.map(b=>b.bookingId));
  const r=await mutate('createBooking',{activityId});
  if (!r.ok) return {ok:false as const,error:r.error||'Cannot create booking.'};
  const booking=state.bookings.find(b=>b.customerId===customerId && b.activityId===activityId && !before.has(b.bookingId));
  const ticket=booking&&getTicketForBooking(booking.bookingId);
  if (!booking||!ticket) return {ok:false as const,error:'Booking saved, but its ticket was not found. Refresh My Bookings.'};
  return {ok:true as const,data:{booking,ticket}};
}
export const getPassports=()=>state.passports;
export function ensurePassport(customerId:string):DigitalActivityPassport{
  return state.passports.find(p=>p.customerId===customerId)??{passportId:'',customerId};
}
export const getStamps=()=>state.stamps;
export const getPassportStamps=(id:string)=>state.stamps.filter(s=>s.passportId===id);
export async function confirmCompletion(_providerId:string,bookingId:string){
  const r=await mutate('confirmCompletion',{bookingId});
  if (!r.ok) return {ok:false as const,error:r.error||'Cannot confirm completion.'};
  const stamp=state.stamps.find(s=>s.bookingId===bookingId);
  // The provider cannot see the customer's passport stamps, but the DB trigger creates it.
  return {ok:true as const,data:stamp??{stampId:'',passportId:'',bookingId,activityId:''}};
}
const MONTHS=['January','February','March','April','May','June','July','August','September','October','November','December'];
export function formatDate(d:string){const [y,m,day]=d.split('-').map(Number);return !y||!m||!day?d:`${day} ${MONTHS[m-1]} ${y}`;}
export function formatTime(t:string){const [h=NaN,m=0]=t.split(':').map(Number); if(isNaN(h))return t;return `${h%12||12}:${String(m).padStart(2,'0')} ${h>=12?'PM':'AM'}`;}
