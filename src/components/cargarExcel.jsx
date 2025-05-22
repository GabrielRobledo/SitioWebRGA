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
    // Ruta al archivo estático en la carpeta 'public'
    const filePath = '/ConsultaEventosRGA.xlsx'; // Asegúrate de que el archivo esté en la carpeta 'public'

    // Usamos fetch para cargar el archivo Excel
    fetch(filePath)
      .then((response) => response.arrayBuffer()) // Leemos el archivo como un buffer
      .then((buffer) => {
        const wb = XLSX.read(buffer, { type: "array" });

        // Suponiendo que la hoja que quieres leer es la primera
        const ws = wb.Sheets[wb.SheetNames[0]];

        // Convertimos la hoja a un array de objetos (como una tabla)
        let jsonData = XLSX.utils.sheet_to_json(ws);

        // Procesamos los datos para convertir solo las columnas de fechas
        jsonData = jsonData.map((row) => {
          Object.keys(row).forEach((key) => {
            // Si la columna está en la lista de columnasConFechas, la convertimos
            if (columnasConFechas.includes(key) && typeof row[key] === "number") {
              row[key] = convertExcelDate(row[key]); // Convertir si es un número
            }
          });
          return row;
        });

        setDatosExcel(jsonData); // Guardamos los datos procesados en el estado
      })
      .catch((error) => {
        console.error("Error al leer el archivo Excel:", error);
      });
  }, []);

  return (
    <div>
      <h2>Listado de Eventos</h2>
      {/* Pasamos los datos al componente TablaConFiltro */}
      <TablaConFiltro datos={datosExcel} />
    </div>
  );
};

export default CargarExcelYMostrarTabla;
