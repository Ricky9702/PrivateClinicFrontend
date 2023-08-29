import { BrowserRouter, Route, Routes } from "react-router-dom";
import Home from "./pages/Home";
import Login from "./pages/Login";
import Register from "./pages/Register";
import Header from "./components/Header";
import Footer from "./components/Footer";
import MedicalRegister from "./pages/MedicalRegister.jsx";
import Department from "./pages/Department";
import PatientList from "./pages/PatientList";
import MedicalReport from "./pages/MedicalReport";
import MedicalReportPatient from "./components/MedicalReportPatient";
import MedicalReportPatientReportHistory from "./components/MedicalReportPatientReportHistory";
import MedicalReportPrescription from "./components/MedicalReportPrescription";

function App() {
  return (
    <>
      <BrowserRouter>
        <Header />
        <Routes>
          <Route path="/" element={<Home />} />
          <Route path="/medicalregister" element={<MedicalRegister />} />
          <Route path="/department" element={<Department />} />
          <Route path="/login" element={<Login />} />
          <Route path="/medical-report/*" element={<MedicalReport />} />
          <Route path="/medical-report/patient-list/" element={<MedicalReportPatient />} />
          <Route path="/medical-report/patient-report-list/" element={<MedicalReportPatientReportHistory />} />
          <Route path="/medical-report/prescription/" element={<MedicalReportPrescription />} />
          <Route path="/register" element={<Register />} />
          <Route path="/patientlist" element={<PatientList />} />
        </Routes>
        <Footer />
      </BrowserRouter>
    </>
  );
}

export default App;
