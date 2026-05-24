import { supabase } from "./supabase";
import { db } from "./db";
import { useState, useEffect, useCallback, useRef } from "react";

// ─── CONFIG ───────────────────────────────────────────────────────────────────
const CONFIG = {
  SUPABASE_URL: "https://YOUR_PROJECT_ID.supabase.co",
  SUPABASE_ANON_KEY: "YOUR_SUPABASE_ANON_KEY",
  TWILIO_ACCOUNT_SID: "YOUR_TWILIO_ACCOUNT_SID",
  TWILIO_AUTH_TOKEN: "YOUR_TWILIO_AUTH_TOKEN",
  TWILIO_WHATSAPP_FROM: "whatsapp:+14155238886",
  FIRM_NAME: "CourtDesk Nigeria",
  DEMO_LAWYER: { email:"admin@chambers.ng", password:"CourtDesk2026", name:"Adaeze Okafor", role:"lawyer" },
  DEMO_RUNNER: { email:"runner@chambers.ng", password:"Runner2026", name:"Emeka Nwosu", role:"runner" },
};

// ─── STORAGE ──────────────────────────────────────────────────────────────────
const Store = {
  async get(key) { try { const r = await window.storage.get(key); return r ? JSON.parse(r.value) : null; } catch { return null; } },
  async set(key, val) { try { await window.storage.set(key, JSON.stringify(val)); } catch {} },
};

// ─── SEED DATA ────────────────────────────────────────────────────────────────
const NIGERIAN_COURTS = ["Federal High Court – Lagos Division","Federal High Court – Abuja Division","Lagos State High Court","Rivers State High Court","Kano State High Court","National Industrial Court – Lagos","Court of Appeal – Lagos Division","Supreme Court of Nigeria","Lagos Magistrate Court","Ikeja High Court","Election Petition Tribunal"];
const MATTER_TYPES = ["Debt Recovery","Property Dispute","Employment/Labour","Criminal Defence","Commercial Litigation","Family Law","Land Dispute","Corporate Dispute","Contract Breach","Fundamental Rights"];
const RUNNER_STATUSES = ["Assigned","En Route","At Registry","At Location","Payment Made","Assessment Pending","Suit No. Generated","Judge Assigned","Filed","Process Served","Service Refused","Adjourned","Completed"];

const SEED_LAWYERS = [
  {id:1,name:"Adaeze Okafor",title:"Senior Partner (SAN)",specialization:"Commercial Litigation & Debt Recovery",cases:14,rating:4.9,email:"a.okafor@courtdesk.ng",phone:"0802-100-0001",bar:"NBA/LAG/2012/042",yearsExp:13,status:"Available"},
  {id:2,name:"Babatunde Adeyemi",title:"Partner",specialization:"Property & Land Disputes",cases:11,rating:4.8,email:"b.adeyemi@courtdesk.ng",phone:"0803-100-0002",bar:"NBA/LAG/2015/087",yearsExp:10,status:"In Court"},
  {id:3,name:"Chinyere Eze",title:"Associate",specialization:"Employment & Labour Law",cases:8,rating:4.7,email:"c.eze@courtdesk.ng",phone:"0809-100-0003",bar:"NBA/ABJ/2018/091",yearsExp:7,status:"Available"},
  {id:4,name:"Fatima Musa",title:"Junior Associate",specialization:"Family Law & Human Rights",cases:5,rating:4.6,email:"f.musa@courtdesk.ng",phone:"0706-100-0004",bar:"NBA/KAN/2021/134",yearsExp:4,status:"On Leave"},
];
const SEED_RUNNERS = [
  {id:1,name:"Emeka Nwosu",phone:"0815-222-0001",assignedMatters:3,status:"Active"},
  {id:2,name:"Sola Afolabi",phone:"0802-222-0002",assignedMatters:2,status:"Active"},
  {id:3,name:"Aminu Garba",phone:"0703-222-0003",assignedMatters:1,status:"Available"},
];
const SEED_MATTERS = [
  {id:"LAG/FHC/2025/001",title:"Zenith Bank v. Adeola Holdings",client:"Zenith Bank Plc",lawyer:"Adaeze Okafor",type:"Debt Recovery",court:"Federal High Court – Lagos Division",status:"Active",priority:"High",filed:"Jan 15, 2025",nextDate:"May 22, 2026",suitNo:"FHC/L/CS/1201/2025",judge:"Hon. Justice A. O. Bello",valueNGN:"₦45,000,000",adjournments:4,stage:"Trial",timeline:[{date:"Jan 15, 2025",event:"Writ Filed",note:"Originating processes filed at registry",status:"done"},{date:"May 22, 2026",event:"Next Hearing",note:"Cross-examination of PW1",status:"upcoming"}]},
  {id:"LAG/SHC/2025/002",title:"Ogun v. Coker Family Estate",client:"Mrs. Grace Ogun",lawyer:"Babatunde Adeyemi",type:"Land Dispute",court:"Lagos State High Court",status:"Active",priority:"High",filed:"Mar 08, 2025",nextDate:"Jun 04, 2026",suitNo:"LD/2340/2025",judge:"Hon. Justice R. T. Bada",valueNGN:"₦120,000,000",adjournments:3,stage:"Mention",timeline:[{date:"Mar 08, 2025",event:"Writ Filed",note:"Statement of claim filed",status:"done"},{date:"Jun 04, 2026",event:"Next Hearing",note:"Defence filing deadline",status:"upcoming"}]},
  {id:"ABJ/NIC/2025/003",title:"Abdullahi v. First Bank Nigeria",client:"Musa Abdullahi",lawyer:"Chinyere Eze",type:"Employment/Labour",court:"National Industrial Court – Lagos",status:"Pending",priority:"Medium",filed:"May 02, 2025",nextDate:"May 28, 2026",suitNo:"NICN/LA/330/2025",judge:"Awaiting Assignment",valueNGN:"₦8,500,000",adjournments:1,stage:"Filed",timeline:[{date:"May 02, 2025",event:"Complaint Filed",note:"Originating application filed",status:"done"},{date:"May 28, 2026",event:"First Mention",note:"Pending court schedule",status:"upcoming"}]},
  {id:"LAG/FHC/2024/004",title:"R v. Okenwa Emmanuel",client:"Okenwa Emmanuel",lawyer:"Adaeze Okafor",type:"Criminal Defence",court:"Federal High Court – Lagos Division",status:"Active",priority:"High",filed:"Nov 10, 2024",nextDate:"May 19, 2026",suitNo:"FHC/L/CR/88/2024",judge:"Hon. Justice K. C. Nwokedi",valueNGN:"₦2,500,000",adjournments:6,stage:"Trial",timeline:[{date:"Nov 10, 2024",event:"Charge Filed",note:"EFCC prosecution",status:"done"},{date:"May 19, 2026",event:"Next Hearing",note:"PW2 scheduled",status:"upcoming"}]},
];
const SEED_CLIENTS = [
  {id:1,name:"Zenith Bank Plc",email:"legal@zenithbank.com",phone:"01-460-0000",type:"Corporate",matters:2,status:"Active",since:"2022",contact:"Head, Legal Services"},
  {id:2,name:"Mrs. Grace Ogun",email:"graceogun@email.com",phone:"0803-456-7890",type:"Individual",matters:1,status:"Active",since:"2025",contact:"Direct"},
  {id:3,name:"Musa Abdullahi",email:"m.abdullahi@mail.com",phone:"0705-234-5678",type:"Individual",matters:1,status:"Active",since:"2025",contact:"Direct"},
  {id:4,name:"Okenwa Emmanuel",email:"emmaokenwa@email.com",phone:"0802-876-5432",type:"Individual",matters:1,status:"Active",since:"2024",contact:"Direct"},
];
const SEED_TASKS = [
  {id:1,matterRef:"LAG/FHC/2025/001",court:"Federal High Court – Lagos Division",instruction:"File enrolled order and collect sealing stamp from registry.",assignedTo:"Emeka Nwosu",assignedBy:"Adaeze Okafor",date:"May 10, 2026",status:"Filed",approved:true,updates:[{time:"8:02 AM",note:"Departed chambers",status:"En Route",gps:""},{time:"9:18 AM",note:"Arrived at FHC Registry",status:"At Registry",gps:"6.4541° N, 3.3947° E"},{time:"10:44 AM",note:"Assessment paid — ₦3,500",status:"Payment Made",gps:""},{time:"11:30 AM",note:"Enrolled order filed and sealed",status:"Filed",gps:""}]},
  {id:2,matterRef:"LAG/SHC/2025/002",court:"Lagos State High Court",instruction:"Serve processes on Defendant 2 — Coker family representative at Ikoyi address.",assignedTo:"Sola Afolabi",assignedBy:"Babatunde Adeyemi",date:"May 11, 2026",status:"Service Refused",approved:false,updates:[{time:"9:00 AM",note:"Left chambers for Ikoyi",status:"En Route",gps:""},{time:"10:15 AM",note:"Arrived at premises, gate refused entry",status:"At Location",gps:"6.4588° N, 3.4347° E"},{time:"10:50 AM",note:"Family rep refused to accept service — photo taken as evidence",status:"Service Refused",gps:"6.4588° N, 3.4347° E"}]},
  {id:3,matterRef:"ABJ/NIC/2025/003",court:"National Industrial Court – Lagos",instruction:"File originating application and confirm suit number with registry.",assignedTo:"Emeka Nwosu",assignedBy:"Chinyere Eze",date:"May 09, 2026",status:"Suit No. Generated",approved:false,updates:[{time:"8:30 AM",note:"Left chambers",status:"En Route",gps:""},{time:"9:50 AM",note:"Arrived NIC Registry",status:"At Registry",gps:""},{time:"11:00 AM",note:"Assessment: ₦7,200 paid",status:"Payment Made",gps:""},{time:"12:30 PM",note:"Suit No: NICN/LA/330/2025 generated",status:"Suit No. Generated",gps:""}]},
  {id:4,matterRef:"LAG/FHC/2024/004",court:"Federal High Court – Lagos Division",instruction:"Check court list and confirm whether FHC/L/CR/88/2024 is on today's cause list.",assignedTo:"Emeka Nwosu",assignedBy:"Adaeze Okafor",date:"May 13, 2026",status:"Assigned",approved:false,updates:[{time:"Now",note:"Task assigned — awaiting departure",status:"Assigned",gps:""}]},
];
const SEED_INVOICES = [
  {id:"INV-2026-041",client:"Zenith Bank Plc",matter:"Zenith Bank v. Adeola Holdings",professional:850000,filingFee:35000,transport:15000,disbursement:22000,courtRunner:12000,deposit:1000000,status:"Paid",date:"Apr 30, 2026"},
  {id:"INV-2026-042",client:"Mrs. Grace Ogun",matter:"Ogun v. Coker Family Estate",professional:500000,filingFee:18000,transport:9000,disbursement:13500,courtRunner:8000,deposit:600000,status:"Pending",date:"May 01, 2026"},
  {id:"INV-2026-043",client:"Musa Abdullahi",matter:"Abdullahi v. First Bank Nigeria",professional:200000,filingFee:7200,transport:4500,disbursement:5000,courtRunner:3500,deposit:250000,status:"Overdue",date:"Apr 01, 2026"},
  {id:"INV-2026-044",client:"Okenwa Emmanuel",matter:"R v. Okenwa Emmanuel",professional:750000,filingFee:0,transport:18000,disbursement:10000,courtRunner:15000,deposit:800000,status:"Paid",date:"May 05, 2026"},
];
const SEED_PROOFS = [
  {id:1,type:"Filing Receipt",name:"FHC_LA_CS1201_FilingReceipt.pdf",matter:"LAG/FHC/2025/001",date:"Jan 15, 2025",size:"0.4 MB",by:"Emeka Nwosu"},
  {id:2,type:"Court Stamp",name:"FHC_EnrolledOrder_Sealed.pdf",matter:"LAG/FHC/2025/001",date:"May 10, 2026",size:"0.8 MB",by:"Emeka Nwosu"},
  {id:3,type:"Proof of Service",name:"LD2340_ServiceAffidavit.pdf",matter:"LAG/SHC/2025/002",date:"Apr 01, 2025",size:"0.5 MB",by:"Sola Afolabi"},
  {id:4,type:"Service Refused Photo",name:"Coker_ServiceRefused_photo.jpg",matter:"LAG/SHC/2025/002",date:"May 11, 2026",size:"1.2 MB",by:"Sola Afolabi"},
];

// ─── HELPERS ──────────────────────────────────────────────────────────────────
const fmtNGN = n => `₦${Number(n||0).toLocaleString("en-NG")}`;
const sc = s => ({
  Active:"#2ecc71",Pending:"#f39c12",Closed:"#6b7280",Overdue:"#e74c3c",Paid:"#2ecc71",
  Available:"#2ecc71","In Court":"#f39c12","On Leave":"#6b7280",High:"#e74c3c",Medium:"#f39c12",Low:"#2ecc71",
  Filed:"#2ecc71","En Route":"#3498db","At Registry":"#f39c12","At Location":"#e67e22",
  "Payment Made":"#9b59b6","Suit No. Generated":"#1abc9c","Process Served":"#2ecc71",
  "Service Refused":"#e74c3c",Adjourned:"#e67e22",Completed:"#2ecc71",Assigned:"#3498db",
  "Assessment Pending":"#e67e22","Judge Assigned":"#1abc9c",Corporate:"#3498db",Individual:"#8e44ad",
  Inactive:"#6b7280",
}[s]||"#6b7280");
const stageC = s => ({Filed:"#3498db",Mention:"#f39c12",Trial:"#e74c3c",Judgment:"#2ecc71",Appeal:"#9b59b6"}[s]||"#3498db");
const proofIcon = {"Filing Receipt":"🧾","Court Stamp":"📮","Proof of Service":"✅","Service Refused Photo":"📸","Assessment Slip":"📋","Payment Receipt":"💳","Affidavit":"📜","Hearing Notice":"📣","Exhibit":"🗂"};
const isMobile = () => window.innerWidth < 768;

