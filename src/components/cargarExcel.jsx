import { useEffect, useState } from "react";
import * as XLSX from "xlsx";
import TablaConFiltro from "./tabla";

const CargarExcelYMostrarTabla = () => {
  const [datosExcel, setDatosExcel] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  // Rótulos estáticos exactos que quieres mostrar en la tabla
  const headersEstaticos = [
    "Fecha de Notificaion ONLINE",
    "Nº Legajo (EJ)",
    "Compañia (EJ)",
    "Nº POLIZA (EJ)",
    "Nº DOMINIO (EJ)",
    "Nº SINIESTRO (EJ)",
    "ESTADO DENUNCIA (EJ)",
    "EVENTO (Tipo)",
    "EVENTO (Fecha)",
    "DNI",
    "PACIENTE nombre y apellido",
    "(AT) Lugar/Dirección de Accidente",
    "(AT) Departamento",
    "Dependencia Policial (EJ)",
    "(ING/DEST) Centro de Salud"
  ];

  const columnasConFechas = ["Fecha de Notificaion ONLINE", "EVENTO (Fecha)"];

  const convertExcelDate = (serial) => {
    if (!serial || typeof serial !== "number") return serial;
    const tempDate = new Date((serial - (25567 + 2)) * 86400 * 1000);
    return tempDate.toLocaleDateString();
  };

  useEffect(() => {
    // Definimos cada hoja, su URL, la fila donde está su cabecera y dónde arrancan los datos
    const sheetConfig = [
      { 
        url: "https://docs.google.com/spreadsheets/d/1RoszM_sVVsG2o0kDtY0tdE-zO1FYDs5KE0DUlDwv2AY/export?format=csv&gid=0", 
        headerRowIndex: 4, // Fila 5 (índice 4)
        startRow: 6        // Datos desde la fila 6
      },
      { 
        url: "https://docs.google.com/spreadsheets/d/1RoszM_sVVsG2o0kDtY0tdE-zO1FYDs5KE0DUlDwv2AY/export?format=csv&gid=2133889569", 
        headerRowIndex: 5, // Fila 6 (índice 5)
        startRow: 7        // Datos desde la fila 7
      }
    ];

    Promise.all(
      sheetConfig.map((sheet) =>
        fetch(sheet.url)
          .then((res) => {
            if (!res.ok) throw new Error("No se pudo conectar con Google Sheets");
            return res.text();
          })
          .then((text) => ({ text, headerRowIndex: sheet.headerRowIndex, startRow: sheet.startRow }))
      )
    )
      .then((results) => {
        let allCombinedData = [];

        results.forEach(({ text: csvText, headerRowIndex, startRow }) => {
          const wb = XLSX.read(csvText, { type: "string" });
          const ws = wb.Sheets[wb.SheetNames[0]];

          const jsonData = XLSX.utils.sheet_to_json(ws, { header: 1, defval: "" });
          
          if (jsonData.length <= startRow) return;

          // Obtenemos los nombres reales de las columnas de esta hoja específica
          const headerRow = jsonData[headerRowIndex] || [];
          const rows = jsonData.slice(startRow);

          // Función para encontrar la columna exacta por su nombre (con variantes flexibles para Legajo)
          const getColIndex = (nombreBuscado) => {
            const normalizar = (str) => str.toLowerCase().replace(/[^a-z0-9]/g, "");
            
            let posiblesNombres = [nombreBuscado];
            if (nombreBuscado === "Nº Legajo (EJ)") {
              posiblesNombres = ["Nº Legajo (EJ)", "Nº Legajo", "Legajo (EJ)", "Legajo"];
            }

            for (let nombre of posiblesNombres) {
              const idx = headerRow.findIndex(
                (h) => h && normalizar(h.toString()) === normalizar(nombre)
              );
              if (idx !== -1) return idx;
            }
            return -1;
          };

          const data = rows.map((row) => {
            const obj = {};
            headersEstaticos.forEach((header) => {
              const colIndex = getColIndex(header);
              let value = colIndex !== -1 ? row[colIndex] : "";

              // Si la columna es DNI, removemos los puntos
              if (header === "DNI" && value) {
                value = value.toString().replace(/\./g, "").trim();
              }

              // Conversión de fechas si corresponde
              if (columnasConFechas.includes(header) && typeof value === "number") {
                value = convertExcelDate(value);
              }

              obj[header] = value !== undefined && value !== null ? value : "";
            });
            return obj;
          });

          const dataValida = data.filter((row) => {
            const valores = Object.values(row);
            const tieneContenido = valores.some((val) => val !== "");
            const esInstruccion = valores.some((val) => 
              typeof val === "string" && val.includes("LA BUSQUEDA SE DEBERA")
            );
            return tieneContenido && !esInstruccion;
          });

          allCombinedData = [...allCombinedData, ...dataValida];
        });

        setDatosExcel(allCombinedData);
        setLoading(false);
      })
      .catch((err) => {
        console.error("Error al leer las hojas de Google Sheets:", err);
        setError("Error al cargar los datos de Google Sheets");
        setLoading(false);
      });
  }, []);

  if (loading) return <p>Cargando datos desde Google Sheets...</p>;
  if (error) return <p style={{ color: "red" }}>{error}</p>;

  return (
    <div>
      <h2>Listado de Eventos</h2>
      {datosExcel.length > 0 && <TablaConFiltro datos={datosExcel} />}
    </div>
  );
};

export default CargarExcelYMostrarTabla;
