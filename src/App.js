import React from "react";
import { useState, useRef } from "react";

const CRITERIOS = [
  { id: "contenido",    label: "Contenido",    peso: 30 },
  { id: "metodologia", label: "Metodología",  peso: 30 },
  { id: "presentacion",label: "Presentación", peso: 20 },
  { id: "originalidad",label: "Originalidad", peso: 20 },
];

const ROLES = ["presidente", "secretario", "vocal"];

function pColor(p) { return p >= 71 ? "#2d7a3a" : p >= 51 ? "#b07a00" : "#a32d2d"; }
function pLabel(p) { return p >= 71 ? "Aprobado" : p >= 51 ? "Regular" : "Reprobado"; }
function initP()   { return { contenido: 0, metodologia: 0, presentacion: 0, originalidad: 0 }; }
function calcTotal(puntajes) {
  return CRITERIOS.reduce(function(a, c) { return a + (puntajes[c.id] * c.peso) / 100; }, 0);
}
function promedioFinal(evaluaciones) {
  var roles = ROLES.filter(function(r) { return evaluaciones[r]; });
  if (!roles.length) return 0;
  var suma = roles.reduce(function(a, r) { return a + evaluaciones[r].total; }, 0);
  return Math.round(suma / roles.length);
}
function estadoDefensa(evaluaciones) {
  var count = ROLES.filter(function(r) { return evaluaciones[r]; }).length;
  if (count === 0) return "pendiente";
  if (count < 3)  return "en_proceso";
  return "completo";
}

function generarRetro(puntajes, comentario, estudiante, rol) {
  var total = Math.round(calcTotal(puntajes));
  var fortalezas = [], mejoras = [];
  var msgs = {
    contenido:    ["Sólido dominio del marco teórico.", "Contenido aceptable; puede enriquecerse.", "Reforzar el sustento teórico."],
    metodologia:  ["Metodología bien estructurada.", "Metodología cumple requisitos mínimos.", "Revisar el diseño metodológico."],
    presentacion: ["Presentación clara y ordenada.", "Presentación funcional; mejorar orden.", "Mejorar estructura y claridad."],
    originalidad: ["Aportes originales y valor académico.", "Cierta originalidad que puede potenciarse.", "Incrementar el aporte original."],
  };
  CRITERIOS.forEach(function(c) {
    var p = puntajes[c.id];
    if (p >= 71) fortalezas.push(msgs[c.id][0]);
    else mejoras.push(p >= 51 ? msgs[c.id][1] : msgs[c.id][2]);
  });
  var accion = total >= 71 ? "Se recomienda su aprobación." : total >= 51 ? "Se recomienda revisión." : "Se recomienda reformulación del trabajo.";
  var coh = Math.abs(puntajes.contenido - puntajes.metodologia);
  var nombre = estudiante ? estudiante.nombre : "el/la estudiante";
  var obs = comentario ? ' Observa: "' + comentario + '". ' : " ";
  return {
    texto: "Evaluación del " + rol + ": " + nombre + " obtuvo " + total + "/100 — " + pLabel(total) + "." + obs + accion,
    fortalezas: fortalezas.length ? fortalezas : ["Cumple los requisitos básicos."],
    mejoras:    mejoras.length    ? mejoras    : ["Profundizar en todos los criterios."],
    coherencia: coh <= 20 ? "Alta" : coh <= 40 ? "Media" : "Baja",
    nota: total,
  };
}

