import { BrowserRouter } from "react-router-dom";
import { ToastContainer } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";
import AppRoutes from "./app/AppRoutes";

function App() {
  return (
    <BrowserRouter>
      <AppRoutes />
      <ToastContainer position="top-right" autoClose={5000} />
    </BrowserRouter>
  );
}

export default App;
