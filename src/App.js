import { useState, useEffect, useRef, useCallback } from "react";

const STORAGE_KEY = "kcal_app_v1";

function getTodayKey() {
  var d = new Date();
  return d.getFullYear() + "-" + String(d.getMonth() + 1).padStart(2, "0") + "-" + String(d.getDate()).padStart(2, "0");
}

function loadData() {
  try {
    var raw = localStorage.getItem(STORAGE_KEY);
    if (raw) return JSON.parse(raw);
  } catch (e) {}
  return { goal: null, records: {} };
}

function saveData(data) {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(data));
  } catch (e) {}
}

function Ring({ consumed, goal }) {
  var size = 280;
  var stroke = 18;
  var r = (size - stroke) / 2;
  var circ = 2 * Math.PI * r;
  var pct = goal > 0 ? Math.min(consumed / goal, 1) : 0;
  var over = goal > 0 && consumed > goal;
  var color = over ? "#FF3B30" : "#34C759";
  var glowColor = over ? "rgba(255,59,48,0.4)" : "rgba(52,199,89,0.4)";
  var trackColor = over ? "rgba(255,59,48,0.12)" : "rgba(52,199,89,0.12)";
  var dashOffset = circ - pct * circ;
  var remaining = goal - consumed;

  return (
    <div style={{ position: "relative", width: size, height: size }}>
      <div style={{
        position: "absolute", inset: 0, borderRadius: "50%",
        background: "radial-gradient(circle at 50% 50%, " + glowColor + " 0%, transparent 65%)",
        transition: "background 0.8s ease",
        pointerEvents: "none",
      }} />
      <svg width={size} height={size} style={{ transform: "rotate(-90deg)", display: "block" }}>
        <defs>
          <filter id="ringGlow">
            <feGaussianBlur stdDeviation="3" result="coloredBlur" />
            <feMerge>
              <feMergeNode in="coloredBlur" />
              <feMergeNode in="SourceGraphic" />
            </feMerge>
          </filter>
        </defs>
        <circle cx={size / 2} cy={size / 2} r={r} fill="none" stroke={trackColor} strokeWidth={stroke}
          style={{ transition: "stroke 0.8s ease" }} />
        <circle cx={size / 2} cy={size / 2} r={r} fill="none" stroke={color} strokeWidth={stroke}
          strokeLinecap="round" strokeDasharray={circ} strokeDashoffset={dashOffset}
          filter="url(#ringGlow)"
          style={{ transition: "stroke-dashoffset 0.7s cubic-bezier(0.34,1.56,0.64,1), stroke 0.8s ease" }} />
        {pct > 0.02 && (
          <circle
            cx={size / 2 + r * Math.cos(2 * Math.PI * pct - Math.PI / 2)}
            cy={size / 2 + r * Math.sin(2 * Math.PI * pct - Math.PI / 2)}
            r={stroke / 2 - 1} fill={color} filter="url(#ringGlow)"
            style={{ transition: "all 0.7s cubic-bezier(0.34,1.56,0.64,1)" }} />
        )}
      </svg>
      <div style={{
        position: "absolute", inset: 0,
        display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", gap: 2,
      }}>
        <span style={{
          fontFamily: "Helvetica Neue, sans-serif",
          fontSize: 52, fontWeight: 700, letterSpacing: -2, color: color,
          lineHeight: 1, transition: "color 0.8s ease",
        }}>
          {consumed.toLocaleString("es-AR")}
        </span>
        <span style={{
          fontFamily: "Helvetica Neue, sans-serif",
          fontSize: 13, color: "rgba(255,255,255,0.45)",
        }}>
          de {goal ? goal.toLocaleString("es-AR") : "--"} kcal
        </span>
        <div style={{ height: 8 }} />
        {goal > 0 && (
          <span style={{
            fontFamily: "Helvetica Neue, sans-serif",
            fontSize: 13, fontWeight: 500,
            color: over ? "#FF3B30" : "rgba(255,255,255,0.6)",
            transition: "color 0.8s ease",
          }}>
            {over
              ? "Excedidas " + Math.abs(remaining).toLocaleString("es-AR") + " kcal"
              : remaining === 0
              ? "Objetivo alcanzado!"
              : "Restan " + remaining.toLocaleString("es-AR") + " kcal"}
          </span>
        )}
      </div>
    </div>
  );
}

