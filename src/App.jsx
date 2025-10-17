import { Routes, Route } from 'react-router-dom';
import BasicLayout from './components/layout';
import FormPreFacturacion from './components/formPreFacturacion';
import FormSiniestros from './components/formSiniestros';
import CargarExcelYMostrarTabla from './components/cargarExcel'
import Acceso from './components/acceso';
import Dashboard from './components/Dashboard';

const App = () => {
  return (
    <Routes>
      <Route path="/" element={<BasicLayout />}>
        <Route index element={<CargarExcelYMostrarTabla />} />
        <Route path="acceso" element={<Acceso />}/>
        <Route path="consultas" element={<CargarExcelYMostrarTabla />} />
        <Route path="formPrefacturacion" element={<FormPreFacturacion />} />
        <Route path="formSiniestros" element={<FormSiniestros />} />
        <Route path="dashboard" element={<Dashboard />} />
        {/* Puedes añadir más rutas aquí en el futuro */}
      </Route>
    </Routes>
  );
};

export default App;
