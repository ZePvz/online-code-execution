import { Routes ,Route} from "react-router-dom";
import Login from "../Pages/Login";
import SignUp from "../Pages/SignUp";
function AuthRouter() {
    return(
        <>
        <Routes>
            <Route path="/login" element={<Login />} />
            <Route path="/signup" element={<SignUp />}/>
        </Routes>
        </>
    )
}

export default AuthRouter;