function AddModal({ onClose, onAdd }) {
  var [val, setVal] = useState("");
  var inputRef = useRef(null);

  useEffect(function() {
    setTimeout(function() { if (inputRef.current) inputRef.current.focus(); }, 150);
  }, []);

  function handle() {
    var n = parseInt(val, 10);
    if (!isNaN(n) && n > 0) { onAdd(n); onClose(); }
  }

  return (
    <div style={{
      position: "fixed", inset: 0, zIndex: 100,
      display: "flex", alignItems: "flex-end", justifyContent: "center",
      background: "rgba(0,0,0,0.6)", backdropFilter: "blur(8px)",
      animation: "fadeIn 0.2s ease",
    }} onClick={onClose}>
      <div style={{
        width: "100%", maxWidth: 480,
        background: "#1C1C1E", borderRadius: "24px 24px 0 0",
        padding: "12px 24px 48px",
        animation: "slideUp 0.35s cubic-bezier(0.34,1.56,0.64,1)",
      }} onClick={function(e) { e.stopPropagation(); }}>
        <div style={{ width: 36, height: 4, borderRadius: 2, background: "rgba(255,255,255,0.2)", margin: "0 auto 24px" }} />
        <p style={{
          fontFamily: "Helvetica Neue, sans-serif",
          fontSize: 20, fontWeight: 600, color: "#fff", margin: "0 0 20px", textAlign: "center",
        }}>Agregar calorias</p>
        <div style={{ display: "flex", gap: 8, marginBottom: 16, justifyContent: "center" }}>
          {[100, 250, 400, 600].map(function(p) {
            return (
              <button key={p} onClick={function() { setVal(String(p)); }} style={{
                flex: 1, padding: "9px 0", borderRadius: 10,
                background: val === String(p) ? "#34C759" : "rgba(255,255,255,0.08)",
                border: "none", cursor: "pointer",
                fontFamily: "Helvetica Neue, sans-serif",
                fontSize: 14, fontWeight: 500,
                color: val === String(p) ? "#000" : "rgba(255,255,255,0.7)",
                transition: "all 0.15s ease",
              }}>{p}</button>
            );
          })}
        </div>
        <div style={{
          background: "rgba(255,255,255,0.06)", borderRadius: 14, padding: "14px 18px",
          display: "flex", alignItems: "center", gap: 8,
          border: "1px solid rgba(255,255,255,0.1)", marginBottom: 20,
        }}>
          <input ref={inputRef} type="number" inputMode="numeric"
            placeholder="Cantidad de calorias" value={val}
            onChange={function(e) { setVal(e.target.value); }}
            onKeyDown={function(e) { if (e.key === "Enter") handle(); }}
            style={{
              flex: 1, background: "none", border: "none", outline: "none",
              fontFamily: "Helvetica Neue, sans-serif",
              fontSize: 18, fontWeight: 500, color: "#fff",
            }} />
          <span style={{ fontFamily: "Helvetica Neue, sans-serif", fontSize: 14, color: "rgba(255,255,255,0.35)" }}>kcal</span>
        </div>
        <div style={{ display: "flex", gap: 10 }}>
          <button onClick={onClose} style={{
            flex: 1, padding: "15px 0", borderRadius: 14,
            background: "rgba(255,255,255,0.08)", border: "none", cursor: "pointer",
            fontFamily: "Helvetica Neue, sans-serif",
            fontSize: 16, fontWeight: 500, color: "rgba(255,255,255,0.7)",
          }}>Cancelar</button>
          <button onClick={handle} style={{
            flex: 2, padding: "15px 0", borderRadius: 14,
            background: val && parseInt(val) > 0 ? "#34C759" : "rgba(52,199,89,0.3)",
            border: "none", cursor: "pointer",
            fontFamily: "Helvetica Neue, sans-serif",
            fontSize: 16, fontWeight: 600,
            color: val && parseInt(val) > 0 ? "#000" : "rgba(255,255,255,0.3)",
            transition: "all 0.2s ease",
          }}>Agregar</button>
        </div>
      </div>
    </div>
  );
}

