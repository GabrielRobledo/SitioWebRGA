import {Menu} from 'antd';
import { Link } from 'react-router-dom';
import {HomeOutlined, DatabaseOutlined, BarsOutlined, DashboardOutlined,} from '@ant-design/icons';

const sidebar = () => {
 

  return (
    <Menu theme='dark' style={{paddingTop:'20%'}}>
        
        
        <Menu.Item key="consultas" icon={<HomeOutlined/>}>
            <Link to="/consultas">Consultas Eventos</Link>
        </Menu.Item>
        <Menu.Item key="dashboard" icon={<DashboardOutlined/>}>
            <Link to="/dashboard">Reporte Estadístico</Link>
        </Menu.Item>
        
    </Menu>
  )
}

export default sidebar
