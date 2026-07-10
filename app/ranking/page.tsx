import { createClient } from "@supabase/supabase-js";
import { scoreOne, normalizeResultados } from "../scoring";

// ---- Sin caché: la página se recalcula en CADA visita ----
export const dynamic = "force-dynamic";
export const revalidate = 0;
export const fetchCache = "force-no-store";

export default async function RankingPage() {
  // Cliente creado acá, sin caché, para que siempre lea datos frescos de Supabase
  const supabase = createClient(
    "https://tqlcfmrtszgrtmnuydhl.supabase.co",
    "sb_publishable_5zzjcayXXzXzRxeWO6V08Q_-c5GE-cA",
    { global: { fetch: (url: any, opts: any = {}) => fetch(url, { ...opts, cache: "no-store" }) } }
  );

  const [predRes, resRes] = await Promise.all([
    supabase.rpc("listar_predicciones"),
    supabase.from("resultados").select("match_id, goles_local, goles_visitante, ganador"),
  ]);

  if (predRes.error || resRes.error) {
    return (
      <div style={{ minHeight: "100vh" }} className="bg-slate-900 text-slate-100 flex items-center justify-center px-4">
        <div className="max-w-sm text-center">
          <h1 className="text-2xl font-black mb-2">Ranking no disponible</h1>
          <p className="text-slate-400 text-sm">Hubo un problema al leer los datos. Revisá que hayas corrido el SQL de la etapa 2 en Supabase.</p>
        </div>
      </div>
    );
  }

  const res = normalizeResultados(resRes.data || []);
  const hayResultados = Object.keys(res.groups).length > 0 || Object.keys(res.koWinners).length > 0;

  const filas = (predRes.data || [])
    .map((p: any) => {
      const { pts, exactos, detail } = scoreOne(p.predicciones, res);
      return { nombre: p.nombre, apellido: p.apellido, campeon: p.campeon, pts, exactos, detail };
    })
    .sort((a: any, b: any) =>
      b.pts - a.pts ||
      b.exactos - a.exactos ||
      String(a.apellido || "").localeCompare(String(b.apellido || "")));

  const actualizado = new Date().toLocaleString("es-AR", { timeZone: "America/Argentina/Buenos_Aires" });

  return (
    <div style={{ minHeight: "100vh" }} className="bg-slate-900 text-slate-100 pb-16">
      <header className="sticky top-0 z-20 bg-slate-950 border-b border-slate-800 px-4 py-3 flex items-center justify-between">
        <span className="font-black tracking-tight" style={{ fontFamily: "Georgia, serif" }}>🏆 RANKING — PRODE 2026</span>
        <a href="/" className="text-xs text-emerald-400 hover:underline">← Volver</a>
      </header>

      <div className="max-w-2xl mx-auto px-4 py-6">
        {!hayResultados && (
          <div className="rounded-xl bg-amber-950 border border-amber-700 text-amber-300 text-sm px-4 py-3 mb-5">
            Todavía no cargaste resultados, así que todos están en 0. A medida que completes la tabla <b>resultados</b> en Supabase, el ranking se va actualizando solo.
          </div>
        )}

        {filas.length === 0 ? (
          <p className="text-center text-slate-400 py-10">Todavía no hay pronósticos enviados.</p>
        ) : (
          <div className="rounded-2xl bg-slate-950 border border-slate-800 overflow-hidden">
            <div className="grid grid-cols-12 px-4 py-2 text-xs text-slate-500 border-b border-slate-800">
              <div className="col-span-1">#</div>
              <div className="col-span-5">Jugador</div>
              <div className="col-span-2 text-center">Campeón</div>
              <div className="col-span-2 text-center">Exactos</div>
              <div className="col-span-2 text-right">Puntos</div>
            </div>
            {filas.map((f: any, i: number) => (
              <div key={i} className={`grid grid-cols-12 px-4 py-3 items-center border-b border-slate-800/50 ${i < 3 ? "bg-slate-900/60" : ""}`}>
                <div className="col-span-1 font-black text-slate-400">{i + 1}</div>
                <div className="col-span-5 font-semibold truncate">{f.nombre} {f.apellido}</div>
                <div className="col-span-2 text-center text-lg">{champFlag(f.campeon)}</div>
                <div className="col-span-2 text-center text-slate-400">{f.exactos}</div>
                <div className="col-span-2 text-right font-black text-emerald-400">{f.pts}</div>
              </div>
            ))}
          </div>
        )}

        <p className="text-center text-[11px] text-slate-600 mt-4">
          Grupos: 1 pto por acertar el signo (gana/empata/pierde) · 16avos 3 · Octavos 5 · Cuartos 7 · Semis 8 · 3.º puesto 9 · Campeón 10. Desempate: más marcadores exactos.
        </p>
        <p className="text-center text-[10px] text-slate-700 mt-2">Actualizado: {actualizado}</p>
      </div>
    </div>
  );
}

const FLAGS: any = {
  MEX:"🇲🇽",RSA:"🇿🇦",KOR:"🇰🇷",CZE:"🇨🇿",CAN:"🇨🇦",SUI:"🇨🇭",QAT:"🇶🇦",BIH:"🇧🇦",BRA:"🇧🇷",MAR:"🇲🇦",SCO:"🏴",HAI:"🇭🇹",
  USA:"🇺🇸",PAR:"🇵🇾",AUS:"🇦🇺",TUR:"🇹🇷",GER:"🇩🇪",ECU:"🇪🇨",CIV:"🇨🇮",CUW:"🇨🇼",NED:"🇳🇱",JPN:"🇯🇵",TUN:"🇹🇳",SWE:"🇸🇪",
  BEL:"🇧🇪",EGY:"🇪🇬",IRN:"🇮🇷",NZL:"🇳🇿",ESP:"🇪🇸",URU:"🇺🇾",KSA:"🇸🇦",CPV:"🇨🇻",FRA:"🇫🇷",SEN:"🇸🇳",NOR:"🇳🇴",IRQ:"🇮🇶",
  ARG:"🇦🇷",AUT:"🇦🇹",ALG:"🇩🇿",JOR:"🇯🇴",POR:"🇵🇹",COL:"🇨🇴",UZB:"🇺🇿",COD:"🇨🇩",ENG:"🏴",CRO:"🇭🇷",GHA:"🇬🇭",PAN:"🇵🇦",
};
function champFlag(id: string) { return id && FLAGS[id] ? FLAGS[id] : "—"; }
