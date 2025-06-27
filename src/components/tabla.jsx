import { useEffect, useMemo, useRef, useState } from "react";
import { utils, writeFile } from "xlsx";
import "../styles/tabla.css";
import {
  useReactTable,
  getCoreRowModel,
  getFilteredRowModel,
  getSortedRowModel,
  flexRender,
} from "@tanstack/react-table";

const TablaConFiltro = ({ datos }) => {
  const [columnFilters, setColumnFilters] = useState([]);
  const [columnVisibility, setColumnVisibility] = useState({});
  const [sorting, setSorting] = useState([]);
  const [pageIndex, setPageIndex] = useState(0);
  const pageSize = 35;

  const allKeys = useMemo(() => {
    const keysSet = new Set();
    datos?.forEach((obj) => {
      Object.keys(obj).forEach((key) => keysSet.add(key));
    });
    return Array.from(keysSet);
  }, [datos]);

  const columns = useMemo(() => {
    return allKeys.map((key) => ({
      accessorKey: key,
      header: key,
      cell: (info) => info.getValue(),
      filterFn: "includesString",
      enableSorting: true,
    }));
  }, [allKeys]);

  const table = useReactTable({
    data: Array.isArray(datos) ? datos : [],
    columns,
    state: {
      columnFilters,
      columnVisibility,
      sorting,
    },
    onColumnFiltersChange: setColumnFilters,
    onColumnVisibilityChange: setColumnVisibility,
    onSortingChange: setSorting,
    getCoreRowModel: getCoreRowModel(),
    getFilteredRowModel: getFilteredRowModel(),
    getSortedRowModel: getSortedRowModel(),
  });

  const filteredRows = table.getSortedRowModel().rows;

  const paginatedRows = useMemo(() => {
    const start = pageIndex * pageSize;
    return filteredRows.slice(start, start + pageSize);
  }, [filteredRows, pageIndex, pageSize]);

  const totalPages = Math.ceil(filteredRows.length / pageSize);

  useEffect(() => {
    setPageIndex(0);
  }, [columnFilters]);

  const exportToExcel = () => {
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

  const clearFilters = () => {
    setColumnFilters([]);
  };

  // Dropdown de columnas
  const dropdownRef = useRef(null);
  const [showColumnDropdown, setShowColumnDropdown] = useState(false);

  const toggleDropdown = () => {
    setShowColumnDropdown((prev) => !prev);
  };

  useEffect(() => {
    const handleClickOutside = (event) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
        setShowColumnDropdown(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, []);

  return (
    <div className="tabla-contenedor">
      {/* Dropdown para mostrar/ocultar columnas */}
      <div style={{ position: "relative", display: "inline-block", marginBottom: "10px" }} ref={dropdownRef}>
        <button
          onClick={toggleDropdown}
          style={{
            padding: "8px 12px",
            backgroundColor: "#007bff",
            color: "white",
            border: "none",
            borderRadius: "5px",
            cursor: "pointer",
            marginRight: "10px"
          }}
        >
          Mostrar columnas ▼
        </button>

        {showColumnDropdown && (
          <div
            style={{
              position: "absolute",
              top: "110%",
              left: 0,
              backgroundColor: "white",
              border: "1px solid #ccc",
              borderRadius: "5px",
              padding: "10px",
              boxShadow: "0 4px 6px rgba(0,0,0,0.1)",
              zIndex: 1000,
              maxHeight: "300px",
              overflowY: "auto",
              minWidth: "200px",
            }}
          >
            {table.getAllLeafColumns().map((column) => (
              <div key={column.id} style={{ marginBottom: "5px" }}>
                <label>
                  <input
                    type="checkbox"
                    checked={column.getIsVisible()}
                    onChange={column.getToggleVisibilityHandler()}
                    style={{ marginRight: "8px" }}
                  />
                  {column.id}
                </label>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Botones de acción */}
      <button
        onClick={exportToExcel}
        style={{
          marginBottom: "10px",
          backgroundColor: "green",
          color: "white",
          padding: "10px",
          borderRadius: "10px",
          marginRight: "10px",
        }}
      >
        Exportar a Excel
      </button>

      <button
        onClick={clearFilters}
        style={{
          marginBottom: "10px",
          backgroundColor: "orange",
          color: "white",
          padding: "10px",
          borderRadius: "10px",
        }}
      >
        Limpiar Filtros
      </button>

      {/* Tabla */}
      <table className="tabla">
        <thead>
          {table.getHeaderGroups().map((headerGroup) => (
            <tr key={headerGroup.id}>
              {headerGroup.headers.map((header) => (
                <th key={header.id}>
                  <div
                    style={{ cursor: "pointer", userSelect: "none" }}
                    onClick={header.column.getToggleSortingHandler()}
                  >
                    {flexRender(header.column.columnDef.header, header.getContext())}
                    {{
                      asc: " 🔼",
                      desc: " 🔽",
                    }[header.column.getIsSorted()] ?? ""}
                  </div>
                  {header.column.getCanFilter() && (
                    <input
                      type="text"
                      onChange={(e) => header.column.setFilterValue(e.target.value)}
                      placeholder="Filtrar..."
                      style={{ width: "100%" }}
                    />
                  )}
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

      {/* Paginación */}
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