// ─── PERSISTENT STATE HOOK ────────────────────────────────────────────────────
function useSupabaseData(table, seed) {
  const [data, setData] = useState(seed);
  const [loaded, setLoaded] = useState(false);

  useEffect(() => {
    if (!db[table]) { setLoaded(true); return; }
    db[table].getAll()
      .then(rows => {
        if (rows && rows.length > 0) setData(rows);
        setLoaded(true);
      })
      .catch(() => setLoaded(true));
  }, [table]);

  const update = useCallback(async (val) => {
    const next = typeof val === "function" ? val(data) : val;
    setData(next);
  }, [data]);

  return [data, update, loaded];
}

// ─── UI PRIMITIVES ────────────────────────────────────────────────────────────
function Badge({label,color}){return <span style={{background:`${color}22`,color,border:`1px solid ${color}44`,borderRadius:20,padding:"3px 10px",fontSize:11,fontWeight:600,letterSpacing:0.5,whiteSpace:"nowrap"}}>{label}</span>;}
function Pill({label,active,onClick}){return <button onClick={onClick} style={{background:active?"#1a3a20":"#0a1e34",border:`1px solid ${active?"#2ecc71":"#1e3a5a"}`,borderRadius:8,padding:"8px 16px",color:active?"#2ecc71":"#7a9ab8",cursor:"pointer",fontSize:12,fontWeight:600}}>{label}</button>;}
function StatCard({label,value,sub,accent="#c9a84c"}){return(<div style={{background:"#0a1e34",border:`1px solid ${accent}22`,borderRadius:12,padding:"20px 22px",flex:1,minWidth:140,position:"relative",overflow:"hidden"}}><div style={{position:"absolute",top:0,right:0,width:56,height:56,background:`${accent}0d`,borderRadius:"0 0 0 56px"}} /><div style={{fontSize:24,fontWeight:700,color:accent,fontFamily:"'Playfair Display',Georgia,serif"}}>{value}</div><div style={{fontSize:12,color:"#5a7a9a",marginTop:4}}>{label}</div>{sub&&<div style={{fontSize:11,color:"#3a6a4a",marginTop:3}}>{sub}</div>}</div>);}
function Modal({title,onClose,children,wide}){return(<div style={{position:"fixed",inset:0,background:"#000000bb",zIndex:1000,display:"flex",alignItems:"center",justifyContent:"center",padding:16}} onClick={onClose}><div style={{background:"#060f1e",border:"1px solid #c9a84c33",borderRadius:16,padding:26,width:wide?"700px":"490px",maxWidth:"96%",maxHeight:"88vh",overflowY:"auto",boxShadow:"0 40px 100px #000c"}} onClick={e=>e.stopPropagation()}><div style={{display:"flex",justifyContent:"space-between",alignItems:"center",marginBottom:20}}><h2 style={{margin:0,color:"#c9a84c",fontFamily:"'Playfair Display',Georgia,serif",fontSize:18}}>{title}</h2><button onClick={onClose} style={{background:"none",border:"none",color:"#6a8aaa",fontSize:22,cursor:"pointer",lineHeight:1}}>×</button></div>{children}</div></div>);}
function FI({label,placeholder,value,onChange,type="text"}){return(<div style={{marginBottom:13}}><label style={{display:"block",color:"#5a7a9a",fontSize:11,marginBottom:5,letterSpacing:0.5}}>{label.toUpperCase()}</label><input type={type} placeholder={placeholder} value={value} onChange={onChange} style={{width:"100%",background:"#0d1f35",border:"1px solid #1e3a5a",borderRadius:8,padding:"10px 13px",color:"#e8dcc8",fontSize:13,outline:"none",boxSizing:"border-box"}} /></div>);}
function FS({label,options,value,onChange}){return(<div style={{marginBottom:13}}><label style={{display:"block",color:"#5a7a9a",fontSize:11,marginBottom:5,letterSpacing:0.5}}>{label.toUpperCase()}</label><select value={value} onChange={onChange} style={{width:"100%",background:"#0d1f35",border:"1px solid #1e3a5a",borderRadius:8,padding:"10px 13px",color:"#e8dcc8",fontSize:13,outline:"none"}}>{options.map(o=><option key={o} value={o}>{o}</option>)}</select></div>);}
function GoldBtn({onClick,children,full,secondary,disabled,loading}){return(<button onClick={onClick} disabled={disabled||loading} style={{width:full?"100%":"auto",background:secondary?"transparent":"#c9a84c",border:secondary?"1px solid #c9a84c44":"none",borderRadius:8,padding:"11px 20px",color:secondary?"#c9a84c":"#0a1628",fontWeight:700,cursor:disabled||loading?"not-allowed":"pointer",fontSize:13,marginTop:full?8:0,opacity:disabled||loading?0.55:1}}>{loading?"Please wait…":children}</button>);}

