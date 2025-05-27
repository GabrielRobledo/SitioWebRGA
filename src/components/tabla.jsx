import  { useEffect, useMemo, useState } from "react";
import { utils, writeFile } from "xlsx";
import '../styles/tabla.css'
import {
  useReactTable,
  getCoreRowModel,
  getFilteredRowModel,
  flexRender,
} from "@tanstack/react-table";

const TablaConFiltro = ({ datos }) => {
  const [columnFilters, setColumnFilters] = useState([]);
  const [pageIndex, setPageIndex] = useState(0); // Estado para la página
  const pageSize = 35; // Número de filas por página

  // Definición de las columnas
  const columns = useMemo(() => {
    if (!datos || datos.length === 0) return [];

    return Object.keys(datos[0]).map((key) => ({
      accessorKey: key,
      header: key,
      cell: (info) => info.getValue(),
      filterFn: "includesString",
    }));
  }, [datos]);

  const table = useReactTable({
    data: Array.isArray(datos) ? datos : [],
    columns,
    state: {
      columnFilters,
    },
    onColumnFiltersChange: setColumnFilters,
    getCoreRowModel: getCoreRowModel(),
    getFilteredRowModel: getFilteredRowModel(),
  });

  // Obtener filas filtradas
  const filteredRows = table.getFilteredRowModel().rows;

  // Datos de la página actual
  const paginatedRows = useMemo(() => {
    const start = pageIndex * pageSize;
    return filteredRows.slice(start, start + pageSize);
  }, [filteredRows, pageIndex, pageSize]);

  // Calcular el total de páginas
  const totalPages = Math.ceil(filteredRows.length / pageSize);

  // Cambiar de página cuando el filtro cambia
  useEffect(() => {
    setPageIndex(0); // Reseteamos la página a la primera cuando cambia el filtro
  }, [columnFilters]);

  const exportToExcel = () => {
    // Convierte los datos filtrados a un array de objetos plano (sin celdas de react-table)
    const dataToExport = filteredRows.map((row) => {
        const obj = {};
        row.getVisibleCells().forEach((cell) => {
        obj[cell.column.id] = cell.getValue();
        });
        return obj;
    });

    const worksheet = utils.json_to_sheet(dataToExport);
    const workbook = utils.book_new();
    utils.book_append_sheet(workbook, worksheet, "Datos");

    writeFile(workbook, "tabla_filtrada.xlsx");
  };

  return (
    <div className="tabla-contenedor">
        <button onClick={exportToExcel} style={{ marginBottom: "10px", backgroundColor: 'green', color: 'white', padding: '10px', borderRadius: '10px'}}>
            Exportar a Excel
        </button>  
      <table className="tabla">
        <thead>
          {table.getHeaderGroups().map((headerGroup) => (
            <tr key={headerGroup.id}>
              {headerGroup.headers.map((header) => (
                <th key={header.id}>
                  {flexRender(header.column.columnDef.header, header.getContext())}
                  <div>
                    {header.column.getCanFilter() ? (
                      <input
                        type="text"
                        onChange={(e) =>
                          header.column.setFilterValue(e.target.value)
                        }
                        placeholder={`Filtrar...`}
                      />
                    ) : null}
                  </div>
                </th>
              ))}
            </tr>
          ))}
        </thead>
        <tbody>
          {paginatedRows.map((row) => (
            <tr key={row.id}>
              {row.getVisibleCells().map((cell) => (
                <td key={cell.id}>
                  {flexRender(cell.column.columnDef.cell, cell.getContext())}
                </td>
              ))}
            </tr>
          ))}
        </tbody>
      </table>

      {/* Controles de paginación */}
      <div style={{ marginTop: "10px" }}>
        <button
          onClick={() => setPageIndex((p) => Math.max(p - 1, 0))}
          disabled={pageIndex === 0}
        >
          Anterior
        </button>
        <span style={{ margin: "0 10px" }}>
          Página {pageIndex + 1} de {totalPages}
        </span>
        <button
          onClick={() => setPageIndex((p) => Math.min(p + 1, totalPages - 1))}
          disabled={pageIndex >= totalPages - 1}
        >
          Siguiente
        </button>
      </div>
    </div>
  );
};

export default TablaConFiltro;
