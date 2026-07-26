import MainPageRouter from "./MainPageRouter.routes";
import Authenticated from "../utils/Authenticated";
import { Route, Routes, Navigate } from "react-router-dom";
import AuthRouter from "./Auth.routes";

function AppRouter(){
    return(
        <Routes>
            <Route path="/Auth/*" element={<AuthRouter />} />
            <Route path="/MainPage/*" element={<Authenticated Child={<MainPageRouter/>}/>} />
            <Route path="/" element={<Navigate to="/Auth/Login" replace />} />  {/* ← add this */}
            <Route path="*" element={<Navigate to="/Auth/Login" replace />} />  {/* ← and this */}
        </Routes>
    )
}

export default AppRouter;