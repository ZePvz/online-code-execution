import { Navigate } from 'react-router-dom'
import { useAuth } from './AuthContext';


function Authenticated({ Child } : {Child: React.ReactElement} ) {
    
    const context = useAuth();

    return context.user? Child : <Navigate to="/Auth/login" />;
}



export default Authenticated;