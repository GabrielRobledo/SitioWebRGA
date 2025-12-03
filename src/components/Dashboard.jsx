// src/components/DashboardRediseñado.jsx
import { useEffect, useState , useRef } from "react";
import * as XLSX from "xlsx";
import { Pie, Bar } from "react-chartjs-2";
import {
  Chart as ChartJS,
  ArcElement,
  Tooltip,
  Legend,
  CategoryScale,
  LinearScale,
  BarElement,
  Title,
} from "chart.js";
import html2canvas from "html2canvas";
import jsPDF from "jspdf";


ChartJS.register(ArcElement, Tooltip, Legend, CategoryScale, LinearScale, BarElement, Title);

const Dashboard = () => {
  const [datos, setDatos] = useState([]);
  const [hospitalSeleccionado, setHospitalSeleccionado] = useState("");
  const [fechaDesde, setFechaDesde] = useState("");
  const [fechaHasta, setFechaHasta] = useState("");
  const [busqueda, setBusqueda] = useState("");
  const [paginaActual, setPaginaActual] = useState(1);
  const filasPorPagina = 10;
  const dashboardRef = useRef();

  const exportarPDF = async () => {
    const canvas = await html2canvas(dashboardRef.current);
    const imgData = canvas.toDataURL("image/png");

    const pdf = new jsPDF({
      orientation: "portrait",
      unit: "mm",
      format: "a4",
    });

    const imgProps = pdf.getImageProperties(imgData);
    const pdfWidth = pdf.internal.pageSize.getWidth();
    const pdfHeight = (imgProps.height * pdfWidth) / imgProps.width;

    pdf.addImage(imgData, "PNG", 0, 0, pdfWidth, pdfHeight);
    pdf.save("dashboard_siniestros.pdf");
  };

  const columnasConFechas = ["Fecha de Notificaion ONLINE", "EVENTO (Fecha)"];

  const convertExcelDate = (serial) => {
    if (!serial) return serial;
    const tempDate = new Date((serial - (25567 + 2)) * 86400 * 1000);
    const day = String(tempDate.getDate()).padStart(2, "0");
    const month = String(tempDate.getMonth() + 1).padStart(2, "0");
    const year = tempDate.getFullYear();
    return `${day}-${month}-${year}`;
  };

  const parseFecha = (fechaStr) => {
    if (!fechaStr || !fechaStr.includes("-")) return null;
    const [dia, mes, anio] = fechaStr.split("-");
    return new Date(`${anio}-${mes}-${dia}`);
  };

  const datosFiltrados = datos.filter((d) => {
    const cumpleHospital = hospitalSeleccionado
        ? d["(ING/DEST) Centro de Salud"] === hospitalSeleccionado
        : true;

    const fechaEvento = parseFecha(d["EVENTO (Fecha)"]);

    const cumpleDesde = fechaDesde ? fechaEvento >= new Date(fechaDesde) : true;
    const cumpleHasta = fechaHasta ? fechaEvento <= new Date(fechaHasta) : true;

    return cumpleHospital && cumpleDesde && cumpleHasta;
  });

  /* ------------------------------------------------------------
     NUEVAS FUNCIONES AGREGADAS (normalizar + obtenerEstadosContados)
  --------------------------------------------------------------*/

  const normalizar = (v) => String(v || "").trim().toLowerCase();

  const obtenerEstadosContados = (lista) => {
    const conteo = {};

    lista.forEach((item) => {
      const estadoOriginal = item["ESTADO DENUNCIA (EJ)"];
      const estado = normalizar(estadoOriginal) || "(Sin estado)";

      conteo[estado] = (conteo[estado] || 0) + 1;
    });

    return conteo;
  };

  const estadosContados = obtenerEstadosContados(datosFiltrados);

  /* ------------------------------------------------------------
     FIN DE LO NUEVO
  --------------------------------------------------------------*/

  const datosFiltradosPorBusqueda = datosFiltrados.filter((row) => {
    const texto = busqueda.toLowerCase();
    return (
        String(row["PACIENTE nombre y apellido"] || "").toLowerCase().includes(texto) ||
        String(row["(AT) Lugar/Dirección de Accidente"] || "").toLowerCase().includes(texto) ||
        String(row["Compañia (EJ)"] || "").toLowerCase().includes(texto)
    );
  });

  const totalPaginas = Math.ceil(datosFiltradosPorBusqueda.length / filasPorPagina);
  const datosPaginados = datosFiltradosPorBusqueda.slice(
    (paginaActual - 1) * filasPorPagina,
    paginaActual * filasPorPagina
  );

  useEffect(() => {
    const filePath = "/ConsultaEventosRGA.xlsx";

    fetch(filePath)
      .then((response) => response.arrayBuffer())
      .then((buffer) => {
        const wb = XLSX.read(buffer, { type: "array" });
        const ws = wb.Sheets[wb.SheetNames[0]];
        const jsonData = XLSX.utils.sheet_to_json(ws, { header: 1 });
        const [headers, ...rows] = jsonData;

        const data = rows.map((row) => {
          const obj = {};
          headers.forEach((header, index) => {
            obj[header] = row[index];
          });
          return obj;
        });

        const dataConFechas = data.map((row) => {
          columnasConFechas.forEach((key) => {
            if (typeof row[key] === "number") {
              row[key] = convertExcelDate(row[key]);
            }
          });
          return row;
        });

        setDatos(dataConFechas);
      })
      .catch((error) => {
        console.error("Error al leer el archivo Excel:", error);
      });
  }, []);

  const hospitalesUnicos = [...new Set(datos.map((d) => d["(ING/DEST) Centro de Salud"]))].sort();
  
  const total = datosFiltrados.length;

  // Pie chart Viables vs No Viables SE MANTIENE IGUAL
  const estadoNormalizado = (v) => String(v || "").trim().toLowerCase();

  const viables = datosFiltrados.filter(d =>
    estadoNormalizado(d["ESTADO DENUNCIA (EJ)"]) === "viable"
  ).length;

  const noViables = datosFiltrados.filter(d => {
    const est = estadoNormalizado(d["ESTADO DENUNCIA (EJ)"]);
    return est === "no viable" || est === "no viable - comisaria";
  }).length;


  const pieData = {
    labels: ["Viable", "No Viable"],
    datasets: [
      {
        data: [viables, noViables],
        backgroundColor: ["#4caf50", "#f44336"],
      },
    ],
  };

  // Gráfico compañías (igual que tu versión original)
  const companias = [...new Set(datosFiltrados.map((d) => d["Compañia (EJ)"]).filter(Boolean))];

  const topN = 10;

  const eventosPorCompaniaMap = companias.map((comp) => ({
    compania: comp,
    cantidad: datosFiltrados.filter((d) => d["Compañia (EJ)"] === comp).length,
  }));

  const sorted = eventosPorCompaniaMap.sort((a, b) => b.cantidad - a.cantidad);

  const top = sorted.slice(0, topN);
  const otrasCantidad = sorted.slice(topN).reduce((acc, curr) => acc + curr.cantidad, 0);

  const finalData = [
    ...top,
    ...(otrasCantidad > 0 ? [{ compania: "Otras", cantidad: otrasCantidad }] : []),
  ];

  const barDataCompanias = {
    labels: finalData.map((item) => item.compania),
    datasets: [
      {
        label: "Eventos por Tipo de Compañía",
        data: finalData.map((item) => item.cantidad),
        backgroundColor: "rgba(255, 159, 64, 0.6)",
      },
    ],
  };

  const exportarTablaExcel = () => {
    const ws = XLSX.utils.json_to_sheet(datosFiltradosPorBusqueda);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, "Eventos");

    XLSX.writeFile(wb, "tabla_eventos_filtrada.xlsx");
  };

  const coloresEstados = {
    "viable": "success",
    "no viable": "danger",
    "no viable - comisaria": "dark",
    "en gestión": "primary",
    "judiciales": "warning",
    "pendiente de denuncia en art": "info",
    "pendiente respuesta de art": "secondary",
    "pendiente respuesta de comisaría": "secondary",
    "ssn": "info",  
    "(Sin estado)": "info",
  };

  return (
    <div className="container mt-4">
      <h2 className="mb-4">📊 Dashboard de Siniestros Viales</h2>

      {/* FILTROS */}
      <div className="row mb-4 align-items-end">
        <div className="col-md-4">
          <label>Elegí tu hospital:</label>
          <select
            className="form-select"
            value={hospitalSeleccionado}
            onChange={(e) => setHospitalSeleccionado(e.target.value)}
          >
            <option value="">-- Seleccionar --</option>
            {hospitalesUnicos.map((hosp, idx) => (
              <option key={idx} value={hosp}>
                {hosp}
              </option>
            ))}
          </select>
        </div>

        <div className="col-md-3">
          <label>Desde:</label>
          <input
            type="date"
            className="form-control"
            value={fechaDesde}
            onChange={(e) => setFechaDesde(e.target.value)}
          />
        </div>

        <div className="col-md-3">
          <label>Hasta:</label>
          <input
            type="date"
            className="form-control"
            value={fechaHasta}
            onChange={(e) => setFechaHasta(e.target.value)}
          />
        </div>

        <div className="col-md-2 d-flex justify-content-end">
          <button
            className="btn btn-outline-secondary w-100"
            onClick={() => {
              setHospitalSeleccionado("");
              setFechaDesde("");
              setFechaHasta("");
              setBusqueda("");
              setPaginaActual(1);
            }}
          >
            🧹 Limpiar filtros
          </button>
        </div>
      </div>

      {!hospitalSeleccionado ? (
        <div className="alert alert-info">🩺 Por favor seleccioná un hospital para ver los datos.</div>
      ) : (
        <div ref={dashboardRef}>

          {/* ------------------------------------------------------------
               ⭐ NUEVAS TARJETAS DINÁMICAS
          --------------------------------------------------------------*/}

        <div className="card p-3 mb-4">
          <h5 className="mb-3 text-center">Estados de Denuncia</h5>

          <div className="d-flex flex-wrap gap-3 justify-content-center">

            {Object.entries(estadosContados).map(([estado, cantidad], idx) => {
              const color = coloresEstados[estado] || "secondary";

              return (
                <span
                  key={idx}
                  className={`badge bg-${color === "purple" ? "" : color} badge-pill px-3 py-2 fs-6 ${color === "purple" ? "badge-purple" : ""}`}
                  style={{ fontSize: "1rem" }}
                >
                  {estado}: <strong>{cantidad}</strong>
                </span>
              );
            })}

          </div>
        </div>

          {/* ------------------------------------------------------------
               FIN NUEVAS TARJETAS
          --------------------------------------------------------------*/}

          {/* GRÁFICOS */}
          <div className="row">
            <div className="col-md-6 mb-4">
              <div className="card p-3">
                <h5 className="text-center">Distribución Viables / No Viables</h5>
                <Pie style={{ maxWidth: '300px', maxHeight: '300px', margin: '0 auto' }} data={pieData} />
              </div>
            </div>

            <div className="col-md-6 mb-4">
              <div className="card p-3">
                <h5 className="text-center">Eventos por Tipo de Compañía</h5>
                <Bar
                  data={barDataCompanias}
                  options={{
                    indexAxis: 'y',
                    responsive: true,
                    plugins: {
                      legend: { display: false },
                      title: { display: false },
                    },
                    scales: {
                      y: { ticks: { autoSkip: false, font: { size: 12 } } },
                      x: { beginAtZero: true },
                    },
                  }}
                />
              </div>
            </div>
          </div>

          {/* BUSCADOR Y EXPORTAR */}
          <div className="mb-3 no-export">
            <input
              type="text"
              className="form-control "
              placeholder="Buscar por paciente, dirección o compañía..."
              value={busqueda}
              onChange={(e) => {
                setBusqueda(e.target.value);
                setPaginaActual(1);
              }}
            />
          </div>

          <button className="btn btn-success mb-3 me-2 no-export" onClick={exportarTablaExcel}>
            💾 Exportar Excel
          </button>

          {/* TABLA */}
          <table className="table table-striped table-hover align-middle shadow-sm border rounded">
            <thead className="table-primary text-center">
              <tr>
                <th>Fecha</th>
                <th>Paciente</th>
                <th>Estado</th>
                <th>Dirección</th>
                <th>Centro de Salud</th>
                <th>Compañía</th>
              </tr>
            </thead>
            <tbody>
              {datosPaginados.map((row, idx) => (
                <tr key={idx}>
                  <td>{row["EVENTO (Fecha)"]}</td>
                  <td>{row["PACIENTE nombre y apellido"]}</td>
                  <td>
                    <span
                      className={`badge bg-${row["ESTADO DENUNCIA (EJ)"] === "Viable" ? "success" : "danger"}`}
                    >
                      {row["ESTADO DENUNCIA (EJ)"]}
                    </span>
                  </td>
                  <td>{row["(AT) Lugar/Dirección de Accidente"]}</td>
                  <td>{row["(ING/DEST) Centro de Salud"]}</td>
                  <td>{row["Compañia (EJ)"]}</td>
                </tr>
              ))}
              {datosPaginados.length === 0 && (
                <tr>
                  <td colSpan="6" className="text-center text-muted">
                    No hay datos para mostrar.
                  </td>
                </tr>
              )}
            </tbody>
          </table>

          {/* PAGINACIÓN */}
          {totalPaginas > 1 && (
            <div className="d-flex justify-content-center align-items-center mt-3">
              <button
                className="btn btn-outline-primary me-3"
                disabled={paginaActual === 1}
                onClick={() => setPaginaActual((prev) => Math.max(prev - 1, 1))}
              >
                &lt;
              </button>
              <span>
                Página {paginaActual} de {totalPaginas}
              </span>
              <button
                className="btn btn-outline-primary ms-3"
                disabled={paginaActual === totalPaginas}
                onClick={() => setPaginaActual((prev) => Math.min(prev + 1, totalPaginas))}
              >
                &gt;
              </button>
            </div>
          )}

        </div>
      )}
    </div>
  );
};


export default Dashboard;



