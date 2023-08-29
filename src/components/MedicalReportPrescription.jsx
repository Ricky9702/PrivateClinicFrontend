import { useEffect, useState } from "react"
import Apis, { endpoints } from "../configs/Apis"
import MedicalReport from "../pages/MedicalReport"
import { Button, Col, Container, Form, Row, Table } from "react-bootstrap"

const MedicalReportPrescription = () => {
    const [categories, setCategories] = useState(null)
    const [medicines, setMedicines] = useState(null)
    const [categoryClick, setCategoryClick] = useState(false)
    const [activeCategory, setActiveCategory] = useState(null);
    const [patient, setPatient] = useState(null);
    const [patientId, setPatientId] = useState(sessionStorage.getItem("patientReport") || null)

    const fetchCategory = async () => {
        try {
            const res = await Apis.get(endpoints["category"]);
            setCategories(res.data);
        } catch (ex) {
            console.error(ex);
        }
    }

    const fetchMedicine = async (category) => {
        let e = `${endpoints["medicine"]}?cateId=${category.id}`
        console.info(e)
        let res = await Apis.get(e)
        setMedicines(res.data)
    }

    const getPatientById = async () => {
        let e = endpoints["patient"]
        let res = await Apis.get(`${e}?id=${patientId}`)
        setPatient(res.data)
        console.info(patient)
    }

    useEffect(() => {
        fetchCategory()
        getPatientById()
    }, [])


    const onCategoryClick = async (c) => {
        setCategoryClick(true)
        setMedicines(null)
        fetchMedicine(c)
        setActiveCategory(c.id);
    }



    return (
        <Container>
            <MedicalReport />

            <Row className="mt-3">

                
                <Col xs="6">
                    <div>
                        <p className="mx-1"><strong> Danh sách nhóm thuốc</strong></p>
                        <hr></hr>
                        <div style={{ maxHeight: '20rem', overflow: 'auto' }}>
                            {categories === null ? (<p>loading...</p>)
                                : categories.sort((a, b) => { return a.name.length - b.name.length }).map((c) => (
                                    <Button variant={activeCategory === c.id ? "success" : "outline-success"}
                                        size="sm" className="mx-1 my-1"
                                        onClick={() => onCategoryClick(c)} key={c.id}>{c.name}</Button>
                                ))}
                        </div>
                        <hr></hr>
                    </div>
                </Col>
                <Col xl={6} style={{border: '1px solid #d3d3d3'}}>
    <Form>
        <Row>
            <Col></Col>
            <Col> <h5 className="mt-2">Đơn thuốc</h5></Col>
            <Col></Col>
        </Row>
        <Row>
            <Col md={12}>
                <p><strong>Bệnh nhân: </strong></p>
                <Form.Control type="text" placeholder="Nhập tên bệnh nhân" />
            </Col>

            {/* <Col md={4}><p><strong>Họ tên: {patient === null ? "Loading..." : patient.length === 0 ? "Không tồn tại" : patient[0].userId.name}</strong></p></Col>
            <Col md={4}><p><strong>Giới tính: {patient === null ? "Loading..." : patient.length === 0 ? "Không tồn tại" : patient[0].userId.gender}</strong>{" "}</p></Col>
            <Col md={4}><p><strong>Năm sinh: {patient === null ? "Loading..." : patient.length === 0 ? "Không tồn tại" : patient[0].userId.birthday}</strong>{" "}</p></Col> */}
        </Row>
        <Row className="mt-2">
            <Col md={12}>
                <p><strong>Triệu chứng:</strong></p>
                <Form.Control type="text" placeholder="Nhập triệu chứng" />
            </Col>
        </Row>
        <Row className="mt-2">
            <Col md={12}>
                <p><strong>Chuẩn đoán:</strong></p>
                <Form.Control type="text" placeholder="Nhập chuẩn đoán" />
            </Col>
        </Row>
        <Row className="mt-2">
            <Col md={12}>
                <p><strong>Ngày khám:</strong>{" "}</p>
                <Form.Control type="date" />
            </Col>
        </Row>
        <hr />
    </Form>
</Col>

            </Row>

            <Row className="mt-1">
            <Col xs="5">
                    <div>
                        <p className="mx-1"><strong> Danh sách thuốc</strong></p>
                        <hr></hr>
                        <div style={{ maxHeight: '10rem', overflowY: 'auto' }}>
                            {categoryClick === false ? (<p>Chọn thuốc...</p>) : medicines === null ? (<p>Loading...</p>)
                                : medicines.length === 0 ? (<p>Không tồn tại thuốc</p>)
                                    : medicines.sort((a, b) => { return a.name.length - b.name.length }).map((c) => (
                                        <Button variant="outline-success" size="sm" className="mx-1 my-1"
                                            okey={c.id}>{c.name}</Button>
                                    ))}
                        </div>
                        <hr></hr>
                    </div>
                </Col>
            </Row>
        </Container>
    );

}
export default MedicalReportPrescription