function exportPDF(est, evaluacionesEst, logoUrl, instNombre) {
  var win = window.open("", "_blank");
  if (!win) { alert("Permite ventanas emergentes."); return; }
  var prom = promedioFinal(evaluacionesEst);

  var tablaRoles = ROLES.map(function(rol) {
    var ev = evaluacionesEst[rol];
    var nombre = est.tribunal[rol] || rol.charAt(0).toUpperCase() + rol.slice(1);
    if (!ev) return "<tr><td>" + nombre + "</td><td colspan='4' style='color:#aaa;text-align:center'>Pendiente</td></tr>";
    var filas = CRITERIOS.map(function(c) {
      return "<tr style='background:#f9f9f9'><td style='padding-left:20px;color:#555'>" + c.label + "</td><td>" + c.peso + "%</td><td>" + ev.puntajes[c.id] + "/100</td><td>" + Math.round(ev.puntajes[c.id] * c.peso / 100) + "</td><td></td></tr>";
    }).join("");
    return "<tr style='background:#e8f5e9'><td><b>" + nombre + "</b><br/><span style='font-size:10px;color:#555'>" + rol.charAt(0).toUpperCase()+rol.slice(1) + "</span></td><td colspan='3'></td><td style='font-weight:bold;color:" + pColor(ev.total) + "'>" + ev.total + "/100</td></tr>" + filas;
  }).join("");

  var firmas = ROLES.map(function(rol) {
    var nombre = est.tribunal[rol] || "_____________________";
    var cap = rol.charAt(0).toUpperCase() + rol.slice(1);
    var ev = evaluacionesEst[rol];
    var nota = ev ? (" — " + ev.total + "/100") : "";
    return "<div style='flex:1;text-align:center'><div style='border-top:1px solid #555;padding-top:8px;margin-top:40px'><b style='font-size:12px'>" + nombre + nota + "</b><br/><span style='font-size:11px;color:#555'>" + cap + "</span><br/><span style='font-size:10px;color:#888'>Tribunal Evaluador</span></div></div>";
  }).join("");

  var logoHtml = logoUrl
    ? "<img src='" + logoUrl + "' style='max-height:70px;max-width:120px;object-fit:contain'/>"
    : "<div style='width:70px;height:70px;border:2px dashed #ccc;border-radius:8px;display:flex;align-items:center;justify-content:center;font-size:9px;color:#aaa;text-align:center'>Sin logo</div>";

  var html = "<!DOCTYPE html><html><head><meta charset='utf-8'>"
    + "<style>body{font-family:Arial,sans-serif;max-width:720px;margin:30px auto;font-size:13px}"
    + "table{width:100%;border-collapse:collapse;margin-bottom:14px}"
    + "td,th{border:1px solid #ddd;padding:7px 10px}th{background:#f0f0f0;font-weight:600}"
    + ".hdr{display:flex;align-items:center;gap:16px;border-bottom:3px solid #2d7a3a;padding-bottom:12px;margin-bottom:18px}"
    + ".hdr-txt{flex:1;text-align:center}.obs{border-left:3px solid #2d7a3a;padding:8px 12px;background:#f9f9f9;margin:8px 0}"
    + ".veredicto{text-align:center;padding:16px;border:2px solid " + pColor(prom) + ";border-radius:8px;margin:16px 0}"
    + "</style></head><body>"
    + "<div class='hdr'>" + logoHtml + "<div class='hdr-txt'><h2 style='margin:0 0 4px'>" + instNombre + "</h2><p style='margin:0;color:#666;font-size:11px'>Acta de Defensa de Trabajo de Grado</p></div></div>"
    + "<table><tr><td><b>Estudiante:</b></td><td>" + est.nombre + "</td><td><b>Carrera:</b></td><td>" + est.carrera + "</td></tr>"
    + "<tr><td><b>Tutor/Docente guía:</b></td><td>" + est.tutor + "</td><td><b>Fecha:</b></td><td>" + est.fecha + "</td></tr></table>"
    + "<h3 style='font-size:13px;margin:12px 0 5px'>Evaluaciones del Tribunal</h3>"
    + "<table><tr><th>Evaluador</th><th>Criterio</th><th>Peso</th><th>Puntaje</th><th>Total</th></tr>" + tablaRoles + "</table>"
    + "<div class='veredicto'><div style='font-size:13px;color:#555;margin-bottom:4px'>VEREDICTO FINAL</div>"
    + "<div style='font-size:32px;font-weight:bold;color:" + pColor(prom) + "'>" + prom + "/100</div>"
    + "<div style='font-size:16px;font-weight:bold;color:" + pColor(prom) + ";margin-top:4px'>" + pLabel(prom) + "</div>"
    + "<div style='font-size:11px;color:#888;margin-top:4px'>Promedio de " + ROLES.filter(function(r){return evaluacionesEst[r];}).length + " evaluadores</div></div>"
    + "<div style='display:flex;gap:16px;margin-top:30px'>" + firmas + "</div>"
    + "<p style='font-size:9px;color:#bbb;text-align:center;margin-top:20px'>EvalúaPro Tribunal · " + new Date().toLocaleString("es-BO") + "</p>"
    + "</body></html>";

  win.document.write(html);
  win.document.close();
  win.focus();
  setTimeout(function() { win.print(); }, 600);
}

// ══════════════════════════════════════════════════════
// APP PRINCIPAL
// ══════════════════════════════════════════════════════
export default function App() {
  var [pantalla,    setPantalla]    = useState("dashboard");
  var [dark,        setDark]        = useState(true);
  var [logoUrl,     setLogoUrl]     = useState("");
  var [instNombre,  setInstNombre]  = useState("Universidad Mayor de San Andrés");
  var [estudiantes, setEstudiantes] = useState([
    { id: 1, nombre: "Ana Lucía Flores Mamani",     carrera: "Ingeniería de Sistemas",     fecha: "2026-03-27", tutor: "Dr. Roberto Vargas",   tribunal: { presidente: "MSc. Carmen López",   secretario: "Dr. Luis Pereira",  vocal: "MSc. Ana Quispe"   } },
    { id: 2, nombre: "Carlos Eduardo Ríos Salazar", carrera: "Administración de Empresas", fecha: "2026-03-28", tutor: "MSc. Patricia Solano",  tribunal: { presidente: "Dr. Jorge Mamani",   secretario: "MSc. Rosa Ticona", vocal: "Dr. Héctor Flores" } },
    { id: 3, nombre: "María Fernanda Quispe López", carrera: "Medicina",                   fecha: "2026-03-29", tutor: "Dr. Alejandro Mendoza", tribunal: { presidente: "Dra. Silvia Conde",  secretario: "Dr. Raúl Herrera",  vocal: "MSc. Clara Vidal"  } },
  ]);
  var [db,          setDB]          = useState({});
  var [activoId,    setActivoId]    = useState(null);
  var [activoRol,   setActivoRol]   = useState(null);

  var activo = estudiantes.find(function(e){ return e.id === activoId; });

  function irEvaluar(est, rol) {
    setActivoId(est.id);
    setActivoRol(rol);
    setPantalla("evaluar");
  }

  function guardarEval(estId, rol, evalData) {
    setDB(function(prev) {
      var estDB = Object.assign({}, prev[estId] || {});
      estDB[rol] = evalData;
      return Object.assign({}, prev, { [estId]: estDB });
    });
    setPantalla("veredicto");
    setActivoId(estId);
  }

  if (pantalla === "config")    return <Config dark={dark} setDark={setDark} setPantalla={setPantalla} logoUrl={logoUrl} setLogoUrl={setLogoUrl} instNombre={instNombre} setInstNombre={setInstNombre} />;
  if (pantalla === "registro")  return <Registro dark={dark} setPantalla={setPantalla} setEstudiantes={setEstudiantes} />;
  if (pantalla === "evaluar")   return <Evaluar dark={dark} activo={activo} rol={activoRol} setPantalla={setPantalla} onGuardar={guardarEval} db={db} />;
  if (pantalla === "veredicto") return <Veredicto dark={dark} activo={activo} db={db} setPantalla={setPantalla} logoUrl={logoUrl} instNombre={instNombre} irEvaluar={irEvaluar} />;
  return <Dashboard dark={dark} setDark={setDark} setPantalla={setPantalla} estudiantes={estudiantes} db={db} logoUrl={logoUrl} irEvaluar={irEvaluar} setActivoId={setActivoId} />;
}

