import axios from "axios";
import React, { useEffect, useState } from "react";
import { Container, Table } from "react-bootstrap";

const PatientList = () => {
  const [scheduleDetail, setScheduleDetail] = useState([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    const fetchScheduleDetail = async () => {
      setLoading(true);
      try {
        const res = await axios.get(
          `http://localhost:8080/Clinic/api/scheduledetails`
        );
        setScheduleDetail(res.data);
        setLoading(false);
        console.info(res.data)
      } catch (error) {
        console.error("Error fetching data", error);
        setLoading(false); // Set loading to false in case of an error
      }
    };
    fetchScheduleDetail();
  }, []);

  return (
    <Container>
      <h3>Danh sách bệnh nhân khám bệnh</h3>
      {loading ? (
        <p>Loading...</p>
      ) : (
        <Table striped hover className="my-5">
         <thead>
          <tr>
            <th>Số thứ tự</th>
            <th>Họ tên</th>
            <th>Ngày sinh</th>
            <th>Lý do khám</th>
            <th>Thời gian khám</th>
            <th>Bác sĩ khám</th>
            <th>Đã xác nhận</th>
          </tr>
        </thead>
        <tbody>
          {scheduleDetail.map((s) => (
            <tr>
              <td>{s.id}</td>
              <td>{s.name}</td>
              <td>{s.patientId.userId.birthday}</td>
              <td>{s.reason}</td>
              <td>
                {s.hourId.hour} {s.date}
              </td>
              <td>{s.doctorId.userId.name}</td>
              <td>{s.isConfirm}</td>
            </tr>
          ))}
        </tbody>
        </Table>
      )}
    </Container>
  );
};

export default PatientList;
