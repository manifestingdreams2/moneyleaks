import { useState, useMemo, useCallback } from "react";
import { PieChart, Pie, Cell, ResponsiveContainer, Tooltip, BarChart, Bar, XAxis, YAxis, CartesianGrid, LineChart, Line } from "recharts";

// ─────────────────────────────────────────────────────────────────────────────
// PERSISTENCE
// ─────────────────────────────────────────────────────────────────────────────
function useLocalStorage(key, initial) {
    const [value, setValue] = useState(() => {
      try {
        const stored = localStorage.getItem(key);
        return stored ? JSON.parse(stored) : initial;
      } catch {
        return initial;
      }
    });
  
    const set = (newValue) => {
      setValue((prev) => {
        const valueToStore =
          typeof newValue === "function" ? newValue(prev) : newValue;
  
        localStorage.setItem(key, JSON.stringify(valueToStore));
        return valueToStore;
      });
    };
  
    return [value, set];
  }

// ─────────────────────────────────────────────────────────────────────────────
// INITIAL DATA
// ─────────────────────────────────────────────────────────────────────────────
const INITIAL_INCOME = [
  { id:"i1", label:"Security Guard (43 hrs/wk @ $35)", amount:6522, category:"Employment" },
  { id:"i2", label:"GuardMaps MRR",                    amount:0,    category:"Business"   },
  { id:"i3", label:"Van / Delivery Work",              amount:0,    category:"Gig"        },
  { id:"i4", label:"Options Trading",                  amount:0,    category:"Investing"  },
  { id:"i5", label:"Stocks / Dividends",               amount:0,    category:"Investing"  },
];
const INITIAL_EXPENSES = [
  { id:"e1",  label:"Rent",                    amount:500,  category:"Housing",       flag:false },
  { id:"e2",  label:"Health Insurance",         amount:235,  category:"Insurance",     flag:false },
  { id:"e3",  label:"Car Insurance (3 cars)",   amount:167,  category:"Insurance",     flag:false },
  { id:"e4",  label:"T-Mobile",                 amount:300,  category:"Telecom",       flag:true  },
  { id:"e5",  label:"Subscriptions",            amount:232,  category:"Subscriptions", flag:true  },
  { id:"e6",  label:"Breakfast (weekdays)",     amount:290,  category:"Food",          flag:true  },
  { id:"e7",  label:"Lunch – Raley's (4x/wk)", amount:346,  category:"Food",          flag:true  },
  { id:"e8",  label:"Sunday Oxtail 🍖",         amount:195,  category:"Food",          flag:true  },
  { id:"e9",  label:"Gas",                      amount:375,  category:"Transport",     flag:false },
  { id:"e10", label:"Haircuts",                 amount:120,  category:"Personal",      flag:false },
  { id:"e11", label:"Car Wash",                 amount:20,   category:"Personal",      flag:false },
  { id:"e12", label:"Lawyer ($3k total)",       amount:500,  category:"Legal",         flag:false },
];
const INITIAL_CREDIT = [
  { id:"c1", label:"Credit Card 1", balance:0, limit:0, minPayment:0, apr:24.99, category:"Credit Card" },
  { id:"c2", label:"Credit Card 2", balance:0, limit:0, minPayment:0, apr:21.99, category:"Credit Card" },
  { id:"c3", label:"Auto Loan",     balance:0, limit:0, minPayment:0, apr:0,     category:"Auto Loan"   },
];

// ─────────────────────────────────────────────────────────────────────────────
// CONSTANTS
// ─────────────────────────────────────────────────────────────────────────────
const SAVINGS_TIPS = {
  "e4":"T-Mobile family plans or Mint Mobile could cut this to ~$60–$80/mo. Potential save: $220+/mo.",
  "e5":"Audit your bank for hidden recurring charges — you likely have $50–$100 in forgotten subs.",
  "e6":"Meal prepping Sunday could cut breakfast spend by 60–70%. That's ~$175/mo back.",
  "e7":"Packing lunch 2–3 days/wk saves ~$170/mo without fully giving up the routine.",
  "e8":"That's $195/mo in oxtails 😂 Even cutting to biweekly saves ~$97/mo.",
};
const CAT_COLORS = {
  Housing:"#60a5fa", Insurance:"#a78bfa", Telecom:"#f87171",
  Subscriptions:"#fb923c", Food:"#fbbf24", Transport:"#34d399",
  Personal:"#94a3b8", Legal:"#e879f9", Employment:"#00e5a0",
  Business:"#38bdf8", Gig:"#f472b6", Investing:"#facc15",
  "Credit Card":"#f87171", "Auto Loan":"#fb923c",
  Gas:"#34d399", Bills:"#a78bfa", Shopping:"#f472b6",
  Entertainment:"#38bdf8", Health:"#4ade80", Other:"#94a3b8",
  Checking:"#00e5a0", Savings:"#38bdf8", Cash:"#4ade80",
  Investments:"#facc15", "Car Value":"#fb923c", Property:"#60a5fa",
  "Other Assets":"#94a3b8", "Car Loan":"#f87171", "Personal Loan":"#fb923c",
  Mortgage:"#a78bfa", "Student Loan":"#e879f9", "Other Debt":"#94a3b8",
};
const DTI_ZONES = [
  { max:36,  label:"Healthy",    color:"#00e5a0", desc:"Strong position. Lenders approve easily."     },
  { max:43,  label:"Acceptable", color:"#f5c842", desc:"Most lenders OK with this. Watch for creep."  },
  { max:50,  label:"Stretched",  color:"#ff8c42", desc:"Getting tight. Cut or grow income soon."      },
  { max:100, label:"High Risk",  color:"#ff4d6d", desc:"Debt is outpacing income. Action needed now." },
];
const PERIODS = [
  { key:"monthly",   label:"Monthly",   mult:1  },
  { key:"quarterly", label:"Quarterly", mult:3  },
  { key:"yearly",    label:"Yearly",    mult:12 },
];
const SPEND_CATS = ["Food","Gas","Bills","Shopping","Entertainment","Transportation","Health","Subscriptions","Other"];
const ASSET_CATS  = ["Checking","Savings","Cash","Investments","Car Value","Property","Other Assets"];
const LIAB_CATS   = ["Credit Card","Car Loan","Personal Loan","Mortgage","Student Loan","Other Debt"];

// ─────────────────────────────────────────────────────────────────────────────
// INTELLIGENCE HELPERS
// ─────────────────────────────────────────────────────────────────────────────
function getCoverageStatus(ratio, totalLiabs) {
  if (totalLiabs === 0) return { label:"No Debt",   color:"#00e5a0", bg:"#00e5a015" };
  if (ratio < 100)      return { label:"High Risk",  color:"#ff4d6d", bg:"#ff4d6d15" };
  if (ratio < 200)      return { label:"Stable",     color:"#f5c842", bg:"#f5c84215" };
  if (ratio < 400)      return { label:"Strong",     color:"#38bdf8", bg:"#38bdf815" };
  return                       { label:"Excellent",  color:"#00e5a0", bg:"#00e5a015" };
}

function getCoverageInsight(ratio, totalLiabs, netWorth) {
  if (totalLiabs === 0 && netWorth <= 0) return "Start building assets to create a positive net worth foundation.";
  if (totalLiabs === 0)                  return "You carry no liabilities. Every asset goes directly toward your net worth.";
  if (ratio < 100)  return "⚠️ Your assets do not cover your liabilities. Prioritize debt reduction immediately.";
  if (ratio < 150)  return "Your assets slightly exceed your liabilities. Stay consistent and keep adding to assets.";
  if (ratio < 200)  return "Solid coverage. Your assets are outpacing your debts. Keep the momentum.";
  if (ratio < 400)  return "Your assets strongly outperform your liabilities. You're building real wealth.";
  return "🏆 Excellent financial position. Your assets dwarf your liabilities.";
}

function getProjectionData(netWorth, monthlyLeak, months = 12) {
  const current = [], improved = [];
  for (let i = 0; i <= months; i++) {
    current.push({  month: i, value: Math.round(netWorth - (monthlyLeak * i))           });
    improved.push({ month: i, value: Math.round(netWorth + (monthlyLeak * 0.5 * i))     });
  }
  return { current, improved };
}

function getRealityStatus(monthlyLeak, totalIncome) {
  const leakPct = totalIncome > 0 ? (monthlyLeak / totalIncome) * 100 : 0;
  if (leakPct === 0)   return { color:"#00e5a0", icon:"✅", label:"Optimized"  };
  if (leakPct < 10)    return { color:"#4ade80", icon:"✅", label:"Controlled" };
  if (leakPct < 20)    return { color:"#f5c842", icon:"⚠️", label:"Watch Out"  };
  if (leakPct < 30)    return { color:"#ff8c42", icon:"⚠️", label:"Leaking"   };
  return                      { color:"#ff4d6d", icon:"🚨", label:"Critical"   };
}

// ─────────────────────────────────────────────────────────────────────────────
// SHARED UI PRIMITIVES
// ─────────────────────────────────────────────────────────────────────────────
const getZone  = r => DTI_ZONES.find(z => r <= z.max) || DTI_ZONES[3];
const fmt      = n => n.toLocaleString("en-US",{style:"currency",currency:"USD",maximumFractionDigits:0});
const fmtDec   = n => n.toLocaleString("en-US",{style:"currency",currency:"USD",minimumFractionDigits:2,maximumFractionDigits:2});
const fmtPct   = n => n.toFixed(1)+"%";
const todayStr   = () => new Date().toISOString().slice(0,10);
const startOfWeek = () => { const d=new Date(); d.setDate(d.getDate()-d.getDay()); return d.toISOString().slice(0,10); };