// ─────────────────────────────────────────────────────────────────────────────
//  PWA INSTALL BANNER
// ─────────────────────────────────────────────────────────────────────────────
function PWAInstallBanner() {
  const [prompt, setPrompt] = useState(null);
  const [dismissed, setDismissed] = useState(false);
  const [installed, setInstalled] = useState(false);

  useEffect(() => {
    const handler = e => { e.preventDefault(); setPrompt(e); };
    window.addEventListener("beforeinstallprompt", handler);
    window.addEventListener("appinstalled", () => setInstalled(true));
    return () => window.removeEventListener("beforeinstallprompt", handler);
  }, []);

  if (!prompt || dismissed || installed) return null;

  const install = async () => {
    prompt.prompt();
    const { outcome } = await prompt.userChoice;
    if (outcome === "accepted") setInstalled(true);
    setPrompt(null);
  };

  return (
    <div style={{background:"linear-gradient(90deg,#0a2a1a,#0d3020)",borderBottom:"1px solid #2ecc7133",padding:"10px 20px",display:"flex",justifyContent:"space-between",alignItems:"center",gap:12,flexWrap:"wrap"}}>
      <div style={{display:"flex",gap:12,alignItems:"center"}}>
        <div style={{width:32,height:32,borderRadius:9,background:"linear-gradient(135deg,#c9a84c,#8a6020)",display:"flex",alignItems:"center",justifyContent:"center",fontSize:16,flexShrink:0}}>⚖</div>
        <div>
          <div style={{color:"#e8dcc8",fontSize:13,fontWeight:700}}>Install CourtDesk Nigeria</div>
          <div style={{color:"#3a6a4a",fontSize:12}}>Add to home screen for quick access — works offline too</div>
        </div>
      </div>
      <div style={{display:"flex",gap:8}}>
        <button onClick={install} style={{background:"#2ecc71",border:"none",borderRadius:7,padding:"8px 18px",color:"#0a1628",fontWeight:700,cursor:"pointer",fontSize:13}}>Install App</button>
        <button onClick={()=>setDismissed(true)} style={{background:"transparent",border:"1px solid #2ecc7133",borderRadius:7,padding:"8px 12px",color:"#3a6a4a",cursor:"pointer",fontSize:13}}>Later</button>
      </div>
    </div>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
//  OFFLINE INDICATOR
// ─────────────────────────────────────────────────────────────────────────────
function OfflineBar() {
  const [online, setOnline] = useState(navigator.onLine);
  useEffect(() => {
    const on = () => setOnline(true);
    const off = () => setOnline(false);
    window.addEventListener("online", on);
    window.addEventListener("offline", off);
    return () => { window.removeEventListener("online",on); window.removeEventListener("offline",off); };
  }, []);
  if (online) return null;
  return (
    <div style={{background:"#2a0a0a",borderBottom:"1px solid #e74c3c44",padding:"8px 20px",textAlign:"center",color:"#e74c3c",fontSize:13,fontWeight:600}}>
      ⚠ You are offline — changes will sync when connection is restored
    </div>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
//  LOGIN SCREEN — role selector
// ─────────────────────────────────────────────────────────────────────────────
function LoginScreen({onLogin}) {
  const [role, setRole] = useState("lawyer");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPass, setShowPass] = useState(false);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  const demo = role==="lawyer" ? CONFIG.DEMO_LAWYER : CONFIG.DEMO_RUNNER;

  const handleLogin = async () => {
  setError(""); setLoading(true);
  try {
    // Try Supabase Auth first
    const { data, error } = await supabase.auth.signInWithPassword({
      email,
      password,
    });
    if (error) throw error;
    const role = email.includes("runner") ? "runner" : "lawyer";
    onLogin({
      email: data.user.email,
      name: data.user.user_metadata?.name || email,
      role,
    });
  } catch (err) {
    // Fall back to demo credentials
    if (email===CONFIG.DEMO_LAWYER.email && 
        password===CONFIG.DEMO_LAWYER.password) {
      onLogin(CONFIG.DEMO_LAWYER); setLoading(false); return;
    }
    if (email===CONFIG.DEMO_RUNNER.email && 
        password===CONFIG.DEMO_RUNNER.password) {
      onLogin(CONFIG.DEMO_RUNNER); setLoading(false); return;
    }
    setError("Invalid email or password. Please try again.");
  }
  setLoading(false);
};

  return (
    <div style={{minHeight:"100vh",background:"#040c18",display:"flex",fontFamily:"Georgia,serif"}}>
      {/* Left branding panel */}
      <div style={{flex:1,background:"linear-gradient(160deg,#060f1e,#0a1628 60%)",display:"flex",flexDirection:"column",justifyContent:"center",padding:"60px 64px",position:"relative",overflow:"hidden"}}>
        <div style={{position:"absolute",top:-80,left:-80,width:320,height:320,borderRadius:"50%",border:"1px solid #c9a84c12"}} />
        <div style={{position:"absolute",bottom:-100,right:-60,width:400,height:400,borderRadius:"50%",border:"1px solid #c9a84c0a"}} />
        <div style={{position:"relative"}}>
          <div style={{display:"flex",alignItems:"center",gap:14,marginBottom:48}}>
            <div style={{width:48,height:48,borderRadius:14,background:"linear-gradient(135deg,#c9a84c,#8a6020)",display:"flex",alignItems:"center",justifyContent:"center",fontSize:24}}>⚖</div>
            <div><div style={{color:"#e8dcc8",fontFamily:"'Playfair Display',Georgia,serif",fontSize:22,fontWeight:700}}>CourtDesk</div><div style={{color:"#2ecc71",fontSize:11,letterSpacing:2}}>NIGERIA</div></div>
          </div>
          <h1 style={{fontFamily:"'Playfair Display',Georgia,serif",fontSize:36,color:"#e8dcc8",margin:"0 0 16px",lineHeight:1.25,maxWidth:420}}>
            The litigation CMS built for <em style={{color:"#c9a84c"}}>Nigerian</em> law firms
          </h1>
          <p style={{color:"#3a5a7a",fontSize:15,lineHeight:1.8,maxWidth:380,margin:"0 0 40px"}}>
            Track matters, registry filings, court runners, client updates and billing — from one dashboard that works even offline.
          </p>
          {[["🏃","Court Runner Workflow — Mobile-optimised","Assign, track and approve every registry visit in real time"],["📲","WhatsApp Client Updates","One-click professional updates via WhatsApp & SMS"],["🗄","Filing & Proof Vault","Never lose a receipt, affidavit or court stamp again"],["📱","Progressive Web App","Install on any phone or desktop — works offline too"]].map(([icon,title,desc])=>(
            <div key={title} style={{display:"flex",gap:13,marginBottom:16,alignItems:"flex-start"}}>
              <div style={{width:34,height:34,borderRadius:9,background:"#c9a84c12",border:"1px solid #c9a84c22",display:"flex",alignItems:"center",justifyContent:"center",fontSize:16,flexShrink:0}}>{icon}</div>
              <div><div style={{color:"#c9a84c",fontSize:13,fontWeight:700,marginBottom:1}}>{title}</div><div style={{color:"#2a4a6a",fontSize:12}}>{desc}</div></div>
            </div>
          ))}
        </div>
      </div>

      {/* Right login panel */}
      <div style={{width:440,background:"#060f1e",display:"flex",flexDirection:"column",justifyContent:"center",padding:"60px 44px",borderLeft:"1px solid #0e2030"}}>
        <h2 style={{fontFamily:"'Playfair Display',Georgia,serif",fontSize:24,color:"#e8dcc8",margin:"0 0 6px"}}>Sign In</h2>
        <p style={{color:"#2a4a6a",fontSize:13,margin:"0 0 28px"}}>Nigerian Chambers Management System</p>

        {/* Role selector */}
        <div style={{display:"flex",gap:8,marginBottom:24}}>
          {[["lawyer","💼 Lawyer / Admin"],["runner","🏃 Court Runner"]].map(([r,label])=>(
            <button key={r} onClick={()=>{setRole(r);setEmail("");setPassword("");}}
              style={{flex:1,background:role===r?"#c9a84c18":"#0a1628",border:`2px solid ${role===r?"#c9a84c":"#1e3a5a"}`,borderRadius:10,padding:"12px 8px",color:role===r?"#c9a84c":"#3a5a7a",cursor:"pointer",fontSize:13,fontWeight:role===r?700:400,transition:"all 0.15s"}}>
              {label}
            </button>
          ))}
        </div>

        <div style={{marginBottom:14}}>
          <label style={{display:"block",color:"#5a7a9a",fontSize:11,marginBottom:5,letterSpacing:0.5}}>EMAIL</label>
          <input type="email" value={email} onChange={e=>setEmail(e.target.value)} placeholder={demo.email}
            onKeyDown={e=>e.key==="Enter"&&handleLogin()}
            style={{width:"100%",background:"#0a1628",border:"1px solid #1e3a5a",borderRadius:10,padding:"13px 16px",color:"#e8dcc8",fontSize:14,outline:"none",boxSizing:"border-box"}} />
        </div>
        <div style={{marginBottom:8,position:"relative"}}>
          <label style={{display:"block",color:"#5a7a9a",fontSize:11,marginBottom:5,letterSpacing:0.5}}>PASSWORD</label>
          <input type={showPass?"text":"password"} value={password} onChange={e=>setPassword(e.target.value)} placeholder="••••••••"
            onKeyDown={e=>e.key==="Enter"&&handleLogin()}
            style={{width:"100%",background:"#0a1628",border:"1px solid #1e3a5a",borderRadius:10,padding:"13px 44px 13px 16px",color:"#e8dcc8",fontSize:14,outline:"none",boxSizing:"border-box"}} />
          <button onClick={()=>setShowPass(!showPass)} style={{position:"absolute",right:14,bottom:13,background:"none",border:"none",color:"#4a6a8a",cursor:"pointer",fontSize:12}}>{showPass?"Hide":"Show"}</button>
        </div>
        {error && <div style={{background:"#200a0a",border:"1px solid #e74c3c44",borderRadius:8,padding:"10px 14px",color:"#e74c3c",fontSize:13,marginBottom:14}}>⚠ {error}</div>}
        <button onClick={handleLogin} disabled={loading||!email||!password}
          style={{width:"100%",background:loading?"#8a7030":"#c9a84c",border:"none",borderRadius:10,padding:"14px",color:"#0a1628",fontWeight:700,cursor:loading||!email||!password?"not-allowed":"pointer",fontSize:15,marginBottom:22,opacity:!email||!password?0.5:1}}>
          {loading?"Signing in…":role==="runner"?"Sign In as Court Runner":"Sign In to Dashboard"}
        </button>

        {/* Demo creds */}
        <div style={{background:"#0a1e34",border:"1px solid #1e3a5a",borderRadius:10,padding:"14px 16px"}}>
          <div style={{color:"#c9a84c",fontSize:11,fontWeight:700,letterSpacing:0.5,marginBottom:8}}>DEMO — {role==="lawyer"?"LAWYER / ADMIN":"COURT RUNNER"}</div>
          {[["Email",demo.email],["Password",demo.password]].map(([k,v])=>(
            <div key={k} style={{display:"flex",justifyContent:"space-between",alignItems:"center",marginBottom:4}}>
              <span style={{color:"#3a5a7a",fontSize:12}}>{k}</span>
              <button onClick={()=>k==="Email"?setEmail(v):setPassword(v)} style={{background:"none",border:"none",color:"#7a9ab8",fontSize:12,cursor:"pointer",fontFamily:"monospace"}}>{v}</button>
            </div>
          ))}
          <div style={{color:"#1a3a2a",fontSize:11,marginTop:6}}>Click values to auto-fill</div>
        </div>
        <p style={{color:"#1a2a3a",fontSize:11,textAlign:"center",marginTop:28}}>© 2026 CourtDesk Nigeria</p>
      </div>
    </div>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
//  MOBILE COURT RUNNER APP
// ─────────────────────────────────────────────────────────────────────────────
function MobileRunnerApp({user, tasks, setTasks, onLogout}) {
  const [tab, setTab] = useState("tasks");
  const [expanded, setExpanded] = useState(null);
  const [showUpdate, setShowUpdate] = useState(null);
  const [updateNote, setUpdateNote] = useState("");
  const [updateStatus, setUpdateStatus] = useState("En Route");
  const [gpsLoading, setGpsLoading] = useState(false);
  const [gpsCoords, setGpsCoords] = useState("");
  const [photoName, setPhotoName] = useState("");
  const [posting, setPosting] = useState(false);
  const [online, setOnline] = useState(navigator.onLine);
  const fileRef = useRef();

  useEffect(() => {
    const on = () => setOnline(true);
    const off = () => setOnline(false);
    window.addEventListener("online",on);
    window.addEventListener("offline",off);
    return () => { window.removeEventListener("online",on); window.removeEventListener("offline",off); };
  }, []);

  const myTasks = tasks.filter(t => t.assignedTo === user.name);

  const getGPS = () => {
    setGpsLoading(true);
    if (!navigator.geolocation) { setGpsCoords("GPS not supported"); setGpsLoading(false); return; }
    navigator.geolocation.getCurrentPosition(
      pos => { setGpsCoords(`${pos.coords.latitude.toFixed(4)}° N, ${pos.coords.longitude.toFixed(4)}° E`); setGpsLoading(false); },
      () => { setGpsCoords("Location unavailable — check permissions"); setGpsLoading(false); }
    );
  };

  const postUpdate = async (taskId) => {
    if(!updateNote.trim()) return;
    setPosting(true);
    await new Promise(r=>setTimeout(r,600));
    const timeStr = new Date().toLocaleTimeString("en-NG",{hour:"2-digit",minute:"2-digit"});
    await setTasks(prev=>prev.map(t=>t.id!==taskId?t:{...t,status:updateStatus,updates:[...t.updates,{time:timeStr,note:updateNote+(photoName?` [📎 ${photoName}]`:"")+( gpsCoords?` 📍 ${gpsCoords}`:""),status:updateStatus,gps:gpsCoords}]}));
    setShowUpdate(null); setUpdateNote(""); setGpsCoords(""); setPhotoName(""); setPosting(false);
  };

  const statusGroups = [
    {label:"Moving",items:["En Route","At Registry","At Location"],color:"#3498db"},
    {label:"Progress",items:["Payment Made","Assessment Pending","Suit No. Generated","Judge Assigned"],color:"#9b59b6"},
    {label:"Completed",items:["Filed","Process Served","Completed"],color:"#2ecc71"},
    {label:"Issues",items:["Service Refused","Adjourned"],color:"#e74c3c"},
  ];

  const S = { // mobile styles
    screen: {minHeight:"100vh",background:"#030b14",fontFamily:"Georgia,serif",color:"#e8dcc8",paddingBottom:70},
    topbar: {background:"#040e1a",borderBottom:"1px solid #0e2030",padding:"14px 16px",display:"flex",justifyContent:"space-between",alignItems:"center",position:"sticky",top:0,zIndex:100},
    card: {background:"#0a1e34",border:"1px solid #1e3a5a",borderRadius:14,margin:"12px 14px",overflow:"hidden"},
    cardHead: {padding:"14px 16px",cursor:"pointer"},
    cardBody: {borderTop:"1px solid #1e3a5a",padding:"14px 16px"},
    bottomNav: {position:"fixed",bottom:0,left:0,right:0,background:"#040e1a",borderTop:"1px solid #0e2030",display:"flex",height:60},
    navBtn: (active) => ({flex:1,background:"none",border:"none",color:active?"#2ecc71":"#2a4a6a",cursor:"pointer",display:"flex",flexDirection:"column",alignItems:"center",justifyContent:"center",gap:3,fontSize:10,fontWeight:active?700:400}),
    bigBtn: (color) => ({width:"100%",background:color,border:"none",borderRadius:10,padding:"15px",color:"#fff",fontWeight:700,fontSize:16,cursor:"pointer",marginBottom:10}),
    statusBtn: (color,selected) => ({flex:1,minWidth:"45%",background:selected?`${color}33`:"#0a1628",border:`2px solid ${selected?color:"#1e3a5a"}`,borderRadius:10,padding:"10px 8px",color:selected?color:"#3a5a7a",cursor:"pointer",fontSize:12,fontWeight:selected?700:400,textAlign:"center",marginBottom:8}),
    sheet: {position:"fixed",bottom:0,left:0,right:0,background:"#040e1a",border:"1px solid #1e3a5a",borderRadius:"20px 20px 0 0",padding:"20px 16px 80px",zIndex:200,maxHeight:"80vh",overflowY:"auto"},
  };

  return (
    <div style={S.screen}>
      {/* Top Bar */}
      <div style={S.topbar}>
        <div style={{display:"flex",alignItems:"center",gap:10}}>
          <div style={{width:32,height:32,borderRadius:9,background:"linear-gradient(135deg,#c9a84c,#8a6020)",display:"flex",alignItems:"center",justifyContent:"center",fontSize:16}}>⚖</div>
          <div>
            <div style={{color:"#e8dcc8",fontSize:14,fontWeight:700}}>CourtDesk</div>
            <div style={{color:"#2ecc71",fontSize:10,letterSpacing:1}}>COURT RUNNER</div>
          </div>
        </div>
        <div style={{display:"flex",alignItems:"center",gap:10}}>
          <div style={{display:"flex",alignItems:"center",gap:5}}>
            <div style={{width:7,height:7,borderRadius:"50%",background:online?"#2ecc71":"#e74c3c",boxShadow:online?"0 0 6px #2ecc71":"none"}} />
            <span style={{color:online?"#2ecc71":"#e74c3c",fontSize:11}}>{online?"Online":"Offline"}</span>
          </div>
          <button onClick={onLogout} style={{background:"#1a0a0a",border:"1px solid #e74c3c33",borderRadius:6,padding:"6px 10px",color:"#e74c3c",cursor:"pointer",fontSize:11}}>Out</button>
        </div>
      </div>

      {/* Runner greeting */}
      <div style={{padding:"16px 16px 0"}}>
        <div style={{background:"linear-gradient(135deg,#0a2218,#0d2a20)",border:"1px solid #2ecc7133",borderRadius:14,padding:"16px"}}>
          <div style={{color:"#2ecc71",fontSize:12,marginBottom:3}}>Good day,</div>
          <div style={{color:"#e8dcc8",fontFamily:"'Playfair Display',Georgia,serif",fontSize:20,marginBottom:4}}>{user.name}</div>
          <div style={{display:"flex",gap:16}}>
            <div style={{textAlign:"center"}}><div style={{color:"#c9a84c",fontSize:22,fontWeight:700}}>{myTasks.length}</div><div style={{color:"#3a6a4a",fontSize:11}}>Tasks</div></div>
            <div style={{textAlign:"center"}}><div style={{color:"#f39c12",fontSize:22,fontWeight:700}}>{myTasks.filter(t=>!["Completed","Filed","Process Served"].includes(t.status)).length}</div><div style={{color:"#3a6a4a",fontSize:11}}>Active</div></div>
            <div style={{textAlign:"center"}}><div style={{color:"#2ecc71",fontSize:22,fontWeight:700}}>{myTasks.filter(t=>["Completed","Filed","Process Served"].includes(t.status)).length}</div><div style={{color:"#3a6a4a",fontSize:11}}>Done</div></div>
          </div>
        </div>
      </div>

      {/* Tasks tab */}
      {tab==="tasks" && (
        <div>
          <div style={{padding:"14px 16px 2px",color:"#5a7a9a",fontSize:12,letterSpacing:0.5}}>YOUR ASSIGNED TASKS</div>
          {myTasks.length===0 && <div style={{padding:"40px 16px",textAlign:"center",color:"#2a4a6a",fontSize:14}}>No tasks assigned to you yet.</div>}
          {myTasks.map(t=>(
            <div key={t.id} style={S.card}>
              {/* Card header */}
              <div style={S.cardHead} onClick={()=>setExpanded(expanded===t.id?null:t.id)}>
                <div style={{display:"flex",justifyContent:"space-between",alignItems:"flex-start",marginBottom:8}}>
                  <span style={{color:"#c9a84c",fontSize:12,fontFamily:"monospace"}}>{t.matterRef}</span>
                  <Badge label={t.status} color={sc(t.status)} />
                </div>
                <div style={{color:"#e8dcc8",fontSize:14,fontFamily:"Georgia,serif",lineHeight:1.4,marginBottom:6}}>{t.instruction}</div>
                <div style={{color:"#3a5a7a",fontSize:12}}>📍 {t.court.split("–")[0].trim()}</div>
                <div style={{color:"#3a5a7a",fontSize:12,marginTop:2}}>📅 {t.date}</div>
                {!t.approved && !["Completed"].includes(t.status) && (
                  <button onClick={e=>{e.stopPropagation();setShowUpdate(t.id);setUpdateStatus("En Route");setUpdateNote("");setGpsCoords("");setPhotoName("");}}
                    style={{width:"100%",background:"#2ecc71",border:"none",borderRadius:9,padding:"13px",color:"#0a1628",fontWeight:700,fontSize:15,marginTop:12,cursor:"pointer"}}>
                    📝 Post Update
                  </button>
                )}
                {t.approved && <div style={{background:"#0a2018",border:"1px solid #2ecc7133",borderRadius:8,padding:"8px 12px",marginTop:10,color:"#2ecc71",fontSize:13,textAlign:"center"}}>✓ Task Approved & Complete</div>}
              </div>

              {/* Activity log */}
              {expanded===t.id && (
                <div style={S.cardBody}>
                  <div style={{fontSize:11,color:"#3a5a7a",letterSpacing:0.5,marginBottom:12}}>ACTIVITY LOG</div>
                  {t.updates.map((u,i)=>(
                    <div key={i} style={{display:"flex",gap:10,marginBottom:12,alignItems:"flex-start"}}>
                      <div style={{width:8,height:8,borderRadius:"50%",background:sc(u.status),marginTop:5,flexShrink:0}} />
                      <div style={{flex:1}}>
                        <div style={{display:"flex",justifyContent:"space-between",marginBottom:2}}>
                          <span style={{color:sc(u.status),fontSize:11,fontWeight:700}}>{u.status}</span>
                          <span style={{color:"#3a5a7a",fontSize:11,fontFamily:"monospace"}}>{u.time}</span>
                        </div>
                        <div style={{color:"#e8dcc8",fontSize:13,lineHeight:1.4}}>{u.note}</div>
                        {u.gps&&<div style={{color:"#3a5a7a",fontSize:11,marginTop:2}}>📍 {u.gps}</div>}
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          ))}
        </div>
      )}

      {/* Profile tab */}
      {tab==="profile" && (
        <div style={{padding:16}}>
          <div style={{background:"#0a1e34",border:"1px solid #1e3a5a",borderRadius:14,padding:20,marginBottom:14}}>
            <div style={{width:60,height:60,borderRadius:"50%",background:"#1e3a5a",display:"flex",alignItems:"center",justifyContent:"center",color:"#c9a84c",fontWeight:700,fontSize:22,margin:"0 auto 12px"}}>
              {user.name.split(" ").map(n=>n[0]).join("")}
            </div>
            <div style={{textAlign:"center",color:"#e8dcc8",fontFamily:"'Playfair Display',Georgia,serif",fontSize:18,marginBottom:4}}>{user.name}</div>
            <div style={{textAlign:"center",color:"#3a6a4a",fontSize:13,marginBottom:16}}>Court Runner · {user.email}</div>
            {[["Tasks Assigned",myTasks.length],["Tasks Completed",myTasks.filter(t=>["Completed","Filed","Process Served"].includes(t.status)).length],["Tasks Active",myTasks.filter(t=>!["Completed","Filed","Process Served"].includes(t.status)).length]].map(([k,v])=>(
              <div key={k} style={{display:"flex",justifyContent:"space-between",padding:"10px 0",borderBottom:"1px solid #1e3a5a"}}>
                <span style={{color:"#5a7a9a",fontSize:13}}>{k}</span>
                <span style={{color:"#c9a84c",fontWeight:700,fontSize:13}}>{v}</span>
              </div>
            ))}
          </div>
          <button onClick={onLogout} style={{width:"100%",background:"#2a0a0a",border:"1px solid #e74c3c44",borderRadius:10,padding:14,color:"#e74c3c",fontWeight:700,fontSize:14,cursor:"pointer"}}>Sign Out</button>
        </div>
      )}

      {/* Bottom navigation */}
      <div style={S.bottomNav}>
        {[["tasks","📋","Tasks"],["profile","👤","Profile"]].map(([t,icon,label])=>(
          <button key={t} onClick={()=>setTab(t)} style={S.navBtn(tab===t)}>
            <span style={{fontSize:22}}>{icon}</span>
            <span>{label}</span>
          </button>
        ))}
      </div>

      {/* Status Update Bottom Sheet */}
      {showUpdate && (
        <div style={{position:"fixed",inset:0,background:"#000000aa",zIndex:199}} onClick={()=>setShowUpdate(null)}>
          <div style={S.sheet} onClick={e=>e.stopPropagation()}>
            <div style={{width:40,height:4,borderRadius:2,background:"#1e3a5a",margin:"0 auto 20px"}} />
            <div style={{color:"#c9a84c",fontFamily:"'Playfair Display',Georgia,serif",fontSize:18,marginBottom:16}}>Post Status Update</div>

            {/* Status selector */}
            <div style={{marginBottom:16}}>
              <div style={{color:"#5a7a9a",fontSize:11,letterSpacing:0.5,marginBottom:10}}>SELECT STATUS</div>
              {statusGroups.map(grp=>(
                <div key={grp.label} style={{marginBottom:10}}>
                  <div style={{color:grp.color,fontSize:11,fontWeight:700,marginBottom:6,letterSpacing:0.5}}>{grp.label.toUpperCase()}</div>
                  <div style={{display:"flex",flexWrap:"wrap",gap:8}}>
                    {grp.items.map(s=>(
                      <button key={s} onClick={()=>setUpdateStatus(s)} style={{...S.statusBtn(grp.color,updateStatus===s),minWidth:"auto",flex:"none",padding:"8px 14px"}}>{s}</button>
                    ))}
                  </div>
                </div>
              ))}
            </div>

            {/* Note */}
            <div style={{marginBottom:14}}>
              <div style={{color:"#5a7a9a",fontSize:11,letterSpacing:0.5,marginBottom:6}}>UPDATE NOTE</div>
              <textarea value={updateNote} onChange={e=>setUpdateNote(e.target.value)} rows={3}
                placeholder="e.g. Filed and collected stamp. Cost: ₦3,500. Next step: return to chambers."
                style={{width:"100%",background:"#0a1628",border:"1px solid #1e3a5a",borderRadius:10,padding:"12px 14px",color:"#e8dcc8",fontSize:14,outline:"none",resize:"none",boxSizing:"border-box",fontFamily:"Georgia,serif"}} />
            </div>

            {/* Photo + GPS */}
            <div style={{display:"flex",gap:10,marginBottom:16}}>
              <button onClick={()=>fileRef.current?.click()} style={{flex:1,background:"#0a1628",border:"1px solid #1e3a5a",borderRadius:10,padding:"13px",color:photoName?"#2ecc71":"#5a7a9a",fontSize:13,cursor:"pointer",fontWeight:photoName?700:400}}>
                📎 {photoName||"Attach Photo / File"}
              </button>
              <input ref={fileRef} type="file" accept="image/*" capture="environment" style={{display:"none"}} onChange={e=>setPhotoName(e.target.files?.[0]?.name||"")} />
              <button onClick={getGPS} style={{flex:1,background:"#0a1628",border:`1px solid ${gpsCoords?"#2ecc71":"#1e3a5a"}`,borderRadius:10,padding:"13px",color:gpsCoords?"#2ecc71":"#5a7a9a",fontSize:13,cursor:"pointer",fontWeight:gpsCoords?700:400}}>
                {gpsLoading?"Locating…":"📍 "+(gpsCoords?"GPS ✓":"Stamp Location")}
              </button>
            </div>

            {gpsCoords&&<div style={{background:"#0a2018",borderRadius:8,padding:"8px 12px",marginBottom:12,color:"#2ecc71",fontSize:12,fontFamily:"monospace"}}>📍 {gpsCoords}</div>}

            <button onClick={()=>postUpdate(showUpdate)} disabled={posting||!updateNote.trim()}
              style={{width:"100%",background:posting?"#1a5a30":"#2ecc71",border:"none",borderRadius:12,padding:"16px",color:"#0a1628",fontWeight:700,fontSize:16,cursor:posting||!updateNote.trim()?"not-allowed":"pointer",opacity:!updateNote.trim()?0.5:1}}>
              {posting?"Posting update…":"✓ Post Update"}
            </button>
          </div>
        </div>
      )}
    </div>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
//  FULL DESKTOP APP (all modules — reuses v2 structure, compacted here)
// ─────────────────────────────────────────────────────────────────────────────
// [imports all desktop pages from previous version]

function DesktopApp({user, onLogout, matters, setMatters, clients, setClients, tasks, setTasks, invoices, setInvoices, proofs, setProofs, lawyers, setLawyers}) {
  const [page, setPage] = useState("dashboard");
  const [collapsed, setCollapsed] = useState(false);

  const NAV = [
    {id:"dashboard",label:"Overview",icon:"⚖"},
    {id:"matters",label:"Matters",icon:"📁"},
    {id:"runner",label:"Court Runner",icon:"🏃"},
    {id:"clients",label:"Clients",icon:"👥"},
    {id:"vault",label:"Proof Vault",icon:"🗄"},
    {id:"billing",label:"Billing",icon:"₦"},
    {id:"updates",label:"Client Updates",icon:"📲"},
    {id:"lawyers",label:"Lawyers",icon:"🎓"},
  ];

  return (
    <div style={{display:"flex",minHeight:"100vh",background:"#040c18",fontFamily:"Georgia,serif",color:"#e8dcc8"}}>
      <aside style={{width:collapsed?60:220,background:"#030b16",borderRight:"1px solid #0e2030",display:"flex",flexDirection:"column",transition:"width 0.22s",overflow:"hidden",flexShrink:0}}>
        <div style={{padding:collapsed?"16px 12px":"18px 16px",borderBottom:"1px solid #0e2030",display:"flex",gap:10,alignItems:"center"}}>
          <div style={{width:32,height:32,borderRadius:9,background:"linear-gradient(135deg,#c9a84c,#8a6020)",display:"flex",alignItems:"center",justifyContent:"center",fontSize:16,flexShrink:0}}>⚖</div>
          {!collapsed&&<div><div style={{color:"#e8dcc8",fontFamily:"'Playfair Display',Georgia,serif",fontSize:13,fontWeight:700}}>CourtDesk</div><div style={{color:"#2ecc71",fontSize:9,letterSpacing:1.5}}>NIGERIA</div></div>}
        </div>
        <nav style={{flex:1,padding:"12px 6px"}}>
          {NAV.map(item=>(
            <button key={item.id} onClick={()=>setPage(item.id)}
              style={{width:"100%",display:"flex",gap:11,alignItems:"center",padding:collapsed?"11px 0":"9px 11px",justifyContent:collapsed?"center":"flex-start",borderRadius:9,border:"none",background:page===item.id?"#c9a84c18":"transparent",cursor:"pointer",marginBottom:2,borderLeft:page===item.id?"3px solid #c9a84c":"3px solid transparent"}}>
              <span style={{fontSize:16}}>{item.icon}</span>
              {!collapsed&&<span style={{color:page===item.id?"#c9a84c":"#3a5a7a",fontSize:13,fontWeight:page===item.id?600:400}}>{item.label}</span>}
            </button>
          ))}
        </nav>
        {!collapsed&&(
          <div style={{padding:"12px 14px",borderTop:"1px solid #0e2030"}}>
            <div style={{color:"#3a5a7a",fontSize:11,marginBottom:2}}>{user.name}</div>
            <div style={{color:"#2a3a4a",fontSize:10,marginBottom:8}}>{user.email}</div>
            <button onClick={onLogout} style={{background:"#1a0a0a",border:"1px solid #e74c3c33",borderRadius:6,padding:"6px 12px",color:"#e74c3c",cursor:"pointer",fontSize:11,width:"100%"}}>Sign Out</button>
          </div>
        )}
        <div style={{padding:"10px 6px",borderTop:collapsed?"1px solid #0e2030":"none"}}>
          <button onClick={()=>setCollapsed(!collapsed)} style={{width:"100%",background:"transparent",border:"none",cursor:"pointer",color:"#2a4a6a",fontSize:16,padding:"8px 0"}}>{collapsed?"▶":"◀"}</button>
        </div>
      </aside>

      <main style={{flex:1,overflow:"auto",padding:"32px 38px"}}>
        {page==="dashboard" && <DesktopDashboard matters={matters} tasks={tasks} invoices={invoices} proofs={proofs} setPage={setPage} />}
        {page==="matters" && <DesktopMatters matters={matters} setMatters={setMatters} lawyers={lawyers} />}
        {page==="runner" && <DesktopRunner tasks={tasks} setTasks={setTasks} matters={matters} lawyers={lawyers} />}
        {page==="clients" && <DesktopClients clients={clients} setClients={setClients} />}
        {page==="vault" && <DesktopVault proofs={proofs} setProofs={setProofs} matters={matters} lawyers={lawyers} />}
        {page==="billing" && <DesktopBilling invoices={invoices} setInvoices={setInvoices} />}
        {page==="updates" && <DesktopUpdates matters={matters} clients={clients} />}
        {page==="lawyers" && <DesktopLawyers lawyers={lawyers} setLawyers={setLawyers} />}
      </main>
    </div>
  );
}

// ─── DESKTOP PAGE COMPONENTS ──────────────────────────────────────────────────

function DesktopDashboard({matters,tasks,invoices,proofs,setPage}) {
  const totalAdj = matters.reduce((a,m)=>a+m.adjournments,0);
  return (
    <div>
      <div style={{marginBottom:26}}>
        <div style={{display:"flex",alignItems:"center",gap:10,marginBottom:6}}>
          <div style={{width:8,height:8,borderRadius:"50%",background:"#2ecc71",boxShadow:"0 0 8px #2ecc71"}} />
          <span style={{color:"#2ecc71",fontSize:11,letterSpacing:1.5}}>LIVE SYSTEM</span>
        </div>
        <h1 style={{margin:0,fontFamily:"'Playfair Display',Georgia,serif",fontSize:28,color:"#e8dcc8"}}>Dashboard</h1>
        <p style={{margin:"5px 0 0",color:"#3a5a7a",fontStyle:"italic",fontSize:13}}>"Never lose a court update, filing proof, service record or client trust again."</p>
      </div>
      <div style={{display:"flex",gap:12,flexWrap:"wrap",marginBottom:24}}>
        <StatCard label="Active Matters" value={matters.filter(m=>m.status==="Active").length} accent="#c9a84c" />
        <StatCard label="Adjournments" value={totalAdj} accent="#e67e22" />
        <StatCard label="Runner Tasks" value={tasks.length} sub={`${tasks.filter(t=>!["Completed","Filed"].includes(t.status)).length} live`} accent="#3498db" />
        <StatCard label="Overdue Invoices" value={invoices.filter(i=>i.status==="Overdue").length} accent="#e74c3c" />
        <StatCard label="Proof Docs" value={proofs.length} accent="#2ecc71" />
      </div>
      <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:18,marginBottom:18}}>
        <div style={{background:"#0a1e34",borderRadius:14,padding:20,border:"1px solid #1e3a5a"}}>
          <div style={{display:"flex",justifyContent:"space-between",marginBottom:14}}><h3 style={{margin:0,color:"#c9a84c",fontFamily:"'Playfair Display',Georgia,serif",fontSize:15}}>Active Matters</h3><button onClick={()=>setPage("matters")} style={{background:"none",border:"none",color:"#2ecc71",fontSize:12,cursor:"pointer"}}>View all →</button></div>
          {matters.filter(m=>m.status==="Active").map(m=>(
            <div key={m.id} style={{padding:"9px 0",borderBottom:"1px solid #152a40",display:"flex",justifyContent:"space-between"}}>
              <div><div style={{color:"#e8dcc8",fontSize:13}}>{m.title}</div><div style={{color:"#3a5a7a",fontSize:11,marginTop:2}}>{m.court.split("–")[0].trim()}</div></div>
              <div style={{textAlign:"right"}}><Badge label={m.stage} color={stageC(m.stage)} /><div style={{color:"#e67e22",fontSize:11,marginTop:3}}>{m.adjournments} adj.</div></div>
            </div>
          ))}
        </div>
        <div style={{background:"#0a1e34",borderRadius:14,padding:20,border:"1px solid #1e3a5a"}}>
          <div style={{display:"flex",justifyContent:"space-between",marginBottom:14}}><h3 style={{margin:0,color:"#c9a84c",fontFamily:"'Playfair Display',Georgia,serif",fontSize:15}}>Court Runner Feed</h3><button onClick={()=>setPage("runner")} style={{background:"none",border:"none",color:"#2ecc71",fontSize:12,cursor:"pointer"}}>View all →</button></div>
          {tasks.map(t=>(
            <div key={t.id} style={{padding:"9px 0",borderBottom:"1px solid #152a40"}}>
              <div style={{display:"flex",justifyContent:"space-between",alignItems:"center"}}><div><div style={{color:"#e8dcc8",fontSize:12}}>{t.matterRef}</div><div style={{color:"#3a5a7a",fontSize:11}}>{t.assignedTo}</div></div><Badge label={t.status} color={sc(t.status)} /></div>
              <div style={{color:"#4a6a8a",fontSize:11,marginTop:3,fontStyle:"italic"}}>"{t.updates[t.updates.length-1]?.note.slice(0,50)}…"</div>
            </div>
          ))}
        </div>
        <div style={{background:"#0a1e34",borderRadius:14,padding:20,border:"1px solid #1e3a5a"}}>
          <h3 style={{margin:"0 0 14px",color:"#c9a84c",fontFamily:"'Playfair Display',Georgia,serif",fontSize:15}}>Upcoming Court Dates</h3>
          {matters.filter(m=>m.nextDate&&m.nextDate!=="TBD").map(m=>(
            <div key={m.id} style={{padding:"9px 0",borderBottom:"1px solid #152a40",display:"flex",justifyContent:"space-between"}}>
              <div><div style={{color:"#e8dcc8",fontSize:13}}>{m.title.length>40?m.title.slice(0,40)+"…":m.title}</div><div style={{color:"#3a5a7a",fontSize:11}}>{m.court.split("–")[0].trim()}</div></div>
              <div style={{color:"#c9a84c",fontWeight:700,fontSize:12}}>{m.nextDate}</div>
            </div>
          ))}
        </div>
        <div style={{background:"#0a1e34",borderRadius:14,padding:20,border:"1px solid #1e3a5a"}}>
          <h3 style={{margin:"0 0 14px",color:"#c9a84c",fontFamily:"'Playfair Display',Georgia,serif",fontSize:15}}>Billing Summary</h3>
          {[["Professional Fees",invoices.reduce((a,i)=>a+i.professional,0),"#3498db"],["Filing Fees",invoices.reduce((a,i)=>a+i.filingFee,0),"#7a9ab8"],["Disbursements",invoices.reduce((a,i)=>a+i.disbursement,0),"#e67e22"],["Court Runner Costs",invoices.reduce((a,i)=>a+i.courtRunner,0),"#9b59b6"]].map(([l,v,c])=>(
            <div key={l} style={{display:"flex",justifyContent:"space-between",padding:"8px 0",borderBottom:"1px solid #152a40"}}><span style={{color:"#5a7a9a",fontSize:13}}>{l}</span><span style={{color:c,fontWeight:400,fontSize:13}}>{fmtNGN(v)}</span></div>
          ))}
          <div style={{display:"flex",justifyContent:"space-between",padding:"10px 0"}}><span style={{color:"#e8dcc8",fontWeight:700}}>Total</span><span style={{color:"#c9a84c",fontWeight:700}}>{fmtNGN(invoices.reduce((a,i)=>a+i.professional+i.filingFee+i.disbursement+i.courtRunner+i.transport,0))}</span></div>
        </div>
      </div>
      <div style={{background:"linear-gradient(135deg,#0f1a08,#1a2f0a)",border:"1px solid #2ecc7133",borderRadius:14,padding:"18px 24px",display:"flex",justifyContent:"space-between",alignItems:"center"}}>
        <div><div style={{color:"#2ecc71",fontFamily:"'Playfair Display',Georgia,serif",fontSize:15,marginBottom:4}}>📲 WhatsApp & SMS Client Updates</div><div style={{color:"#3a6a3a",fontSize:13}}>Generate and send professional matter updates to clients in one click.</div></div>
        <button onClick={()=>setPage("updates")} style={{background:"#2ecc71",border:"none",borderRadius:8,padding:"10px 20px",color:"#0a1628",fontWeight:700,cursor:"pointer",fontSize:13,whiteSpace:"nowrap"}}>Open Update Centre</button>
      </div>
    </div>
  );
}

function DesktopMatters({matters,setMatters,lawyers}) {
  const [filter,setFilter]=useState("All");
  const [search,setSearch]=useState("");
  const [selected,setSelected]=useState(null);
  const [showAdd,setShowAdd]=useState(false);
  const [form,setForm]=useState({title:"",client:"",lawyer:lawyers[0]?.name||"",type:MATTER_TYPES[0],court:NIGERIAN_COURTS[0],priority:"High",valueNGN:""});
  const filtered=matters.filter(m=>(filter==="All"||m.status===filter)&&(m.title.toLowerCase().includes(search.toLowerCase())||m.client.toLowerCase().includes(search.toLowerCase())));
  const addMatter=async()=>{if(!form.title||!form.client)return;await setMatters(prev=>[{...form,id:`NG/2026/00${prev.length+1}`,filed:"May 2026",nextDate:"TBD",suitNo:"Pending",judge:"Awaiting Assignment",adjournments:0,stage:"Filed",status:"Pending",timeline:[{date:"May 2026",event:"Matter Opened",note:"Instructions received",status:"done"}]},...prev]);setShowAdd(false);};
  return(
    <div>
      <div style={{display:"flex",justifyContent:"space-between",alignItems:"center",marginBottom:22}}>
        <div><h2 style={{margin:0,color:"#e8dcc8",fontFamily:"'Playfair Display',Georgia,serif",fontSize:26}}>Matters</h2><p style={{margin:"4px 0 0",color:"#3a5a7a",fontSize:13}}>{matters.length} matters · Click to view timeline</p></div>
        <GoldBtn onClick={()=>setShowAdd(true)}>+ Open Matter</GoldBtn>
      </div>
      <div style={{display:"flex",gap:10,marginBottom:16,flexWrap:"wrap"}}>
        <input placeholder="Search matters or clients…" value={search} onChange={e=>setSearch(e.target.value)} style={{flex:1,minWidth:200,background:"#0a1e34",border:"1px solid #1e3a5a",borderRadius:8,padding:"9px 13px",color:"#e8dcc8",fontSize:13,outline:"none"}} />
        {["All","Active","Pending","Closed"].map(f=><Pill key={f} label={f} active={filter===f} onClick={()=>setFilter(f)} />)}
      </div>
      <div style={{display:"flex",flexDirection:"column",gap:11}}>
        {filtered.map(m=>(
          <div key={m.id} onClick={()=>setSelected(m)} style={{background:"#0a1e34",border:"1px solid #1e3a5a",borderRadius:13,padding:"16px 20px",cursor:"pointer"}} onMouseEnter={e=>e.currentTarget.style.borderColor="#c9a84c55"} onMouseLeave={e=>e.currentTarget.style.borderColor="#1e3a5a"}>
            <div style={{display:"flex",justifyContent:"space-between",flexWrap:"wrap",gap:10}}>
              <div><div style={{display:"flex",gap:8,flexWrap:"wrap",marginBottom:5}}><span style={{color:"#c9a84c",fontSize:11,fontFamily:"monospace"}}>{m.suitNo}</span><Badge label={m.type} color="#3498db" /><Badge label={m.stage} color={stageC(m.stage)} /><Badge label={m.priority} color={sc(m.priority)} /></div><div style={{color:"#e8dcc8",fontFamily:"'Playfair Display',Georgia,serif",fontSize:16,marginBottom:3}}>{m.title}</div><div style={{display:"flex",gap:14,flexWrap:"wrap"}}><span style={{color:"#3a5a7a",fontSize:12}}>Client: <span style={{color:"#7a9ab8"}}>{m.client}</span></span><span style={{color:"#3a5a7a",fontSize:12}}>Lawyer: <span style={{color:"#7a9ab8"}}>{m.lawyer}</span></span></div></div>
              <div style={{textAlign:"right"}}><div style={{color:"#c9a84c",fontWeight:700,fontSize:15}}>{m.valueNGN}</div><div style={{color:"#e67e22",fontSize:12,marginTop:3}}>⚠ {m.adjournments} adjournments</div><div style={{color:"#3a5a7a",fontSize:12}}>Next: {m.nextDate}</div></div>
            </div>
          </div>
        ))}
      </div>
      {selected&&(<Modal title={selected.title} onClose={()=>setSelected(null)} wide><div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:10,marginBottom:20}}>{[["Suit No.",selected.suitNo],["Court",selected.court],["Judge",selected.judge],["Lawyer",selected.lawyer],["Client",selected.client],["Type",selected.type],["Stage",selected.stage],["Adjournments",selected.adjournments],["Value",selected.valueNGN],["Next Date",selected.nextDate]].map(([k,v])=>(<div key={k} style={{background:"#0d1f35",borderRadius:8,padding:"10px 13px"}}><div style={{color:"#4a6a8a",fontSize:10,marginBottom:3}}>{k.toUpperCase()}</div><div style={{color:k==="Adjournments"?"#e67e22":k==="Value"?"#c9a84c":"#e8dcc8",fontSize:13,fontWeight:["Adjournments","Value"].includes(k)?700:400}}>{v}</div></div>))}</div><div style={{color:"#c9a84c",fontSize:12,fontWeight:700,letterSpacing:0.5,marginBottom:12}}>TIMELINE</div><div style={{position:"relative",paddingLeft:22}}><div style={{position:"absolute",left:7,top:6,bottom:6,width:2,background:"#1e3a5a"}} />{selected.timeline.map((t,i)=>(<div key={i} style={{position:"relative",marginBottom:13}}><div style={{position:"absolute",left:-17,top:5,width:8,height:8,borderRadius:"50%",background:t.status==="upcoming"?"#e67e22":"#2ecc71",border:"2px solid #0a1628"}} /><div style={{background:"#0d1f35",borderRadius:8,padding:"9px 13px",border:`1px solid ${t.status==="upcoming"?"#e67e2244":"#1e3a5a"}`}}><div style={{display:"flex",justifyContent:"space-between"}}><span style={{color:t.status==="upcoming"?"#e67e22":"#2ecc71",fontWeight:700,fontSize:12}}>{t.event}</span><span style={{color:"#4a6a8a",fontSize:12}}>{t.date}</span></div><div style={{color:"#7a9ab8",fontSize:12,marginTop:3}}>{t.note}</div></div></div>))}</div></Modal>)}
      {showAdd&&(<Modal title="Open New Matter" onClose={()=>setShowAdd(false)}><FI label="Matter Title" placeholder="e.g. Adamu v. Sterling Bank" value={form.title} onChange={e=>setForm({...form,title:e.target.value})} /><FI label="Client Name / Company" placeholder="Client name" value={form.client} onChange={e=>setForm({...form,client:e.target.value})} /><FS label="Assigned Lawyer" options={lawyers.map(l=>l.name)} value={form.lawyer} onChange={e=>setForm({...form,lawyer:e.target.value})} /><FS label="Matter Type" options={MATTER_TYPES} value={form.type} onChange={e=>setForm({...form,type:e.target.value})} /><FS label="Court" options={NIGERIAN_COURTS} value={form.court} onChange={e=>setForm({...form,court:e.target.value})} /><div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:13}}><FS label="Priority" options={["High","Medium","Low"]} value={form.priority} onChange={e=>setForm({...form,priority:e.target.value})} /><FI label="Claim Value (₦)" placeholder="e.g. 5000000" value={form.valueNGN} onChange={e=>setForm({...form,valueNGN:`₦${Number(e.target.value.replace(/\D/g,"")).toLocaleString("en-NG")}`})} /></div><GoldBtn onClick={addMatter} full>Open Matter</GoldBtn></Modal>)}
    </div>
  );
}

function DesktopRunner({tasks,setTasks,matters,lawyers}) {
  const [exp,setExp]=useState(null);
  const [showAdd,setShowAdd]=useState(false);
  const [showUpd,setShowUpd]=useState(null);
  const [upd,setUpd]=useState({note:"",status:"En Route"});
  const [form,setForm]=useState({matterRef:matters[0]?.id||"",court:NIGERIAN_COURTS[0],instruction:"",assignedTo:SEED_RUNNERS[0].name,assignedBy:lawyers[0]?.name||"",date:""});
  const addTask=async()=>{if(!form.instruction)return;await setTasks(prev=>[{...form,id:Date.now(),status:"Assigned",approved:false,updates:[{time:"Now",note:"Task assigned",status:"Assigned",gps:""}]},...prev]);setShowAdd(false);};
  const addUpd=async(id)=>{if(!upd.note)return;const t=new Date().toLocaleTimeString("en-NG",{hour:"2-digit",minute:"2-digit"});await setTasks(prev=>prev.map(tk=>tk.id!==id?tk:{...tk,status:upd.status,updates:[...tk.updates,{time:t,note:upd.note,status:upd.status,gps:""}]}));setShowUpd(null);setUpd({note:"",status:"En Route"});};
  const approve=async(id)=>{const t=new Date().toLocaleTimeString("en-NG",{hour:"2-digit",minute:"2-digit"});await setTasks(prev=>prev.map(tk=>tk.id!==id?tk:{...tk,status:"Completed",approved:true,updates:[...tk.updates,{time:t,note:"Task approved by supervising lawyer",status:"Completed",gps:""}]}));};
  return(
    <div>
      <div style={{display:"flex",justifyContent:"space-between",alignItems:"center",marginBottom:22}}><div><h2 style={{margin:0,color:"#e8dcc8",fontFamily:"'Playfair Display',Georgia,serif",fontSize:26}}>Court Runner Workflow</h2><p style={{margin:"4px 0 0",color:"#3a5a7a",fontSize:13}}>Assign and track every registry visit, filing, and service of process in real time</p></div><GoldBtn onClick={()=>setShowAdd(true)}>+ Assign Task</GoldBtn></div>
      <div style={{display:"flex",gap:10,marginBottom:20,flexWrap:"wrap"}}>{SEED_RUNNERS.map(r=>(<div key={r.id} style={{background:"#0a1e34",border:"1px solid #1e3a5a",borderRadius:10,padding:"12px 16px",display:"flex",gap:12,alignItems:"center"}}><div style={{width:34,height:34,borderRadius:"50%",background:"#1e3a5a",display:"flex",alignItems:"center",justifyContent:"center",color:"#c9a84c",fontWeight:700,fontSize:13}}>{r.name.split(" ").map(n=>n[0]).join("")}</div><div><div style={{color:"#e8dcc8",fontSize:13}}>{r.name}</div><div style={{color:"#3a5a7a",fontSize:11}}>{r.phone}</div></div><Badge label={r.status} color={sc(r.status)} /></div>))}</div>
      <div style={{display:"flex",flexDirection:"column",gap:12}}>
        {tasks.map(t=>(
          <div key={t.id} style={{background:"#0a1e34",border:"1px solid #1e3a5a",borderRadius:13,overflow:"hidden"}}>
            <div style={{padding:"15px 20px",cursor:"pointer",display:"flex",justifyContent:"space-between",alignItems:"center",flexWrap:"wrap",gap:10}} onClick={()=>setExp(exp===t.id?null:t.id)}>
              <div><div style={{display:"flex",gap:8,flexWrap:"wrap",marginBottom:5}}><span style={{color:"#c9a84c",fontSize:11,fontFamily:"monospace"}}>{t.matterRef}</span><Badge label={t.status} color={sc(t.status)} />{t.approved&&<Badge label="Approved" color="#2ecc71" />}</div><div style={{color:"#e8dcc8",fontSize:14,fontFamily:"Georgia,serif",marginBottom:3}}>{t.instruction}</div><div style={{display:"flex",gap:14}}><span style={{color:"#3a5a7a",fontSize:12}}>Runner: <span style={{color:"#7a9ab8"}}>{t.assignedTo}</span></span><span style={{color:"#3a5a7a",fontSize:12}}>By: <span style={{color:"#7a9ab8"}}>{t.assignedBy}</span></span><span style={{color:"#3a5a7a",fontSize:12}}>{t.date}</span></div></div>
              <div style={{display:"flex",gap:8,alignItems:"center"}}><button onClick={e=>{e.stopPropagation();setShowUpd(t.id);setUpd({note:"",status:"En Route"});}} style={{background:"#1e3a5a",border:"none",borderRadius:7,padding:"7px 13px",color:"#7a9ab8",cursor:"pointer",fontSize:12}}>+ Update</button><span style={{color:"#3a5a7a",fontSize:16}}>{exp===t.id?"▲":"▼"}</span></div>
            </div>
            {exp===t.id&&(
              <div style={{borderTop:"1px solid #1e3a5a",padding:"14px 20px 16px"}}>
                <div style={{fontSize:10,color:"#3a5a7a",letterSpacing:0.5,marginBottom:10}}>ACTIVITY LOG</div>
                <div style={{position:"relative",paddingLeft:20}}><div style={{position:"absolute",left:6,top:4,bottom:4,width:2,background:"#1e3a5a"}} />{t.updates.map((u,i)=>(<div key={i} style={{position:"relative",marginBottom:10}}><div style={{position:"absolute",left:-14,top:3,width:7,height:7,borderRadius:"50%",background:sc(u.status)}} /><div style={{display:"flex",gap:12,alignItems:"center",flexWrap:"wrap"}}><span style={{color:"#c9a84c",fontSize:11,fontFamily:"monospace",minWidth:58}}>{u.time}</span><span style={{color:"#e8dcc8",fontSize:13}}>{u.note}</span><Badge label={u.status} color={sc(u.status)} />{u.gps&&<span style={{color:"#3a5a7a",fontSize:11}}>📍 {u.gps}</span>}</div></div>))}</div>
                {["Filed","Process Served","Suit No. Generated"].includes(t.status)&&!t.approved&&(<div style={{background:"#0a2018",border:"1px solid #2ecc7133",borderRadius:8,padding:"11px 16px",marginTop:12,display:"flex",justifyContent:"space-between",alignItems:"center"}}><div><div style={{color:"#2ecc71",fontWeight:700,fontSize:13}}>✓ Awaiting Partner Approval</div></div><button onClick={()=>approve(t.id)} style={{background:"#2ecc71",border:"none",borderRadius:7,padding:"8px 16px",color:"#0a1628",fontWeight:700,cursor:"pointer",fontSize:13}}>Approve</button></div>)}
                {t.status==="Service Refused"&&(<div style={{background:"#200a0a",border:"1px solid #e74c3c33",borderRadius:8,padding:"11px 16px",marginTop:12}}><div style={{color:"#e74c3c",fontWeight:700,fontSize:13}}>⚠ Service Refused — Action Required</div><div style={{color:"#6a2a2a",fontSize:12,marginTop:3}}>Apply for substituted service or file a motion. Upload refusal photo to Proof Vault.</div></div>)}
              </div>
            )}
          </div>
        ))}
      </div>
      {showUpd&&(<Modal title="Add Runner Update" onClose={()=>setShowUpd(null)}><FS label="New Status" options={RUNNER_STATUSES} value={upd.status} onChange={e=>setUpd({...upd,status:e.target.value})} /><FI label="Update Note" placeholder="e.g. Assessment paid — ₦4,500. Awaiting stamping." value={upd.note} onChange={e=>setUpd({...upd,note:e.target.value})} /><div style={{background:"#0d1f35",border:"2px dashed #1e3a5a",borderRadius:8,padding:"18px",textAlign:"center",marginBottom:13}}><div style={{fontSize:22,marginBottom:5}}>📎</div><div style={{color:"#3a5a7a",fontSize:12}}>Attach receipt, photo or document (optional)</div></div><GoldBtn onClick={()=>addUpd(showUpd)} full>Post Update</GoldBtn></Modal>)}
      {showAdd&&(<Modal title="Assign Court Runner Task" onClose={()=>setShowAdd(false)}><FS label="Matter Reference" options={matters.map(m=>m.id)} value={form.matterRef} onChange={e=>setForm({...form,matterRef:e.target.value})} /><FS label="Target Court / Registry" options={NIGERIAN_COURTS} value={form.court} onChange={e=>setForm({...form,court:e.target.value})} /><FI label="Instruction" placeholder="e.g. File motion and collect date stamp" value={form.instruction} onChange={e=>setForm({...form,instruction:e.target.value})} /><div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:13}}><FS label="Assign Runner" options={SEED_RUNNERS.map(r=>r.name)} value={form.assignedTo} onChange={e=>setForm({...form,assignedTo:e.target.value})} /><FS label="Supervising Lawyer" options={lawyers.map(l=>l.name)} value={form.assignedBy} onChange={e=>setForm({...form,assignedBy:e.target.value})} /></div><FI label="Date" placeholder="e.g. May 15, 2026" value={form.date} onChange={e=>setForm({...form,date:e.target.value})} /><GoldBtn onClick={addTask} full>Assign Task</GoldBtn></Modal>)}
    </div>
  );
}

function DesktopClients({clients,setClients}){const [showAdd,setShowAdd]=useState(false);const [selected,setSelected]=useState(null);const [form,setForm]=useState({name:"",email:"",phone:"",type:"Individual",contact:""});const add=async()=>{if(!form.name||!form.phone)return;await setClients(prev=>[...prev,{...form,id:Date.now(),matters:0,status:"Active",since:"2026"}]);setShowAdd(false);setForm({name:"",email:"",phone:"",type:"Individual",contact:""});};return(<div><div style={{display:"flex",justifyContent:"space-between",alignItems:"center",marginBottom:22}}><div><h2 style={{margin:0,color:"#e8dcc8",fontFamily:"'Playfair Display',Georgia,serif",fontSize:26}}>Clients</h2><p style={{margin:"4px 0 0",color:"#3a5a7a",fontSize:13}}>{clients.length} registered clients</p></div><GoldBtn onClick={()=>setShowAdd(true)}>+ Register Client</GoldBtn></div><div style={{display:"grid",gridTemplateColumns:"repeat(auto-fill, minmax(270px, 1fr))",gap:15}}>{clients.map(c=>(<div key={c.id} onClick={()=>setSelected(c)} style={{background:"#0a1e34",border:"1px solid #1e3a5a",borderRadius:14,padding:20,cursor:"pointer"}} onMouseEnter={e=>e.currentTarget.style.borderColor="#c9a84c55"} onMouseLeave={e=>e.currentTarget.style.borderColor="#1e3a5a"}><div style={{display:"flex",justifyContent:"space-between",marginBottom:12}}><div style={{width:42,height:42,borderRadius:"50%",background:"#1e3a5a",display:"flex",alignItems:"center",justifyContent:"center",color:"#c9a84c",fontWeight:700,fontSize:14}}>{c.name.split(" ").map(n=>n[0]).join("").slice(0,2)}</div><Badge label={c.status} color={sc(c.status)} /></div><div style={{color:"#e8dcc8",fontFamily:"'Playfair Display',Georgia,serif",fontSize:15,marginBottom:3}}>{c.name}</div><div style={{color:"#3a5a7a",fontSize:12,marginBottom:3}}>{c.phone}</div><div style={{color:"#3a5a7a",fontSize:12,marginBottom:12}}>{c.email}</div><div style={{display:"flex",justifyContent:"space-between"}}><Badge label={c.type} color={sc(c.type)} /><span style={{color:"#5a7a9a",fontSize:12}}>{c.matters} matter{c.matters!==1?"s":""}</span></div></div>))}</div>{selected&&(<Modal title={selected.name} onClose={()=>setSelected(null)}>{[["Phone",selected.phone],["Email",selected.email],["Type",selected.type],["Contact Person",selected.contact||"—"],["Matters",selected.matters],["Status",selected.status],["Since",selected.since]].map(([k,v])=>(<div key={k} style={{display:"flex",justifyContent:"space-between",padding:"9px 0",borderBottom:"1px solid #152a40"}}><span style={{color:"#4a6a8a",fontSize:12}}>{k}</span><span style={{color:"#e8dcc8",fontSize:12}}>{v}</span></div>))}</Modal>)}{showAdd&&(<Modal title="Register New Client" onClose={()=>setShowAdd(false)}><FI label="Full Name / Company" placeholder="e.g. Alhaji Bello or GTBank Plc" value={form.name} onChange={e=>setForm({...form,name:e.target.value})} /><FI label="Phone Number" placeholder="0803-456-7890" value={form.phone} onChange={e=>setForm({...form,phone:e.target.value})} /><FI label="Email Address" placeholder="client@email.com" value={form.email} onChange={e=>setForm({...form,email:e.target.value})} /><FI label="Contact Person (corporate)" placeholder="e.g. Head, Legal Services" value={form.contact} onChange={e=>setForm({...form,contact:e.target.value})} /><FS label="Client Type" options={["Individual","Corporate","Government Body","NGO"]} value={form.type} onChange={e=>setForm({...form,type:e.target.value})} /><GoldBtn onClick={add} full>Register Client</GoldBtn></Modal>)}</div>);}

function DesktopVault({proofs,setProofs,matters,lawyers}){const [search,setSearch]=useState("");const [showAdd,setShowAdd]=useState(false);const [form,setForm]=useState({type:"Filing Receipt",name:"",matter:matters[0]?.id||"",by:lawyers[0]?.name||""});const filtered=proofs.filter(p=>p.name.toLowerCase().includes(search.toLowerCase())||p.matter.toLowerCase().includes(search.toLowerCase()));const tList=["Filing Receipt","Assessment Slip","Payment Receipt","Court Stamp","Proof of Service","Affidavit of Service","Service Refused Photo","Hearing Notice","Enrollment Order","Exhibit","Registry Note"];const add=async()=>{if(!form.name)return;await setProofs(prev=>[...prev,{...form,id:Date.now(),date:"May 2026",size:"—"}]);setShowAdd(false);setForm({type:"Filing Receipt",name:"",matter:matters[0]?.id||"",by:lawyers[0]?.name||""});};return(<div><div style={{display:"flex",justifyContent:"space-between",alignItems:"center",marginBottom:22}}><div><h2 style={{margin:0,color:"#e8dcc8",fontFamily:"'Playfair Display',Georgia,serif",fontSize:26}}>Filing & Service Proof Vault</h2><p style={{margin:"4px 0 0",color:"#3a5a7a",fontSize:13}}>Every filing receipt, stamp, affidavit and service proof — permanently stored</p></div><GoldBtn onClick={()=>setShowAdd(true)}>+ Upload Proof</GoldBtn></div><input placeholder="Search by name or matter ref…" value={search} onChange={e=>setSearch(e.target.value)} style={{width:"100%",background:"#0a1e34",border:"1px solid #1e3a5a",borderRadius:8,padding:"10px 13px",color:"#e8dcc8",fontSize:13,outline:"none",boxSizing:"border-box",marginBottom:16}} /><div style={{display:"flex",flexDirection:"column",gap:9}}>{filtered.map(p=>(<div key={p.id} style={{background:"#0a1e34",border:"1px solid #1e3a5a",borderRadius:11,padding:"13px 18px",display:"flex",gap:13,alignItems:"center"}} onMouseEnter={e=>e.currentTarget.style.borderColor="#c9a84c44"} onMouseLeave={e=>e.currentTarget.style.borderColor="#1e3a5a"}><div style={{fontSize:24}}>{proofIcon[p.type]||"📄"}</div><div style={{flex:1}}><div style={{color:"#e8dcc8",fontSize:14,fontFamily:"Georgia,serif",marginBottom:3}}>{p.name}</div><div style={{display:"flex",gap:14,flexWrap:"wrap"}}><span style={{color:"#3a5a7a",fontSize:12}}>Matter: <span style={{color:"#6a8aaa"}}>{p.matter}</span></span><span style={{color:"#3a5a7a",fontSize:12}}>By: {p.by}</span><span style={{color:"#3a5a7a",fontSize:12}}>{p.date}</span></div></div><div style={{display:"flex",gap:8,alignItems:"center"}}><Badge label={p.type} color="#3498db" /><button style={{background:"#1e3a5a",border:"none",borderRadius:6,padding:"5px 11px",color:"#7a9ab8",fontSize:12,cursor:"pointer"}}>View</button></div></div>))}</div>{showAdd&&(<Modal title="Upload Proof Document" onClose={()=>setShowAdd(false)}><FS label="Document Type" options={tList} value={form.type} onChange={e=>setForm({...form,type:e.target.value})} /><FI label="File Name" placeholder="e.g. FHC_FilingReceipt.pdf" value={form.name} onChange={e=>setForm({...form,name:e.target.value})} /><FS label="Matter Reference" options={matters.map(m=>m.id)} value={form.matter} onChange={e=>setForm({...form,matter:e.target.value})} /><FS label="Uploaded By" options={[...lawyers.map(l=>l.name),...SEED_RUNNERS.map(r=>r.name)]} value={form.by} onChange={e=>setForm({...form,by:e.target.value})} /><div style={{background:"#0d1f35",border:"2px dashed #1e3a5a",borderRadius:8,padding:"24px",textAlign:"center",marginBottom:13}}><div style={{fontSize:32,marginBottom:6}}>📂</div><div style={{color:"#3a5a7a",fontSize:13}}>Drag & drop or click to attach file</div></div><GoldBtn onClick={add} full>Upload to Vault</GoldBtn></Modal>)}</div>);}

function DesktopBilling({invoices,setInvoices}){const [selected,setSelected]=useState(null);const [showAdd,setShowAdd]=useState(false);const [form,setForm]=useState({client:"",matter:"",professional:"",filingFee:"",transport:"",disbursement:"",courtRunner:"",deposit:""});const total=inv=>inv.professional+inv.filingFee+inv.transport+inv.disbursement+inv.courtRunner;const balance=inv=>total(inv)-inv.deposit;const num=v=>Number(String(v).replace(/\D/g,""))||0;const add=async()=>{if(!form.client||!form.professional)return;await setInvoices(prev=>[...prev,{id:`INV-2026-${50+prev.length}`,...form,professional:num(form.professional),filingFee:num(form.filingFee),transport:num(form.transport),disbursement:num(form.disbursement),courtRunner:num(form.courtRunner),deposit:num(form.deposit),status:"Pending",date:"May 2026"}]);setShowAdd(false);setForm({client:"",matter:"",professional:"",filingFee:"",transport:"",disbursement:"",courtRunner:"",deposit:""});};return(<div><div style={{display:"flex",justifyContent:"space-between",alignItems:"center",marginBottom:22}}><div><h2 style={{margin:0,color:"#e8dcc8",fontFamily:"'Playfair Display',Georgia,serif",fontSize:26}}>Billing & Disbursements</h2><p style={{margin:"4px 0 0",color:"#3a5a7a",fontSize:13}}>All fees tracked in ₦ — professional, filing, transport, disbursements and runner costs</p></div><GoldBtn onClick={()=>setShowAdd(true)}>+ Create Invoice</GoldBtn></div><div style={{display:"flex",gap:12,flexWrap:"wrap",marginBottom:22}}><StatCard label="Total Billed" value={fmtNGN(invoices.reduce((a,i)=>a+total(i),0))} accent="#c9a84c" /><StatCard label="Prof. Fees" value={fmtNGN(invoices.reduce((a,i)=>a+i.professional,0))} accent="#3498db" /><StatCard label="Disbursements" value={fmtNGN(invoices.reduce((a,i)=>a+i.disbursement+i.filingFee+i.transport+i.courtRunner,0))} accent="#e67e22" /><StatCard label="Outstanding" value={fmtNGN(invoices.filter(i=>i.status!=="Paid").reduce((a,i)=>a+balance(i),0))} accent="#e74c3c" /></div><div style={{background:"#0a1e34",borderRadius:14,border:"1px solid #1e3a5a",overflowX:"auto"}}><table style={{width:"100%",borderCollapse:"collapse",minWidth:860}}><thead><tr style={{borderBottom:"1px solid #1e3a5a"}}>{["Invoice","Client","Prof. Fee","Filing","Transport","Disburse","Runner","Total","Deposit","Balance","Status"].map(h=><th key={h} style={{padding:"12px 13px",textAlign:"left",color:"#4a6a8a",fontSize:10,fontWeight:600,letterSpacing:0.5,whiteSpace:"nowrap"}}>{h.toUpperCase()}</th>)}</tr></thead><tbody>{invoices.map((inv,i)=>(<tr key={inv.id} onClick={()=>setSelected(inv)} style={{borderBottom:"1px solid #112038",background:i%2?"#08192e":"transparent",cursor:"pointer"}} onMouseEnter={e=>e.currentTarget.style.background="#152840"} onMouseLeave={e=>e.currentTarget.style.background=i%2?"#08192e":"transparent"}><td style={{padding:"11px 13px",color:"#c9a84c",fontSize:11,fontFamily:"monospace"}}>{inv.id}</td><td style={{padding:"11px 13px",color:"#e8dcc8",fontSize:12}}>{inv.client}</td><td style={{padding:"11px 13px",color:"#3498db",fontSize:12,fontWeight:600}}>{fmtNGN(inv.professional)}</td><td style={{padding:"11px 13px",color:"#7a9ab8",fontSize:12}}>{fmtNGN(inv.filingFee)}</td><td style={{padding:"11px 13px",color:"#7a9ab8",fontSize:12}}>{fmtNGN(inv.transport)}</td><td style={{padding:"11px 13px",color:"#e67e22",fontSize:12}}>{fmtNGN(inv.disbursement)}</td><td style={{padding:"11px 13px",color:"#9b59b6",fontSize:12}}>{fmtNGN(inv.courtRunner)}</td><td style={{padding:"11px 13px",color:"#c9a84c",fontWeight:700,fontSize:12}}>{fmtNGN(total(inv))}</td><td style={{padding:"11px 13px",color:"#2ecc71",fontSize:12}}>{fmtNGN(inv.deposit)}</td><td style={{padding:"11px 13px",color:balance(inv)>0?"#e74c3c":"#2ecc71",fontWeight:700,fontSize:12}}>{fmtNGN(balance(inv))}</td><td style={{padding:"11px 13px"}}><Badge label={inv.status} color={sc(inv.status)} /></td></tr>))}</tbody></table></div>{selected&&(<Modal title={`Invoice — ${selected.id}`} onClose={()=>setSelected(null)}><div style={{color:"#e8dcc8",fontFamily:"'Playfair Display',Georgia,serif",fontSize:16,marginBottom:3}}>{selected.client}</div><div style={{color:"#3a5a7a",fontSize:13,marginBottom:18}}>{selected.matter}</div>{[["Professional Fee",selected.professional,"#3498db"],["Filing Fee",selected.filingFee,"#7a9ab8"],["Transport",selected.transport,"#7a9ab8"],["Disbursements",selected.disbursement,"#e67e22"],["Court Runner Cost",selected.courtRunner,"#9b59b6"],["TOTAL",total(selected),"#c9a84c"],["Client Deposit",selected.deposit,"#2ecc71"],["Balance Outstanding",balance(selected),balance(selected)>0?"#e74c3c":"#2ecc71"]].map(([k,v,c])=>(<div key={k} style={{display:"flex",justifyContent:"space-between",padding:"9px 0",borderBottom:"1px solid #152a40"}}><span style={{color:"#5a7a9a",fontSize:13}}>{k}</span><span style={{color:c,fontWeight:["TOTAL","Balance Outstanding"].includes(k)?700:400,fontSize:13}}>{fmtNGN(v)}</span></div>))}<div style={{marginTop:14}}><Badge label={selected.status} color={sc(selected.status)} /></div></Modal>)}{showAdd&&(<Modal title="Create Invoice" onClose={()=>setShowAdd(false)}><div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:13}}><FI label="Client Name" placeholder="Client" value={form.client} onChange={e=>setForm({...form,client:e.target.value})} /><FI label="Matter Reference" placeholder="Title or ID" value={form.matter} onChange={e=>setForm({...form,matter:e.target.value})} /><FI label="Professional Fee (₦)" placeholder="e.g. 500000" value={form.professional} onChange={e=>setForm({...form,professional:e.target.value})} /><FI label="Filing Fee (₦)" placeholder="e.g. 18000" value={form.filingFee} onChange={e=>setForm({...form,filingFee:e.target.value})} /><FI label="Transport (₦)" placeholder="e.g. 9000" value={form.transport} onChange={e=>setForm({...form,transport:e.target.value})} /><FI label="Disbursements (₦)" placeholder="e.g. 13500" value={form.disbursement} onChange={e=>setForm({...form,disbursement:e.target.value})} /><FI label="Court Runner Cost (₦)" placeholder="e.g. 8000" value={form.courtRunner} onChange={e=>setForm({...form,courtRunner:e.target.value})} /><FI label="Client Deposit (₦)" placeholder="e.g. 600000" value={form.deposit} onChange={e=>setForm({...form,deposit:e.target.value})} /></div><GoldBtn onClick={add} full>Create Invoice</GoldBtn></Modal>)}</div>);}

function DesktopUpdates({matters,clients}){
  const [mIdx,setMIdx]=useState(0);const [event,setEvent]=useState("adjourned");const [adjDate,setAdjDate]=useState("12 June 2026");const [custom,setCustom]=useState("");const [channel,setChannel]=useState("WhatsApp");const [toPhone,setToPhone]=useState("");const [sending,setSending]=useState(false);const [result,setResult]=useState(null);const [log,setLog]=useState([]);
  const matter=matters[mIdx]||matters[0];const client=clients.find(c=>c.name===matter?.client);
  useEffect(()=>{setToPhone(client?.phone||"");},[client]);
  const tpls={adjourned:`Dear ${matter?.client},\n\nYour matter — ${matter?.title} — came up today at the ${matter?.court}.\n\nThe court has adjourned to ${adjDate} for the next hearing.\n\nWarm regards,\nCourtDesk Chambers.`,served:`Dear ${matter?.client},\n\nAll originating processes in your matter — ${matter?.title} — have been duly served on the opposing party.\n\nSuit No: ${matter?.suitNo}. Next court date: ${matter?.nextDate}.\n\nWarm regards,\nCourtDesk Chambers.`,filed:`Dear ${matter?.client},\n\nYour matter has been formally filed at the ${matter?.court}. Suit No: ${matter?.suitNo} has been generated.\n\nWe will notify you of the first hearing date.\n\nWarm regards,\nCourtDesk Chambers.`,judgment:`Dear ${matter?.client},\n\nJudgment has been delivered in the matter of ${matter?.title}.\n\nKindly contact our office to discuss next steps and enforcement.\n\nWarm regards,\nCourtDesk Chambers.`,custom};
  const msg=tpls[event]||"";
  const send=async()=>{if(!msg.trim()||!toPhone)return;setSending(true);setResult(null);try{let sid;if(channel==="WhatsApp")sid=await sendWhatsApp(toPhone,msg);else if(channel==="SMS")sid=await sendSMS(toPhone,msg);else sid="EMAIL_"+Date.now();setResult({ok:true,sid});setLog(prev=>[{matter:matter.id,client:matter.client,channel,phone:toPhone,time:new Date().toLocaleTimeString("en-NG",{hour:"2-digit",minute:"2-digit"}),sid},...prev]);}catch(e){setResult({ok:false,err:e.message});}setSending(false);};
  return(
    <div>
      <div style={{marginBottom:22}}><h2 style={{margin:0,color:"#e8dcc8",fontFamily:"'Playfair Display',Georgia,serif",fontSize:26}}>Client Update Centre</h2><p style={{margin:"5px 0 0",color:"#3a5a7a",fontSize:13}}>Generate and send professional client updates via WhatsApp, SMS or Email</p></div>
      <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:22}}>
        <div style={{background:"#0a1e34",border:"1px solid #1e3a5a",borderRadius:14,padding:22}}>
          <div style={{color:"#c9a84c",fontSize:12,fontWeight:700,letterSpacing:0.5,marginBottom:16}}>UPDATE GENERATOR</div>
          <div style={{marginBottom:13}}><label style={{display:"block",color:"#5a7a9a",fontSize:11,marginBottom:5,letterSpacing:0.5}}>SELECT MATTER</label><select value={mIdx} onChange={e=>setMIdx(Number(e.target.value))} style={{width:"100%",background:"#0d1f35",border:"1px solid #1e3a5a",borderRadius:8,padding:"10px 13px",color:"#e8dcc8",fontSize:13,outline:"none"}}>{matters.map((m,i)=><option key={m.id} value={i}>{m.id} — {m.client}</option>)}</select></div>
          <FS label="Update Type" options={["adjourned","served","filed","judgment","custom"]} value={event} onChange={e=>setEvent(e.target.value)} />
          {event==="adjourned"&&<FI label="Next Adjournment Date" placeholder="e.g. 25 June 2026" value={adjDate} onChange={e=>setAdjDate(e.target.value)} />}
          {event==="custom"&&<div style={{marginBottom:13}}><label style={{display:"block",color:"#5a7a9a",fontSize:11,marginBottom:5,letterSpacing:0.5}}>CUSTOM MESSAGE</label><textarea value={custom} onChange={e=>setCustom(e.target.value)} rows={4} placeholder="Type your client update…" style={{width:"100%",background:"#0d1f35",border:"1px solid #1e3a5a",borderRadius:8,padding:"10px 13px",color:"#e8dcc8",fontSize:13,outline:"none",resize:"vertical",boxSizing:"border-box",fontFamily:"Georgia,serif"}} /></div>}
          <FI label="Client Phone Number" placeholder="e.g. +2348031234567" value={toPhone} onChange={e=>setToPhone(e.target.value)} />
          <div style={{marginBottom:14}}><label style={{display:"block",color:"#5a7a9a",fontSize:11,marginBottom:8,letterSpacing:0.5}}>SEND VIA</label><div style={{display:"flex",gap:8}}>{[["WhatsApp","📱","#25D366"],["SMS","💬","#3498db"],["Email","📧","#e67e22"]].map(([c,icon,color])=>(<button key={c} onClick={()=>setChannel(c)} style={{flex:1,background:channel===c?`${color}22`:"#0d1f35",border:`1px solid ${channel===c?color:"#1e3a5a"}`,borderRadius:8,padding:"9px 0",color:channel===c?color:"#5a7a9a",cursor:"pointer",fontSize:12,fontWeight:600}}>{icon} {c}</button>))}</div></div>
        </div>
        <div style={{background:"#0a1e34",border:"1px solid #1e3a5a",borderRadius:14,padding:22}}>
          <div style={{color:"#c9a84c",fontSize:12,fontWeight:700,letterSpacing:0.5,marginBottom:14}}>PREVIEW</div>
          <div style={{background:"#060f1e",border:"1px solid #1e3a5a",borderRadius:14,padding:18,minHeight:220,marginBottom:16}}>
            <div style={{display:"flex",gap:8,alignItems:"center",marginBottom:12,paddingBottom:10,borderBottom:"1px solid #1e3a5a"}}>
              <div style={{width:28,height:28,borderRadius:"50%",background:channel==="WhatsApp"?"#25D36633":"#3498db33",display:"flex",alignItems:"center",justifyContent:"center",fontSize:14}}>{channel==="WhatsApp"?"📱":channel==="SMS"?"💬":"📧"}</div>
              <div><div style={{color:"#e8dcc8",fontSize:12,fontWeight:700}}>To: {matter?.client}</div><div style={{color:"#3a5a7a",fontSize:11}}>{toPhone||"No phone set"} · via {channel}</div></div>
            </div>
            <div style={{color:"#c8daea",fontSize:13,lineHeight:1.8,fontFamily:"Georgia,serif",whiteSpace:"pre-wrap"}}>{msg}</div>
          </div>
          {result&&(<div style={{background:result.ok?"#0a2018":"#200a0a",border:`1px solid ${result.ok?"#2ecc71":"#e74c3c"}44`,borderRadius:8,padding:"10px 14px",marginBottom:12}}>{result.ok?<><div style={{color:"#2ecc71",fontWeight:700,fontSize:13}}>✓ Sent successfully</div><div style={{color:"#2a5a3a",fontSize:11}}>SID: {result.sid}</div></>:<><div style={{color:"#e74c3c",fontWeight:700,fontSize:13}}>✗ Send failed</div><div style={{color:"#6a2a2a",fontSize:11}}>{result.err}</div></>}</div>)}
          <div style={{display:"flex",gap:10}}><button onClick={send} disabled={sending||!msg.trim()||!toPhone} style={{flex:1,background:sending?"#1a5a30":"#2ecc71",border:"none",borderRadius:8,padding:"12px",color:"#0a1628",fontWeight:700,cursor:sending||!toPhone?"not-allowed":"pointer",fontSize:14,opacity:!toPhone?0.5:1}}>{sending?`Sending via ${channel}…`:`Send via ${channel}`}</button><GoldBtn secondary onClick={()=>setResult(null)}>Clear</GoldBtn></div>
        </div>
      </div>
      {log.length>0&&(<div style={{marginTop:22,background:"#0a1e34",border:"1px solid #1e3a5a",borderRadius:14,padding:20}}><div style={{color:"#c9a84c",fontSize:12,fontWeight:700,letterSpacing:0.5,marginBottom:14}}>SENT MESSAGES LOG</div>{log.map((l,i)=>(<div key={i} style={{padding:"10px 0",borderBottom:"1px solid #152a40",display:"flex",justifyContent:"space-between",flexWrap:"wrap",gap:8}}><div><div style={{color:"#e8dcc8",fontSize:13}}>{l.client}</div><div style={{color:"#3a5a7a",fontSize:12}}>Matter: {l.matter} · {l.time}</div></div><div style={{display:"flex",gap:8,alignItems:"center"}}><Badge label={l.channel} color={l.channel==="WhatsApp"?"#25D366":"#3498db"} /><Badge label="Sent" color="#2ecc71" /></div></div>))}</div>)}
    </div>
  );
}

