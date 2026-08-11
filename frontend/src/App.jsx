import {BrowserRouter , Routes , Route} from 'react-router-dom';
import Workspace from  './pages/Workspace';
import Login from './pages/login';
import Signup from './pages/Signup';


function App(){
  return(
    <BrowserRouter>
    <Routes>
      <Route path = "/" element={<Workspace/>}/>
      <Route path = "/login" element={<Login/>}/>
      <Route path = "signup" element={<Signup/>}/>
    </Routes>
    </BrowserRouter>
  )
}

export default App;