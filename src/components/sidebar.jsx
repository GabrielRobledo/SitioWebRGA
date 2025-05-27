import {Menu} from 'antd';
import { Link } from 'react-router-dom';
import {HomeOutlined, DatabaseOutlined, BarsOutlined, DashboardOutlined} from '@ant-design/icons';

const sidebar = () => {
 

  return (
    <Menu theme='dark' style={{paddingTop:'20%'}}>
        
        <Menu.Item key="acceso" icon={<HomeOutlined/>}>
            <Link to="/acceso">Acceso</Link>
        </Menu.Item>
        <Menu.Item key="consultas" icon={<DashboardOutlined/>}>
            <Link to="/consultas">Consultas Eventos</Link>
        </Menu.Item>
        <Menu.SubMenu key="Tramites" icon={<DatabaseOutlined/>} title="Formularios">
            <Menu.Item>
              <Link to="/formSiniestros">Notificacion Siniestros</Link>
            </Menu.Item>
            <Menu.Item>
              <Link to="/formPrefacturacion">Pre-Facturacion</Link>
            </Menu.Item>
        </Menu.SubMenu>
    </Menu>
  )
}

export default sidebar