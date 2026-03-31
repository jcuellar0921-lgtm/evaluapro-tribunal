import { useState, useRef } from "react";

const CRITERIOS_DEFAULT = [
  { id: "contenido",    label: "Contenido",    peso: 30 },
  { id: "metodologia", label: "Metodología",  peso: 30 },
  { id: "presentacion",label: "Presentación", peso: 20 },
  { id: "originalidad",label: "Originalidad", peso: 20 },
];
const ROLES = ["presidente", "secretario", "vocal"];

function pColor(p) { return p >= 71 ? "#2d7a3a" : p >= 51 ? "#b07a00" : "#a32d2d"; }
function pLabel(p) { return p >= 71 ? "Aprobado" : p >= 51 ? "Regular" : "Reprobado"; }
function initP(criterios) { return Object.fromEntries(criterios.map(c => [c.id, 0])); }
function calcTotal(puntajes, criterios) {
  return criterios.reduce((a, c) => a + (puntajes[c.id] * c.peso) / 100, 0);
}
function promedioFinal(evaluaciones) {
  const roles = ROLES.filter(r => evaluaciones[r]);
  if (!roles.length) return 0;
  return Math.round(roles.reduce((a, r) => a + evaluaciones[r].total, 0) / roles.length);
}
function estadoDefensa(evaluaciones) {
  const count = ROLES.filter(r => evaluaciones[r]).length;
  return count === 0 ? "pendiente" : count < 3 ? "en_proceso" : "completo";
}
function generarRetro(puntajes, criterios, comentario, estudiante, rol) {
  const total = Math.round(calcTotal(puntajes, criterios));
  const fortalezas = [], mejoras = [];
  const msgs = {
    contenido:    ["Sólido dominio del marco teórico.", "Contenido aceptable; puede enriquecerse.", "Reforzar el sustento teórico."],
    metodologia:  ["Metodología bien estructurada.", "Metodología cumple requisitos mínimos.", "Revisar el diseño metodológico."],
    presentacion: ["Presentación clara y ordenada.", "Presentación funcional; mejorar orden.", "Mejorar estructura y claridad."],
    originalidad: ["Aportes originales y valor académico.", "Cierta originalidad que puede potenciarse.", "Incrementar el aporte original."],
  };
  criterios.forEach(c => {
    const p = puntajes[c.id];
    const m = msgs[c.id] || ["Buen desempeño.", "Desempeño aceptable.", "Necesita mejorar."];
    if (p >= 71) fortalezas.push(m[0]); else mejoras.push(p >= 51 ? m[1] : m[2]);
  });
  const accion = total >= 71 ? "Se recomienda su aprobación." : total >= 51 ? "Se recomienda revisión." : "Se recomienda reformulación del trabajo.";
  const nombre = estudiante ? estudiante.nombre : "el/la estudiante";
  const obs = comentario ? ` Observa: "${comentario}". ` : " ";
  return {
    texto: `Evaluación del ${rol}: ${nombre} obtuvo ${total}/100 — ${pLabel(total)}.${obs}${accion}`,
    fortalezas: fortalezas.length ? fortalezas : ["Cumple los requisitos básicos."],
    mejoras:    mejoras.length    ? mejoras    : ["Profundizar en todos los criterios."],
    nota: total,
  };
}

// ── Logo JVR SVG ─────────────────────────────────────
function LogoIcon({ url, size = 34 }) {
  if (url) return <img src={url} alt="logo" style={{ height:size, width:size, objectFit:"contain", borderRadius:6 }} />;
  const s = size;
  return (
    <svg width={s} height={s} viewBox="0 0 200 200" xmlns="http://www.w3.org/2000/svg">
      <circle cx="100" cy="100" r="98" fill="#0d3320" stroke="#2ecc71" strokeWidth="2"/>
      <circle cx="100" cy="100" r="88" fill="none" stroke="#2ecc71" strokeWidth="1" strokeOpacity="0.5"/>
      <circle cx="100" cy="100" r="78" fill="none" stroke="#2ecc71" strokeWidth="0.5" strokeOpacity="0.3"/>
      <path id="topArc" fill="none" d="M 22,100 A 78,78 0 0,1 178,100"/>
      <text fontSize="10" fill="#4ade80" letterSpacing="3" fontFamily="serif">
        <textPath href="#topArc" startOffset="8%">SISTEMA DE EVALUACION ACADEMICA</textPath>
      </text>
      <path id="botArc" fill="none" d="M 25,108 A 78,78 0 0,0 175,108"/>
      <text fontSize="9.5" fill="#4ade80" letterSpacing="2" fontFamily="serif">
        <textPath href="#botArc" startOffset="8%">BOLIVIA · 2026 · EVALUAPRO</textPath>
      </text>
      <polygon points="100,28 103,37 113,37 105,43 108,52 100,46 92,52 95,43 87,37 97,37" fill="#4ade80"/>
      <polygon points="100,148 103,157 113,157 105,163 108,172 100,166 92,172 95,163 87,157 97,157" fill="#4ade80"/>
      <line x1="60" y1="68" x2="140" y2="68" stroke="#4ade80" strokeWidth="1.2" opacity="0.7"/>
      <line x1="60" y1="132" x2="140" y2="132" stroke="#4ade80" strokeWidth="1.2" opacity="0.7"/>
      <line x1="100" y1="60" x2="100" y2="68" stroke="#4ade80" strokeWidth="1" opacity="0.5"/>
      <line x1="100" y1="132" x2="100" y2="140" stroke="#4ade80" strokeWidth="1" opacity="0.5"/>
      <text x="100" y="115" textAnchor="middle" fontSize="52" fontFamily="Georgia,serif" fontWeight="bold" fill="#a7f3c0" letterSpacing="2">JVR</text>
    </svg>
  );
}