function GoalSetup({ onSave, initial }) {
  var [val, setVal] = useState(initial ? String(initial) : "");

  return (
    <div style={{
      minHeight: "100dvh", background: "#000",
      display: "flex", flexDirection: "column",
      alignItems: "center", justifyContent: "center", padding: 32,
    }}>
      <div style={{
        width: 72, height: 72, borderRadius: 18,
        background: "linear-gradient(135deg, #34C759, #30D158)",
        display: "flex", alignItems: "center", justifyContent: "center",
        marginBottom: 24, boxShadow: "0 0 40px rgba(52,199,89,0.4)",
      }}>
        <span style={{ fontSize: 36 }}>&#128293;</span>
      </div>
      <h1 style={{
        fontFamily: "Helvetica Neue, sans-serif",
        fontSize: 28, fontWeight: 700, color: "#fff",
        margin: "0 0 8px", textAlign: "center",
      }}>{initial ? "Editar objetivo" : "Tu objetivo diario"}</h1>
      <p style={{
        fontFamily: "Helvetica Neue, sans-serif",
        fontSize: 15, color: "rgba(255,255,255,0.5)",
        margin: "0 0 36px", textAlign: "center", lineHeight: 1.5,
      }}>Cuantas calorias queres consumir por dia?</p>
      <div style={{
        width: "100%", maxWidth: 320,
        background: "rgba(255,255,255,0.06)", borderRadius: 16, padding: "16px 20px",
        display: "flex", alignItems: "center",
        border: "1px solid rgba(255,255,255,0.1)", marginBottom: 16,
      }}>
        <input type="number" inputMode="numeric" placeholder="2000" value={val}
          onChange={function(e) { setVal(e.target.value); }}
          onKeyDown={function(e) { if (e.key === "Enter" && parseInt(val) > 0) onSave(parseInt(val)); }}
          style={{
            flex: 1, background: "none", border: "none", outline: "none",
            fontFamily: "Helvetica Neue, sans-serif",
            fontSize: 32, fontWeight: 600, color: "#fff", textAlign: "center",
          }} autoFocus />
        <span style={{ fontFamily: "Helvetica Neue, sans-serif", fontSize: 16, color: "rgba(255,255,255,0.35)", marginLeft: 4 }}>kcal</span>
      </div>
      <div style={{ display: "flex", gap: 8, marginBottom: 28, flexWrap: "wrap", justifyContent: "center" }}>
        {[1500, 1800, 2000, 2200, 2500].map(function(v) {
          return (
            <button key={v} onClick={function() { setVal(String(v)); }} style={{
              padding: "6px 14px", borderRadius: 20,
              background: val === String(v) ? "#34C759" : "rgba(255,255,255,0.08)",
              border: "none", cursor: "pointer",
              fontFamily: "Helvetica Neue, sans-serif",
              fontSize: 13, fontWeight: 500,
              color: val === String(v) ? "#000" : "rgba(255,255,255,0.6)",
              transition: "all 0.15s ease",
            }}>{v}</button>
          );
        })}
      </div>
      <button onClick={function() { if (parseInt(val) > 0) onSave(parseInt(val)); }} style={{
        width: "100%", maxWidth: 320, padding: "16px 0", borderRadius: 16,
        background: val && parseInt(val) > 0 ? "linear-gradient(135deg,#34C759,#30D158)" : "rgba(255,255,255,0.1)",
        border: "none", cursor: "pointer",
        fontFamily: "Helvetica Neue, sans-serif",
        fontSize: 17, fontWeight: 600,
        color: val && parseInt(val) > 0 ? "#000" : "rgba(255,255,255,0.3)",
        transition: "all 0.2s ease",
        boxShadow: val && parseInt(val) > 0 ? "0 4px 20px rgba(52,199,89,0.3)" : "none",
      }}>{initial ? "Guardar" : "Empezar"}</button>
    </div>
  );
}