// ══════════════════════════════════════════════════════
// DASHBOARD
// ══════════════════════════════════════════════════════
function Dashboard(props) {
  var dark=props.dark, setDark=props.setDark, setPantalla=props.setPantalla;
  var estudiantes=props.estudiantes, db=props.db, logoUrl=props.logoUrl;
  var irEvaluar=props.irEvaluar, setActivoId=props.setActivoId;

  var bg=dark?"#1a1a1a":"#f5f5f0", card=dark?"#252525":"#fff", brd=dark?"#333":"#e0e0d8";
  var txt=dark?"#f0f0f0":"#1a1a1a", txt2=dark?"#888":"#666", acc="#2d7a3a";
  function sc(x){ return Object.assign({ background:card, border:"1px solid "+brd, borderRadius:12, padding:"14px 16px", marginBottom:10 }, x); }
  function sb(on,col){ return { background:on?(col||acc):"transparent", color:on?"#fff":txt2, border:"1px solid "+(on?(col||acc):brd), borderRadius:8, padding:"7px 14px", fontSize:12, cursor:"pointer", fontWeight:500 }; }

  var completados = estudiantes.filter(function(e){ return estadoDefensa(db[e.id]||{}) === "completo"; }).length;

  return (
    <div style={{ fontFamily:"system-ui,sans-serif", minHeight:"100vh", background:bg, color:txt, paddingBottom:40 }}>
      <div style={{ background:card, borderBottom:"1px solid "+brd, padding:"12px 16px", display:"flex", alignItems:"center", justifyContent:"space-between", position:"sticky", top:0, zIndex:10 }}>
        <div style={{ display:"flex", alignItems:"center", gap:10 }}>
          {logoUrl ? <img src={logoUrl} alt="logo" style={{ height:34, width:34, objectFit:"contain", borderRadius:6 }} /> : <span style={{ fontSize:22 }}>🎓</span>}
          <div>
            <div style={{ fontWeight:500, fontSize:14 }}>EvalúaPro Tribunal</div>
            <div style={{ fontSize:10, color:txt2 }}>Evaluación colectiva · Bolivia</div>
          </div>
        </div>
        <div style={{ display:"flex", gap:8 }}>
          <button style={sb(false)} onClick={function(){ setPantalla("config"); }}>⚙️</button>
          <button style={sb(false)} onClick={function(){ setDark(function(d){ return !d; }); }}>{dark?"☀️":"🌙"}</button>
        </div>
      </div>

      <div style={{ padding:"12px 16px" }}>
        <div style={{ display:"grid", gridTemplateColumns:"repeat(3,1fr)", gap:8, marginBottom:14 }}>
          {[["Total",estudiantes.length],["En proceso",estudiantes.filter(function(e){ var s=estadoDefensa(db[e.id]||{}); return s==="en_proceso"; }).length],["Completados",completados]].map(function(item){
            return (
              <div key={item[0]} style={{ background:dark?"#1e1e1e":card, border:"1px solid "+brd, borderRadius:10, padding:"10px 8px", textAlign:"center" }}>
                <div style={{ fontSize:20, fontWeight:500, color:acc }}>{item[1]}</div>
                <div style={{ fontSize:11, color:txt2 }}>{item[0]}</div>
              </div>
            );
          })}
        </div>

        <button style={{ background:acc, color:"#fff", border:"none", borderRadius:8, padding:"10px 16px", fontSize:13, cursor:"pointer", fontWeight:500, marginBottom:14, width:"100%" }} onClick={function(){ setPantalla("registro"); }}>
          + Registrar nuevo estudiante
        </button>

        <div style={{ fontSize:11, color:txt2, marginBottom:8, textTransform:"uppercase", letterSpacing:.8 }}>Defensas</div>

        {estudiantes.map(function(est) {
          var evEst = db[est.id] || {};
          var estado = estadoDefensa(evEst);
          var prom = promedioFinal(evEst);
          var estadoColor = estado==="completo" ? "#2d7a3a" : estado==="en_proceso" ? "#b07a00" : "#888";
          var estadoLabel = estado==="completo" ? "✓ Completo" : estado==="en_proceso" ? "● En proceso" : "○ Pendiente";
          var countEv = ROLES.filter(function(r){ return evEst[r]; }).length;

          return (
            <div key={est.id} style={sc()}>
              <div style={{ display:"flex", justifyContent:"space-between", alignItems:"flex-start", marginBottom:10 }}>
                <div style={{ flex:1 }}>
                  <div style={{ fontWeight:500, fontSize:13 }}>{est.nombre}</div>
                  <div style={{ fontSize:11, color:txt2, marginTop:2 }}>{est.carrera}</div>
                  <div style={{ fontSize:11, color:txt2 }}>Tutor: {est.tutor}</div>
                  <div style={{ fontSize:11, color:txt2 }}>Fecha: {est.fecha}</div>
                </div>
                <div style={{ textAlign:"right", flexShrink:0 }}>
                  <div style={{ fontSize:11, color:estadoColor, fontWeight:500 }}>{estadoLabel}</div>
                  <div style={{ fontSize:11, color:txt2 }}>{countEv}/3 evaluadores</div>
                  {estado==="completo" && <div style={{ fontSize:18, fontWeight:500, color:pColor(prom), marginTop:4 }}>{prom}/100</div>}
                </div>
              </div>

              <div style={{ borderTop:"1px solid "+brd, paddingTop:10 }}>
                <div style={{ fontSize:11, color:txt2, marginBottom:8 }}>Tribunal asignado:</div>
                <div style={{ display:"grid", gridTemplateColumns:"repeat(3,1fr)", gap:6 }}>
                  {ROLES.map(function(rol) {
                    var ev = evEst[rol];
                    var nombre = est.tribunal[rol] || rol;
                    var cap = rol.charAt(0).toUpperCase()+rol.slice(1);
                    return (
                      <div key={rol} style={{ background:dark?"#1e1e1e":"#f8f8f4", borderRadius:8, padding:"8px", border:"1px solid "+(ev?"#2d7a3a44":brd) }}>
                        <div style={{ fontSize:10, color:acc, marginBottom:3, fontWeight:500 }}>{cap}</div>
                        <div style={{ fontSize:11, color:txt, marginBottom:6, lineHeight:1.3 }}>{nombre}</div>
                        {ev ? (
                          <div style={{ fontSize:12, fontWeight:500, color:pColor(ev.total) }}>{ev.total}/100 ✓</div>
                        ) : (
                          <button style={{ background:acc, color:"#fff", border:"none", borderRadius:6, padding:"5px 8px", fontSize:11, cursor:"pointer", fontWeight:500, width:"100%" }} onClick={function(){ irEvaluar(est, rol); }}>
                            Evaluar
                          </button>
                        )}
                      </div>
                    );
                  })}
                </div>
                {estado === "completo" && (
                  <button style={{ background:"transparent", color:acc, border:"1px solid "+acc, borderRadius:8, padding:"8px", fontSize:12, cursor:"pointer", fontWeight:500, width:"100%", marginTop:8 }}
                    onClick={function(){ setActivoId(est.id); setPantalla("veredicto"); }}>
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
function Registro(props) {
  var dark=props.dark, setPantalla=props.setPantalla, setEstudiantes=props.setEstudiantes;
  var [form, setForm] = useState({ nombre:"", carrera:"", fecha:"", tutor:"", presidente:"", secretario:"", vocal:"" });

  var bg=dark?"#1a1a1a":"#f5f5f0", card=dark?"#252525":"#fff", brd=dark?"#333":"#e0e0d8";
  var txt=dark?"#f0f0f0":"#1a1a1a", txt2=dark?"#888":"#666", acc="#2d7a3a";
  function si(x){ return Object.assign({ background:dark?"#1e1e1e":"#f8f8f4", border:"1px solid "+brd, borderRadius:8, padding:"8px 12px", color:txt, fontSize:13, width:"100%", outline:"none", boxSizing:"border-box", marginBottom:10 }, x); }
  var sl = { fontSize:11, color:txt2, marginBottom:4, display:"block", textTransform:"uppercase", letterSpacing:.8 };
  function sc(x){ return Object.assign({ background:card, border:"1px solid "+brd, borderRadius:12, padding:"14px 16px", marginBottom:10 }, x); }

  function setF(k, v) { setForm(function(p){ return Object.assign({}, p, { [k]: v }); }); }

  function guardar() {
    if (!form.nombre.trim() || !form.carrera.trim()) return;
    var nuevo = { id: Date.now(), nombre: form.nombre, carrera: form.carrera, fecha: form.fecha, tutor: form.tutor,
      tribunal: { presidente: form.presidente, secretario: form.secretario, vocal: form.vocal } };
    setEstudiantes(function(p){ return p.concat([nuevo]); });
    setPantalla("dashboard");
  }

  return (
    <div style={{ fontFamily:"system-ui,sans-serif", minHeight:"100vh", background:bg, color:txt, paddingBottom:40 }}>
      <div style={{ background:card, borderBottom:"1px solid "+brd, padding:"12px 16px", display:"flex", alignItems:"center", gap:8, position:"sticky", top:0 }}>
        <button style={{ background:"none", border:"none", color:txt2, cursor:"pointer", fontSize:18 }} onClick={function(){ setPantalla("dashboard"); }}>←</button>
        <span style={{ fontWeight:500 }}>Registrar estudiante</span>
      </div>
      <div style={{ padding:16 }}>
        <div style={sc()}>
          <div style={{ fontWeight:500, fontSize:13, marginBottom:12 }}>👨‍🎓 Datos del estudiante</div>
          {[["nombre","Nombre completo","text"],["carrera","Carrera","text"],["fecha","Fecha de defensa","date"],["tutor","Nombre del tutor / docente guía","text"]].map(function(f){
            return (
              <div key={f[0]}>
                <label style={sl}>{f[1]}</label>
                <input type={f[2]} value={form[f[0]]} onChange={function(e){ setF(f[0], e.target.value); }} style={si()} />
              </div>
            );
          })}
        </div>

        <div style={sc()}>
          <div style={{ fontWeight:500, fontSize:13, marginBottom:12 }}>⚖️ Tribunal evaluador</div>
          {[["presidente","👤 Nombre del Presidente"],["secretario","👤 Nombre del Secretario"],["vocal","👤 Nombre del Vocal"]].map(function(f){
            return (
              <div key={f[0]}>
                <label style={sl}>{f[1]}</label>
                <input type="text" value={form[f[0]]} onChange={function(e){ setF(f[0], e.target.value); }} style={si()} />
              </div>
            );
          })}
        </div>

        <button style={{ background:acc, color:"#fff", border:"none", borderRadius:8, padding:"12px", fontSize:14, cursor:"pointer", fontWeight:500, width:"100%" }} onClick={guardar}>
          ✓ Registrar estudiante
        </button>
      </div>
    </div>
  );
}

// ══════════════════════════════════════════════════════
// EVALUAR
// ══════════════════════════════════════════════════════
function Evaluar(props) {
  var dark=props.dark, activo=props.activo, rol=props.rol;
  var setPantalla=props.setPantalla, onGuardar=props.onGuardar, db=props.db;

  var [puntajes,      setPuntajes]      = useState(initP());
  var [comentario,    setComentario]    = useState("");
  var [transcripcion, setTranscripcion] = useState("");
  var [grabando,      setGrabando]      = useState(false);
  var [retro,         setRetro]         = useState(null);
  var [loading,       setLoading]       = useState(false);
  var [tab,           setTab]           = useState("rubrica");
  var recRef = useRef(null);

  var bg=dark?"#1a1a1a":"#f5f5f0", card=dark?"#252525":"#fff", brd=dark?"#333":"#e0e0d8";
  var txt=dark?"#f0f0f0":"#1a1a1a", txt2=dark?"#888":"#666", acc="#2d7a3a";
  var total = calcTotal(puntajes);
  var nombreEval = activo ? activo.tribunal[rol] : rol;
  var capRol = rol ? rol.charAt(0).toUpperCase()+rol.slice(1) : "";

  function sc(x){ return Object.assign({ background:card, border:"1px solid "+brd, borderRadius:12, padding:"14px 16px", marginBottom:10 }, x); }
  function sb(on,col){ return { background:on?(col||acc):"transparent", color:on?"#fff":txt2, border:"1px solid "+(on?(col||acc):brd), borderRadius:8, padding:"8px 16px", fontSize:13, cursor:"pointer", fontWeight:500 }; }
  function si(x){ return Object.assign({ background:dark?"#1e1e1e":"#f8f8f4", border:"1px solid "+brd, borderRadius:8, padding:"8px 12px", color:txt, fontSize:13, width:"100%", outline:"none", boxSizing:"border-box" }, x); }
  function stab(a){ return { padding:"8px 11px", fontSize:12, cursor:"pointer", color:a?acc:txt2, background:"transparent", border:"none", borderBottom:a?"2px solid "+acc:"2px solid transparent", fontWeight:a?500:400 }; }

  function iniciar() {
    var SR = window.SpeechRecognition || window.webkitSpeechRecognition;
    if (!SR) { alert("Usa Chrome para reconocimiento de voz."); return; }
    var rec = new SR();
    rec.lang="es-BO"; rec.continuous=true; rec.interimResults=true;
    rec.onresult = function(e) {
      var t=""; for (var i=0;i<e.results.length;i++) t+=e.results[i][0].transcript+" ";
      setTranscripcion(t.trim());
      var m = t.match(/nota\s+(\d+)/i)||t.match(/puntaje\s+(\d+)/i);
      if (m) setPuntajes(function(p){ return Object.assign({},p,{contenido:Math.min(100,parseInt(m[1]))}); });
    };
    rec.onerror=function(){ setGrabando(false); };
    rec.onend=function(){ setGrabando(false); };
    recRef.current=rec; rec.start(); setGrabando(true);
  }
  function detener() {
    if (recRef.current) recRef.current.stop();
    setGrabando(false);
    if (transcripcion) setComentario(function(p){ return (p+" "+transcripcion).trim(); });
  }
  function analizar() {
    setLoading(true);
    setTimeout(function(){
      setRetro(generarRetro(puntajes, comentario, activo, capRol));
      setTab("retro"); setLoading(false);
    }, 1000);
  }
  function guardar() {
    onGuardar(activo.id, rol, { puntajes:Object.assign({},puntajes), total:Math.round(total), comentario:comentario, retro:retro, evaluador:nombreEval, rol:capRol });
  }

  return (
    <div style={{ fontFamily:"system-ui,sans-serif", minHeight:"100vh", background:bg, color:txt, paddingBottom:40 }}>
      <div style={{ background:card, borderBottom:"1px solid "+brd, padding:"12px 16px", display:"flex", alignItems:"center", justifyContent:"space-between", position:"sticky", top:0, zIndex:10 }}>
        <div style={{ display:"flex", alignItems:"center", gap:8 }}>
          <button style={{ background:"none", border:"none", color:txt2, cursor:"pointer", fontSize:18 }} onClick={function(){ setPantalla("dashboard"); }}>←</button>
          <div>
            <div style={{ fontWeight:500, fontSize:13, maxWidth:160, overflow:"hidden", textOverflow:"ellipsis", whiteSpace:"nowrap" }}>{activo && activo.nombre}</div>
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
          <b style={{ color:acc }}>Tutor del trabajo:</b> <span style={{ color:txt2 }}>{activo && activo.tutor}</span>
        </div>

        <div style={sc()}>
          <div style={{ display:"flex", justifyContent:"space-between", alignItems:"center", marginBottom:10 }}>
            <span style={{ fontWeight:500, fontSize:13 }}>🎤 Evaluación por voz</span>
            <button style={sb(grabando, grabando?"#a32d2d":acc)} onClick={grabando?detener:iniciar}>{grabando?"⏹ Detener":"● Grabar"}</button>
          </div>
          {grabando && <div style={{ fontSize:11, color:"#e24b4a", marginBottom:8 }}>● Grabando... Di "nota 85" para asignar puntaje</div>}
          {transcripcion && <div style={{ fontSize:12, color:txt2, background:dark?"#1e1e1e":"#f0f0e8", borderRadius:8, padding:"8px 10px", marginBottom:8, fontStyle:"italic" }}>"{transcripcion}"</div>}
          <textarea placeholder="Comentario del evaluador..." value={comentario} onChange={function(e){ setComentario(e.target.value); }} style={si({ minHeight:60, resize:"vertical" })} />
          <button style={Object.assign({},sb(!loading),{ marginTop:8, width:"100%", fontSize:12 })} onClick={analizar} disabled={loading}>
            {loading?"⏳ Generando...":"🤖 Generar retroalimentación inteligente"}
          </button>
        </div>

        <div style={{ display:"flex", borderBottom:"1px solid "+brd, marginBottom:10 }}>
          {[["rubrica","📊 Rúbrica"],["retro","🤖 Retroalim."]].map(function(item){
            return <button key={item[0]} style={stab(tab===item[0])} onClick={function(){ setTab(item[0]); }}>{item[1]}</button>;
          })}
        </div>

        {tab==="rubrica" && (
          <div style={sc()}>
            {CRITERIOS.map(function(c){
              return (
                <div key={c.id} style={{ marginBottom:18 }}>
                  <div style={{ display:"flex", justifyContent:"space-between", marginBottom:4 }}>
                    <span style={{ fontSize:13, fontWeight:500 }}>{c.label}</span>
                    <span style={{ fontSize:13, color:pColor(puntajes[c.id]), fontWeight:500 }}>{puntajes[c.id]} <span style={{ color:txt2, fontWeight:400, fontSize:11 }}>({c.peso}%)</span></span>
                  </div>
                  <input type="range" min="0" max="100" step="1" value={puntajes[c.id]}
                    onChange={function(e){ var v=parseInt(e.target.value),id=c.id; setPuntajes(function(p){ return Object.assign({},p,{[id]:v}); }); }}
                    style={{ width:"100%", accentColor:pColor(puntajes[c.id]) }} />
                  <div style={{ display:"flex", justifyContent:"space-between", fontSize:10, color:txt2 }}>
                    <span>0 Deficiente</span><span>51 Regular</span><span>100 Excelente</span>
                  </div>
                </div>
              );
            })}
            <div style={{ borderTop:"1px solid "+brd, paddingTop:10, display:"flex", justifyContent:"space-between" }}>
              <span style={{ color:txt2, fontSize:12 }}>Puntaje total ponderado</span>
              <span style={{ fontSize:22, fontWeight:500, color:pColor(total) }}>{Math.round(total)}/100</span>
            </div>
          </div>
        )}

        {tab==="retro" && (
          <div>
            {!retro && !loading && <div style={{ textAlign:"center", color:txt2, fontSize:13, padding:"20px 0" }}>Ajusta la rúbrica y toca "Generar retroalimentación"</div>}
            {loading && <div style={{ textAlign:"center", color:txt2, fontSize:13, padding:"20px 0" }}>⏳ Generando...</div>}
            {retro && (
              <div>
                <div style={sc()}><div style={{ fontSize:11, color:acc, marginBottom:6, fontWeight:500 }}>RETROALIMENTACIÓN FORMAL</div><div style={{ fontSize:13, lineHeight:1.7 }}>{retro.texto}</div></div>
                <div style={{ display:"grid", gridTemplateColumns:"1fr 1fr", gap:8 }}>
                  <div style={sc({ marginBottom:0 })}><div style={{ fontSize:11, color:"#2d7a3a", marginBottom:6, fontWeight:500 }}>✓ FORTALEZAS</div>{retro.fortalezas.map(function(f,i){ return <div key={i} style={{ fontSize:12, color:txt2, marginBottom:3 }}>· {f}</div>; })}</div>
                  <div style={sc({ marginBottom:0 })}><div style={{ fontSize:11, color:"#b07a00", marginBottom:6, fontWeight:500 }}>△ MEJORAS</div>{retro.mejoras.map(function(m,i){ return <div key={i} style={{ fontSize:12, color:txt2, marginBottom:3 }}>· {m}</div>; })}</div>
                </div>
              </div>
            )}
          </div>
        )}

        <button style={{ background:acc, color:"#fff", border:"none", borderRadius:8, padding:"12px", fontSize:14, cursor:"pointer", fontWeight:500, width:"100%", marginTop:8 }} onClick={guardar}>
          💾 Guardar evaluación · {Math.round(total)} pts
        </button>
      </div>
    </div>
  );
}

// ══════════════════════════════════════════════════════
// VEREDICTO
// ══════════════════════════════════════════════════════
function Veredicto(props) {
  var dark=props.dark, activo=props.activo, db=props.db;
  var setPantalla=props.setPantalla, logoUrl=props.logoUrl, instNombre=props.instNombre, irEvaluar=props.irEvaluar;

  var bg=dark?"#1a1a1a":"#f5f5f0", card=dark?"#252525":"#fff", brd=dark?"#333":"#e0e0d8";
  var txt=dark?"#f0f0f0":"#1a1a1a", txt2=dark?"#888":"#666", acc="#2d7a3a";
  function sc(x){ return Object.assign({ background:card, border:"1px solid "+brd, borderRadius:12, padding:"14px 16px", marginBottom:10 }, x); }
  function sb(on,col){ return { background:on?(col||acc):"transparent", color:on?"#fff":txt2, border:"1px solid "+(on?(col||acc):brd), borderRadius:8, padding:"8px 16px", fontSize:13, cursor:"pointer", fontWeight:500 }; }

  if (!activo) return null;
  var evEst = db[activo.id] || {};
  var prom  = promedioFinal(evEst);
  var estado = estadoDefensa(evEst);
  var countEv = ROLES.filter(function(r){ return evEst[r]; }).length;

  return (
    <div style={{ fontFamily:"system-ui,sans-serif", minHeight:"100vh", background:bg, color:txt, paddingBottom:40 }}>
      <div style={{ background:card, borderBottom:"1px solid "+brd, padding:"12px 16px", display:"flex", alignItems:"center", gap:8, position:"sticky", top:0 }}>
        <button style={{ background:"none", border:"none", color:txt2, cursor:"pointer", fontSize:18 }} onClick={function(){ setPantalla("dashboard"); }}>←</button>
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

        {estado === "completo" && (
          <div style={{ background:card, border:"2px solid "+pColor(prom), borderRadius:14, padding:"20px", textAlign:"center", marginBottom:12 }}>
            <div style={{ fontSize:12, color:txt2, marginBottom:6 }}>VEREDICTO FINAL</div>
            <div style={{ fontSize:48, fontWeight:500, color:pColor(prom), lineHeight:1 }}>{prom}</div>
            <div style={{ fontSize:13, color:txt2, marginBottom:8 }}>/ 100 puntos</div>
            <div style={{ fontSize:20, fontWeight:500, color:pColor(prom), background:pColor(prom)+"22", display:"inline-block", padding:"6px 20px", borderRadius:8 }}>{pLabel(prom)}</div>
            <div style={{ fontSize:11, color:txt2, marginTop:8 }}>Promedio de {countEv} evaluadores</div>
          </div>
        )}

        {estado !== "completo" && (
          <div style={{ background:card, border:"1px solid "+brd, borderRadius:12, padding:"16px", textAlign:"center", marginBottom:12 }}>
            <div style={{ fontSize:13, color:txt2, marginBottom:4 }}>Evaluaciones completadas: {countEv}/3</div>
            <div style={{ fontSize:12, color:"#b07a00" }}>Faltan {3-countEv} evaluador(es) para el veredicto final</div>
          </div>
        )}

        <div style={sc()}>
          <div style={{ fontSize:11, color:txt2, marginBottom:10, textTransform:"uppercase", letterSpacing:.8 }}>Notas por evaluador</div>
          {ROLES.map(function(rol){
            var ev = evEst[rol];
            var nombre = activo.tribunal[rol] || rol;
            var cap = rol.charAt(0).toUpperCase()+rol.slice(1);
            return (
              <div key={rol} style={{ display:"flex", alignItems:"center", justifyContent:"space-between", padding:"10px 0", borderBottom:"1px solid "+brd }}>
                <div>
                  <div style={{ fontWeight:500, fontSize:13 }}>{nombre}</div>
                  <div style={{ fontSize:11, color:acc }}>{cap}</div>
                </div>
                {ev ? (
                  <div style={{ textAlign:"right" }}>
                    <div style={{ fontSize:20, fontWeight:500, color:pColor(ev.total) }}>{ev.total}</div>
                    <div style={{ fontSize:10, color:pColor(ev.total) }}>{pLabel(ev.total)}</div>
                  </div>
                ) : (
                  <button style={Object.assign({},sb(true),{ padding:"6px 12px", fontSize:11 })} onClick={function(){ irEvaluar(activo, rol); }}>
                    Evaluar
                  </button>
                )}
              </div>
            );
          })}
        </div>

        {ROLES.map(function(rol){
          var ev = evEst[rol];
          if (!ev || !ev.retro) return null;
          var nombre = activo.tribunal[rol] || rol;
          return (
            <div key={rol} style={sc()}>
              <div style={{ fontSize:11, color:acc, marginBottom:6, fontWeight:500 }}>OBSERVACIONES — {nombre.toUpperCase()}</div>
              {ev.comentario && <div style={{ fontSize:12, color:txt2, borderLeft:"3px solid "+acc, paddingLeft:10, marginBottom:8, fontStyle:"italic" }}>"{ev.comentario}"</div>}
              <div style={{ fontSize:12, lineHeight:1.6, color:txt }}>{ev.retro.texto}</div>
            </div>
          );
        })}

        {estado === "completo" && (
          <button style={{ background:acc, color:"#fff", border:"none", borderRadius:8, padding:"12px", fontSize:14, cursor:"pointer", fontWeight:500, width:"100%", marginTop:4 }}
            onClick={function(){ exportPDF(activo, evEst, logoUrl, instNombre); }}>
            🖨️ Exportar acta final con veredicto
          </button>
        )}
      </div>
    </div>
  );
}

// ══════════════════════════════════════════════════════
// CONFIG
// ══════════════════════════════════════════════════════
function Config(props) {
  var dark=props.dark, setPantalla=props.setPantalla;
  var logoUrl=props.logoUrl, setLogoUrl=props.setLogoUrl;
  var instNombre=props.instNombre, setInstNombre=props.setInstNombre;
  var logoRef = useRef(null);

  var bg=dark?"#1a1a1a":"#f5f5f0", card=dark?"#252525":"#fff", brd=dark?"#333":"#e0e0d8";
  var txt=dark?"#f0f0f0":"#1a1a1a", txt2=dark?"#888":"#666", acc="#2d7a3a";
  function sc(x){ return Object.assign({ background:card, border:"1px solid "+brd, borderRadius:12, padding:"14px 16px", marginBottom:10 }, x); }
  var si = { background:dark?"#1e1e1e":"#f8f8f4", border:"1px solid "+brd, borderRadius:8, padding:"8px 12px", color:txt, fontSize:13, width:"100%", outline:"none", boxSizing:"border-box" };
  var sl = { fontSize:11, color:txt2, marginBottom:4, display:"block", textTransform:"uppercase", letterSpacing:.8 };

  function handleLogo(e) {
    var file = e.target.files[0]; if (!file) return;
    var r = new FileReader();
    r.onload = function(ev) { setLogoUrl(ev.target.result); };
    r.readAsDataURL(file);
  }

  return (
    <div style={{ fontFamily:"system-ui,sans-serif", minHeight:"100vh", background:bg, color:txt, paddingBottom:40 }}>
      <div style={{ background:card, borderBottom:"1px solid "+brd, padding:"12px 16px", display:"flex", alignItems:"center", gap:8, position:"sticky", top:0 }}>
        <button style={{ background:"none", border:"none", color:txt2, cursor:"pointer", fontSize:18 }} onClick={function(){ setPantalla("dashboard"); }}>←</button>
        <span style={{ fontWeight:500 }}>Configuración</span>
      </div>
      <div style={{ padding:16 }}>
        <div style={sc()}>
          <div style={{ fontWeight:500, fontSize:13, marginBottom:12 }}>🏛️ Logo institucional</div>
          <div style={{ display:"flex", alignItems:"center", gap:14, marginBottom:10 }}>
            <div style={{ width:80, height:80, borderRadius:10, border:"2px dashed "+brd, display:"flex", alignItems:"center", justifyContent:"center", overflow:"hidden", background:dark?"#1e1e1e":"#f8f8f4", flexShrink:0 }}>
              {logoUrl ? <img src={logoUrl} alt="logo" style={{ width:"100%", height:"100%", objectFit:"contain" }} /> : <span style={{ fontSize:11, color:txt2, textAlign:"center", padding:4 }}>Sin logo</span>}
            </div>
            <div style={{ flex:1 }}>
              <button style={{ background:acc, color:"#fff", border:"none", borderRadius:8, padding:"8px 14px", fontSize:12, cursor:"pointer", fontWeight:500, marginBottom:8, width:"100%" }} onClick={function(){ logoRef.current && logoRef.current.click(); }}>
                📁 Subir logo
              </button>
              {logoUrl && <button style={{ background:"transparent", color:"#e24b4a", border:"1px solid #e24b4a", borderRadius:8, padding:"6px 14px", fontSize:12, cursor:"pointer", width:"100%" }} onClick={function(){ setLogoUrl(""); }}>Eliminar</button>}
              <input ref={logoRef} type="file" accept="image/*" style={{ display:"none" }} onChange={handleLogo} />
            </div>
          </div>
        </div>
        <div style={sc()}>
          <div style={{ fontWeight:500, fontSize:13, marginBottom:12 }}>🏫 Institución</div>
          <label style={sl}>Nombre de institución</label>
          <input value={instNombre} onChange={function(e){ setInstNombre(e.target.value); }} style={si} />
        </div>
        <button style={{ background:acc, color:"#fff", border:"none", borderRadius:8, padding:"12px", fontSize:14, cursor:"pointer", fontWeight:500, width:"100%" }} onClick={function(){ setPantalla("dashboard"); }}>
          ✓ Guardar y volver
        </button>
      </div>
    </div>
  );
}