// ── Suma de pesos ────────────────────────────────────
function sumaPesos(criterios) { return criterios.reduce((a, c) => a + Number(c.peso), 0); }

export default function App() {
  const [pantalla,    setPantalla]    = useState("dashboard");
  const [dark,        setDark]        = useState(true);
  const [logoUrl,     setLogoUrl]     = useState("");
  const [instNombre,  setInstNombre]  = useState("Universidad Mayor de San Andrés");
  const [criterios,   setCriterios]   = useState(CRITERIOS_DEFAULT);
  const [estudiantes, setEstudiantes] = useState([
    { id:1, nombre:"Ana Lucía Flores Mamani",     carrera:"Ingeniería de Sistemas",     fecha:"2026-03-27", tutor:"Dr. Roberto Vargas",   tribunal:{ presidente:"MSc. Carmen López",  secretario:"Dr. Luis Pereira",  vocal:"MSc. Ana Quispe"   } },
    { id:2, nombre:"Carlos Eduardo Ríos Salazar", carrera:"Administración de Empresas", fecha:"2026-03-28", tutor:"MSc. Patricia Solano",  tribunal:{ presidente:"Dr. Jorge Mamani",  secretario:"MSc. Rosa Ticona", vocal:"Dr. Héctor Flores" } },
    { id:3, nombre:"María Fernanda Quispe López", carrera:"Medicina",                   fecha:"2026-03-29", tutor:"Dr. Alejandro Mendoza", tribunal:{ presidente:"Dra. Silvia Conde", secretario:"Dr. Raúl Herrera",  vocal:"MSc. Clara Vidal"  } },
  ]);
  const [db,        setDB]        = useState({});
  const [activoId,  setActivoId]  = useState(null);
  const [activoRol, setActivoRol] = useState(null);
  const activo = estudiantes.find(e => e.id === activoId);

  function irEvaluar(est, rol) { setActivoId(est.id); setActivoRol(rol); setPantalla("evaluar"); }
  function guardarEval(estId, rol, evalData) {
    setDB(prev => ({ ...prev, [estId]: { ...(prev[estId]||{}), [rol]: evalData } }));
    setPantalla("veredicto"); setActivoId(estId);
  }

  const shared = { dark, setPantalla, logoUrl, instNombre, criterios };

  if (pantalla === "config")    return <Config {...shared} setDark={setDark} setLogoUrl={setLogoUrl} setInstNombre={setInstNombre} criterios={criterios} setCriterios={setCriterios} />;
  if (pantalla === "registro")  return <Registro {...shared} setEstudiantes={setEstudiantes} />;
  if (pantalla === "evaluar")   return <Evaluar  {...shared} activo={activo} rol={activoRol} onGuardar={guardarEval} db={db} />;
  if (pantalla === "veredicto") return <Veredicto {...shared} activo={activo} db={db} irEvaluar={irEvaluar} />;
  return <Dashboard {...shared} setDark={setDark} estudiantes={estudiantes} db={db} irEvaluar={irEvaluar} setActivoId={setActivoId} />;
}