function DesktopLawyers({lawyers,setLawyers}){const [selected,setSelected]=useState(null);const [showAdd,setShowAdd]=useState(false);const [form,setForm]=useState({name:"",title:"Associate",specialization:"",email:"",phone:"",bar:"",yearsExp:"",status:"Available",rating:4.5,cases:0});const add=async()=>{if(!form.name||!form.email)return;await setLawyers(prev=>[...prev,{...form,id:Date.now(),yearsExp:Number(form.yearsExp)}]);setShowAdd(false);setForm({name:"",title:"Associate",specialization:"",email:"",phone:"",bar:"",yearsExp:"",status:"Available",rating:4.5,cases:0});};return(<div><div style={{display:"flex",justifyContent:"space-between",alignItems:"center",marginBottom:22}}><div><h2 style={{margin:0,color:"#e8dcc8",fontFamily:"'Playfair Display',Georgia,serif",fontSize:26}}>Legal Team</h2><p style={{margin:"4px 0 0",color:"#3a5a7a",fontSize:13}}>{lawyers.length} lawyers on staff</p></div><GoldBtn onClick={()=>setShowAdd(true)}>+ Add Lawyer</GoldBtn></div><div style={{display:"grid",gridTemplateColumns:"repeat(auto-fill, minmax(290px, 1fr))",gap:16}}>{lawyers.map(l=>(<div key={l.id} onClick={()=>setSelected(l)} style={{background:"#0a1e34",border:"1px solid #1e3a5a",borderRadius:15,padding:22,cursor:"pointer",position:"relative",overflow:"hidden"}} onMouseEnter={e=>e.currentTarget.style.borderColor="#c9a84c55"} onMouseLeave={e=>e.currentTarget.style.borderColor="#1e3a5a"}><div style={{display:"flex",gap:13,alignItems:"center",marginBottom:14}}><div style={{width:50,height:50,borderRadius:"50%",background:"linear-gradient(135deg,#1e3a5a,#0d2a45)",border:"2px solid #c9a84c33",display:"flex",alignItems:"center",justifyContent:"center",color:"#c9a84c",fontWeight:700,fontSize:16}}>{l.name.split(" ").map(n=>n[0]).join("")}</div><div style={{flex:1}}><div style={{color:"#e8dcc8",fontFamily:"'Playfair Display',Georgia,serif",fontSize:15}}>{l.name}</div><div style={{color:"#c9a84c",fontSize:11,marginTop:1}}>{l.title}</div></div><Badge label={l.status} color={sc(l.status)} /></div><div style={{color:"#5a7a9a",fontSize:12,fontStyle:"italic",marginBottom:13}}>{l.specialization}</div><div style={{display:"flex",justifyContent:"space-around",borderTop:"1px solid #1e3a5a",paddingTop:13}}>{[["Matters",l.cases,"#c9a84c"],["Rating",l.rating,"#f39c12"],["Yrs",l.yearsExp,"#3498db"]].map(([lb,v,c])=>(<div key={lb} style={{textAlign:"center"}}><div style={{color:c,fontWeight:700,fontSize:17}}>{v}</div><div style={{color:"#3a5a7a",fontSize:11}}>{lb}</div></div>))}</div></div>))}</div>{selected&&(<Modal title={selected.name} onClose={()=>setSelected(null)}><div style={{textAlign:"center",marginBottom:16}}><div style={{width:60,height:60,borderRadius:"50%",background:"#1e3a5a",border:"2px solid #c9a84c44",display:"flex",alignItems:"center",justifyContent:"center",color:"#c9a84c",fontWeight:700,fontSize:20,margin:"0 auto 8px"}}>{selected.name.split(" ").map(n=>n[0]).join("")}</div><div style={{color:"#c9a84c",fontSize:12}}>{selected.title}</div></div>{[["Specialization",selected.specialization],["NBA Bar No.",selected.bar],["Email",selected.email],["Phone",selected.phone],["Years Experience",`${selected.yearsExp} years`],["Active Matters",selected.cases],["Status",selected.status],["Rating",`${selected.rating} / 5.0`]].map(([k,v])=>(<div key={k} style={{display:"flex",justifyContent:"space-between",padding:"9px 0",borderBottom:"1px solid #152a40"}}><span style={{color:"#4a6a8a",fontSize:12}}>{k}</span><span style={{color:"#e8dcc8",fontSize:12}}>{v}</span></div>))}</Modal>)}{showAdd&&(<Modal title="Add New Lawyer" onClose={()=>setShowAdd(false)}><FI label="Full Name" placeholder="Lawyer's full name" value={form.name} onChange={e=>setForm({...form,name:e.target.value})} /><div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:13}}><FS label="Title" options={["Senior Partner (SAN)","Partner","Senior Associate","Associate","Junior Associate","Pupil","Of Counsel"]} value={form.title} onChange={e=>setForm({...form,title:e.target.value})} /><FI label="Years Experience" placeholder="e.g. 7" value={form.yearsExp} onChange={e=>setForm({...form,yearsExp:e.target.value})} /></div><FI label="Specialization" placeholder="e.g. Commercial Litigation" value={form.specialization} onChange={e=>setForm({...form,specialization:e.target.value})} /><FI label="Email" placeholder="lawyer@chambers.ng" value={form.email} onChange={e=>setForm({...form,email:e.target.value})} /><FI label="Phone" placeholder="0803-000-0000" value={form.phone} onChange={e=>setForm({...form,phone:e.target.value})} /><FI label="NBA Bar Number" placeholder="e.g. NBA/LAG/2020/155" value={form.bar} onChange={e=>setForm({...form,bar:e.target.value})} /><GoldBtn onClick={add} full>Add Lawyer</GoldBtn></Modal>)}</div>);}

