import { useMemo, useState } from "react";
import "./App.css";
import type {
  Neighborhood,
  PretrainedModel,
  SimulationParams,
  SimulationResponse,
} from "./types";
import {
  Area,
  AreaChart,
  Bar,
  BarChart,
  CartesianGrid,
  Legend,
  Line,
  LineChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";

type EnrichedNeighborhood = Neighborhood & { cluster: number };
type EnrichedResult = Omit<SimulationResponse, "neighborhoods"> & {
  neighborhoods: EnrichedNeighborhood[];
};

const API_BASE_URL =
  (import.meta.env.VITE_API_URL as string | undefined) ??
  "http://localhost:8000";

const clusterPalette = [
  "#72efdd",
  "#ffbe0b",
  "#ff006e",
  "#00b4d8",
  "#9ef01a",
  "#f15bb5",
  "#f77f00",
  "#3a0ca3",
];

const viewBoxSize = 520;
const padding = 24;

const CityMap = ({
  result,
  gridSize,
}: {
  result: EnrichedResult | null;
  gridSize: number;
}) => {
  const plotSize = viewBoxSize - padding * 2;
  const scalePoint = (value: number) =>
    padding + (value / Math.max(gridSize, 1)) * plotSize;

  const gridLines = useMemo(() => {
    const steps = Math.min(gridSize, 12);
    return Array.from({ length: steps + 1 }, (_, idx) => {
      const ratio = idx / steps;
      const position = padding + ratio * plotSize;
      return { id: idx, position, label: Math.round(ratio * gridSize) };
    });
  }, [gridSize, plotSize]);

  return (
    <svg
      className="city-map"
      viewBox={`0 0 ${viewBoxSize} ${viewBoxSize}`}
      role="img"
      aria-label="Mapa de la ciudad con vecindarios y hospitales"
    >
      <defs>
        <linearGradient id="gridGradient" x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" stopColor="#1e1b4b" />
          <stop offset="100%" stopColor="#0f172a" />
        </linearGradient>
      </defs>
      <rect
        x={0}
        y={0}
        width={viewBoxSize}
        height={viewBoxSize}
        fill="url(#gridGradient)"
        rx={32}
      />
      {gridLines.map((line) => (
        <g key={`grid-${line.id}`}>
          <line
            x1={padding}
            x2={viewBoxSize - padding}
            y1={line.position}
            y2={line.position}
            stroke="#2d325a"
            strokeWidth={0.5}
          />
          <line
            y1={padding}
            y2={viewBoxSize - padding}
            x1={line.position}
            x2={line.position}
            stroke="#2d325a"
            strokeWidth={0.5}
          />
          <text x={line.position} y={padding - 6} className="grid-label">
            {line.label} km
          </text>
        </g>
      ))}

      {result?.neighborhoods.map((neighborhood) => {
        const color =
          clusterPalette[neighborhood.cluster % clusterPalette.length];
        const x = scalePoint(neighborhood.x);
        const y = scalePoint(neighborhood.y);
        return (
          <circle
            key={`n-${neighborhood.id}`}
            cx={x}
            cy={y}
            r={5.5}
            fill={color}
            opacity={0.85}
          >
            <title>Vecindario #{neighborhood.id}</title>
          </circle>
        );
      })}

      {result?.hospitals.map((hospital, idx) => {
        const x = scalePoint(hospital.x);
        const y = scalePoint(hospital.y);
        return (
          <g key={`h-${hospital.id}`} transform={`translate(${x}, ${y})`}>
            <circle r={9} fill="#0f172a" stroke="#f8fafc" strokeWidth={1.5} />
            <path
              d="M -5 0 L 5 0 M 0 -5 L 0 5"
              stroke="#f8fafc"
              strokeWidth={2}
              strokeLinecap="round"
            />
            <text
              x={0}
              y={18}
              textAnchor="middle"
              className="grid-label"
              style={{ fontSize: "10px" }}
            >
              H{idx + 1}
            </text>
          </g>
        );
      })}
    </svg>
  );
};

const useClusterSummary = (result: EnrichedResult | null) =>
  useMemo(() => {
    if (!result) return [];
    return result.hospitals.map((hospital, idx) => {
      const assigned = result.neighborhoods.filter(
        (neighborhood) => neighborhood.cluster === idx,
      );
      const averageDistance =
        assigned.reduce((sum, neighborhood) => {
          const distance = Math.hypot(
            neighborhood.x - hospital.x,
            neighborhood.y - hospital.y,
          );
          return sum + distance;
        }, 0) / Math.max(assigned.length, 1);

      return {
        id: hospital.id,
        color: clusterPalette[idx % clusterPalette.length],
        count: assigned.length,
        averageDistance,
        hospital,
      };
    });
  }, [result]);

const formatKm = (value: number) => `${value.toFixed(1)} km`;

function App() {
  const [params, setParams] = useState<SimulationParams>({
    m: 20,
    n: 80,
    k: 4,
  });
  const [gridSize, setGridSize] = useState(20);
  const [result, setResult] = useState<EnrichedResult | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [pretrained, setPretrained] = useState<PretrainedModel | null>(null);
  const [pretrainedLoading, setPretrainedLoading] = useState(false);

  const summary = useClusterSummary(result);
  const clusterChartData = useMemo(() => {
    if (!result) return [];
    return result.cluster_stats.map((stat, idx) => ({
      hospital: `H${stat.hospital_id}`,
      count: stat.count,
      avg: Number(stat.avg_distance.toFixed(2)),
      max: Number(stat.max_distance.toFixed(2)),
      color: clusterPalette[idx % clusterPalette.length],
    }));
  }, [result]);

  const distanceHistogramData = useMemo(() => {
    if (!result) return [];
    return result.distance_bins.map((bin) => ({
      label: bin.label,
      count: bin.count,
    }));
  }, [result]);

  const statHighlights = useMemo(() => {
    if (!result) return [];
    return [
      {
        label: "Vecindarios simulados",
        value: result.neighborhoods.length,
        caption: `${result.grid_size} km de lado`,
      },
      {
        label: "Hospitales sugeridos",
        value: result.hospitals.length,
        caption: `${result.iterations} iteraciones`,
      },
      {
        label: "Distancia promedio",
        value: formatKm(result.overall_avg_distance),
        caption: "Promedio global",
      },
      {
        label: "Distancia máxima",
        value: formatKm(result.overall_max_distance),
        caption: "Caso más lejano",
      },
      {
        label: "Inercia total",
        value: result.inertia.toFixed(2),
        caption: "Suma de distancias²",
      },
    ];
  }, [result]);

  const handleInputChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = event.target;
    setParams((prev) => ({
      ...prev,
      [name]: Number(value),
    }));
  };

  const runSimulation = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setLoading(true);
    setError(null);
    try {
      const response = await fetch(`${API_BASE_URL}/kmeans/run`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(params),
      });
      if (!response.ok) {
        const payload = await response.json().catch(() => ({}));
        throw new Error(payload.detail ?? "No se pudo ejecutar K-Means.");
      }
      const payload: SimulationResponse = await response.json();
      const enriched: EnrichedResult = {
        ...payload,
        neighborhoods: payload.neighborhoods.map((neighborhood, idx) => ({
          ...neighborhood,
          cluster: payload.assignments[idx],
        })),
      };
      setResult(enriched);
      setGridSize(params.m);
    } catch (err) {
      const message =
        err instanceof Error ? err.message : "Error desconocido al llamar al API.";
      setError(message);
    } finally {
      setLoading(false);
    }
  };

  const fetchPretrained = async () => {
    setPretrainedLoading(true);
    setError(null);
    try {
      const response = await fetch(`${API_BASE_URL}/kmeans/pretrained`);
      if (!response.ok) {
        throw new Error("No se encontró un modelo preentrenado disponible.");
      }
      const payload: PretrainedModel = await response.json();
      setPretrained(payload);
    } catch (err) {
      const message =
        err instanceof Error
          ? err.message
          : "Error desconocido al cargar el modelo.";
      setError(message);
    } finally {
      setPretrainedLoading(false);
    }
  };

  return (
    <div className="app-shell">
      <header>
        <p className="eyebrow">K-Means Hospitals</p>
        <h1>Ubica hospitales óptimos para cada vecindario</h1>
        <p className="lede">
          Simula una ciudad como cuadrícula, genera vecindarios y calcula la
          ubicación recomendada de hospitales usando K-Means. Visualiza clusters
          en modo oscuro con estilo inspirado en tableros operativos.
        </p>
      </header>

      <main className="layout">
        <section className="panel">
          <h2>Parámetros</h2>
          <p className="panel-hint">
            Ajusta el tamaño de la ciudad, el número de vecindarios a simular y la
            cantidad de hospitales/clusters a estimar.
          </p>
          <form className="controls" onSubmit={runSimulation}>
            <label>
              <span>Tamaño de la ciudad (m)</span>
              <input
                type="number"
                min={5}
                max={100}
                name="m"
                value={params.m}
                onChange={handleInputChange}
                required
              />
            </label>
            <label>
              <span>Vecindarios a simular (n)</span>
              <input
                type="number"
                min={10}
                max={500}
                name="n"
                value={params.n}
                onChange={handleInputChange}
                required
              />
            </label>
            <label>
              <span>Hospitales (k)</span>
              <input
                type="number"
                min={1}
                max={12}
                name="k"
                value={params.k}
                onChange={handleInputChange}
                required
              />
            </label>
            <button type="submit" disabled={loading}>
              {loading ? "Calculando..." : "Ejecutar K-Means"}
            </button>
          </form>
          {error && <p className="error-banner">{error}</p>}
          {result && (
            <div className="iterations-chip">
              Convergió en {result.iterations} iteraciones.
            </div>
          )}
        </section>

        <section className="visual">
          <div className="visual-header">
            <div>
              <h2>Ciudad simulada</h2>
              <p>Dimensiona un canvas m x m donde cada punto representa un vecindario.</p>
            </div>
            {result && (
              <div className="legend">
                {summary.map((cluster) => (
                  <span key={cluster.id}>
                    <span
                      className="legend-dot"
                      style={{ backgroundColor: cluster.color }}
                    />
                    H{cluster.id}
                  </span>
                ))}
              </div>
            )}
          </div>
          <CityMap result={result} gridSize={gridSize} />
          {!result && (
            <p className="empty-state">
              Ejecuta la simulación para visualizar vecindarios y hospitales en la
              cuadrícula.
            </p>
          )}

          {result && (
            <div className="summary-grid">
              {summary.map((cluster) => (
                <article key={cluster.id} className="summary-card">
                  <header style={{ borderColor: cluster.color }}>
                    <p>Hospital #{cluster.id}</p>
                    <strong>{cluster.count} vecindarios</strong>
                  </header>
                  <dl>
                    <div>
                      <dt>Coordenadas</dt>
                      <dd>
                        {cluster.hospital.x.toFixed(1)} km,{" "}
                        {cluster.hospital.y.toFixed(1)} km
                      </dd>
                    </div>
                    <div>
                      <dt>Distancia media</dt>
                      <dd>{formatKm(cluster.averageDistance)}</dd>
                    </div>
                  </dl>
                </article>
              ))}
            </div>
          )}
        </section>

        {result && (
          <>
            <section className="analytics">
              {statHighlights.map((stat) => (
                <article key={stat.label} className="stat-card">
                  <p>{stat.label}</p>
                  <strong>{stat.value}</strong>
                  <span>{stat.caption}</span>
                </article>
              ))}
            </section>

            <section className="charts-grid">
              <article className="chart-card">
                <header>
                  <h3>Vecindarios por hospital</h3>
                  <p>Comprueba el balance de carga entre cada centro.</p>
                </header>
                {clusterChartData.length ? (
                  <ResponsiveContainer width="100%" height={260}>
                    <BarChart data={clusterChartData}>
                      <CartesianGrid strokeDasharray="3 3" stroke="#1f2937" />
                      <XAxis dataKey="hospital" stroke="#94a3b8" />
                      <YAxis stroke="#94a3b8" allowDecimals={false} />
                      <Tooltip
                        contentStyle={{ background: "#0f172a", borderRadius: "0.8rem", border: "1px solid rgba(148,163,184,0.3)" }}
                      />
                      <Bar dataKey="count" fill="#7c3aed" radius={[8, 8, 0, 0]} />
                    </BarChart>
                  </ResponsiveContainer>
                ) : (
                  <p className="empty-state">Sin datos para mostrar.</p>
                )}
              </article>

              <article className="chart-card">
                <header>
                  <h3>Calidad de cobertura</h3>
                  <p>Compara distancias promedio vs máximas por hospital.</p>
                </header>
                {clusterChartData.length ? (
                  <ResponsiveContainer width="100%" height={260}>
                    <LineChart data={clusterChartData}>
                      <CartesianGrid strokeDasharray="3 3" stroke="#1f2937" />
                      <XAxis dataKey="hospital" stroke="#94a3b8" />
                      <YAxis stroke="#94a3b8" />
                      <Tooltip
                        contentStyle={{ background: "#0f172a", borderRadius: "0.8rem", border: "1px solid rgba(148,163,184,0.3)" }}
                      />
                      <Legend />
                      <Line type="monotone" dataKey="avg" name="Promedio (km)" stroke="#ffbe0b" strokeWidth={2} />
                      <Line type="monotone" dataKey="max" name="Máximo (km)" stroke="#00b4d8" strokeWidth={2} />
                    </LineChart>
                  </ResponsiveContainer>
                ) : (
                  <p className="empty-state">Sin datos para mostrar.</p>
                )}
              </article>

              <article className="chart-card span-2">
                <header>
                  <h3>Distribución de distancias</h3>
                  <p>Cuántos vecindarios deben viajar más en esta simulación.</p>
                </header>
                {distanceHistogramData.length ? (
                  <ResponsiveContainer width="100%" height={260}>
                    <AreaChart data={distanceHistogramData}>
                      <defs>
                        <linearGradient id="distanceGradient" x1="0" y1="0" x2="0" y2="1">
                          <stop offset="5%" stopColor="#f43f5e" stopOpacity={0.8} />
                          <stop offset="95%" stopColor="#f43f5e" stopOpacity={0.1} />
                        </linearGradient>
                      </defs>
                      <CartesianGrid strokeDasharray="3 3" stroke="#1f2937" />
                      <XAxis dataKey="label" stroke="#94a3b8" />
                      <YAxis stroke="#94a3b8" allowDecimals={false} />
                      <Tooltip
                        contentStyle={{ background: "#0f172a", borderRadius: "0.8rem", border: "1px solid rgba(148,163,184,0.3)" }}
                      />
                      <Area type="monotone" dataKey="count" stroke="#f43f5e" fillOpacity={1} fill="url(#distanceGradient)" />
                    </AreaChart>
                  </ResponsiveContainer>
                ) : (
                  <p className="empty-state">Sin datos para mostrar.</p>
                )}
              </article>
            </section>
          </>
        )}
      </main>

      <section className="pretrained-section">
        <div>
          <h2>Modelo preentrenado</h2>
          <p>
            Consulta los centroides guardados desde el notebook para comparar con la
            simulación en vivo o exponerlos públicamente.
          </p>
        </div>
        <button onClick={fetchPretrained} disabled={pretrainedLoading}>
          {pretrainedLoading ? "Cargando..." : "Ver hospitales preentrenados"}
        </button>
        {pretrained && (
          <div className="pretrained-card">
            <p>{pretrained.description}</p>
            <ul>
              {pretrained.hospitals.map((hospital, idx) => (
                <li key={`pre-${idx}`}>
                  <span>Hospital #{idx + 1}</span>
                  <span>
                    {hospital[0].toFixed(2)} km · {hospital[1].toFixed(2)} km
                  </span>
                </li>
              ))}
            </ul>
          </div>
        )}
      </section>
    </div>
  );
}

export default App;
