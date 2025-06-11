import {Menu} from 'antd';
import { Link } from 'react-router-dom';
import {HomeOutlined, DatabaseOutlined, BarsOutlined, DashboardOutlined} from '@ant-design/icons';

const sidebar = () => {
 

  return (
    <Menu theme='dark' style={{paddingTop:'20%'}}>
        
        
        <Menu.Item key="consultas" icon={<DashboardOutlined/>}>
            <Link to="/consultas">Consultas Eventos</Link>
        </Menu.Item>
        
    </Menu>
  )
}

export default sidebar