// ─────────────────────────────────────────────────────────────────────────────
//  ROOT APP
// ─────────────────────────────────────────────────────────────────────────────
export default function App() {
const [matters, setMatters, mLoaded] = useSupabaseData("matters", SEED_MATTERS);
const [clients, setClients] = useSupabaseData("clients", SEED_CLIENTS);
const [tasks, setTasks] = useSupabaseData("tasks", SEED_TASKS);
const [invoices, setInvoices] = useSupabaseData("invoices", SEED_INVOICES);
const [proofs, setProofs] = useSupabaseData("proofs", SEED_PROOFS);
const [lawyers, setLawyers] = useSupabaseData("lawyers", SEED_LAWYERS);

  useEffect(() => {
    const link = document.createElement("link");
    link.href = "https://fonts.googleapis.com/css2?family=Playfair+Display:ital,wght@0,600;0,700;1,400&display=swap";
    link.rel = "stylesheet";
    document.head.appendChild(link);
    Store.get("cd_session_v3").then(s => { if(s?.email) setUser(s); });
  }, []);

  const handleLogin = async (u) => {
  await Store.set("cd_session_v3", u);
  setUser(u);
};
  const handleLogout = async () => { await Store.set("cd_session_v3", null); setUser(null); };

  if (!user) return <LoginScreen onLogin={handleLogin} />;

  if (!mLoaded) return (
    <div style={{minHeight:"100vh",background:"#040c18",display:"flex",alignItems:"center",justifyContent:"center",fontFamily:"Georgia,serif"}}>
      <div style={{textAlign:"center"}}><div style={{fontSize:40,marginBottom:14}}>⚖</div><div style={{color:"#c9a84c",fontFamily:"'Playfair Display',Georgia,serif",fontSize:18}}>Loading CourtDesk Nigeria…</div><div style={{color:"#3a5a7a",fontSize:13,marginTop:6}}>Syncing your chambers data</div></div>
    </div>
  );

  // Court runners always get mobile view regardless of screen size
  if (user.role === "runner") {
    return (
      <>
        <OfflineBar />
        <PWAInstallBanner />
        <MobileRunnerApp user={user} tasks={tasks} setTasks={setTasks} onLogout={handleLogout} />
      </>
    );
  }

  // Lawyers / Admin get full desktop app + PWA install prompt
  return (
    <>
      <OfflineBar />
      <PWAInstallBanner />
      <DesktopApp
        user={user} onLogout={handleLogout}
        matters={matters} setMatters={setMatters}
        clients={clients} setClients={setClients}
        tasks={tasks} setTasks={setTasks}
        invoices={invoices} setInvoices={setInvoices}
        proofs={proofs} setProofs={setProofs}
        lawyers={lawyers} setLawyers={setLawyers}
      />
    </>
  );
}