function HistorialTab({ records, goal }) {
  var [viewDate, setViewDate] = useState(new Date());
  var [selected, setSelected] = useState(null);
  var year = viewDate.getFullYear();
  var month = viewDate.getMonth();
  var daysInMonth = new Date(year, month + 1, 0).getDate();
  var firstDay = new Date(year, month, 1).getDay();
  var startOffset = (firstDay + 6) % 7;
  var monthNames = ["Enero","Febrero","Marzo","Abril","Mayo","Junio","Julio","Agosto","Septiembre","Octubre","Noviembre","Diciembre"];
  var dayNames = ["Lu","Ma","Mi","Ju","Vi","Sa","Do"];
  var today = getTodayKey();

  function getKey(d) {
    return year + "-" + String(month + 1).padStart(2, "0") + "-" + String(d).padStart(2, "0");
  }

  function getDayStatus(d) {
    var rec = records[getKey(d)];
    if (!rec) return "empty";
    return rec.consumed <= (rec.goal || goal) ? "ok" : "over";
  }

  var cells = [];
  for (var i = 0; i < startOffset; i++) cells.push(null);
  for (var d = 1; d <= daysInMonth; d++) cells.push(d);

  var selRec = selected ? records[getKey(selected)] : null;
  var selGoal = selRec ? (selRec.goal || goal) : goal;

  return (
    <div style={{ padding: "0 20px 100px" }}>
      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 20 }}>
        <button onClick={function() { setViewDate(new Date(year, month - 1, 1)); }} style={{ background: "none", border: "none", cursor: "pointer", padding: 8, color: "#fff", fontSize: 20 }}>{"<"}</button>
        <span style={{ fontFamily: "Helvetica Neue, sans-serif", fontSize: 18, fontWeight: 600, color: "#fff" }}>{monthNames[month]} {year}</span>
        <button onClick={function() { setViewDate(new Date(year, month + 1, 1)); }} style={{ background: "none", border: "none", cursor: "pointer", padding: 8, color: "#fff", fontSize: 20 }}>{">"}</button>
      </div>
      <div style={{ display: "grid", gridTemplateColumns: "repeat(7, 1fr)", marginBottom: 8, gap: 2 }}>
        {dayNames.map(function(dn) {
          return <div key={dn} style={{ textAlign: "center", fontFamily: "Helvetica Neue, sans-serif", fontSize: 11, fontWeight: 500, color: "rgba(255,255,255,0.3)", padding: "4px 0" }}>{dn}</div>;
        })}
      </div>
      <div style={{ display: "grid", gridTemplateColumns: "repeat(7, 1fr)", gap: 4 }}>
        {cells.map(function(d, i) {
          if (!d) return <div key={"e" + i} />;
          var status = getDayStatus(d);
          var isToday = getKey(d) === today;
          var isSel = selected === d;
          var dotColor = status === "ok" ? "#34C759" : status === "over" ? "#FF3B30" : "transparent";
          var dotBg = status === "ok" ? "rgba(52,199,89,0.15)" : status === "over" ? "rgba(255,59,48,0.15)" : "transparent";
          return (
            <button key={d} onClick={function() { setSelected(isSel ? null : d); }} style={{
              aspectRatio: "1", borderRadius: 10,
              background: isSel ? dotColor : isToday ? "rgba(255,255,255,0.1)" : dotBg,
              border: isToday && !isSel ? "1px solid rgba(255,255,255,0.2)" : "1px solid transparent",
              cursor: "pointer", display: "flex", flexDirection: "column",
              alignItems: "center", justifyContent: "center", gap: 2,
              transition: "all 0.15s ease",
            }}>
              <span style={{ fontFamily: "Helvetica Neue, sans-serif", fontSize: 14, fontWeight: isToday ? 700 : 400, color: isSel ? "#000" : status !== "empty" ? "#fff" : "rgba(255,255,255,0.4)" }}>{d}</span>
              {status !== "empty" && !isSel && <div style={{ width: 4, height: 4, borderRadius: "50%", background: dotColor }} />}
            </button>
          );
        })}
      </div>
      {selected && (
        <div style={{ marginTop: 20, background: "#1C1C1E", borderRadius: 16, padding: "18px 20px", animation: "fadeIn 0.2s ease" }}>
          {selRec ? (
            <div>
              <p style={{ fontFamily: "Helvetica Neue, sans-serif", fontSize: 15, fontWeight: 600, color: "#fff", margin: "0 0 12px" }}>{selected} de {monthNames[month]}</p>
              <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
                <Row label="Objetivo" value={(selGoal || 0).toLocaleString("es-AR") + " kcal"} />
                <Row label="Consumido" value={(selRec.consumed || 0).toLocaleString("es-AR") + " kcal"} />
                <div style={{ height: 1, background: "rgba(255,255,255,0.08)", margin: "4px 0" }} />
                <Row label="Resultado"
                  value={selRec.consumed <= selGoal
                    ? (selGoal - selRec.consumed).toLocaleString("es-AR") + " kcal por debajo"
                    : (selRec.consumed - selGoal).toLocaleString("es-AR") + " kcal excedidas"}
                  valueColor={selRec.consumed <= selGoal ? "#34C759" : "#FF3B30"} />
              </div>
            </div>
          ) : (
            <p style={{ fontFamily: "Helvetica Neue, sans-serif", fontSize: 14, color: "rgba(255,255,255,0.4)", margin: 0, textAlign: "center" }}>Sin registros para este dia</p>
          )}
        </div>
      )}
      <div style={{ display: "flex", gap: 16, marginTop: 16, justifyContent: "center" }}>
        <Legend color="#34C759" label="Objetivo cumplido" />
        <Legend color="#FF3B30" label="Objetivo superado" />
        <Legend color="rgba(255,255,255,0.2)" label="Sin datos" />
      </div>
    </div>
  );
}

