import axios from "axios";

const SERVER = "http://localhost:8080";
const SERVER_CONTEXT = `${SERVER}/Clinic`

export const endpoints = {
  departments: `${SERVER_CONTEXT}/api/departments/`,
  doctors: `${SERVER_CONTEXT}/api/doctors/`,
  scheduleDetail: `${SERVER_CONTEXT}/api/scheduledetail/`,
  "patient": `${SERVER_CONTEXT}/api/patients/`,
  "report-detail": `${SERVER_CONTEXT}/api/report-details/`,
  "medical-report": `${SERVER_CONTEXT}/api/medical-report/`,
  "category":  `${SERVER_CONTEXT}/api/categories/`,
  "medicine": `${SERVER_CONTEXT}/api/medicines/`,
  "unit" : `${SERVER_CONTEXT}/api/units/`
};

export default axios.create({
  baseURL: SERVER,
});
