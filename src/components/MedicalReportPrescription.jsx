import { useContext, useEffect, useRef, useState } from "react"
import Apis, { endpoints } from "../configs/Apis"
import MedicalReport from "../pages/MedicalReport"
import { Badge, Button, Col, Container, Form, FormLabel, Row, Table, Modal } from "react-bootstrap"

import { HiArrowCircleUp, HiArrowCircleDown, HiTrash, HiPlusCircle, HiPencil, HiOutlinePencil, HiStar, HiX, HiCheck } from "react-icons/hi";
import moment from "moment/moment"
import html2pdf from "html-to-pdf-js";
const MedicalReportPrescription = () => {

    const [categories, setCategories] = useState(null)
    const [medicines, setMedicines] = useState(null)
    const [categoryClick, setCategoryClick] = useState(false)
    const [activeCategory, setActiveCategory] = useState(null);
    const [patient, setPatient] = useState(null);
    const [patientId, setPatientId] = useState(sessionStorage.getItem("patientReport") || null)
    const [keyword, setKeyword] = useState('')
    const [suggestMedicines, setSuggestMedicines] = useState([])
    const [units, setUnits] = useState([])
    const [medicalReportHistory, setMedicalReportHistory] = useState([])
    const [selectedReport, setSelectedReport] = useState(null);
    const [showDialog, setShowDialog] = useState(false);

    const medicineFormRef = useRef({})
    const medicalReportFormRef = useRef({})
    const [medicalReport, setMedicalReport] = useState(JSON.parse(sessionStorage.getItem("medicalReport")) || {
        "symptom": "",
        "diagnose": "",
        "createdDate": moment().format('YYYY-MM-DD'),
        "patientId": null,
        "doctorId": {
            "id": 1 // add current user with role doctor
        },
        "billId": null
    })
    const [reportDetail, setReportDetail] = useState(JSON.parse(sessionStorage.getItem("medicinesInReport")) || []);

    const [currentPage, setCurrentPage] = useState(1);
    const medicinesPerPage = 4;
    const startIndex = (currentPage - 1) * medicinesPerPage;
    const endIndex = startIndex + medicinesPerPage;
    const paginate = (pageNumber) => setCurrentPage(pageNumber);
    const [index, setIndex] = useState(0)
    const [editReportDetail, setEditReportDetail] = useState(null)
    const [selectedMedicineNames, setSelectedMedicineNames] = useState(new Set());

    const onReportDetailChange = (field, value) => {
        if (reportDetail.length > 0) {
            const index = reportDetail.indexOf(editReportDetail)
            if (field === "medicineUnitId.medicineId.name")
                selectedMedicineNames.add(value)
            setReportDetail((current) => {
                const updatedReportDetail = [...current];
                const keys = field.split('.');
                let target = updatedReportDetail[index];

                // Traverse the nested structure to set the value
                for (let i = 0; i < keys.length - 1; i++) {
                    target = target[keys[i]];
                }

                target[keys[keys.length - 1]] = value;
                return updatedReportDetail;
            });
            console.info(reportDetail)
        }
    }

    const onMedicalReportChange = (field, value) => {
        const updatedMedicalReport = { ...medicalReport };
        updatedMedicalReport[field] = value;
        setMedicalReport(updatedMedicalReport);
        console.info(updatedMedicalReport)
    };


    const fetchCategory = async () => {
        try {
            const res = await Apis.get(endpoints["category"]);
            setCategories(res.data);
        } catch (ex) {
            console.error(ex);
        }
    }

    const fetchMedicine = async (category) => {
        try {
            let e = `${endpoints["medicine"]}?cateId=${category.id}`
            console.info(e)
            let res = await Apis.get(e)
            setMedicines(res.data)
        } catch (ex) {
            console.error(ex)
        }
    }

    const fetchUnits = async () => {
        try {
            let e = `${endpoints["unit"]}`
            let res = await Apis.get(e)
            setUnits(res.data)
            console.info(e)
        } catch (ex) {
            console.error(ex)
        }
    }


    const getPatientById = async () => {
        try {
            let e = endpoints["patient"]
            let res = await Apis.get(`${e}?id=${patientId}`)
            setPatient(res.data)
        } catch (ex) {
            console.error(ex)
        }

    }

    const fetchReportDetails = async (medicalReportId) => {
        try {
            let e = `${endpoints["report-detail"]}?id=${medicalReportId}`
            const response = await Apis.get(e)
            return response.data;

        } catch (error) {
            console.error("Error fetching report details:", error);
            return [];
        }
    };

    useEffect(() => {
        const fetchData = async () => {
            try {
                await fetchUnits();
                await fetchCategory();

                if (patientId !== null) {
                    await getPatientById();

                    let e = endpoints["medical-report"]
                    let res = await Apis.get(`${e}?patientId=${patientId}`)

                    const medicalReportsWithDetails = await Promise.all(
                        res.data.map(async (report) => {
                            const reportDetails = await fetchReportDetails(report.id);
                            return { ...report, reportDetails };
                        })
                    )
                    setMedicalReportHistory(medicalReportsWithDetails);
                }
            } catch (error) {
                console.error(error);
            }
        };
        fetchData();
    }, []);

    const onCategoryClick = async (c) => {
        setCategoryClick(true)
        setMedicines(null)
        fetchMedicine(c)
        setActiveCategory(c.id);
    }

    useEffect(() => {
        if (patient) {
            setMedicalReport((current) => ({
                ...current,
                patientId: patient[0],
            }));
        }
    }, [patient]);

    useEffect(() => {
        sessionStorage.setItem("medicalReport", JSON.stringify(medicalReport))
    }, [medicalReport])

    const onKeyWordChange = async (value) => {
        if (value !== null) {
            let filter = value.split('-')[0];
            setKeyword(filter);
            if (filter.trim().length > 0) {
                let e = endpoints["medicine"];
                const res = await Apis.get(`${e}?name=${filter}`);
                setSuggestMedicines(res.data);
            } else {
                setSuggestMedicines([])
            }
        }
    };

    const tableStyles = {
        position: 'absolute',
        width: '100%',
        maxHeight: '200px',
        overflowY: 'auto',
        border: '1px solid #ced4da',
        backgroundColor: '#ffffff',
        zIndex: 1,
        boxShadow: '0px 8px 16px 0px rgba(0, 0, 0, 0.2)',
    };

    const onUsageChange = (type) => {
        const index = reportDetail.indexOf(editReportDetail)
        const updatedReportDetail = [...reportDetail];
        updatedReportDetail[index].type = type;
        updatedReportDetail[index].usageInfo = `${type} Sáng: ${updatedReportDetail[index].morning || 0}, Trưa: ${updatedReportDetail[index].noon || 0}, Chiều: ${updatedReportDetail[index].afternoon || 0}, Tối: ${updatedReportDetail[index].evening || 0}`;
        setReportDetail(updatedReportDetail);
    };


    const onTimeChange = (timeOfDay, value) => {
        const index = reportDetail.indexOf(editReportDetail)
        const updatedReportDetail = [...reportDetail];
        updatedReportDetail[index][timeOfDay] = value;
        const { type, morning, noon, afternoon, evening } = updatedReportDetail[index];
        updatedReportDetail[index].usageInfo = `${type} Sáng: ${morning || 0}, Trưa: ${noon || 0}, Chiều: ${afternoon || 0}, Tối: ${evening || 0}`;
        setReportDetail(updatedReportDetail);
        console.info(reportDetail)
    };

    const formatDatePdf = (dateString) => {
        const date = new Date(dateString);
        const day = date.getDate().toString().padStart(2, "0");
        const month = (date.getMonth() + 1).toString().padStart(2, "0");
        const year = date.getFullYear();
        return `Ngày ${day} tháng ${month} năm ${year}`
    }


    const generatePDF = () => {
        const htmlContent = `
      <div style="padding: 10px 35px 0 35px;">
        <table style="width: 100%; margin: 0 auto;">
            <tr>
                <td>
                <img src="/logo512.png" alt="Logo" style="max-width: 60px">
                <strong> QUẢN LÝ PHÒNG MẠCH TƯ</strong>
                </td>
            </tr>
            <tr>
                <td colspan="3" style="text-align: center;"> <h2>ĐƠN THUỐC</h2></td>
            </tr>
            <tr>
                <td><p><strong>Họ tên:</strong> ${medicalReport.patientId.userId.name}</p></td>
                <td><p><strong>Giới tính:</strong> ${medicalReport.patientId.userId.gender === "male" ? "Nam" : "Nữ"}</p></td>
                <td><p><strong>Năm sinh:</strong> ${medicalReport.patientId.userId.birthday.substring(0, 4)}</p></td>
            </tr>

            <tr>
                <td><p><strong>Địa chỉ:</strong> ${medicalReport.patientId.userId.address}</p></td>
            </tr>

            <tr>
                <td><p><strong>Triệu chứng:</strong> ${medicalReport.symptom}</p></td>
            </tr>

            <tr>
                <td><p><strong>Chuẩn đoán:</strong> ${medicalReport.diagnose}</p></td>
            </tr>
           ${reportDetail.length > 0 && `
            <tr>
            <td><p><strong><u>Chỉ định dùng thuốc:</u></strong></p></td>
            </tr>
           `}
           
            
            <table style="width: 95%">
            ${reportDetail.map((detail, index) => `
            <tr>
                <td style="width: 50px;"><p>${index + 1}.</p></td>
                <td>
                    <p><strong>${detail.medicineUnitId.medicineId.name}</strong></p>
                    <p><i>Cách dùng: ${detail.usageInfo}</i></p>
                </td>
                <td>
                    <p>x ${detail.quantity} ${detail.medicineUnitId.unitId.name === "pill"
                ? "Viên"
                : detail.medicineUnitId.unitId.name === "bottle"
                    ? "Chai"
                    : detail.medicineUnitId.unitId.name === "jar"
                        ? "Lọ"
                        : detail.medicineUnitId.unitId.name === "tablet"
                            ? "Vỉ"
                            : "Gói"}</p>
                </td>
            </tr>
          `).join('')}
            </table>

            <div style="text-align: right; padding-right: 15px;">
                <p><i>${formatDatePdf(medicalReport.createdDate)}</i></p>
                <p style="text-align: right; margin-right: 25px;"><strong>Bác sĩ khám bệnh</strong></p>
                <p style="text-align: right; margin-right: 25px;"><strong>Bs. Khương Đẹp Trai</strong></p>
            </div>
        </table>
       
      </div>`
        html2pdf(htmlContent)
    };



    const addReportDetail = (medicine) => {
        const newReportDetail = {
            "quantity": medicineFormRef.current['quantity'].value,
            "usageInfo": medicineFormRef.current['usageInfo'].value,
            "medicineUnitId": {
                "medicineId": medicine,
                "unitId": {
                },
            },
            "type": "",
            "morning": "",
            "noon": "",
            "afternoon": "",
            "evening": "",
        }
        setReportDetail([...reportDetail, newReportDetail])
        setIndex(index + 1)
    }

    const clearMedicineInput = () => {
        for (const key in medicineFormRef.current) {
            if (medicineFormRef.current.hasOwnProperty(key)) {
                medicineFormRef.current[key].value = '';
            }
        }
        setKeyword("")
    }

    useEffect(() => {
        if (!editReportDetail && reportDetail.length > 0) {
            console.info(reportDetail)
            setEditReportDetail(reportDetail[reportDetail.length - 1])
        }
        sessionStorage.setItem("medicinesInReport", JSON.stringify(reportDetail))
    }, [reportDetail]);

    const formatDate = (dateString) => {
        const date = new Date(dateString);
        const day = date.getDate().toString().padStart(2, "0");
        const month = (date.getMonth() + 1).toString().padStart(2, "0");
        const year = date.getFullYear();
        return `${day}-${month}-${year}`
    }

    const openDialog = (report) => {
        setSelectedReport(report);
        setShowDialog(true);
    };

    const closeDialog = () => {
        setSelectedReport(null);
        setShowDialog(false);
    };

    const saveMedicalReport = async (isPrinted) => {
        try {
            const data = {
                medicalReport: medicalReport,
                reportDetail: reportDetail,
            };

            console.info(data)

            const isValidInputs = () => {
                for (const key in medicalReportFormRef.current) {
                    if (medicalReportFormRef.current.hasOwnProperty(key)) {
                        if (medicalReportFormRef.current[key].value.trim() === '') {
                            return false;
                        }
                    }
                }
                return true; 
            }

            if (!isValidInputs()) {
                alert("Vui lòng điền đầy đủ thông tin phiếu khám bệnh!!!")
                return;
            }

            const response = await Apis.post(endpoints["medical-report"], data)

            if (response.status === 201) {
                alert("Lưu phiếu khám bệnh thành công")
                setReportDetail([])
                setEditReportDetail(null)
                clearMedicineInput()
                medicalReportFormRef.current['symptom'].value = ''
                medicalReportFormRef.current['diagnose'].value = ''

                setMedicalReport({
                    ...medicalReport,
                    symptom: '',
                    diagnose: '',
                })

                if (isPrinted) {
                    generatePDF(data)
                }

            } else alert("Hệ thống lỗi.....")

        } catch (ex) {
            console.error(ex)
        }
    }
    return (
        <Container>
            <MedicalReport />
            <Row className="mt-3">
                <Col xs="5">
                    <div>
                        <p className="mx-1"><strong>Lịch sử toa thuốc</strong></p>
                        <hr></hr>
                        <div style={{ maxHeight: '20rem', overflow: 'auto' }}>
                            {medicalReportHistory.length > 0 ? (
                                <Table>
                                    <th>Mã phiếu khám</th>
                                    <th>Ngày khám</th>
                                    <th>Toa thuốc</th>
                                    <tbody>
                                        {Array.isArray(medicalReportHistory) && medicalReportHistory.map((r) => (
                                            <tr key={r.id} >
                                                <td>{r.id}</td>
                                                <td>{formatDate(r.createdDate)}</td>
                                                <td>
                                                    {r.reportDetails && r.reportDetails.length > 0 &&
                                                        <Button variant="primary" onClick={() => openDialog(r)}>Xem</Button>}
                                                </td>
                                            </tr>
                                        ))}
                                    </tbody>
                                </Table>
                            ) : <p>Loading...</p>}

                        </div>
                        <hr></hr>
                    </div>

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

                    <div>
                        <p className="mx-1"><strong> Danh sách thuốc</strong></p>
                        <hr></hr>
                        <div style={{ maxHeight: '10rem', overflowY: 'auto' }}>
                            {categoryClick === false ? (<p>Chọn thuốc...</p>) : medicines === null ? (<p>Loading...</p>)
                                : medicines.length === 0 ? (<p>Không tồn tại thuốc</p>)
                                    : medicines.sort((a, b) => { return a.name.length - b.name.length }).map((medicine) => (
                                        <Button variant="outline-success" size="sm" className="mx-1 my-1"
                                            onClick={() => {
                                                if (!selectedMedicineNames.has(medicine.name)) {
                                                    selectedMedicineNames.add(medicine.name)
                                                    clearMedicineInput()
                                                    addReportDetail((medicine))
                                                }
                                            }}
                                            key={medicine.id}>{medicine.name}</Button>
                                    ))}
                        </div>
                        <hr></hr>
                    </div>

                </Col>
                {/* {Medical report} */}
                <Col>
                    <Container style={{ border: '1px solid #d3d3d3' }}>
                        <Form>
                            <Row className="text-center">
                                <Col>
                                    <h5 className="mt-2">Đơn thuốc</h5>
                                </Col>
                            </Row>

                            <Row>
                                <Col> <h6 className="text-success">Thông tin bệnh nhân</h6></Col>
                            </Row>

                            <Row className="mt-2">
                                <Col>
                                    <p><strong>Bệnh nhân: </strong></p>
                                    <Form.Control type="text" readOnly
                                        ref={(el) => medicalReportFormRef.current['patient'] = el}
                                        placeholder="Nhập tên bệnh nhân" value={medicalReport.patientId && medicalReport.patientId.userId.name} />
                                </Col>
                                <Col>
                                    <p><strong>Ngày khám:</strong>{" "}</p>
                                    <Form.Control type="date"
                                        ref={(el) => medicalReportFormRef.current['createdDate'] = el}
                                        readOnly value={medicalReport.createdDate} />
                                </Col>

                            </Row>
                            <Row className="mt-2">
                                <Col>
                                    <p><strong>Triệu chứng:</strong></p>
                                    <Form.Control type="text"
                                        value={medicalReport.symptom}
                                        ref={(el) => medicalReportFormRef.current['symptom'] = el}
                                        onChange={(e) => onMedicalReportChange("symptom", e.target.value)}
                                        placeholder="Nhập triệu chứng" />
                                </Col>
                                <Col>
                                    <p><strong>Chuẩn đoán:</strong></p>
                                    <Form.Control type="text"
                                        value={medicalReport.diagnose}
                                        ref={(el) => medicalReportFormRef.current['diagnose'] = el}
                                        onChange={(e) => onMedicalReportChange("diagnose", e.target.value)}
                                        placeholder="Nhập chuẩn đoán" />
                                </Col>
                            </Row>
                            <Row className="mt-3">
                                <Col> <h6 className="text-success">Thông tin thuốc</h6></Col>
                            </Row>
                            <Row className="mt-2">
                                <Col md={6}>
                                    <p><strong>Chọn thuốc: </strong>{" "}</p>
                                    <Form.Control type="text" placeholder="Nhập tên thuốc"
                                        ref={(el) => medicineFormRef.current['keyword'] = el}
                                        value={keyword}
                                        onChange={(e) => {
                                            onKeyWordChange(e.target.value)
                                        }} />
                                </Col>
                                <Col>
                                    <p><strong>Đơn vị: </strong>{" "}</p>
                                    <Form.Select
                                        value={
                                            editReportDetail && editReportDetail.medicineUnitId.unitId.name ? editReportDetail.medicineUnitId.unitId.name : "Chọn đơn vị"
                                        }
                                        onChange={(e) =>
                                            editReportDetail &&
                                            onReportDetailChange("medicineUnitId.unitId", units.find((unit) => unit.name === e.target.value))
                                        }
                                        ref={(el) => medicineFormRef.current['unit'] = el}
                                    >
                                        <option disabled selected>Chọn đơn vị</option>
                                        {units.map((unit) => (
                                            <option key={unit.id} value={unit.name}>
                                                {unit.name === "pill"
                                                    ? "Viên"
                                                    : unit.name === "bottle"
                                                        ? "Chai"
                                                        : unit.name === "jar"
                                                            ? "Lọ"
                                                            : unit.name === "tablet"
                                                                ? "Vỉ"
                                                                : "Gói"}
                                            </option>
                                        ))}
                                    </Form.Select>

                                </Col>
                                <Col>
                                    <p><strong>Số lượng: </strong>{" "}</p>
                                    <Form.Control type="number" min={0} placeholder="Số lượng"
                                        value={editReportDetail && editReportDetail.quantity}
                                        ref={(el) => medicineFormRef.current['quantity'] = el}
                                        onChange={(e) => onReportDetailChange('quantity', e.target.value)}
                                    />
                                </Col>
                            </Row>
                            {suggestMedicines.length > 0 && (
                                <div style={{ position: 'relative' }}>
                                    <div style={tableStyles}>
                                        <Table hover size="sm">
                                            <thead>
                                                <tr>
                                                    <th>Mã thuốc</th>
                                                    <th>Tên thuốc</th>
                                                </tr>
                                            </thead>
                                            <tbody>
                                                {suggestMedicines.map((medicine) => (
                                                    <tr
                                                        key={medicine.id}
                                                        style={{ cursor: 'pointer' }}
                                                        onClick={() => {
                                                            if (!selectedMedicineNames.has(medicine.name)) {
                                                                selectedMedicineNames.add(medicine.name)
                                                                clearMedicineInput()
                                                                addReportDetail(medicine)

                                                                setKeyword(medicine.name)
                                                                setEditReportDetail(null)
                                                                setSuggestMedicines([])
                                                            }
                                                        }}
                                                    >
                                                        <td>{medicine.id}</td>
                                                        <td>{medicine.name}</td>
                                                    </tr>
                                                ))}
                                            </tbody>
                                        </Table>
                                    </div>
                                    <Button variant="danger"
                                        style={{
                                            position: 'absolute',
                                            bottom: '0',
                                            right: '0',
                                            zIndex: '1',
                                        }}
                                        onClick={() => {
                                            setSuggestMedicines([])
                                        }}
                                    >
                                        Close
                                    </Button>
                                </div>
                            )}
                            <Row className="mt-2">
                                <FormLabel><strong>Cách dùng:</strong></FormLabel>
                                <Col md={3}>
                                    <FormLabel>Loại</FormLabel>
                                    <Form.Select
                                        ref={(el) => medicineFormRef.current['usageInfo'] = el}
                                        onChange={(e) => editReportDetail != null && onUsageChange(e.target.value)}
                                        value={editReportDetail != null && editReportDetail.type ? editReportDetail.type : "Chọn loại"}
                                    >
                                        <option disabled selected>Chọn loại</option>
                                        <option value="Uống">Uống</option>
                                        <option value="Tiêm">Tiêm</option>
                                        <option value="Bôi">Bôi</option>
                                        <option value="Hít">Hít</option>
                                        <option value="Xịt mũi">Xịt mũi</option>
                                    </Form.Select>
                                </Col>

                                <Col>
                                    <FormLabel>Sáng</FormLabel>
                                    <Form.Control
                                        ref={(el) => medicineFormRef.current['morning'] = el}
                                        value={editReportDetail && editReportDetail.morning ? editReportDetail.morning : ""}
                                        type="number" min={0} onChange={(e) => editReportDetail && onTimeChange('morning', e.target.value)} />

                                </Col>

                                <Col>
                                    <FormLabel>Trưa</FormLabel>
                                    <Form.Control
                                        ref={(el) => medicineFormRef.current['noon'] = el}
                                        value={editReportDetail && editReportDetail.noon ? editReportDetail.noon : ""}
                                        type="number" min={0} onChange={(e) => editReportDetail && onTimeChange('noon', e.target.value)} />

                                </Col>

                                <Col>
                                    <FormLabel>Chiều</FormLabel>
                                    <Form.Control
                                        ref={(el) => medicineFormRef.current['afternoon'] = el}
                                        value={editReportDetail && editReportDetail.afternoon ? editReportDetail.afternoon : ""}
                                        type="number" min={0} onChange={(e) => editReportDetail && onTimeChange('afternoon', e.target.value)} />

                                </Col>

                                <Col>
                                    <FormLabel>Tối</FormLabel>

                                    <Form.Control
                                        ref={(el) => medicineFormRef.current['evening'] = el}
                                        value={editReportDetail && editReportDetail.evening ? editReportDetail.evening : ""}
                                        type="number" min={0} onChange={(e) => editReportDetail && onTimeChange('evening', e.target.value)} />

                                </Col>


                                <Col>
                                    <br></br>
                                    <Button className="mt-2" variant="danger"
                                        onClick={() => {
                                            clearMedicineInput()
                                            setEditReportDetail(null)
                                        }}
                                    >
                                        Clear<HiX style={{ fontSize: '20px' }} /></Button>
                                </Col>
                            </Row>
                            <hr />
                            <Row>
                                <Col> <h6 className="text-success">Chi tiết đơn thuốc</h6></Col>
                            </Row>
                            {reportDetail.slice(startIndex, endIndex).map((r, i) => (
                                <Row className="mt-2">
                                    <Col xs={1} style={{ display: "flex", alignItems: "center" }}>
                                        <p style={{ fontSize: "18px" }}>
                                            {reportDetail.indexOf(r) + 1 > 9 ? reportDetail.indexOf(r) + 1 + "." : reportDetail.indexOf(r) + 1 + "."}
                                        </p>
                                    </Col>
                                    <Col md={6}>
                                        <p>
                                            {editReportDetail === r && (<Badge pill bg="warning"><HiStar /></Badge>)}
                                            <strong> {r.medicineUnitId.medicineId.name === "" ? "Tên thuốc" : r.medicineUnitId.medicineId.name}</strong></p>
                                        <p><i>Cách dùng: {r.usageInfo}</i></p>
                                    </Col>
                                    <Col xs={1} style={{ display: "flex", alignItems: "center" }}>
                                        <p><i>x {r.quantity} <br /> {r.medicineUnitId.unitId.name === "" ? ""
                                            : r.medicineUnitId.unitId.name === "pill" ? "Viên"
                                                : r.medicineUnitId.unitId.name === "bottle" ? "Chai"
                                                    : r.medicineUnitId.unitId.name === "jar" ? "Lọ"
                                                        : r.medicineUnitId.unitId.name === "tablet" ? "Vỉ"
                                                            : r.medicineUnitId.unitId.name === "packet" ? "Gói" : ""}
                                        </i></p>
                                    </Col>
                                    <Col style={{ display: "flex", alignItems: "center" }}>
                                        <Button variant="primary" className="mx-1" size="sm"
                                            onClick={() => {
                                                const pos = reportDetail.indexOf(r)
                                                if (pos > 0) {
                                                    // Move the item up by swapping with the previous item
                                                    const updatedReportDetail = [...reportDetail];
                                                    const temp = updatedReportDetail[pos];
                                                    updatedReportDetail[pos] = updatedReportDetail[pos - 1];
                                                    updatedReportDetail[pos - 1] = temp;
                                                    setReportDetail(updatedReportDetail);
                                                    console.info(pos)
                                                    console.info(index)

                                                }
                                            }}
                                        ><HiArrowCircleUp style={{ fontSize: '24px' }} /></Button>
                                        <Button variant="success" className="mx-1" size="sm"
                                            onClick={() => {
                                                const pos = reportDetail.indexOf(r)
                                                if (pos < reportDetail.length - 1) {
                                                    // Move the item down by swapping with the next item
                                                    const updatedReportDetail = [...reportDetail];
                                                    const temp = updatedReportDetail[pos];
                                                    updatedReportDetail[pos] = updatedReportDetail[pos + 1];
                                                    updatedReportDetail[pos + 1] = temp;
                                                    setReportDetail(updatedReportDetail);
                                                }
                                            }}
                                        ><HiArrowCircleDown style={{ fontSize: '24px' }} /></Button>
                                        <Button variant="warning" className="mx-1" size="sm"
                                            onClick={() => {
                                                setEditReportDetail(r)
                                                setKeyword(r.medicineUnitId.medicineId.name)
                                                console.info(editReportDetail)
                                            }}
                                        ><HiPencil style={{ fontSize: '24px' }} /></Button>
                                        <Button variant="danger" className="mx-1" size="sm"
                                            onClick={() => {
                                                const pos = reportDetail.indexOf(r);

                                                if (pos !== -1) {
                                                    // Create a copy of the reportDetail array without the item to delete
                                                    const updatedReportDetail = [...reportDetail.slice(0, pos), ...reportDetail.slice(pos + 1)];
                                                    setReportDetail(updatedReportDetail);
                                                    selectedMedicineNames.delete(r.medicineUnitId.medicineId.name);
                                                    console.info(selectedMedicineNames);
                                                    const newCurrentPage = Math.ceil((updatedReportDetail.length) / medicinesPerPage);
                                                    setCurrentPage(newCurrentPage >= 1 ? newCurrentPage : 1);
                                                    console.info(newCurrentPage);
                                                }
                                            }}
                                        ><HiTrash style={{ fontSize: '24px' }} /></Button>
                                    </Col>
                                </Row>
                            ))}
                            {reportDetail.length > medicinesPerPage && (
                                <nav style={{ display: "flex", justifyContent: "center" }}>
                                    <ul className="pagination">
                                        {Array.from({
                                            length: Math.ceil(reportDetail.length / medicinesPerPage),
                                        }).map((_, index) => (
                                            <li key={index} className="page-item">
                                                <button type="button" onClick={(e) =>
                                                    paginate(index + 1)} className="page-link">
                                                    {index + 1}
                                                </button>
                                            </li>
                                        ))}
                                    </ul>
                                </nav>
                            )}
                        </Form>
                    </Container>

                    <Button variant="primary" className="mx-1 my-2"
                        onClick={() => saveMedicalReport(false)}
                    >Lưu</Button>
                    <Button variant="primary" className="mx-1 my-2"
                        onClick={() => saveMedicalReport(true)}
                    >Lưu và in</Button>
                </Col>
            </Row>
            <Modal show={showDialog} onHide={closeDialog}>
                <Modal.Header closeButton>
                    <Modal.Title>Thông tin đơn thuốc</Modal.Title>
                </Modal.Header>
                <Modal.Body>
                    {selectedReport && (
                        <div id="pdf-content">
                            <Container>
                                <Row>
                                    <Col md={4}>
                                        <p>
                                            <strong>Họ tên:</strong> {selectedReport.patientId.userId.name}
                                        </p>
                                    </Col>
                                    <Col md={4}>
                                        <p>
                                            <strong>Giới tính:</strong>{" "}
                                            {selectedReport.patientId.userId.gender === "male" ? "Nam" : "Nữ"}
                                        </p>
                                    </Col>
                                    <Col md={4}>
                                        <p>
                                            <strong>Năm sinh:</strong>{" "}
                                            {selectedReport.patientId.userId.birthday.substring(0, 4)}
                                        </p>
                                    </Col>
                                </Row>
                                <Row>
                                    <Col md={12}>
                                        <p>
                                            <strong>Triệu chứng:</strong> {selectedReport.symptom}
                                        </p>
                                    </Col>
                                </Row>
                                <Row>
                                    <Col md={12}>
                                        <p>
                                            <strong>Chuẩn đoán:</strong> {selectedReport.diagnose}
                                        </p>
                                    </Col>
                                </Row>
                                <Row>
                                    <Col md={12}>
                                        <p>
                                            <strong>Ngày khám:</strong>{" "}
                                            {formatDate(selectedReport.createdDate)}
                                        </p>
                                    </Col>
                                </Row>
                                <hr />
                                <h5>Chỉ định dùng thuốc:</h5>
                                {selectedReport.reportDetails.map((detail, index) => (
                                    <Row>
                                        <Col md={10}>
                                            <p>
                                                {index + 1}<strong>. {detail.medicineUnitId.medicineId.name}</strong>
                                            </p>
                                            <p><i>Cách dùng: {detail.usageInfo}
                                            </i></p>
                                        </Col>
                                        <Col>
                                            <p>
                                                {detail.quantity} {detail.medicineUnitId.unitId.name === "pill"
                                                    ? "Viên"
                                                    : detail.medicineUnitId.unitId.name === "bottle"
                                                        ? "Chai"
                                                        : detail.medicineUnitId.unitId.name === "jar"
                                                            ? "Lọ"
                                                            : detail.medicineUnitId.unitId.name === "tablet"
                                                                ? "Vỉ"
                                                                : "Gói"}
                                            </p>

                                        </Col>
                                    </Row>
                                ))}
                            </Container>
                        </div>
                    )}
                </Modal.Body>
            </Modal>
        </Container>
    );

}
export default MedicalReportPrescription