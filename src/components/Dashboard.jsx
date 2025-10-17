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

      const datosFiltrados = datos.filter((d) => {
        const cumpleHospital = hospitalSeleccionado
        ? d["(ING/DEST) Centro de Salud"] === hospitalSeleccionado
        : true;
        const fechaEvento = d["EVENTO (Fecha)"];
        const cumpleDesde = fechaDesde ? fechaEvento >= fechaDesde : true;
        const cumpleHasta = fechaHasta ? fechaEvento <= fechaHasta : true;
        return cumpleHospital && cumpleDesde && cumpleHasta;
    });
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
    const viables = datosFiltrados.filter((d) => d["ESTADO DENUNCIA (EJ)"] === "Viable").length;
    const noViables = total - viables;

  const pieData = {
    labels: ["Viable", "No Viable"],
    datasets: [
      {
        data: [viables, noViables],
        backgroundColor: ["#4caf50", "#f44336"],
      },
    ],
  };

  // Gráfico por tipo de compañía
  const companias = [...new Set(datosFiltrados.map((d) => d["Compañia (EJ)"]).filter(Boolean))];

    // Obtener top 10 compañías y agrupar el resto como "Otras"
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


  return (
    <div className="container mt-4">
      <h2 className="mb-4">📊 Dashboard de Siniestros Viales</h2>

      {/* Filtros */}
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
    </div>


      {!hospitalSeleccionado ? (
        <div className="alert alert-info">🩺 Por favor seleccioná un hospital para ver los datos.</div>
      ) : (
        < div ref={dashboardRef}>
          {/* KPIs */}
          <div className="row mb-4">
            <div className="col-md-4">
              <div className="card text-white bg-primary mb-3">
                <div className="card-body">
                  <h5 className="card-title">Total Eventos</h5>
                  <p className="card-text fs-4">{total}</p>
                </div>
              </div>
            </div>
            <div className="col-md-4">
              <div className="card text-white bg-success mb-3">
                <div className="card-body">
                  <h5 className="card-title">Viables</h5>
                  <p className="card-text fs-4">{viables}</p>
                </div>
              </div>
            </div>
            <div className="col-md-4">
              <div className="card text-white bg-danger mb-3">
                <div className="card-body">
                  <h5 className="card-title">No Viables</h5>
                  <p className="card-text fs-4">{noViables}</p>
                </div>
              </div>
            </div>
          </div>

          {/* Gráficos */}
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
                    indexAxis: 'y', // 👈 hace el gráfico horizontal
                    responsive: true,
                    plugins: {
                    legend: { display: false },
                    title: { display: false },
                    },
                    scales: {
                    y: {
                        ticks: {
                        autoSkip: false, // muestra todas las etiquetas si es posible
                        font: { size: 12 },
                        },
                    },
                    x: {
                      beginAtZero: true,
                      ticks: {
                        stepSize: 1, // 👈 fuerza la unidad a 1
                      },
                    },

                    },
                }}
                />

              </div>
            </div>
          </div>

          {/* Tabla de eventos */}
        <div className="mb-3 no-export">
        <input
            type="text"
            className="form-control "
            placeholder="Buscar por paciente, dirección o compañía..."
            value={busqueda}
            onChange={(e) => {
            setBusqueda(e.target.value);
            setPaginaActual(1); // Reiniciar a página 1 al buscar
            }}
        />
        </div>
        <button className="btn btn-success mb-3 me-2 no-export" onClick={exportarTablaExcel}>
            💾 Exportar Excel
        </button>

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
        {/* Línea divisoria */}
        <hr className="my-4" />
        </table>
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