function Card({ children, style={}, onClick }) {
  return <div onClick={onClick} style={{background:"#12131a",border:"1px solid #1e1f2e",borderRadius:14,padding:14,...style}}>{children}</div>;
}
function SectionLabel({ children, color="#64748b" }) {
  return <p style={{fontSize:10,fontWeight:700,letterSpacing:1,color,textTransform:"uppercase",marginBottom:12}}>{children}</p>;
}
function Pill({ label, color, bg }) {
  return <span style={{fontSize:9,color,background:bg||color+"18",padding:"2px 8px",borderRadius:99,fontWeight:700,letterSpacing:0.5}}>{label.toUpperCase()}</span>;
}
function ProgressBar({ pct, color="#00e5a0", height=6 }) {
  return (
    <div style={{background:"#1e1f2e",borderRadius:99,height,overflow:"hidden"}}>
      <div style={{width:`${Math.min(Math.max(pct,0),100)}%`,height:"100%",background:color,borderRadius:99,transition:"width 0.5s ease"}}/>
    </div>
  );
}
function MicroToast({ msg, color="#00e5a0" }) {
  if (!msg) return null;
  return (
    <div style={{background:`${color}15`,border:`1px solid ${color}30`,borderRadius:10,padding:"10px 14px",
      display:"flex",alignItems:"center",gap:8,marginBottom:10,animation:"fadeIn 0.3s ease"}}>
      <span style={{fontSize:14}}>💡</span>
      <span style={{fontSize:12,color,fontWeight:600,lineHeight:1.4}}>{msg}</span>
    </div>
  );
}
function GaugeMeter({ ratio }) {
  const zone=getZone(ratio), angle=(Math.min(ratio,100)/100)*180;
  const r=76,cx=100,cy=90, rad=d=>d*Math.PI/180;
  const nx=cx+r*Math.cos(rad(180-angle)), ny=cy-r*Math.sin(rad(180-angle));
  const arc=(s,e,c)=>{
    const x1=cx+r*Math.cos(rad(s)),y1=cy-r*Math.sin(rad(s));
    const x2=cx+r*Math.cos(rad(e)),y2=cy-r*Math.sin(rad(e));
    return <path d={`M ${x1} ${y1} A ${r} ${r} 0 0 0 ${x2} ${y2}`} stroke={c} strokeWidth="13" fill="none" strokeLinecap="butt"/>;
  };
  return (
    <div style={{textAlign:"center"}}>
      <svg viewBox="0 0 200 105" style={{width:"100%",maxWidth:220,display:"block",margin:"0 auto"}}>
        {arc(0,65,"#00e5a0")}{arc(65,78,"#f5c842")}{arc(78,90,"#ff8c42")}{arc(90,180,"#ff4d6d")}
        <line x1={cx} y1={cy} x2={nx} y2={ny} stroke="white" strokeWidth="2.5" strokeLinecap="round"/>
        <circle cx={cx} cy={cy} r="5" fill="white"/>
        <text x={cx} y={cy-20} textAnchor="middle" fill="white" fontSize="21" fontWeight="800" fontFamily="monospace">{ratio.toFixed(1)}%</text>
        <text x={cx} y={cy-6}  textAnchor="middle" fill={zone.color} fontSize="9" fontFamily="monospace" fontWeight="700">{zone.label.toUpperCase()}</text>
      </svg>
      <p style={{color:"#94a3b8",fontSize:11,marginTop:4}}>{zone.desc}</p>
    </div>
  );
}
function LawyerTracker({ paid, total, monthly }) {
  const pct=Math.round((paid/total)*100), remaining=total-paid, months=Math.ceil(remaining/monthly);
  return (
    <div style={{background:"#12131a",border:"1px solid #2a2b3d",borderRadius:12,padding:"14px 16px"}}>
      <div style={{display:"flex",justifyContent:"space-between",alignItems:"center",marginBottom:10}}>
        <span style={{color:"#e879f9",fontSize:11,fontWeight:700,letterSpacing:1,textTransform:"uppercase"}}>⚖️ Lawyer Payoff</span>
        <span style={{color:"#94a3b8",fontSize:10}}>{months} mo left · {fmt(remaining)} remaining</span>
      </div>
      <ProgressBar pct={pct} color="url(#lawyerGrad)" height={8}/>
      <svg width="0" height="0"><defs><linearGradient id="lawyerGrad" x1="0" x2="1"><stop offset="0%" stopColor="#e879f9"/><stop offset="100%" stopColor="#a855f7"/></linearGradient></defs></svg>
      <div style={{display:"flex",justifyContent:"space-between",marginTop:6}}>
        <span style={{color:"#e879f9",fontSize:10}}>{fmt(paid)} paid</span>
        <span style={{color:"#64748b",fontSize:10}}>{fmt(total)} total</span>
      </div>
    </div>
  );
}
function PeriodToggle({ value, onChange }) {
  return (
    <div style={{display:"flex",gap:4,background:"#1e1f2e",padding:3,borderRadius:8,marginBottom:14}}>
      {PERIODS.map(p=>(
        <button key={p.key} onClick={()=>onChange(p.key)}
          style={{flex:1,padding:"5px 0",border:"none",borderRadius:6,fontSize:10,fontWeight:700,
            cursor:"pointer",background:value===p.key?"#00e5a0":"transparent",
            color:value===p.key?"#0a0b12":"#64748b",transition:"all 0.2s"}}>
          {p.label}
        </button>
      ))}
    </div>
  );
}
function EditableAmount({ value, onChange }) {
  const [editing,setEditing]=useState(false);
  const [draft,setDraft]=useState(String(value));
  if(editing) return(
    <input autoFocus value={draft} onChange={e=>setDraft(e.target.value)}
      onBlur={()=>{onChange(parseFloat(draft)||0);setEditing(false);}}
      onKeyDown={e=>{if(e.key==="Enter"){onChange(parseFloat(draft)||0);setEditing(false);}}}
      style={{width:80,background:"#1e1f2e",border:"1px solid #60a5fa",borderRadius:6,color:"white",fontSize:13,padding:"2px 6px",textAlign:"right",fontFamily:"monospace"}}/>
  );
  return(
    <span onClick={()=>{setDraft(String(value));setEditing(true);}} title="Tap to edit"
      style={{cursor:"pointer",color:"#e2e8f0",fontSize:13,fontFamily:"monospace",borderBottom:"1px dashed #374151"}}>
      {fmt(value)}
    </span>
  );
}
function EditableField({ value, onChange, prefix="", suffix="" }) {
  const [editing,setEditing]=useState(false);
  const [draft,setDraft]=useState(String(value));
  if(editing) return(
    <input autoFocus value={draft} onChange={e=>setDraft(e.target.value)}
      onBlur={()=>{onChange(parseFloat(draft)||0);setEditing(false);}}
      onKeyDown={e=>{if(e.key==="Enter"){onChange(parseFloat(draft)||0);setEditing(false);}}}
      style={{width:72,background:"#1e1f2e",border:"1px solid #60a5fa",borderRadius:6,color:"white",fontSize:12,padding:"2px 5px",textAlign:"right",fontFamily:"monospace"}}/>
  );
  return(
    <span onClick={()=>{setDraft(String(value));setEditing(true);}} title="Tap to edit"
      style={{cursor:"pointer",color:"#e2e8f0",fontSize:12,fontFamily:"monospace",borderBottom:"1px dashed #374151"}}>
      {prefix}{value}{suffix}
    </span>
  );
}
function UtilBar({ pct }) {
  const color=pct>=90?"#ff4d6d":pct>=70?"#ff8c42":pct>=30?"#f5c842":"#00e5a0";
  return <ProgressBar pct={pct} color={color} height={5}/>;
}
function TotalsFooter({ monthly, color }) {
  return(
    <div style={{marginTop:12,paddingTop:12,borderTop:"1px solid #2a2b3d",display:"flex",flexDirection:"column",gap:6}}>
      {[["Monthly",1],["Quarterly",3],["Yearly",12]].map(([label,mult])=>(
        <div key={label} style={{display:"flex",justifyContent:"space-between",alignItems:"center"}}>
          <span style={{fontSize:12,fontWeight:700,color:"#64748b"}}>{label}</span>
          <span style={{fontFamily:"monospace",fontSize:14,fontWeight:800,color}}>{fmt(monthly*mult)}</span>
        </div>
      ))}
    </div>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// FINANCIAL REALITY CHECK (cross-tab intelligence)
// ─────────────────────────────────────────────────────────────────────────────
function FinancialRealityCheck({ totalIncome, monthlyLeak, netWorth }) {
  const yearlyLeak   = monthlyLeak * 12;
  const status       = getRealityStatus(monthlyLeak, totalIncome);
  const leakPct      = totalIncome > 0 ? ((monthlyLeak / totalIncome) * 100).toFixed(1) : 0;
  const hasLeaks     = monthlyLeak > 0;

  return (
    <div style={{background:"#0f0f18",border:`1px solid ${status.color}30`,borderRadius:16,padding:16}}>
      <div style={{display:"flex",justifyContent:"space-between",alignItems:"center",marginBottom:12}}>
        <SectionLabel color={status.color}>🧠 Financial Reality Check</SectionLabel>
        <Pill label={status.label} color={status.color}/>
      </div>

      <div style={{display:"grid",gridTemplateColumns:"1fr 1fr 1fr",gap:8,marginBottom:14}}>
        {[
          {label:"Net Worth",    value:fmtDec(netWorth),          color: netWorth>=0?"#00e5a0":"#ff4d6d"},
          {label:"Monthly Leak", value:fmt(monthlyLeak),          color:"#f87171"},
          {label:"Yearly Leak",  value:fmt(yearlyLeak),           color:"#ff8c42"},
        ].map(k=>(
          <div key={k.label} style={{background:"#1a1b26",borderRadius:10,padding:"10px 10px",border:"1px solid #1e1f2e"}}>
            <div style={{fontSize:9,color:"#64748b",fontWeight:700,textTransform:"uppercase",marginBottom:4,letterSpacing:0.5}}>{k.label}</div>
            <div style={{fontFamily:"monospace",fontSize:12,fontWeight:800,color:k.color,lineHeight:1.2}}>{k.value}</div>
          </div>
        ))}
      </div>

      {/* Leak % of income visual */}
      {totalIncome > 0 && (
        <div style={{marginBottom:14}}>
          <div style={{display:"flex",justifyContent:"space-between",marginBottom:4}}>
            <span style={{fontSize:10,color:"#64748b"}}>Leak as % of income</span>
            <span style={{fontFamily:"monospace",fontSize:10,color:status.color,fontWeight:700}}>{leakPct}%</span>
          </div>
          <ProgressBar pct={parseFloat(leakPct)} color={status.color} height={7}/>
        </div>
      )}

      {/* Main insight message */}
      <div style={{background:`${status.color}10`,border:`1px solid ${status.color}20`,borderRadius:10,padding:"12px 14px"}}>
        <p style={{fontSize:12,color:"#e2e8f0",lineHeight:1.6}}>
          {!hasLeaks
            ? "✅ Your spending is fully under control. You are building wealth efficiently."
            : monthlyLeak < totalIncome * 0.10
            ? `✅ Minor leaks of ${fmt(monthlyLeak)}/mo. Small wins here compound fast — ${fmt(yearlyLeak)} back per year.`
            : monthlyLeak < totalIncome * 0.20
            ? `⚠️ You are losing ${fmt(monthlyLeak)}/month (${fmt(yearlyLeak)}/year). Cutting leaks 50% adds ${fmt(yearlyLeak * 0.5)} back annually.`
            : `🚨 You are losing ${fmt(monthlyLeak)}/month (${fmt(yearlyLeak)}/year). At this rate, your net worth will shrink by ${fmt(yearlyLeak)} this year.`
          }
        </p>
      </div>
    </div>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// NET WORTH PROJECTION
// ─────────────────────────────────────────────────────────────────────────────
function NetWorthProjection({ netWorth, monthlyLeak }) {
  const currentEnd  = netWorth - (monthlyLeak * 12);
  const improvedEnd = netWorth + (monthlyLeak * 0.5 * 12);
  const hasChange   = monthlyLeak > 0;

  // Build chart data — quarterly checkpoints
  const chartData = useMemo(() => {
    return [0,3,6,9,12].map(m => ({
      month: m === 0 ? "Now" : `${m}mo`,
      Current:  Math.round(netWorth - (monthlyLeak * m)),
      Improved: Math.round(netWorth + (monthlyLeak * 0.5 * m)),
    }));
  }, [netWorth, monthlyLeak]);

  return (
    <div style={{background:"#0a0f1a",border:"1px solid #38bdf820",borderRadius:16,padding:16}}>
      <SectionLabel color="#38bdf8">📈 Net Worth Projection — 12 Months</SectionLabel>

      {!hasChange ? (
        <div style={{textAlign:"center",padding:"16px 0"}}>
          <p style={{fontSize:13,color:"#94a3b8",lineHeight:1.6}}>
            No leaks detected. Your net worth is projected to remain stable.<br/>
            <div style={{ textAlign: "center", padding: "16px 0" }}>
  <p style={{ fontSize: 13, color: "#94a3b8", lineHeight: 1.6 }}>
    No leaks detected. Your net worth is projected to remain stable.
    <br />
    <span style={{ color: "#00e5a0", fontWeight: 700 }}>
      Add income to watch it grow.
    </span>
  </p>
</div>
          </p>
        </div>
      ) : (
        <>
          {/* Scenario Cards */}
          <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:8,marginBottom:14}}>
            <div style={{background:"#1a0f0f",border:"1px solid #ff4d6d25",borderRadius:12,padding:"12px 12px"}}>
              <div style={{fontSize:9,color:"#ff4d6d",fontWeight:700,textTransform:"uppercase",letterSpacing:0.5,marginBottom:4}}>Current Habits</div>
              <div style={{fontFamily:"monospace",fontSize:15,fontWeight:800,color:currentEnd>=0?"#f87171":"#ff4d6d"}}>{fmtDec(currentEnd)}</div>
              <div style={{fontSize:10,color:"#64748b",marginTop:3}}>in 12 months</div>
              <div style={{fontSize:10,color:"#ff4d6d",marginTop:6}}>
                {currentEnd < netWorth ? `▼ ${fmtDec(netWorth - currentEnd)} lost` : `▲ ${fmtDec(currentEnd - netWorth)} gained`}
              </div>
            </div>
            <div style={{background:"#0d1f1a",border:"1px solid #00e5a025",borderRadius:12,padding:"12px 12px"}}>
              <div style={{fontSize:9,color:"#00e5a0",fontWeight:700,textTransform:"uppercase",letterSpacing:0.5,marginBottom:4}}>50% Leak Reduction</div>
              <div style={{fontFamily:"monospace",fontSize:15,fontWeight:800,color:"#00e5a0"}}>{fmtDec(improvedEnd)}</div>
              <div style={{fontSize:10,color:"#64748b",marginTop:3}}>in 12 months</div>
              <div style={{fontSize:10,color:"#00e5a0",marginTop:6}}>
                ▲ {fmtDec(improvedEnd - currentEnd)} difference
              </div>
            </div>
          </div>

          {/* Projection Chart */}
          <ResponsiveContainer width="100%" height={140}>
            <LineChart data={chartData} margin={{top:4,right:4,left:0,bottom:0}}>
              <CartesianGrid strokeDasharray="3 3" stroke="#1e1f2e"/>
              <XAxis dataKey="month" tick={{fill:"#64748b",fontSize:9}} axisLine={false} tickLine={false}/>
              <YAxis tick={{fill:"#64748b",fontSize:9}} axisLine={false} tickLine={false} tickFormatter={v=>`$${(v/1000).toFixed(0)}k`}/>
              <Tooltip formatter={v=>fmtDec(v)} contentStyle={{background:"#1e1f2e",border:"none",borderRadius:8,fontSize:11}}/>
              <Line type="monotone" dataKey="Current"  stroke="#f87171" strokeWidth={2} dot={false} name="Current Habits"/>
              <Line type="monotone" dataKey="Improved" stroke="#00e5a0" strokeWidth={2} dot={false} strokeDasharray="4 2" name="50% Leaks Cut"/>
            </LineChart>
          </ResponsiveContainer>

          {/* Plain-language summary */}
          <div style={{marginTop:12,background:"#111218",borderRadius:10,padding:"12px 14px",borderLeft:"3px solid #38bdf8"}}>
            <p style={{fontSize:12,color:"#94a3b8",lineHeight:1.7}}>
              <span style={{color:"white",fontWeight:700}}>If you continue current habits:</span><br/>
              → Your net worth could {currentEnd < netWorth ? "drop" : "reach"} <span style={{color:"#f87171",fontWeight:700}}>{fmtDec(currentEnd)}</span> in 12 months<br/><br/>
              <span style={{color:"white",fontWeight:700}}>If you reduce leaks by 50%:</span><br/>
              → Your net worth could reach <span style={{color:"#00e5a0",fontWeight:700}}>{fmtDec(improvedEnd)}</span> in 12 months
            </p>
          </div>
        </>
      )}
    </div>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// DAILY SPENDING TAB
// ─────────────────────────────────────────────────────────────────────────────
function SpendingTab() {
  const [entries,  setEntries ] = useLocalStorage("dti_spending",[]);
  const [filter,   setFilter  ] = useState("today");
  const [showForm, setShowForm] = useState(false);
  const [form,     setForm    ] = useState({amount:"",category:"Food",note:"",date:todayStr()});
  const [formError,setFormError] = useState("");
  const [toast,    setToast   ] = useState("");

  const today     = todayStr();
  const weekStart = startOfWeek();

  const filtered = useMemo(()=>{
    const sorted=[...entries].sort((a,b)=>b.date.localeCompare(a.date)||b.id-a.id);
    if(filter==="today") return sorted.filter(e=>e.date===today);
    if(filter==="week")  return sorted.filter(e=>e.date>=weekStart);
    return sorted;
  },[entries,filter,today,weekStart]);

  const todayTotal = useMemo(()=>entries.filter(e=>e.date===today).reduce((s,e)=>s+e.amount,0),[entries,today]);
  const weekTotal  = useMemo(()=>entries.filter(e=>e.date>=weekStart).reduce((s,e)=>s+e.amount,0),[entries,weekStart]);
  const allTotal   = useMemo(()=>entries.reduce((s,e)=>s+e.amount,0),[entries]);

  const showToast = (msg, delay=3000) => { setToast(msg); setTimeout(()=>setToast(""),delay); };

  const handleAdd = () => {
    const amt = parseFloat(form.amount);
    if(!form.amount||isNaN(amt)||amt<=0){setFormError("Enter a valid amount greater than $0");return;}
    setFormError("");
    const entry={id:Date.now(),amount:amt,category:form.category,note:form.note.trim(),date:form.date};
    setEntries(prev=>[entry,...prev]);
    setForm({amount:"",category:"Food",note:"",date:todayStr()});
    setShowForm(false);
    showToast(`You've spent ${fmtDec(amt)} on ${form.category}. Today's total: ${fmtDec(todayTotal+amt)}`);
  };

  const handleDelete=(id)=>{ const e=entries.find(x=>x.id===id); setEntries(prev=>prev.filter(x=>x.id!==id)); showToast(`Removed ${e?fmtDec(e.amount):""} ${e?.category||""} entry`,"#94a3b8"); };

  const catTotals = useMemo(()=>{
    const g={};
    filtered.forEach(e=>{g[e.category]=(g[e.category]||0)+e.amount;});
    return Object.entries(g).sort((a,b)=>b[1]-a[1]);
  },[filtered]);
  const filteredTotal = useMemo(()=>filtered.reduce((s,e)=>s+e.amount,0),[filtered]);

  const inputStyle={width:"100%",background:"#1e1f2e",border:"1px solid #2a2b3d",borderRadius:8,color:"white",fontSize:14,padding:"10px 12px",outline:"none",fontFamily:"inherit"};

  return (
    <div style={{display:"flex",flexDirection:"column",gap:12}}>
      <style>{`@keyframes fadeIn{from{opacity:0;transform:translateY(-4px)}to{opacity:1;transform:translateY(0)}}`}</style>

      {toast && <MicroToast msg={toast}/>}

      {/* Summary */}
      <div style={{display:"grid",gridTemplateColumns:"1fr 1fr 1fr",gap:8}}>
        {[
          {label:"Today",     value:fmt(todayTotal), color:"#00e5a0"},
          {label:"This Week", value:fmt(weekTotal),  color:"#60a5fa"},
          {label:"All Time",  value:fmt(allTotal),   color:"#f87171"},
        ].map(k=>(
          <div key={k.label} style={{background:"#12131a",border:"1px solid #1e1f2e",borderRadius:10,padding:"10px"}}>
            <div style={{color:"#64748b",fontSize:9,fontWeight:700,textTransform:"uppercase",marginBottom:4}}>{k.label}</div>
            <div style={{color:k.color,fontSize:13,fontWeight:800,fontFamily:"monospace"}}>{k.value}</div>
          </div>
        ))}
      </div>

      {/* Insight */}
      {todayTotal>0 && (
        <div style={{background:"#0d1a2e",border:"1px solid #60a5fa25",borderRadius:10,padding:"10px 14px",display:"flex",alignItems:"center",gap:8}}>
          <span style={{fontSize:16}}>💡</span>
          <span style={{fontSize:12,color:"#94a3b8"}}>
            You've spent <span style={{color:"#60a5fa",fontWeight:700}}>{fmtDec(todayTotal)}</span> today.
            {todayTotal>150?" Consider what's discretionary vs necessary.":todayTotal>75?" Tracking well.":""}
          </span>
        </div>
      )}

      {/* Add Button / Form */}
      {!showForm ? (
        <button onClick={()=>setShowForm(true)}
          style={{background:"linear-gradient(135deg,#00e5a0,#00b37a)",border:"none",borderRadius:12,padding:"14px",
            color:"#0a0b12",fontSize:14,fontWeight:800,cursor:"pointer",width:"100%",letterSpacing:0.3}}>
          + Add Expense
        </button>
      ) : (
        <Card style={{border:"1px solid #00e5a030"}}>
          <SectionLabel color="#00e5a0">New Expense</SectionLabel>
          <div style={{display:"flex",flexDirection:"column",gap:10}}>
            <div>
              <label style={{fontSize:10,color:"#64748b",fontWeight:700,textTransform:"uppercase",display:"block",marginBottom:4}}>Amount *</label>
              <input type="number" placeholder="0.00" value={form.amount} onChange={e=>setForm(f=>({...f,amount:e.target.value}))} style={{...inputStyle,fontSize:18,fontWeight:700,fontFamily:"monospace"}}/>
              {formError&&<p style={{color:"#ff4d6d",fontSize:11,marginTop:4}}>{formError}</p>}
            </div>
            <div>
              <label style={{fontSize:10,color:"#64748b",fontWeight:700,textTransform:"uppercase",display:"block",marginBottom:4}}>Category</label>
              <select value={form.category} onChange={e=>setForm(f=>({...f,category:e.target.value}))} style={{...inputStyle,cursor:"pointer"}}>
                {SPEND_CATS.map(c=><option key={c} value={c}>{c}</option>)}
              </select>
            </div>
            <div>
              <label style={{fontSize:10,color:"#64748b",fontWeight:700,textTransform:"uppercase",display:"block",marginBottom:4}}>Note (optional)</label>
              <input type="text" placeholder="e.g. Raley's lunch run" value={form.note} onChange={e=>setForm(f=>({...f,note:e.target.value}))} style={inputStyle}/>
            </div>
            <div>
              <label style={{fontSize:10,color:"#64748b",fontWeight:700,textTransform:"uppercase",display:"block",marginBottom:4}}>Date</label>
              <input type="date" value={form.date} onChange={e=>setForm(f=>({...f,date:e.target.value}))} style={{...inputStyle,colorScheme:"dark"}}/>
            </div>
            <div style={{display:"flex",gap:8,marginTop:4}}>
              <button onClick={handleAdd} style={{flex:1,background:"#00e5a0",border:"none",borderRadius:8,padding:"11px",color:"#0a0b12",fontSize:13,fontWeight:800,cursor:"pointer"}}>Save Expense</button>
              <button onClick={()=>{setShowForm(false);setFormError("");}} style={{background:"#1e1f2e",border:"1px solid #2a2b3d",borderRadius:8,padding:"11px 16px",color:"#64748b",fontSize:13,fontWeight:700,cursor:"pointer"}}>Cancel</button>
            </div>
          </div>
        </Card>
      )}

      {/* Filter */}
      <div style={{display:"flex",gap:4,background:"#12131a",padding:3,borderRadius:8,border:"1px solid #1e1f2e"}}>
        {[["today","Today"],["week","This Week"],["all","All Time"]].map(([k,l])=>(
          <button key={k} onClick={()=>setFilter(k)}
            style={{flex:1,padding:"6px 0",border:"none",borderRadius:6,fontSize:10,fontWeight:700,
              cursor:"pointer",background:filter===k?"#00e5a0":"transparent",
              color:filter===k?"#0a0b12":"#64748b",transition:"all 0.2s"}}>
            {l}
          </button>
        ))}
      </div>

      {/* Category Breakdown */}
      {catTotals.length>0 && (
        <Card>
          <SectionLabel>Breakdown — {filter==="today"?"Today":filter==="week"?"This Week":"All Time"}</SectionLabel>
          {catTotals.map(([cat,amt])=>(
            <div key={cat} style={{marginBottom:10}}>
              <div style={{display:"flex",justifyContent:"space-between",marginBottom:3}}>
                <span style={{fontSize:12,color:"#e2e8f0",display:"flex",alignItems:"center",gap:6}}>
                  <span style={{width:7,height:7,borderRadius:"50%",background:CAT_COLORS[cat]||"#94a3b8",display:"inline-block"}}/>
                  {cat}
                </span>
                <span style={{fontFamily:"monospace",fontSize:12,color:CAT_COLORS[cat]||"#94a3b8",fontWeight:700}}>{fmtDec(amt)}</span>
              </div>
              <ProgressBar pct={filteredTotal>0?(amt/filteredTotal)*100:0} color={CAT_COLORS[cat]||"#94a3b8"} height={4}/>
            </div>
          ))}
        </Card>
      )}

      {/* Entries */}
      <Card>
        <SectionLabel>
          {filter==="today"?"Today's Entries":filter==="week"?"This Week":"All Entries"}
          {filtered.length>0&&<span style={{color:"#374151",fontWeight:400}}> ({filtered.length})</span>}
        </SectionLabel>
        {filtered.length===0 ? (
          <div style={{textAlign:"center",padding:"24px 0"}}>
            <p style={{fontSize:24,marginBottom:8}}>📭</p>
            <p style={{color:"#374151",fontSize:13}}>No expenses yet. Hit "Add Expense" to start tracking.</p>
          </div>
        ) : filtered.map(e=>(
          <div key={e.id} style={{display:"flex",justifyContent:"space-between",alignItems:"center",padding:"10px 0",borderBottom:"1px solid #1e1f2e"}}>
            <div style={{display:"flex",alignItems:"center",gap:10}}>
              <div style={{width:36,height:36,borderRadius:10,background:`${CAT_COLORS[e.category]||"#94a3b8"}18`,display:"flex",alignItems:"center",justifyContent:"center",flexShrink:0}}>
                <span style={{fontSize:16}}>{{Food:"🍔",Gas:"⛽",Bills:"💡",Shopping:"🛍️",Entertainment:"🎮",Transportation:"🚗",Health:"🏥",Subscriptions:"📱",Other:"📦"}[e.category]||"💰"}</span>
              </div>
              <div>
                <div style={{fontSize:13,color:"#e2e8f0",fontWeight:600}}>{e.category}</div>
                <div style={{fontSize:10,color:"#64748b",marginTop:1}}>
                  {e.note&&<span style={{color:"#94a3b8"}}>{e.note} · </span>}{e.date}
                </div>
              </div>
            </div>
            <div style={{display:"flex",alignItems:"center",gap:10}}>
              <span style={{fontFamily:"monospace",fontSize:14,fontWeight:800,color:"#f87171"}}>-{fmtDec(e.amount)}</span>
              <button onClick={()=>handleDelete(e.id)} style={{background:"#1e1f2e",border:"none",borderRadius:6,color:"#64748b",fontSize:11,padding:"3px 7px",cursor:"pointer"}}>✕</button>
            </div>
          </div>
        ))}
      </Card>
    </div>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// NET WORTH TAB — FULL INTELLIGENCE UPGRADE
// ─────────────────────────────────────────────────────────────────────────────
function NetWorthTab({ totalIncome, monthlyLeak }) {
  const [assets,      setAssets     ] = useLocalStorage("dti_assets",     []);
  const [liabilities, setLiabilities] = useLocalStorage("dti_liabilities",[]);
  const [showForm,    setShowForm   ] = useState(null);
  const [form,        setForm       ] = useState({name:"",amount:"",category:""});
  const [formError,   setFormError  ] = useState("");
  const [toast,       setToast      ] = useState({msg:"",color:"#00e5a0"});

  const totalAssets = useMemo(()=>assets.reduce((s,a)=>s+a.amount,0),[assets]);
  const totalLiabs  = useMemo(()=>liabilities.reduce((s,l)=>s+l.amount,0),[liabilities]);
  const netWorth    = totalAssets - totalLiabs;
  const coveragePct = totalLiabs > 0 ? (totalAssets / totalLiabs) * 100 : totalAssets > 0 ? Infinity : 0;
  const status      = getCoverageStatus(coveragePct, totalLiabs);
  const insight     = getCoverageInsight(coveragePct, totalLiabs, netWorth);

  const showToast = (msg, color="#00e5a0") => { setToast({msg,color}); setTimeout(()=>setToast({msg:"",color:"#00e5a0"}),3500); };

  const handleAdd = (type) => {
    const amt=parseFloat(form.amount);
    if(!form.name.trim())           {setFormError("Name is required");return;}
    if(!form.amount||isNaN(amt)||amt<=0){setFormError("Enter a valid amount greater than $0");return;}
    if(!form.category)              {setFormError("Select a category");return;}
    setFormError("");
    const entry={id:Date.now(),name:form.name.trim(),amount:amt,category:form.category};
    if(type==="asset"){
      setAssets(prev=>[...prev,entry]);
      showToast(`You increased your net worth by ${fmtDec(amt)}`,"#00e5a0");
    } else {
      setLiabilities(prev=>[...prev,entry]);
      showToast(`This reduces your net worth by ${fmtDec(amt)}`,"#ff4d6d");
    }
    setForm({name:"",amount:"",category:""});
    setShowForm(null);
  };

  const deleteAsset=(id)=>{
    const a=assets.find(x=>x.id===id);
    setAssets(prev=>prev.filter(x=>x.id!==id));
    if(a) showToast(`Removed ${a.name} (${fmtDec(a.amount)}) from assets`,"#f87171");
  };
  const deleteLiab=(id)=>{
    const l=liabilities.find(x=>x.id===id);
    setLiabilities(prev=>prev.filter(x=>x.id!==id));
    if(l) showToast(`Removed ${l.name} from liabilities — net worth improved by ${fmtDec(l.amount)}`,"#00e5a0");
  };

  const inputStyle={width:"100%",background:"#1e1f2e",border:"1px solid #2a2b3d",borderRadius:8,color:"white",fontSize:14,padding:"10px 12px",outline:"none",fontFamily:"inherit"};

  const EntryForm = ({type}) => (
    <Card style={{border:`1px solid ${type==="asset"?"#00e5a030":"#ff4d6d30"}`}}>
      <SectionLabel color={type==="asset"?"#00e5a0":"#ff4d6d"}>Add {type==="asset"?"Asset":"Liability"}</SectionLabel>
      <div style={{display:"flex",flexDirection:"column",gap:10}}>
        <div>
          <label style={{fontSize:10,color:"#64748b",fontWeight:700,textTransform:"uppercase",display:"block",marginBottom:4}}>Name *</label>
          <input type="text" placeholder={type==="asset"?"e.g. Chase Checking":"e.g. Chase Sapphire"} value={form.name} onChange={e=>setForm(f=>({...f,name:e.target.value}))} style={inputStyle}/>
        </div>
        <div>
          <label style={{fontSize:10,color:"#64748b",fontWeight:700,textTransform:"uppercase",display:"block",marginBottom:4}}>Amount *</label>
          <input type="number" placeholder="0.00" value={form.amount} onChange={e=>setForm(f=>({...f,amount:e.target.value}))} style={{...inputStyle,fontSize:16,fontWeight:700,fontFamily:"monospace"}}/>
        </div>
        <div>
          <label style={{fontSize:10,color:"#64748b",fontWeight:700,textTransform:"uppercase",display:"block",marginBottom:4}}>Category *</label>
          <select value={form.category} onChange={e=>setForm(f=>({...f,category:e.target.value}))} style={{...inputStyle,cursor:"pointer"}}>
            <option value="">Select category…</option>
            {(type==="asset"?ASSET_CATS:LIAB_CATS).map(c=><option key={c} value={c}>{c}</option>)}
          </select>
        </div>
        {formError&&<p style={{color:"#ff4d6d",fontSize:11}}>{formError}</p>}
        <div style={{display:"flex",gap:8,marginTop:4}}>
          <button onClick={()=>handleAdd(type)} style={{flex:1,background:type==="asset"?"#00e5a0":"#ff4d6d",border:"none",borderRadius:8,padding:"11px",color:type==="asset"?"#0a0b12":"white",fontSize:13,fontWeight:800,cursor:"pointer"}}>
            Save {type==="asset"?"Asset":"Liability"}
          </button>
          <button onClick={()=>{setShowForm(null);setFormError("");setForm({name:"",amount:"",category:""});}} style={{background:"#1e1f2e",border:"1px solid #2a2b3d",borderRadius:8,padding:"11px 16px",color:"#64748b",fontSize:13,fontWeight:700,cursor:"pointer"}}>Cancel</button>
        </div>
      </div>
    </Card>
  );

  const ListItem = ({entry, onDelete, color, isAsset}) => {
    const isCar = entry.category === "Car Value";
    const depreciatedValue = isCar ? entry.amount * 0.9 : null;
    return (
      <div style={{padding:"12px 0",borderBottom:"1px solid #1e1f2e"}}>
        <div style={{display:"flex",justifyContent:"space-between",alignItems:"flex-start"}}>
          <div style={{flex:1}}>
            <div style={{display:"flex",alignItems:"center",gap:6,flexWrap:"wrap"}}>
              <span style={{fontSize:13,color:"#e2e8f0",fontWeight:600}}>{entry.name}</span>
              <Pill label={entry.category} color={CAT_COLORS[entry.category]||"#94a3b8"}/>
            </div>
            {isCar && (
              <div style={{marginTop:5,background:"#fb923c10",border:"1px solid #fb923c25",borderRadius:7,padding:"5px 9px",display:"inline-block"}}>
                <span style={{fontSize:10,color:"#fb923c"}}>⚠️ Depreciating asset · est. value in 1yr: <span style={{fontFamily:"monospace",fontWeight:700}}>{fmtDec(depreciatedValue)}</span> (–10%)</span>
              </div>
            )}
          </div>
          <div style={{display:"flex",alignItems:"center",gap:8,flexShrink:0,marginLeft:10}}>
            <div style={{textAlign:"right"}}>
              <div style={{fontFamily:"monospace",fontSize:13,fontWeight:800,color}}>{fmtDec(entry.amount)}</div>
              {isCar && <div style={{fontFamily:"monospace",fontSize:10,color:"#fb923c",textDecoration:"line-through"}}>{fmtDec(entry.amount)}</div>}
            </div>
            <button onClick={()=>onDelete(entry.id)} style={{background:"#1e1f2e",border:"none",borderRadius:6,color:"#64748b",fontSize:11,padding:"3px 7px",cursor:"pointer",flexShrink:0}}>✕</button>
          </div>
        </div>
      </div>
    );
  };

  return (
    <div style={{display:"flex",flexDirection:"column",gap:12}}>
      <style>{`@keyframes fadeIn{from{opacity:0;transform:translateY(-4px)}to{opacity:1;transform:translateY(0)}}`}</style>

      {toast.msg && <MicroToast msg={toast.msg} color={toast.color}/>}

      {/* ── Net Worth Hero Card ── */}
      <div style={{background:`linear-gradient(135deg, ${netWorth>=0?"#0d2b1f":"#2b0d0d"}, #0a0b12)`,
        border:`1px solid ${netWorth>=0?"#00e5a030":"#ff4d6d30"}`,borderRadius:16,padding:18}}>

        <div style={{display:"flex",justifyContent:"space-between",alignItems:"flex-start",marginBottom:8}}>
          <div>
            <p style={{fontSize:10,fontWeight:700,letterSpacing:1,color:"#64748b",textTransform:"uppercase",marginBottom:4}}>Net Worth</p>
            <p style={{fontFamily:"monospace",fontSize:28,fontWeight:800,color:netWorth>=0?"#00e5a0":"#ff4d6d",lineHeight:1}}>
              {fmtDec(netWorth)}
            </p>
          </div>
          <Pill label={status.label} color={status.color} bg={status.bg}/>
        </div>

        {/* Asset vs Liability bars */}
        <div style={{marginBottom:12}}>
          <div style={{display:"flex",justifyContent:"space-between",marginBottom:3}}>
            <span style={{fontSize:10,color:"#64748b"}}>Assets vs Liabilities</span>
            {totalLiabs > 0 && (
              <span style={{fontSize:10,fontFamily:"monospace",color:status.color,fontWeight:700}}>
                {coveragePct === Infinity ? "∞" : fmtPct(coveragePct)} coverage
              </span>
            )}
          </div>
          <div style={{display:"flex",gap:3,height:8,borderRadius:99,overflow:"hidden"}}>
            <div style={{flex:totalAssets,background:"#00e5a0",transition:"flex 0.5s",minWidth:totalAssets>0?2:0}}/>
            <div style={{flex:totalLiabs, background:"#ff4d6d",transition:"flex 0.5s",minWidth:totalLiabs>0?2:0}}/>
          </div>
          <div style={{display:"flex",justifyContent:"space-between",marginTop:4}}>
            <span style={{fontSize:10,color:"#00e5a0",fontFamily:"monospace",fontWeight:700}}>{fmtDec(totalAssets)} assets</span>
            <span style={{fontSize:10,color:"#ff4d6d",fontFamily:"monospace",fontWeight:700}}>{fmtDec(totalLiabs)} liabilities</span>
          </div>
        </div>

        {/* Coverage status grid */}
        <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:8,marginBottom:12}}>
          <div style={{background:"#00e5a010",borderRadius:10,padding:"10px 12px"}}>
            <div style={{fontSize:9,color:"#64748b",fontWeight:700,textTransform:"uppercase",marginBottom:3}}>Total Assets</div>
            <div style={{fontFamily:"monospace",fontSize:14,fontWeight:800,color:"#00e5a0"}}>{fmtDec(totalAssets)}</div>
          </div>
          <div style={{background:"#ff4d6d10",borderRadius:10,padding:"10px 12px"}}>
            <div style={{fontSize:9,color:"#64748b",fontWeight:700,textTransform:"uppercase",marginBottom:3}}>Total Liabilities</div>
            <div style={{fontFamily:"monospace",fontSize:14,fontWeight:800,color:"#ff4d6d"}}>{fmtDec(totalLiabs)}</div>
          </div>
        </div>

        {/* Coverage Ratio bar */}
        {totalLiabs > 0 && coveragePct !== Infinity && (
          <div style={{marginBottom:12}}>
            <div style={{display:"flex",justifyContent:"space-between",marginBottom:3}}>
              <span style={{fontSize:10,color:"#64748b"}}>Asset Coverage Ratio</span>
              <span style={{fontSize:10,color:status.color,fontFamily:"monospace",fontWeight:700}}>{fmtPct(coveragePct)}</span>
            </div>
            <ProgressBar pct={Math.min(coveragePct/4,100)} color={status.color} height={7}/>
            <div style={{display:"flex",justifyContent:"space-between",marginTop:3}}>
              {[["0%","High Risk","#ff4d6d"],["100%","Stable","#f5c842"],["200%","Strong","#38bdf8"],["400%+","Excellent","#00e5a0"]].map(([pct,lbl,c])=>(
                <span key={lbl} style={{fontSize:8,color:c}}>{pct}</span>
              ))}
            </div>
          </div>
        )}

        {/* Dynamic insight */}
        <div style={{background:"#ffffff08",borderRadius:10,padding:"10px 12px",borderLeft:`3px solid ${status.color}`}}>
          <p style={{fontSize:12,color:"#94a3b8",lineHeight:1.6}}>{insight}</p>
        </div>
      </div>

      {/* ── Projection inline in this tab too ── */}
      <NetWorthProjection netWorth={netWorth} monthlyLeak={monthlyLeak}/>

      {/* ── Add Buttons ── */}
      {!showForm && (
        <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:8}}>
          <button onClick={()=>{setShowForm("asset");setForm({name:"",amount:"",category:""});setFormError("");}}
            style={{background:"#00e5a015",border:"1px solid #00e5a030",borderRadius:10,padding:"12px",color:"#00e5a0",fontSize:13,fontWeight:700,cursor:"pointer"}}>
            + Add Asset
          </button>
          <button onClick={()=>{setShowForm("liability");setForm({name:"",amount:"",category:""});setFormError("");}}
            style={{background:"#ff4d6d15",border:"1px solid #ff4d6d30",borderRadius:10,padding:"12px",color:"#ff4d6d",fontSize:13,fontWeight:700,cursor:"pointer"}}>
            + Add Liability
          </button>
        </div>
      )}
      {showForm && <EntryForm type={showForm}/>}

      {/* ── Assets List ── */}
      <Card style={{border:"1px solid #00e5a020"}}>
        <div style={{display:"flex",justifyContent:"space-between",alignItems:"center",marginBottom:4}}>
          <SectionLabel color="#00e5a0">Assets ({assets.length})</SectionLabel>
          <span style={{fontFamily:"monospace",fontSize:13,fontWeight:800,color:"#00e5a0"}}>{fmtDec(totalAssets)}</span>
        </div>
        {assets.length===0
          ? <p style={{color:"#374151",fontSize:12,textAlign:"center",padding:"16px 0"}}>No assets added yet. Start with your checking account balance.</p>
          : assets.map(a=><ListItem key={a.id} entry={a} onDelete={deleteAsset} color="#00e5a0" isAsset={true}/>)
        }
      </Card>

      {/* ── Liabilities List ── */}
      <Card style={{border:"1px solid #ff4d6d20"}}>
        <div style={{display:"flex",justifyContent:"space-between",alignItems:"center",marginBottom:4}}>
          <SectionLabel color="#ff4d6d">Liabilities ({liabilities.length})</SectionLabel>
          <span style={{fontFamily:"monospace",fontSize:13,fontWeight:800,color:"#ff4d6d"}}>{fmtDec(totalLiabs)}</span>
        </div>
        {liabilities.length===0
          ? <p style={{color:"#374151",fontSize:12,textAlign:"center",padding:"16px 0"}}>No liabilities added yet.</p>
          : liabilities.map(l=><ListItem key={l.id} entry={l} onDelete={deleteLiab} color="#ff4d6d" isAsset={false}/>)
        }
      </Card>

      {/* ── Coverage Legend ── */}
      <Card>
        <SectionLabel>Coverage Ratio Guide</SectionLabel>
        {[
          {range:"< 100%",   label:"High Risk",  color:"#ff4d6d", desc:"Assets don't cover debts"},
          {range:"100–200%", label:"Stable",     color:"#f5c842", desc:"Basic coverage achieved"},
          {range:"200–400%", label:"Strong",     color:"#38bdf8", desc:"Solid financial buffer"},
          {range:"> 400%",   label:"Excellent",  color:"#00e5a0", desc:"Assets far exceed debts"},
        ].map(z=>(
          <div key={z.label} style={{display:"flex",alignItems:"center",gap:10,padding:"7px 0",borderBottom:"1px solid #1e1f2e"}}>
            <div style={{width:8,height:8,borderRadius:"50%",background:z.color,flexShrink:0}}/>
            <span style={{fontSize:11,color:z.color,fontWeight:700,width:54,flexShrink:0}}>{z.label}</span>
            <span style={{fontSize:10,color:"#64748b",flex:1}}>{z.range} · {z.desc}</span>
          </div>
        ))}
      </Card>
    </div>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// MAIN APP
// ─────────────────────────────────────────────────────────────────────────────
export default function DTITracker() {
  const [income,   setIncome  ] = useLocalStorage("dti_income",   INITIAL_INCOME);
  const [expenses, setExpenses] = useLocalStorage("dti_expenses", INITIAL_EXPENSES);
  const [credit,   setCredit  ] = useLocalStorage("dti_credit",   INITIAL_CREDIT);
  const [tab,      setTab     ] = useState("overview");
  const [incomePeriod,  setIncomePeriod ] = useState("monthly");
  const [expensePeriod, setExpensePeriod] = useState("monthly");
  const [expandedTip,   setExpandedTip  ] = useState(null);

  const totalIncome   = useMemo(()=>income.reduce((s,r)=>s+(r.amount||0),0),[income]);
  const totalExpenses = useMemo(()=>expenses.reduce((s,r)=>s+(r.amount||0),0),[expenses]);
  const totalMinPay   = useMemo(()=>credit.reduce((s,c)=>s+(c.minPayment||0),0),[credit]);
  const totalDebt     = useMemo(()=>credit.reduce((s,c)=>s+(c.balance||0),0),[credit]);
  const flaggedTotal  = useMemo(()=>expenses.filter(e=>e.flag).reduce((s,e)=>s+e.amount,0),[expenses]);
  const monthlyLeak   = flaggedTotal; // leaks = flagged expenses

  const dti      = totalIncome>0?((totalExpenses+totalMinPay)/totalIncome)*100:0;
  const leftover = totalIncome-totalExpenses-totalMinPay;
  const zone     = getZone(dti);

  // Net worth from localStorage (read-only here for cross-tab intelligence)
  const [assets]      = useLocalStorage("dti_assets",     []);
  const [liabilities] = useLocalStorage("dti_liabilities",[]);
  const netWorthXTab  = useMemo(()=>assets.reduce((s,a)=>s+a.amount,0)-liabilities.reduce((s,l)=>s+l.amount,0),[assets,liabilities]);

  const pieData = useMemo(()=>{
    const g={};
    expenses.forEach(e=>{g[e.category]=(g[e.category]||0)+e.amount;});
    return Object.entries(g).map(([name,value])=>({name,value})).sort((a,b)=>b.value-a.value);
  },[expenses]);

  const barData = useMemo(()=>[
    {name:"Mo",  income:totalIncome,    expenses:totalExpenses    },
    {name:"Q",   income:totalIncome*3,  expenses:totalExpenses*3  },
    {name:"Year",income:totalIncome*12, expenses:totalExpenses*12 },
  ],[totalIncome,totalExpenses]);

  const updateIncome  = (id,val)=>setIncome(prev=>prev.map(r=>r.id===id?{...r,amount:val}:r));
  const updateExpense = (id,val)=>setExpenses(prev=>prev.map(r=>r.id===id?{...r,amount:val}:r));
  const updateCredit  = (id,field,val)=>setCredit(prev=>prev.map(r=>r.id===id?{...r,[field]:val}:r));
  const addCredit     = ()=>setCredit(prev=>[...prev,{id:`c${Date.now()}`,label:"New Account",balance:0,limit:0,minPayment:0,apr:0,category:"Credit Card"}]);
  const savingsOpps   = expenses.filter(e=>e.flag&&SAVINGS_TIPS[e.id]);

  const topTabs    = ["overview","income","expenses","credit","savings"];
  const bottomTabs = ["spending","networth"];
  const allLabels  = {overview:"Overview",income:"Income",expenses:"Expenses",credit:"Credit",savings:"Savings",spending:"💸 Daily",networth:"📊 Net Worth"};

  const ts = (t, accent="#00e5a0") => ({
    flex:1, padding:"7px 2px", border:"none", borderRadius:7, fontSize:10, fontWeight:700,
    cursor:"pointer",
    background:tab===t?accent:"transparent",
    color:tab===t?"#0a0b12":"#64748b", transition:"all 0.2s",
  });

  return(
    <div style={{fontFamily:"'DM Sans','Segoe UI',sans-serif",background:"#0a0b12",minHeight:"100vh",color:"white",padding:"20px 14px 48px",maxWidth:480,margin:"0 auto"}}>
      <style>{`
        *{box-sizing:border-box;margin:0;padding:0;}
        input[type=number]::-webkit-inner-spin-button{-webkit-appearance:none;}
        @keyframes fadeIn{from{opacity:0;transform:translateY(-4px)}to{opacity:1;transform:translateY(0)}}
      `}</style>

      {/* ── Header ── */}
      <div style={{marginBottom:18}}>
        <div style={{display:"flex",justifyContent:"space-between",alignItems:"flex-start"}}>
          <div>
            <h1 style={{fontSize:20,fontWeight:800,letterSpacing:-0.5}}>MoneyLeaks</h1>
            <p style={{color:"#64748b",fontSize:10,marginTop:2}}>Personal Financial Intelligence</p>
          </div>
          <div style={{display:"flex",flexDirection:"column",alignItems:"flex-end",gap:4}}>
            <span style={{fontSize:10,color:"#00e5a0",background:"#00e5a015",padding:"2px 8px",borderRadius:99,fontWeight:600}}>✓ Auto-saved</span>
            <button onClick={()=>{if(window.confirm("Reset ALL data to defaults?")){
              ["dti_income","dti_expenses","dti_credit","dti_spending","dti_assets","dti_liabilities"].forEach(k=>localStorage.removeItem(k));
              window.location.reload();
            }}} style={{background:"transparent",border:"none",color:"#374151",fontSize:10,cursor:"pointer",textDecoration:"underline"}}>
              Reset
            </button>
          </div>
        </div>
      </div>

      {/* ── KPI Row ── */}
      <div style={{display:"grid",gridTemplateColumns:"1fr 1fr 1fr",gap:8,marginBottom:14}}>
        {[
          {label:"Income/mo",   value:fmt(totalIncome),   color:"#00e5a0"},
          {label:"Expenses/mo", value:fmt(totalExpenses), color:"#f87171"},
          {label:leftover>=0?"Leftover":"Deficit", value:fmt(Math.abs(leftover)), color:leftover>=0?"#60a5fa":"#ff4d6d"},
        ].map(k=>(
          <div key={k.label} style={{background:"#12131a",border:"1px solid #1e1f2e",borderRadius:10,padding:"10px"}}>
            <div style={{color:"#64748b",fontSize:9,fontWeight:700,textTransform:"uppercase",marginBottom:4,letterSpacing:0.5}}>{k.label}</div>
            <div style={{color:k.color,fontSize:13,fontWeight:800,fontFamily:"monospace",lineHeight:1.2}}>{k.value}</div>
          </div>
        ))}
      </div>

      {/* ── DTI Gauge ── */}
      <div style={{background:"#12131a",border:`1px solid ${zone.color}35`,borderRadius:14,padding:"16px 14px",marginBottom:12}}>
        <div style={{display:"flex",justifyContent:"space-between",alignItems:"center",marginBottom:6}}>
          <span style={{fontSize:10,fontWeight:700,letterSpacing:1,color:"#64748b",textTransform:"uppercase"}}>Debt-to-Income Ratio</span>
          <Pill label={zone.label} color={zone.color}/>
        </div>
        <GaugeMeter ratio={dti}/>
        <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:"4px 10px",marginTop:8}}>
          {DTI_ZONES.map(z=>(
            <div key={z.label} style={{display:"flex",alignItems:"center",gap:5,opacity:zone.label===z.label?1:0.3}}>
              <div style={{width:7,height:7,borderRadius:"50%",background:z.color,flexShrink:0}}/>
              <span style={{fontSize:10,color:"#94a3b8"}}>{z.label} ≤{z.max}%</span>
            </div>
          ))}
        </div>
      </div>

      {/* ── Lawyer Tracker ── */}
      <div style={{marginBottom:12}}>
        <LawyerTracker paid={1500} total={3000} monthly={expenses.find(e=>e.id==="e12")?.amount||500}/>
      </div>

      {/* ── Tab Nav ── */}
      <div style={{display:"flex",gap:3,marginBottom:4,background:"#12131a",padding:4,borderRadius:10,border:"1px solid #1e1f2e"}}>
        {topTabs.map(t=><button key={t} style={ts(t)} onClick={()=>setTab(t)}>{allLabels[t]}</button>)}
      </div>
      <div style={{display:"flex",gap:3,marginBottom:14,background:"#12131a",padding:4,borderRadius:10,border:"1px solid #1e1f2e"}}>
        {bottomTabs.map(t=><button key={t} style={{...ts(t,"#60a5fa"),flex:1,fontSize:11}} onClick={()=>setTab(t)}>{allLabels[t]}</button>)}
      </div>

      {/* ══════════════════════════════════════════════════════════════════════ */}
      {/* OVERVIEW                                                              */}
      {/* ══════════════════════════════════════════════════════════════════════ */}
      {tab==="overview" && (
        <div style={{display:"flex",flexDirection:"column",gap:12}}>

          {/* Big Picture Grid */}
          <Card>
            <SectionLabel>📊 Big Picture</SectionLabel>
            <div style={{display:"grid",gridTemplateColumns:"1fr 1fr 1fr",gap:8,marginBottom:14}}>
              {[{label:"Monthly",inc:totalIncome,exp:totalExpenses},{label:"Quarterly",inc:totalIncome*3,exp:totalExpenses*3},{label:"Yearly",inc:totalIncome*12,exp:totalExpenses*12}].map(p=>(
                <div key={p.label} style={{background:"#1e1f2e",borderRadius:10,padding:"10px"}}>
                  <div style={{color:"#64748b",fontSize:9,fontWeight:700,textTransform:"uppercase",marginBottom:6}}>{p.label}</div>
                  <div style={{color:"#00e5a0",fontSize:11,fontFamily:"monospace",fontWeight:700}}>{fmt(p.inc)}</div>
                  <div style={{color:"#374151",fontSize:8,margin:"2px 0"}}>income</div>
                  <div style={{color:"#f87171",fontSize:11,fontFamily:"monospace",fontWeight:700}}>{fmt(p.exp)}</div>
                  <div style={{color:"#374151",fontSize:8,margin:"2px 0"}}>spending</div>
                  <div style={{height:1,background:"#2a2b3d",margin:"5px 0"}}/>
                  <div style={{color:(p.inc-p.exp)>=0?"#60a5fa":"#ff4d6d",fontSize:12,fontFamily:"monospace",fontWeight:800}}>{fmt(p.inc-p.exp)}</div>
                  <div style={{color:"#374151",fontSize:8}}>net</div>
                </div>
              ))}
            </div>
            <ResponsiveContainer width="100%" height={120}>
              <BarChart data={barData} barCategoryGap="30%">
                <CartesianGrid strokeDasharray="3 3" stroke="#1e1f2e"/>
                <XAxis dataKey="name" tick={{fill:"#64748b",fontSize:10}} axisLine={false} tickLine={false}/>
                <YAxis tick={{fill:"#64748b",fontSize:9}} axisLine={false} tickLine={false} tickFormatter={v=>`$${(v/1000).toFixed(0)}k`}/>
                <Tooltip formatter={v=>fmt(v)} contentStyle={{background:"#1e1f2e",border:"none",borderRadius:8,fontSize:11}}/>
                <Bar dataKey="income"   fill="#00e5a0" radius={[4,4,0,0]} name="Income"/>
                <Bar dataKey="expenses" fill="#f87171" radius={[4,4,0,0]} name="Expenses"/>
              </BarChart>
            </ResponsiveContainer>
          </Card>

          {/* Spending Pie */}
          <Card>
            <SectionLabel>Spending Breakdown</SectionLabel>
            <ResponsiveContainer width="100%" height={155}>
              <PieChart>
                <Pie data={pieData} cx="50%" cy="50%" innerRadius={44} outerRadius={72} dataKey="value" paddingAngle={2}>
                  {pieData.map(e=><Cell key={e.name} fill={CAT_COLORS[e.name]||"#64748b"}/>)}
                </Pie>
                <Tooltip formatter={v=>fmt(v)} contentStyle={{background:"#1e1f2e",border:"none",borderRadius:8,fontSize:12}}/>
              </PieChart>
            </ResponsiveContainer>
            <div style={{display:"flex",flexWrap:"wrap",gap:"5px 12px",marginTop:6}}>
              {pieData.map(d=>(
                <div key={d.name} style={{display:"flex",alignItems:"center",gap:4}}>
                  <div style={{width:7,height:7,borderRadius:2,background:CAT_COLORS[d.name]||"#64748b"}}/>
                  <span style={{fontSize:10,color:"#94a3b8"}}>{d.name} <span style={{color:"#e2e8f0",fontFamily:"monospace"}}>{fmt(d.value)}</span></span>
                </div>
              ))}
            </div>
          </Card>

          {/* 🧠 Financial Reality Check — NEW */}
          <FinancialRealityCheck totalIncome={totalIncome} monthlyLeak={monthlyLeak} netWorth={netWorthXTab}/>

          {/* 📈 Net Worth Projection — NEW */}
          <NetWorthProjection netWorth={netWorthXTab} monthlyLeak={monthlyLeak}/>

          {/* First Check Plan */}
          <div style={{background:"#0d1f1a",border:"1px solid #00e5a028",borderRadius:14,padding:14}}>
            <SectionLabel color="#00e5a0">💡 First New Check Plan</SectionLabel>
            <p style={{fontSize:12,color:"#64748b",marginBottom:10,lineHeight:1.5}}>Your raise adds ~$2,100/mo gross. Allocate it NOW before lifestyle creep takes it:</p>
            {[
              {label:"Lawyer payoff acceleration",amount:500,note:"Done in 3 months, then freed up"},
              {label:"Emergency buffer fund",      amount:500,note:"Kills the overdraft cycle"},
              {label:"Subscription + food audit",  amount:300,note:"Redirect what you cut"},
              {label:"GuardMaps / investing",       amount:500,note:"Put the raise to work"},
              {label:"Guilt-free spending",         amount:300,note:"You earned it — enjoy it"},
            ].map(item=>(
              <div key={item.label} style={{display:"flex",justifyContent:"space-between",alignItems:"center",padding:"8px 0",borderBottom:"1px solid #0a2218"}}>
                <div>
                  <div style={{fontSize:13,color:"#e2e8f0"}}>{item.label}</div>
                  <div style={{fontSize:10,color:"#4ade80",marginTop:1}}>{item.note}</div>
                </div>
                <span style={{fontFamily:"monospace",color:"#00e5a0",fontSize:13,fontWeight:700}}>{fmt(item.amount)}</span>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* ══════════════════════════════════════════════════════════════════════ */}
      {/* INCOME                                                                */}
      {/* ══════════════════════════════════════════════════════════════════════ */}
      {tab==="income" && (
        <div style={{display:"flex",flexDirection:"column",gap:12}}>
          <PeriodToggle value={incomePeriod} onChange={setIncomePeriod}/>
          <Card>
            <SectionLabel>Income Streams</SectionLabel>
            {income.map(row=>(
              <div key={row.id} style={{display:"flex",justifyContent:"space-between",alignItems:"center",padding:"10px 0",borderBottom:"1px solid #1e1f2e"}}>
                <div>
                  <div style={{display:"flex",alignItems:"center",gap:6}}>
                    <span style={{fontSize:13,color:"#e2e8f0"}}>{row.label}</span>
                    {row.category==="Investing"&&<Pill label="Trading" color="#facc15"/>}
                  </div>
                  <div style={{fontSize:9,color:CAT_COLORS[row.category]||"#64748b",marginTop:2}}>{row.category}</div>
                </div>
                <div style={{textAlign:"right"}}>
                  <EditableAmount value={row.amount} onChange={v=>updateIncome(row.id,v)}/>
                  {PERIODS.find(p=>p.key===incomePeriod)?.mult>1&&row.amount>0&&(
                    <div style={{fontSize:10,color:"#00e5a060",fontFamily:"monospace",marginTop:2}}>
                      {fmt(row.amount*PERIODS.find(p=>p.key===incomePeriod).mult)} {incomePeriod}
                    </div>
                  )}
                </div>
              </div>
            ))}
            <TotalsFooter monthly={totalIncome} color="#00e5a0"/>
          </Card>
          <div style={{background:"#1a1400",border:"1px solid #facc1525",borderRadius:12,padding:14}}>
            <p style={{fontSize:10,color:"#facc15",fontWeight:700,textTransform:"uppercase",letterSpacing:1,marginBottom:6}}>📈 Options & Stocks</p>
            <p style={{fontSize:12,color:"#94a3b8",lineHeight:1.6}}>Enter your average monthly P&L. Use a 3-month rolling average for a realistic DTI picture. Losses entered as negative will correctly raise your DTI warning.</p>
          </div>
        </div>
      )}

      {/* ══════════════════════════════════════════════════════════════════════ */}
      {/* EXPENSES                                                              */}
      {/* ══════════════════════════════════════════════════════════════════════ */}
      {tab==="expenses" && (
        <div style={{display:"flex",flexDirection:"column",gap:12}}>
          <PeriodToggle value={expensePeriod} onChange={setExpensePeriod}/>
          <Card>
            <SectionLabel>Monthly Expenses</SectionLabel>
            {expenses.map(row=>(
              <div key={row.id} style={{display:"flex",justifyContent:"space-between",alignItems:"center",padding:"9px 0",borderBottom:"1px solid #1e1f2e"}}>
                <div style={{flex:1,marginRight:10}}>
                  <div style={{display:"flex",alignItems:"center",gap:5,flexWrap:"wrap"}}>
                    <span style={{fontSize:12,color:"#e2e8f0"}}>{row.label}</span>
                    {row.flag&&<Pill label="Leak" color="#ff4d6d"/>}
                  </div>
                  <div style={{fontSize:9,color:CAT_COLORS[row.category]||"#64748b",marginTop:2}}>{row.category}</div>
                </div>
                <div style={{textAlign:"right"}}>
                  <EditableAmount value={row.amount} onChange={v=>updateExpense(row.id,v)}/>
                  {PERIODS.find(p=>p.key===expensePeriod)?.mult>1&&row.amount>0&&(
                    <div style={{fontSize:10,color:"#f8717160",fontFamily:"monospace",marginTop:2}}>
                      {fmt(row.amount*PERIODS.find(p=>p.key===expensePeriod).mult)} {expensePeriod}
                    </div>
                  )}
                </div>
              </div>
            ))}
            <TotalsFooter monthly={totalExpenses} color="#f87171"/>
          </Card>
        </div>
      )}

      {/* ══════════════════════════════════════════════════════════════════════ */}
      {/* CREDIT                                                                */}
      {/* ══════════════════════════════════════════════════════════════════════ */}
      {tab==="credit" && (
        <div style={{display:"flex",flexDirection:"column",gap:12}}>
          <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:8}}>
            <div style={{background:"#12131a",border:"1px solid #1e1f2e",borderRadius:10,padding:"12px"}}>
              <div style={{fontSize:9,color:"#64748b",fontWeight:700,textTransform:"uppercase",marginBottom:4}}>Total Debt</div>
              <div style={{fontSize:16,fontFamily:"monospace",fontWeight:800,color:"#f87171"}}>{fmt(totalDebt)}</div>
            </div>
            <div style={{background:"#12131a",border:"1px solid #1e1f2e",borderRadius:10,padding:"12px"}}>
              <div style={{fontSize:9,color:"#64748b",fontWeight:700,textTransform:"uppercase",marginBottom:4}}>Min Payments/mo</div>
              <div style={{fontSize:16,fontFamily:"monospace",fontWeight:800,color:"#fb923c"}}>{fmt(totalMinPay)}</div>
            </div>
          </div>
          {credit.map(acct=>{
            const util=acct.limit>0?(acct.balance/acct.limit)*100:0;
            return(
              <Card key={acct.id}>
                <div style={{display:"flex",justifyContent:"space-between",alignItems:"flex-start",marginBottom:10}}>
                  <div>
                    <div style={{fontSize:13,color:"#e2e8f0",fontWeight:600}}>{acct.label}</div>
                    <div style={{fontSize:9,color:CAT_COLORS[acct.category]||"#64748b",marginTop:2}}>{acct.category}</div>
                  </div>
                  {acct.limit>0&&<Pill label={`${fmtPct(util)} used`} color={util>=70?"#ff4d6d":util>=30?"#f5c842":"#00e5a0"}/>}
                </div>
                <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:"8px 16px"}}>
                  {[{label:"Balance",field:"balance",prefix:"$"},{label:"Credit Limit",field:"limit",prefix:"$"},{label:"Min Payment",field:"minPayment",prefix:"$"},{label:"APR",field:"apr",suffix:"%"}].map(f=>(
                    <div key={f.field}>
                      <div style={{fontSize:9,color:"#64748b",marginBottom:3,textTransform:"uppercase",letterSpacing:0.5}}>{f.label}</div>
                      <EditableField value={acct[f.field]} onChange={v=>updateCredit(acct.id,f.field,v)} prefix={f.prefix||""} suffix={f.suffix||""}/>
                    </div>
                  ))}
                </div>
                {acct.limit>0&&<><UtilBar pct={util}/><p style={{fontSize:9,color:"#64748b",marginTop:4}}>{util>=70?"⚠️ High utilization. Hurting your credit score.":util>=30?"Moderate. Aim for under 30%.":"✅ Good. Under 30%."}</p></>}
              </Card>
            );
          })}
          <button onClick={addCredit} style={{background:"#1e1f2e",border:"1px dashed #374151",borderRadius:10,padding:"12px",color:"#60a5fa",fontSize:13,fontWeight:700,cursor:"pointer",width:"100%"}}>
            + Add Credit Account
          </button>
          <div style={{background:"#0d1a2e",border:"1px solid #60a5fa25",borderRadius:12,padding:14}}>
            <p style={{fontSize:10,color:"#60a5fa",fontWeight:700,textTransform:"uppercase",letterSpacing:1,marginBottom:6}}>💳 Credit Strategy</p>
            <p style={{fontSize:12,color:"#94a3b8",lineHeight:1.6}}>Keep utilization under 30% per card. Once the lawyer is paid (~3 months), redirect that $500/mo to your highest APR balance (avalanche method). Knock out debt fastest, then invest the freed cash flow.</p>
          </div>
        </div>
      )}

      {/* ══════════════════════════════════════════════════════════════════════ */}
      {/* SAVINGS                                                               */}
      {/* ══════════════════════════════════════════════════════════════════════ */}
      {tab==="savings" && (
        <div style={{display:"flex",flexDirection:"column",gap:10}}>
          <div style={{background:"#1a0f00",border:"1px solid #ff8c4228",borderRadius:12,padding:14}}>
            <p style={{fontSize:10,color:"#ff8c42",fontWeight:700,marginBottom:4,textTransform:"uppercase",letterSpacing:1}}>🔴 Total Flagged Leaks</p>
            <p style={{fontFamily:"monospace",fontSize:24,fontWeight:800,color:"#ff4d6d"}}>
              {fmt(flaggedTotal)}<span style={{fontSize:12,color:"#64748b",marginLeft:6,fontFamily:"sans-serif"}}>/mo</span>
            </p>
            <div style={{display:"flex",gap:20,marginTop:8}}>
              <div><div style={{fontSize:9,color:"#64748b",textTransform:"uppercase"}}>Quarterly</div><div style={{fontSize:13,fontFamily:"monospace",color:"#ff8c42",fontWeight:700}}>{fmt(flaggedTotal*3)}</div></div>
              <div><div style={{fontSize:9,color:"#64748b",textTransform:"uppercase"}}>Yearly</div><div style={{fontSize:13,fontFamily:"monospace",color:"#ff8c42",fontWeight:700}}>{fmt(flaggedTotal*12)}</div></div>
            </div>
          </div>
          {savingsOpps.map(e=>(
            <Card key={e.id} style={{cursor:"pointer"}} onClick={()=>setExpandedTip(expandedTip===e.id?null:e.id)}>
              <div style={{display:"flex",justifyContent:"space-between",alignItems:"center"}}>
                <div style={{display:"flex",alignItems:"center",gap:8}}>
                  <span style={{fontSize:13,color:"#e2e8f0"}}>{e.label}</span>
                  <Pill label="Leak" color="#ff4d6d"/>
                </div>
                <div style={{textAlign:"right"}}>
                  <div style={{fontFamily:"monospace",color:"#f87171",fontSize:12}}>{fmt(e.amount)}/mo</div>
                  <div style={{fontFamily:"monospace",color:"#f8717155",fontSize:10}}>{fmt(e.amount*12)}/yr</div>
                </div>
              </div>
              {expandedTip===e.id&&<p style={{marginTop:10,fontSize:12,color:"#94a3b8",lineHeight:1.6,borderTop:"1px solid #1e1f2e",paddingTop:10}}>💡 {SAVINGS_TIPS[e.id]}</p>}
            </Card>
          ))}
          <div style={{background:"#0d1a2e",border:"1px solid #60a5fa28",borderRadius:12,padding:14}}>
            <p style={{fontSize:10,color:"#60a5fa",fontWeight:700,marginBottom:8,textTransform:"uppercase",letterSpacing:1}}>If you cut just half the leaks:</p>
            <div style={{display:"flex",gap:14}}>
              {[["Monthly",1],["Quarterly",3],["Yearly",12]].map(([l,m])=>(
                <div key={l}><div style={{fontSize:9,color:"#64748b",textTransform:"uppercase"}}>{l}</div><div style={{fontSize:14,fontFamily:"monospace",color:"#60a5fa",fontWeight:800}}>+{fmt(flaggedTotal*0.5*m)}</div></div>
              ))}
            </div>
            <p style={{fontSize:11,color:"#94a3b8",marginTop:8,lineHeight:1.5}}>Enough to build an emergency fund AND start a real investing position within 12 months.</p>
          </div>
        </div>
      )}

      {/* ══════════════════════════════════════════════════════════════════════ */}
      {/* DAILY SPENDING                                                        */}
      {/* ══════════════════════════════════════════════════════════════════════ */}
      {tab==="spending" && <SpendingTab/>}

      {/* ══════════════════════════════════════════════════════════════════════ */}
      {/* NET WORTH                                                             */}
      {/* ══════════════════════════════════════════════════════════════════════ */}
      {tab==="networth" && <NetWorthTab totalIncome={totalIncome} monthlyLeak={monthlyLeak}/>}
    </div>
  );
}