function Row({ label, value, valueColor }) {
  return (
    <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
      <span style={{ fontFamily: "Helvetica Neue, sans-serif", fontSize: 14, color: "rgba(255,255,255,0.5)" }}>{label}</span>
      <span style={{ fontFamily: "Helvetica Neue, sans-serif", fontSize: 14, fontWeight: 500, color: valueColor || "#fff" }}>{value}</span>
    </div>
  );
}

function Legend({ color, label }) {
  return (
    <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
      <div style={{ width: 8, height: 8, borderRadius: "50%", background: color }} />
      <span style={{ fontFamily: "Helvetica Neue, sans-serif", fontSize: 11, color: "rgba(255,255,255,0.4)" }}>{label}</span>
    </div>
  );
}

function StatsTab({ records, goal }) {
  var today = getTodayKey();
  var entries = Object.entries(records).filter(function(e) { return e[0] !== today; }).sort(function(a, b) { return a[0].localeCompare(b[0]); });

  var streak = 0;
  var sd = new Date();
  sd.setDate(sd.getDate() - 1);
  while (true) {
    var sk = sd.getFullYear() + "-" + String(sd.getMonth() + 1).padStart(2, "0") + "-" + String(sd.getDate()).padStart(2, "0");
    var srec = records[sk];
    if (!srec) break;
    if (srec.consumed > (srec.goal || goal)) break;
    streak++;
    sd.setDate(sd.getDate() - 1);
  }

  var last7 = [];
  var ld = new Date();
  ld.setDate(ld.getDate() - 1);
  for (var i = 0; i < 7; i++) {
    var lk = ld.getFullYear() + "-" + String(ld.getMonth() + 1).padStart(2, "0") + "-" + String(ld.getDate()).padStart(2, "0");
    last7.unshift({ key: lk, day: ld.getDay(), data: records[lk] });
    ld.setDate(ld.getDate() - 1);
  }

  var avg = entries.length ? Math.round(entries.reduce(function(s, e) { return s + (e[1].consumed || 0); }, 0) / entries.length) : 0;
  var pct = entries.length ? Math.round(entries.filter(function(e) { return e[1].consumed <= (e[1].goal || goal); }).length / entries.length * 100) : 0;
  var maxVal = Math.max.apply(null, last7.map(function(r) { return r.data ? r.data.consumed || 0 : 0; }).concat([goal || 2000])) * 1.1;
  var dayLabels = ["D","L","M","M","J","V","S"];

  return (
    <div style={{ padding: "0 20px 100px", display: "flex", flexDirection: "column", gap: 16 }}>
      <div style={{
        background: "linear-gradient(135deg,rgba(52,199,89,0.15),rgba(52,199,89,0.05))",
        borderRadius: 18, padding: "20px 24px",
        border: "1px solid rgba(52,199,89,0.2)",
        display: "flex", alignItems: "center", gap: 16,
      }}>
        <span style={{ fontSize: 32 }}>&#128293;</span>
        <div>
          <p style={{ fontFamily: "Helvetica Neue, sans-serif", fontSize: 13, color: "rgba(255,255,255,0.5)", margin: "0 0 2px" }}>Racha actual</p>
          <p style={{ fontFamily: "Helvetica Neue, sans-serif", fontSize: 32, fontWeight: 700, color: "#34C759", margin: 0 }}>
            {streak} <span style={{ fontSize: 16, fontWeight: 400, color: "rgba(255,255,255,0.5)" }}>dias</span>
          </p>
        </div>
      </div>
      <div style={{ background: "#1C1C1E", borderRadius: 18, padding: "18px 16px" }}>
        <p style={{ fontFamily: "Helvetica Neue, sans-serif", fontSize: 13, fontWeight: 500, color: "rgba(255,255,255,0.5)", margin: "0 0 14px" }}>Ultimos 7 dias</p>
        <div style={{ display: "flex", alignItems: "flex-end", gap: 6, height: 80 }}>
          {last7.map(function(r, i) {
            var v = r.data ? (r.data.consumed || 0) : 0;
            var g = r.data ? (r.data.goal || goal) : goal;
            var h = maxVal > 0 ? Math.max((v / maxVal) * 80, v > 0 ? 4 : 0) : 0;
            var over = v > g && g > 0;
            return (
              <div key={i} style={{ flex: 1, display: "flex", flexDirection: "column", alignItems: "center", gap: 4, height: "100%" }}>
                <div style={{ flex: 1, display: "flex", alignItems: "flex-end" }}>
                  <div style={{
                    width: "100%", height: h, borderRadius: "4px 4px 2px 2px",
                    background: v === 0 ? "rgba(255,255,255,0.06)" : over ? "#FF3B30" : "#34C759",
                    transition: "height 0.5s ease", minHeight: 3,
                  }} />
                </div>
                <span style={{ fontFamily: "Helvetica Neue, sans-serif", fontSize: 10, color: "rgba(255,255,255,0.3)" }}>{dayLabels[r.day]}</span>
              </div>
            );
          })}
        </div>
      </div>
      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12 }}>
        <StatCard icon="&#128202;" label="Promedio diario" value={avg.toLocaleString("es-AR")} unit="kcal" />
        <StatCard icon="&#9989;" label="Cumplimiento" value={String(pct)} unit="%" color={pct >= 80 ? "#34C759" : pct >= 50 ? "#FF9F0A" : "#FF3B30"} />
        <StatCard icon="&#128197;" label="Dias registrados" value={String(entries.length)} unit="dias" />
        <StatCard icon="&#127919;" label="Mi objetivo" value={(goal || 0).toLocaleString("es-AR")} unit="kcal" />
      </div>
    </div>
  );
}

