import { useEffect, useState } from "react";
import * as XLSX from "xlsx";
import TablaConFiltro from "./tabla"; // Asegúrate de tener el componente importado correctamente

const CargarExcelYMostrarTabla = () => {
  const [datosExcel, setDatosExcel] = useState([]);

  // Columnas que deseas convertir a fecha (por su nombre)
  const columnasConFechas = ["Fecha de Notificaion ONLINE", "EVENTO (Fecha)"]; // Aquí puedes agregar más columnas si es necesario

  // Función para convertir números a fechas en formato legible
  const convertExcelDate = (serial) => {
    if (!serial) return serial;

    // Excel utiliza el número 1 como 1/1/1900, así que convertimos esto
    const tempDate = new Date((serial - (25567 + 2)) * 86400 * 1000);
    return tempDate.toLocaleDateString(); // Convierte la fecha a una cadena legible
  };
  useEffect(() => {
    const filePath = '/ConsultaEventosRGA.xlsx';
  
    fetch(filePath)
      .then((response) => response.arrayBuffer())
      .then((buffer) => {
        const wb = XLSX.read(buffer, { type: "array" });
        const ws = wb.Sheets[wb.SheetNames[0]];
  
        // Leer como array de arrays
        const jsonData = XLSX.utils.sheet_to_json(ws, { header: 1 });
  
        const [headers, ...rows] = jsonData;
  
        // Convertir a array de objetos con orden fijo
        const data = rows.map((row) => {
          const obj = {};
          headers.forEach((header, index) => {
            obj[header] = row[index];
          });
          return obj;
        });
  
        // Convertir fechas
        const dataConFechas = data.map((row) => {
          headers.forEach((key) => {
            if (columnasConFechas.includes(key) && typeof row[key] === "number") {
              row[key] = convertExcelDate(row[key]);
            }
          });
          return row;
        });
  
        setDatosExcel(dataConFechas);
      })
      .catch((error) => {
        console.error("Error al leer el archivo Excel:", error);
      });
  }, []);

  return (
    <div>
      <h2>Listado de Eventos</h2>
      {/* Pasamos los datos al componente TablaConFiltro */}
      {datosExcel.length > 0 && <TablaConFiltro datos={datosExcel} />}
    </div>
  );
};

export default CargarExcelYMostrarTabla;
