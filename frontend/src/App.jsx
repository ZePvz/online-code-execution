import {BrowserRouter , Routes , Route} from 'react-router-dom';
import Workspace from  './pages/Workspace';
import Login from './pages/Login';
import Signup from './pages/Signup';
import { AuthProvider } from './utils/AuthContext';
import ProtectedRoute from './components/ProtectedRoute';

function App(){
  return(
    <AuthProvider>
      <BrowserRouter>
      <Routes>
        <Route path = "/login" element={<Login/>}/>
        <Route path = "signup" element={<Signup/>}/>
        <Route element={ProtectedRoute}>
          <Route path = "/" element={<Workspace/>}/>
        </Route>
        
      </Routes>
      </BrowserRouter>
    </AuthProvider>
  ) 
}

export default App;