function StatCard({ icon, label, value, unit, color }) {
  return (
    <div style={{ background: "#1C1C1E", borderRadius: 16, padding: "16px 16px" }}>
      <span style={{ fontSize: 22 }} dangerouslySetInnerHTML={{ __html: icon }} />
      <p style={{ fontFamily: "Helvetica Neue, sans-serif", fontSize: 12, color: "rgba(255,255,255,0.4)", margin: "8px 0 2px" }}>{label}</p>
      <p style={{ margin: 0 }}>
        <span style={{ fontFamily: "Helvetica Neue, sans-serif", fontSize: 26, fontWeight: 700, color: color || "#fff" }}>{value}</span>
        <span style={{ fontFamily: "Helvetica Neue, sans-serif", fontSize: 12, color: "rgba(255,255,255,0.4)", marginLeft: 3 }}>{unit}</span>
      </p>
    </div>
  );
}

function TabBar({ tab, setTab }) {
  var tabs = [
    { id: "home", label: "Inicio" },
    { id: "historial", label: "Historial" },
    { id: "stats", label: "Estadisticas" },
  ];
  return (
    <div style={{
      position: "fixed", bottom: 0, left: 0, right: 0, zIndex: 50,
      background: "rgba(0,0,0,0.9)", backdropFilter: "blur(20px)",
      borderTop: "1px solid rgba(255,255,255,0.08)",
      display: "flex", paddingBottom: "env(safe-area-inset-bottom,0px)",
    }}>
      {tabs.map(function(t) {
        return (
          <button key={t.id} onClick={function() { setTab(t.id); }} style={{
            flex: 1, padding: "12px 0 14px",
            background: "none", border: "none", cursor: "pointer",
            fontFamily: "Helvetica Neue, sans-serif",
            fontSize: 11, fontWeight: tab === t.id ? 600 : 400,
            color: tab === t.id ? "#fff" : "rgba(255,255,255,0.4)",
            opacity: tab === t.id ? 1 : 0.6,
            transition: "opacity 0.15s ease",
          }}>{t.label}</button>
        );
      })}
    </div>
  );
}