// ══════════════════════════════════════════════════════
// DASHBOARD
// ══════════════════════════════════════════════════════
function Dashboard({ dark, setDark, setPantalla, estudiantes, db, logoUrl, instNombre, irEvaluar, setActivoId }) {
  const bg=dark?"#1a1a1a":"#f5f5f0", card=dark?"#252525":"#fff", brd=dark?"#333":"#e0e0d8";
  const txt=dark?"#f0f0f0":"#1a1a1a", txt2=dark?"#888":"#666", acc="#2d7a3a";
  const sc = x => ({ background:card, border:`1px solid ${brd}`, borderRadius:12, padding:"14px 16px", marginBottom:10, ...x });
  const sb = (on,col) => ({ background:on?(col||acc):"transparent", color:on?"#fff":txt2, border:`1px solid ${on?(col||acc):brd}`, borderRadius:8, padding:"7px 14px", fontSize:12, cursor:"pointer", fontWeight:500 });

  return (
    <div style={{ fontFamily:"system-ui,sans-serif", minHeight:"100vh", background:bg, color:txt, paddingBottom:40 }}>
      {/* HEADER */}
      <div style={{ background:card, borderBottom:`1px solid ${brd}`, padding:"12px 16px", display:"flex", alignItems:"center", justifyContent:"space-between", position:"sticky", top:0, zIndex:10 }}>
        <div style={{ display:"flex", alignItems:"center", gap:10 }}>
          <LogoIcon url={logoUrl} size={36} />
          <div>
            <div style={{ fontWeight:600, fontSize:14 }}>EvalúaPro Tribunal</div>
            <div style={{ fontSize:10, color:txt2 }}>{instNombre} · <span style={{color:"#4ade80"}}>JVR</span></div>
          </div>
        </div>
        <div style={{ display:"flex", gap:8 }}>
          <button style={sb(false)} onClick={() => setPantalla("config")}>⚙️</button>
          <button style={sb(false)} onClick={() => setDark(d => !d)}>{dark?"☀️":"🌙"}</button>
        </div>
      </div>

      <div style={{ padding:"12px 16px" }}>
        <div style={{ display:"grid", gridTemplateColumns:"repeat(3,1fr)", gap:8, marginBottom:14 }}>
          {[["Total",estudiantes.length],["En proceso",estudiantes.filter(e=>estadoDefensa(db[e.id]||{})==="en_proceso").length],["Completados",estudiantes.filter(e=>estadoDefensa(db[e.id]||{})==="completo").length]].map(([label,val]) => (
            <div key={label} style={{ background:dark?"#1e1e1e":card, border:`1px solid ${brd}`, borderRadius:10, padding:"10px 8px", textAlign:"center" }}>
              <div style={{ fontSize:20, fontWeight:500, color:acc }}>{val}</div>
              <div style={{ fontSize:11, color:txt2 }}>{label}</div>
            </div>
          ))}
        </div>

        <button style={{ background:acc, color:"#fff", border:"none", borderRadius:8, padding:"10px 16px", fontSize:13, cursor:"pointer", fontWeight:500, marginBottom:14, width:"100%" }} onClick={() => setPantalla("registro")}>
          + Registrar nuevo estudiante
        </button>

        <div style={{ fontSize:11, color:txt2, marginBottom:8, textTransform:"uppercase", letterSpacing:.8 }}>Defensas</div>

        {estudiantes.map(est => {
          const evEst=db[est.id]||{}, estado=estadoDefensa(evEst), prom=promedioFinal(evEst);
          const estadoColor=estado==="completo"?"#2d7a3a":estado==="en_proceso"?"#b07a00":"#888";
          const estadoLabel=estado==="completo"?"✓ Completo":estado==="en_proceso"?"● En proceso":"○ Pendiente";
          const countEv=ROLES.filter(r=>evEst[r]).length;
          return (
            <div key={est.id} style={sc()}>
              <div style={{ display:"flex", justifyContent:"space-between", alignItems:"flex-start", marginBottom:10 }}>
                <div style={{ flex:1 }}>
                  <div style={{ fontWeight:500, fontSize:13 }}>{est.nombre}</div>
                  <div style={{ fontSize:11, color:txt2, marginTop:2 }}>{est.carrera}</div>
                  <div style={{ fontSize:11, color:txt2 }}>Tutor: {est.tutor} · {est.fecha}</div>
                </div>
                <div style={{ textAlign:"right", flexShrink:0 }}>
                  <div style={{ fontSize:11, color:estadoColor, fontWeight:500 }}>{estadoLabel}</div>
                  <div style={{ fontSize:11, color:txt2 }}>{countEv}/3</div>
                  {estado==="completo" && <div style={{ fontSize:18, fontWeight:500, color:pColor(prom) }}>{prom}/100</div>}
                </div>
              </div>
              <div style={{ borderTop:`1px solid ${brd}`, paddingTop:10 }}>
                <div style={{ display:"grid", gridTemplateColumns:"repeat(3,1fr)", gap:6 }}>
                  {ROLES.map(rol => {
                    const ev=evEst[rol], nombre=est.tribunal[rol]||rol, cap=rol.charAt(0).toUpperCase()+rol.slice(1);
                    return (
                      <div key={rol} style={{ background:dark?"#1e1e1e":"#f8f8f4", borderRadius:8, padding:8, border:`1px solid ${ev?"#2d7a3a44":brd}` }}>
                        <div style={{ fontSize:10, color:acc, marginBottom:3, fontWeight:500 }}>{cap}</div>
                        <div style={{ fontSize:11, color:txt, marginBottom:6, lineHeight:1.3 }}>{nombre}</div>
                        {ev ? <div style={{ fontSize:12, fontWeight:500, color:pColor(ev.total) }}>{ev.total}/100 ✓</div>
                          : <button style={{ background:acc, color:"#fff", border:"none", borderRadius:6, padding:"5px 8px", fontSize:11, cursor:"pointer", fontWeight:500, width:"100%" }} onClick={() => irEvaluar(est, rol)}>Evaluar</button>}
                      </div>
                    );
                  })}
                </div>
                {estado==="completo" && (
                  <button style={{ background:"transparent", color:acc, border:`1px solid ${acc}`, borderRadius:8, padding:8, fontSize:12, cursor:"pointer", fontWeight:500, width:"100%", marginTop:8 }}
                    onClick={() => { setActivoId(est.id); setPantalla("veredicto"); }}>
                    📋 Ver veredicto final
                  </button>
                )}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}

// ══════════════════════════════════════════════════════
// REGISTRO
// ══════════════════════════════════════════════════════
function Registro({ dark, setPantalla, setEstudiantes, logoUrl, instNombre }) {
  const [form, setForm] = useState({ nombre:"", carrera:"", fecha:"", tutor:"", presidente:"", secretario:"", vocal:"" });
  const bg=dark?"#1a1a1a":"#f5f5f0", card=dark?"#252525":"#fff", brd=dark?"#333":"#e0e0d8";
  const txt=dark?"#f0f0f0":"#1a1a1a", txt2=dark?"#888":"#666", acc="#2d7a3a";
  const si = x => ({ background:dark?"#1e1e1e":"#f8f8f4", border:`1px solid ${brd}`, borderRadius:8, padding:"8px 12px", color:txt, fontSize:13, width:"100%", outline:"none", boxSizing:"border-box", marginBottom:10, ...x });
  const sl = { fontSize:11, color:txt2, marginBottom:4, display:"block", textTransform:"uppercase", letterSpacing:.8 };
  const sc = x => ({ background:card, border:`1px solid ${brd}`, borderRadius:12, padding:"14px 16px", marginBottom:10, ...x });
  const setF = (k,v) => setForm(p => ({...p, [k]:v}));
  function guardar() {
    if (!form.nombre.trim() || !form.carrera.trim()) return;
    setEstudiantes(p => [...p, { id:Date.now(), nombre:form.nombre, carrera:form.carrera, fecha:form.fecha, tutor:form.tutor, tribunal:{ presidente:form.presidente, secretario:form.secretario, vocal:form.vocal } }]);
    setPantalla("dashboard");
  }
  return (
    <div style={{ fontFamily:"system-ui,sans-serif", minHeight:"100vh", background:bg, color:txt, paddingBottom:40 }}>
      <div style={{ background:card, borderBottom:`1px solid ${brd}`, padding:"12px 16px", display:"flex", alignItems:"center", gap:10, position:"sticky", top:0 }}>
        <button style={{ background:"none", border:"none", color:txt2, cursor:"pointer", fontSize:18 }} onClick={() => setPantalla("dashboard")}>←</button>
        <LogoIcon url={logoUrl} size={28} />
        <span style={{ fontWeight:500 }}>Registrar estudiante</span>
      </div>
      <div style={{ padding:16 }}>
        <div style={sc()}>
          <div style={{ fontWeight:500, fontSize:13, marginBottom:12 }}>👨‍🎓 Datos del estudiante</div>
          {[["nombre","Nombre completo","text"],["carrera","Carrera","text"],["fecha","Fecha de defensa","date"],["tutor","Tutor / docente guía","text"]].map(([k,l,t]) => (
            <div key={k}><label style={sl}>{l}</label><input type={t} value={form[k]} onChange={e=>setF(k,e.target.value)} style={si()} /></div>
          ))}
        </div>
        <div style={sc()}>
          <div style={{ fontWeight:500, fontSize:13, marginBottom:12 }}>⚖️ Tribunal evaluador</div>
          {[["presidente","Presidente"],["secretario","Secretario"],["vocal","Vocal"]].map(([k,l]) => (
            <div key={k}><label style={sl}>{l}</label><input type="text" value={form[k]} onChange={e=>setF(k,e.target.value)} style={si()} /></div>
          ))}
        </div>
        <button style={{ background:acc, color:"#fff", border:"none", borderRadius:8, padding:12, fontSize:14, cursor:"pointer", fontWeight:500, width:"100%" }} onClick={guardar}>✓ Registrar estudiante</button>
      </div>
    </div>
  );
}

// ══════════════════════════════════════════════════════
// EVALUAR
// ══════════════════════════════════════════════════════
function Evaluar({ dark, activo, rol, setPantalla, onGuardar, db, logoUrl, criterios }) {
  const [puntajes,   setPuntajes]   = useState(() => initP(criterios));
  const [comentario, setComentario] = useState("");
  const [retro,      setRetro]      = useState(null);
  const [loading,    setLoading]    = useState(false);
  const [tab,        setTab]        = useState("rubrica");

  const bg=dark?"#1a1a1a":"#f5f5f0", card=dark?"#252525":"#fff", brd=dark?"#333":"#e0e0d8";
  const txt=dark?"#f0f0f0":"#1a1a1a", txt2=dark?"#888":"#666", acc="#2d7a3a";
  const total = calcTotal(puntajes, criterios);
  const nombreEval = activo ? activo.tribunal[rol] : rol;
  const capRol = rol ? rol.charAt(0).toUpperCase()+rol.slice(1) : "";
  const sc = x => ({ background:card, border:`1px solid ${brd}`, borderRadius:12, padding:"14px 16px", marginBottom:10, ...x });
  const sb = (on,col) => ({ background:on?(col||acc):"transparent", color:on?"#fff":txt2, border:`1px solid ${on?(col||acc):brd}`, borderRadius:8, padding:"8px 16px", fontSize:13, cursor:"pointer", fontWeight:500 });
  const si = x => ({ background:dark?"#1e1e1e":"#f8f8f4", border:`1px solid ${brd}`, borderRadius:8, padding:"8px 12px", color:txt, fontSize:13, width:"100%", outline:"none", boxSizing:"border-box", ...x });
  const stab = a => ({ padding:"8px 11px", fontSize:12, cursor:"pointer", color:a?acc:txt2, background:"transparent", border:"none", borderBottom:a?`2px solid ${acc}`:"2px solid transparent", fontWeight:a?500:400 });

  function analizar() {
    setLoading(true);
    setTimeout(() => { setRetro(generarRetro(puntajes, criterios, comentario, activo, capRol)); setTab("retro"); setLoading(false); }, 900);
  }
  function guardar() {
    onGuardar(activo.id, rol, { puntajes:{...puntajes}, total:Math.round(total), comentario, retro, evaluador:nombreEval, rol:capRol });
  }

  return (
    <div style={{ fontFamily:"system-ui,sans-serif", minHeight:"100vh", background:bg, color:txt, paddingBottom:40 }}>
      <div style={{ background:card, borderBottom:`1px solid ${brd}`, padding:"12px 16px", display:"flex", alignItems:"center", justifyContent:"space-between", position:"sticky", top:0, zIndex:10 }}>
        <div style={{ display:"flex", alignItems:"center", gap:8 }}>
          <button style={{ background:"none", border:"none", color:txt2, cursor:"pointer", fontSize:18 }} onClick={() => setPantalla("dashboard")}>←</button>
          <LogoIcon url={logoUrl} size={28} />
          <div>
            <div style={{ fontWeight:500, fontSize:13 }}>{activo && activo.nombre}</div>
            <div style={{ fontSize:11, color:acc }}>{capRol}: {nombreEval}</div>
          </div>
        </div>
        <div style={{ textAlign:"right" }}>
          <div style={{ fontSize:24, fontWeight:500, color:pColor(total) }}>{Math.round(total)}</div>
          <div style={{ fontSize:10, color:txt2 }}>/ 100</div>
        </div>
      </div>

      <div style={{ padding:"12px 16px" }}>
        <div style={{ background:dark?"#1a3320":"#e8f5e9", border:"1px solid #2d7a3a44", borderRadius:10, padding:"10px 14px", marginBottom:12, fontSize:12 }}>
          <b style={{ color:acc }}>Tutor:</b> <span style={{ color:txt2 }}>{activo && activo.tutor}</span>
        </div>

        <div style={sc()}>
          <textarea placeholder="Comentario del evaluador..." value={comentario} onChange={e=>setComentario(e.target.value)} style={si({ minHeight:60, resize:"vertical" })} />
          <button style={{ ...sb(!loading), marginTop:8, width:"100%", fontSize:12 }} onClick={analizar} disabled={loading}>
            {loading?"⏳ Generando...":"🤖 Generar retroalimentación"}
          </button>
        </div>

        <div style={{ display:"flex", borderBottom:`1px solid ${brd}`, marginBottom:10 }}>
          {[["rubrica","📊 Rúbrica"],["retro","🤖 Retroalim."]].map(([k,l]) => (
            <button key={k} style={stab(tab===k)} onClick={() => setTab(k)}>{l}</button>
          ))}
        </div>

        {tab==="rubrica" && (
          <div style={sc()}>
            {criterios.map(c => (
              <div key={c.id} style={{ marginBottom:18 }}>
                <div style={{ display:"flex", justifyContent:"space-between", marginBottom:4 }}>
                  <span style={{ fontSize:13, fontWeight:500 }}>{c.label}</span>
                  <span style={{ fontSize:13, color:pColor(puntajes[c.id]||0), fontWeight:500 }}>
                    {puntajes[c.id]||0} <span style={{ color:txt2, fontWeight:400, fontSize:11 }}>({c.peso}%)</span>
                  </span>
                </div>
                <input type="range" min="0" max="100" step="1" value={puntajes[c.id]||0}
                  onChange={e => { const v=parseInt(e.target.value), id=c.id; setPuntajes(p => ({...p,[id]:v})); }}
                  style={{ width:"100%", accentColor:pColor(puntajes[c.id]||0) }} />
                <div style={{ display:"flex", justifyContent:"space-between", fontSize:10, color:txt2 }}>
                  <span>0 Deficiente</span><span>51 Regular</span><span>100 Excelente</span>
                </div>
              </div>
            ))}
            <div style={{ borderTop:`1px solid ${brd}`, paddingTop:10, display:"flex", justifyContent:"space-between" }}>
              <span style={{ color:txt2, fontSize:12 }}>Puntaje total ponderado</span>
              <span style={{ fontSize:22, fontWeight:500, color:pColor(total) }}>{Math.round(total)}/100</span>
            </div>
          </div>
        )}

        {tab==="retro" && (
          <div>
            {!retro && !loading && <div style={{ textAlign:"center", color:txt2, fontSize:13, padding:"20px 0" }}>Ajusta la rúbrica y toca "Generar retroalimentación"</div>}
            {loading && <div style={{ textAlign:"center", color:txt2, padding:"20px 0" }}>⏳ Generando...</div>}
            {retro && (
              <div>
                <div style={sc()}><div style={{ fontSize:11, color:acc, marginBottom:6, fontWeight:500 }}>RETROALIMENTACIÓN</div><div style={{ fontSize:13, lineHeight:1.7 }}>{retro.texto}</div></div>
                <div style={{ display:"grid", gridTemplateColumns:"1fr 1fr", gap:8 }}>
                  <div style={sc({ marginBottom:0 })}><div style={{ fontSize:11, color:"#2d7a3a", marginBottom:6, fontWeight:500 }}>✓ FORTALEZAS</div>{retro.fortalezas.map((f,i)=><div key={i} style={{ fontSize:12, color:txt2, marginBottom:3 }}>· {f}</div>)}</div>
                  <div style={sc({ marginBottom:0 })}><div style={{ fontSize:11, color:"#b07a00", marginBottom:6, fontWeight:500 }}>△ MEJORAS</div>{retro.mejoras.map((m,i)=><div key={i} style={{ fontSize:12, color:txt2, marginBottom:3 }}>· {m}</div>)}</div>
                </div>
              </div>
            )}
          </div>
        )}

        <button style={{ background:acc, color:"#fff", border:"none", borderRadius:8, padding:12, fontSize:14, cursor:"pointer", fontWeight:500, width:"100%", marginTop:8 }} onClick={guardar}>
          💾 Guardar evaluación · {Math.round(total)} pts
        </button>
      </div>
    </div>
  );
}

// ══════════════════════════════════════════════════════
// VEREDICTO
// ══════════════════════════════════════════════════════
function Veredicto({ dark, activo, db, setPantalla, logoUrl, instNombre, irEvaluar }) {
  const bg=dark?"#1a1a1a":"#f5f5f0", card=dark?"#252525":"#fff", brd=dark?"#333":"#e0e0d8";
  const txt=dark?"#f0f0f0":"#1a1a1a", txt2=dark?"#888":"#666", acc="#2d7a3a";
  const sc = x => ({ background:card, border:`1px solid ${brd}`, borderRadius:12, padding:"14px 16px", marginBottom:10, ...x });
  const sb = (on,col) => ({ background:on?(col||acc):"transparent", color:on?"#fff":txt2, border:`1px solid ${on?(col||acc):brd}`, borderRadius:8, padding:"8px 16px", fontSize:13, cursor:"pointer", fontWeight:500 });
  if (!activo) return null;
  const evEst=db[activo.id]||{}, prom=promedioFinal(evEst), estado=estadoDefensa(evEst);
  const countEv=ROLES.filter(r=>evEst[r]).length;
  return (
    <div style={{ fontFamily:"system-ui,sans-serif", minHeight:"100vh", background:bg, color:txt, paddingBottom:40 }}>
      <div style={{ background:card, borderBottom:`1px solid ${brd}`, padding:"12px 16px", display:"flex", alignItems:"center", gap:10, position:"sticky", top:0 }}>
        <button style={{ background:"none", border:"none", color:txt2, cursor:"pointer", fontSize:18 }} onClick={() => setPantalla("dashboard")}>←</button>
        <LogoIcon url={logoUrl} size={28} />
        <div>
          <div style={{ fontWeight:500, fontSize:13 }}>Veredicto Final</div>
          <div style={{ fontSize:11, color:txt2 }}>{activo.nombre}</div>
        </div>
      </div>
      <div style={{ padding:"12px 16px" }}>
        <div style={{ background:dark?"#1a3320":"#e8f5e9", border:"1px solid #2d7a3a44", borderRadius:10, padding:"10px 14px", marginBottom:12, fontSize:12 }}>
          <div><b style={{ color:acc }}>Carrera:</b> <span style={{ color:txt2 }}>{activo.carrera}</span></div>
          <div><b style={{ color:acc }}>Tutor:</b> <span style={{ color:txt2 }}>{activo.tutor}</span></div>
          <div><b style={{ color:acc }}>Fecha:</b> <span style={{ color:txt2 }}>{activo.fecha}</span></div>
        </div>
        {estado==="completo" ? (
          <div style={{ background:card, border:`2px solid ${pColor(prom)}`, borderRadius:14, padding:20, textAlign:"center", marginBottom:12 }}>
            <div style={{ fontSize:12, color:txt2, marginBottom:6 }}>VEREDICTO FINAL</div>
            <div style={{ fontSize:48, fontWeight:500, color:pColor(prom), lineHeight:1 }}>{prom}</div>
            <div style={{ fontSize:13, color:txt2, marginBottom:8 }}>/ 100 puntos</div>
            <div style={{ fontSize:20, fontWeight:500, color:pColor(prom), background:pColor(prom)+"22", display:"inline-block", padding:"6px 20px", borderRadius:8 }}>{pLabel(prom)}</div>
            <div style={{ fontSize:11, color:txt2, marginTop:8 }}>Promedio de {countEv} evaluadores</div>
          </div>
        ) : (
          <div style={{ background:card, border:`1px solid ${brd}`, borderRadius:12, padding:16, textAlign:"center", marginBottom:12 }}>
            <div style={{ fontSize:13, color:txt2, marginBottom:4 }}>Evaluaciones: {countEv}/3</div>
            <div style={{ fontSize:12, color:"#b07a00" }}>Faltan {3-countEv} evaluador(es)</div>
          </div>
        )}
        <div style={sc()}>
          <div style={{ fontSize:11, color:txt2, marginBottom:10, textTransform:"uppercase", letterSpacing:.8 }}>Notas por evaluador</div>
          {ROLES.map(rol => {
            const ev=evEst[rol], nombre=activo.tribunal[rol]||rol, cap=rol.charAt(0).toUpperCase()+rol.slice(1);
            return (
              <div key={rol} style={{ display:"flex", alignItems:"center", justifyContent:"space-between", padding:"10px 0", borderBottom:`1px solid ${brd}` }}>
                <div><div style={{ fontWeight:500, fontSize:13 }}>{nombre}</div><div style={{ fontSize:11, color:acc }}>{cap}</div></div>
                {ev ? (
                  <div style={{ textAlign:"right" }}>
                    <div style={{ fontSize:20, fontWeight:500, color:pColor(ev.total) }}>{ev.total}</div>
                    <div style={{ fontSize:10, color:pColor(ev.total) }}>{pLabel(ev.total)}</div>
                  </div>
                ) : (
                  <button style={{ ...sb(true), padding:"6px 12px", fontSize:11 }} onClick={() => irEvaluar(activo, rol)}>Evaluar</button>
                )}
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}

// ══════════════════════════════════════════════════════
// CONFIG — con pesos editables
// ══════════════════════════════════════════════════════
function Config({ dark, setDark, setPantalla, logoUrl, setLogoUrl, instNombre, setInstNombre, criterios, setCriterios }) {
  const logoRef = useRef(null);
  const [pesosTmp, setPesosTmp] = useState(criterios.map(c => ({ ...c })));
  const bg=dark?"#1a1a1a":"#f5f5f0", card=dark?"#252525":"#fff", brd=dark?"#333":"#e0e0d8";
  const txt=dark?"#f0f0f0":"#1a1a1a", txt2=dark?"#888":"#666", acc="#2d7a3a";
  const sc = x => ({ background:card, border:`1px solid ${brd}`, borderRadius:12, padding:"14px 16px", marginBottom:10, ...x });
  const si = { background:dark?"#1e1e1e":"#f8f8f4", border:`1px solid ${brd}`, borderRadius:8, padding:"8px 12px", color:txt, fontSize:13, width:"100%", outline:"none", boxSizing:"border-box" };
  const sl = { fontSize:11, color:txt2, marginBottom:4, display:"block", textTransform:"uppercase", letterSpacing:.8 };

  const suma = sumaPesos(pesosTmp);
  const sumaOk = suma === 100;

  function setPeso(id, val) {
    setPesosTmp(prev => prev.map(c => c.id === id ? { ...c, peso: Math.max(0, Math.min(100, Number(val)||0)) } : c));
  }
  function setLabel(id, val) {
    setPesosTmp(prev => prev.map(c => c.id === id ? { ...c, label: val } : c));
  }
  function handleLogo(e) {
    const file=e.target.files[0]; if(!file) return;
    const r=new FileReader(); r.onload=ev=>setLogoUrl(ev.target.result); r.readAsDataURL(file);
  }
  function guardar() {
    if (!sumaOk) return;
    setCriterios(pesosTmp.map(c => ({ ...c })));
    setPantalla("dashboard");
  }

  return (
    <div style={{ fontFamily:"system-ui,sans-serif", minHeight:"100vh", background:bg, color:txt, paddingBottom:40 }}>
      <div style={{ background:card, borderBottom:`1px solid ${brd}`, padding:"12px 16px", display:"flex", alignItems:"center", gap:10, position:"sticky", top:0 }}>
        <button style={{ background:"none", border:"none", color:txt2, cursor:"pointer", fontSize:18 }} onClick={() => setPantalla("dashboard")}>←</button>
        <LogoIcon url={logoUrl} size={28} />
        <span style={{ fontWeight:500 }}>Configuración</span>
      </div>

      <div style={{ padding:16 }}>
        {/* LOGO */}
        <div style={sc()}>
          <div style={{ fontWeight:500, fontSize:13, marginBottom:12 }}>🏛️ Logo institucional</div>
          <div style={{ display:"flex", alignItems:"center", gap:14, marginBottom:10 }}>
            <div style={{ width:80, height:80, borderRadius:10, border:`2px dashed ${brd}`, display:"flex", alignItems:"center", justifyContent:"center", overflow:"hidden", background:dark?"#1e1e1e":"#f8f8f4", flexShrink:0 }}>
              {logoUrl ? <img src={logoUrl} alt="logo" style={{ width:"100%", height:"100%", objectFit:"contain" }} /> : <span style={{ fontSize:11, color:txt2, textAlign:"center", padding:4 }}>Sin logo</span>}
            </div>
            <div style={{ flex:1 }}>
              <button style={{ background:acc, color:"#fff", border:"none", borderRadius:8, padding:"8px 14px", fontSize:12, cursor:"pointer", fontWeight:500, marginBottom:8, width:"100%" }} onClick={() => logoRef.current && logoRef.current.click()}>📁 Subir logo</button>
              {logoUrl && <button style={{ background:"transparent", color:"#e24b4a", border:"1px solid #e24b4a", borderRadius:8, padding:"6px 14px", fontSize:12, cursor:"pointer", width:"100%" }} onClick={() => setLogoUrl("")}>Eliminar</button>}
              <input ref={logoRef} type="file" accept="image/*" style={{ display:"none" }} onChange={handleLogo} />
            </div>
          </div>
        </div>

        {/* INSTITUCIÓN */}
        <div style={sc()}>
          <div style={{ fontWeight:500, fontSize:13, marginBottom:12 }}>🏫 Institución</div>
          <label style={sl}>Nombre</label>
          <input value={instNombre} onChange={e=>setInstNombre(e.target.value)} style={si} />
        </div>

        {/* CRITERIOS Y PESOS */}
        <div style={sc()}>
          <div style={{ display:"flex", justifyContent:"space-between", alignItems:"center", marginBottom:12 }}>
            <div style={{ fontWeight:500, fontSize:13 }}>📊 Criterios y pesos</div>
            <div style={{ fontSize:12, fontWeight:600, color: sumaOk ? acc : "#e24b4a" }}>
              Total: {suma}% {sumaOk ? "✓" : "≠ 100"}
            </div>
          </div>

          {!sumaOk && (
            <div style={{ background:"#a32d2d22", border:"1px solid #a32d2d44", borderRadius:8, padding:"8px 12px", fontSize:12, color:"#e24b4a", marginBottom:12 }}>
              ⚠️ Los pesos deben sumar exactamente 100%. Actualmente suman {suma}%.
            </div>
          )}

          {pesosTmp.map(c => (
            <div key={c.id} style={{ marginBottom:14, background:dark?"#1e1e1e":"#f8f8f4", borderRadius:10, padding:"10px 12px", border:`1px solid ${brd}` }}>
              <div style={{ display:"grid", gridTemplateColumns:"1fr auto", gap:8, alignItems:"center" }}>
                <div>
                  <label style={sl}>Nombre del criterio</label>
                  <input value={c.label} onChange={e=>setLabel(c.id, e.target.value)}
                    style={{ ...si, marginBottom:8 }} />
                </div>
                <div style={{ textAlign:"center", minWidth:70 }}>
                  <label style={{ ...sl, textAlign:"center" }}>Peso %</label>
                  <input type="number" min="0" max="100" value={c.peso}
                    onChange={e => setPeso(c.id, e.target.value)}
                    style={{ ...si, textAlign:"center", fontWeight:600, fontSize:16, color: acc, width:70 }} />
                </div>
              </div>
              <input type="range" min="0" max="100" step="1" value={c.peso}
                onChange={e => setPeso(c.id, e.target.value)}
                style={{ width:"100%", accentColor: acc }} />
            </div>
          ))}

          <button style={{ background:dark?"#1e1e1e":"#f0f0e8", color:txt2, border:`1px solid ${brd}`, borderRadius:8, padding:"8px", fontSize:12, cursor:"pointer", width:"100%" }}
            onClick={() => setPesosTmp(CRITERIOS_DEFAULT.map(c=>({...c})))}>
            ↺ Restablecer pesos por defecto
          </button>
        </div>

        <button
          style={{ background:sumaOk?acc:"#666", color:"#fff", border:"none", borderRadius:8, padding:12, fontSize:14, cursor:sumaOk?"pointer":"not-allowed", fontWeight:500, width:"100%", opacity:sumaOk?1:0.6 }}
          onClick={guardar} disabled={!sumaOk}>
          ✓ Guardar configuración
        </button>
      </div>
    </div>
  );
}
