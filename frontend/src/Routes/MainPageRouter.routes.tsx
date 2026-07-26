import { Routes,Route } from "react-router-dom";
import MainPage from "../Pages/MainPage";


function MainPageRouter() {

    return(
        <>
        <Routes>
            <Route path="/DashBoard" element={<MainPage />} />
        </Routes>
        </>
    );
}

export default MainPageRouter;