export default function App() {
  var [data, setData] = useState(null);
  var [tab, setTab] = useState("home");
  var [showModal, setShowModal] = useState(false);
  var [showGoalEdit, setShowGoalEdit] = useState(false);
  var [addAnim, setAddAnim] = useState(false);

  useEffect(function() {
    var d = loadData();
    var todayKey = getTodayKey();
    if (d.goal && !d.records[todayKey]) {
      d.records[todayKey] = { consumed: 0, goal: d.goal };
    }
    setData(d);
  }, []);

  useEffect(function() {
    if (data) saveData(data);
  }, [data]);

  var todayKey = getTodayKey();
  var consumed = data && data.records && data.records[todayKey] ? (data.records[todayKey].consumed || 0) : 0;
  var goal = data ? data.goal : null;

  var addCalories = useCallback(function(n) {
    setAddAnim(true);
    setTimeout(function() { setAddAnim(false); }, 600);
    setData(function(prev) {
      var key = getTodayKey();
      var prevConsumed = prev.records[key] ? (prev.records[key].consumed || 0) : 0;
      return Object.assign({}, prev, {
        records: Object.assign({}, prev.records, {
          [key]: { consumed: prevConsumed + n, goal: prev.goal }
        })
      });
    });
  }, []);

  var saveGoal = function(g) {
    setData(function(prev) {
      var key = getTodayKey();
      var prevConsumed = prev && prev.records && prev.records[key] ? (prev.records[key].consumed || 0) : 0;
      return Object.assign({}, prev || {}, {
        goal: g,
        records: Object.assign({}, (prev || {}).records || {}, {
          [key]: { consumed: prevConsumed, goal: g }
        })
      });
    });
    setShowGoalEdit(false);
  };

  if (!data) {
    return (
      <div style={{ minHeight: "100dvh", background: "#000", display: "flex", alignItems: "center", justifyContent: "center" }}>
        <div style={{ width: 40, height: 40, borderRadius: "50%", border: "2px solid rgba(52,199,89,0.2)", borderTopColor: "#34C759", animation: "spin 0.8s linear infinite" }} />
      </div>
    );
  }

  if (!goal || showGoalEdit) {
    return <GoalSetup onSave={saveGoal} initial={showGoalEdit ? goal : null} />;
  }

  return (
    <div style={{ minHeight: "100dvh", background: "#000", overflowX: "hidden" }}>
      <style>{`
        @keyframes fadeIn { from { opacity: 0; } to { opacity: 1; } }
        @keyframes slideUp { from { transform: translateY(60px); opacity: 0; } to { transform: translateY(0); opacity: 1; } }
        @keyframes spin { to { transform: rotate(360deg); } }
        @keyframes bounceIn { 0% { transform: scale(0.94); } 60% { transform: scale(1.04); } 100% { transform: scale(1); } }
        * { box-sizing: border-box; margin: 0; padding: 0; -webkit-tap-highlight-color: transparent; }
        input[type=number]::-webkit-inner-spin-button,
        input[type=number]::-webkit-outer-spin-button { -webkit-appearance: none; }
        input[type=number] { -moz-appearance: textfield; }
        body { background: #000; }
      `}</style>

      {tab === "home" && (
        <div style={{
          minHeight: "100dvh", display: "flex", flexDirection: "column",
          alignItems: "center", justifyContent: "space-between",
          paddingTop: "max(env(safe-area-inset-top,0px),44px)",
          paddingBottom: 100,
        }}>
          <div style={{ width: "100%", display: "flex", alignItems: "center", justifyContent: "space-between", padding: "16px 24px 0" }}>
            <div>
              <p style={{ fontFamily: "Helvetica Neue, sans-serif", fontSize: 13, color: "rgba(255,255,255,0.4)", marginBottom: 1 }}>Hoy</p>
              <p style={{ fontFamily: "Helvetica Neue, sans-serif", fontSize: 20, fontWeight: 700, color: "#fff" }}>
                {new Date().toLocaleDateString("es-AR", { weekday: "long", day: "numeric", month: "long" }).replace(/^\w/, function(c) { return c.toUpperCase(); })}
              </p>
            </div>
            <button onClick={function() { setShowGoalEdit(true); }} style={{
              background: "rgba(255,255,255,0.08)", border: "none", cursor: "pointer",
              borderRadius: 12, padding: "8px 14px",
            }}>
              <span style={{ fontFamily: "Helvetica Neue, sans-serif", fontSize: 13, color: "rgba(255,255,255,0.6)" }}>Meta</span>
            </button>
          </div>

          <div style={{ animation: addAnim ? "bounceIn 0.5s ease" : "none", marginTop: 8 }}>
            <Ring consumed={consumed} goal={goal} />
          </div>

          <div style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: 10 }}>
            <button onClick={function() { setShowModal(true); }} style={{
              width: 72, height: 72, borderRadius: "50%",
              background: "linear-gradient(135deg,#34C759,#30D158)",
              border: "none", cursor: "pointer",
              display: "flex", alignItems: "center", justifyContent: "center",
              boxShadow: "0 4px 24px rgba(52,199,89,0.45)",
              transition: "transform 0.15s ease",
            }}
              onMouseDown={function(e) { e.currentTarget.style.transform = "scale(0.93)"; }}
              onMouseUp={function(e) { e.currentTarget.style.transform = "scale(1)"; }}
              onTouchStart={function(e) { e.currentTarget.style.transform = "scale(0.93)"; }}
              onTouchEnd={function(e) { e.currentTarget.style.transform = "scale(1)"; }}
            >
              <svg width="24" height="24" viewBox="0 0 24 24" fill="none">
                <path d="M12 5V19M5 12H19" stroke="#000" strokeWidth="2.5" strokeLinecap="round" />
              </svg>
            </button>
            <span style={{ fontFamily: "Helvetica Neue, sans-serif", fontSize: 13, color: "rgba(255,255,255,0.4)" }}>Agregar calorias</span>
          </div>
        </div>
      )}

      {tab === "historial" && (
        <div style={{ paddingTop: "calc(max(env(safe-area-inset-top,0px),44px) + 20px)" }}>
          <p style={{ fontFamily: "Helvetica Neue, sans-serif", fontSize: 28, fontWeight: 700, color: "#fff", padding: "0 20px 20px" }}>Historial</p>
          <HistorialTab records={data.records} goal={goal} />
        </div>
      )}

      {tab === "stats" && (
        <div style={{ paddingTop: "calc(max(env(safe-area-inset-top,0px),44px) + 20px)" }}>
          <p style={{ fontFamily: "Helvetica Neue, sans-serif", fontSize: 28, fontWeight: 700, color: "#fff", padding: "0 20px 20px" }}>Estadisticas</p>
          <StatsTab records={data.records} goal={goal} />
        </div>
      )}

      <TabBar tab={tab} setTab={setTab} />
      {showModal && <AddModal onClose={function() { setShowModal(false); }} onAdd={addCalories} />}
    </div>
  );
}
