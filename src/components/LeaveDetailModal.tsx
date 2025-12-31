import React, { useState } from 'react';
import { TeamRegistration, ApprovalStatus, updateRegistrationStatus } from '../services/dataverseService';
import { useMsal } from '@azure/msal-react';
import { getAccessToken } from '../services/dataverseService';

interface LeaveDetailModalProps {
    registration: TeamRegistration;
    onClose: () => void;
    onUpdateSuccess: () => void;
}

export const LeaveDetailModal: React.FC<LeaveDetailModalProps> = ({ registration, onClose, onUpdateSuccess }) => {
    const { instance, accounts } = useMsal();
    const [processing, setProcessing] = useState(false);

    // Mock or check current user? 
    // Ideally we check if current user is manager, but for now we just allow action.

    const handleAction = async (status: ApprovalStatus) => {
        if (!accounts[0]) return;
        setProcessing(true);
        try {
            const token = await getAccessToken(instance, accounts[0]);
            const success = await updateRegistrationStatus(token, registration.crdfd_phieuangkyid, status);

            if (success) {
                onUpdateSuccess();
                onClose();
            } else {
                alert("Có lỗi xảy ra khi cập nhật!");
            }
        } catch (e) {
            console.error(e);
            alert("Lỗi kết nối!");
        } finally {
            setProcessing(false);
        }
    };

    return (
        <div className="modal-overlay">
            <div className="modal-content">
                <div className="modal-header">
                    <h2>Chi tiết phiếu đăng ký</h2>
                    <button className="close-btn" onClick={onClose}>&times;</button>
                </div>

                <div className="modal-body">
                    <div className="detail-row">
                        <label>Nhân viên:</label>
                        <div className="value font-medium">{registration.employeeName}</div>
                    </div>
                    <div className="detail-row">
                        <label>Mã NV:</label>
                        <div className="value">{registration.employeeCode || 'N/A'}</div>
                    </div>
                    <div className="detail-row">
                        <label>Loại:</label>
                        <div className="value">{getTypeName(registration.crdfd_loaiangky)}</div>
                    </div>
                    <div className="detail-row">
                        <label>Thời gian:</label>
                        <div className="value">
                            {formatDate(registration.crdfd_tungay)}
                            {registration.crdfd_tungay !== registration.crdfd_enngay && ` - ${formatDate(registration.crdfd_enngay)}`}
                            {registration.crdfd_sogio2 ? ` (${registration.crdfd_sogio2} giờ)` : ''}
                        </div>
                    </div>
                    <div className="detail-row">
                        <label>Lý do:</label>
                        <div className="value">{registration.crdfd_diengiai || 'Không có'}</div>
                    </div>
                    <div className="detail-row">
                        <label>Trạng thái:</label>
                        <div className="value">
                            <span className={`status-badge ${getStatusClass(registration.crdfd_captrenduyet)}`}>
                                {getStatusText(registration.crdfd_captrenduyet)}
                            </span>
                        </div>
                    </div>
                </div>

                <div className="modal-footer">
                    {registration.crdfd_captrenduyet === ApprovalStatus.ChuaDuyet ? (
                        <>
                            <button
                                className="btn btn-reject"
                                onClick={() => handleAction(ApprovalStatus.TuChoi)}
                                disabled={processing}
                            >
                                {processing ? '...' : 'Từ chối'}
                            </button>
                            <button
                                className="btn btn-approve"
                                onClick={() => handleAction(ApprovalStatus.DaDuyet)}
                                disabled={processing}
                            >
                                {processing ? '...' : 'Duyệt'}
                            </button>
                        </>
                    ) : (
                        <div className="text-muted italic">Phiếu đã được xử lý</div>
                    )}
                </div>
            </div>
        </div>
    );
};

// Duplicated helpers - typically move to utils
function getTypeName(type: number): string {
    switch (type) {
        case 191920000: return "Nghỉ phép";
        case 191920001: return "Làm ở nhà";
        case 191920002: return "Tăng ca";
        case 191920003: return "Công tác";
        case 191920004: return "Đi trễ/Về sớm";
        case 283640001: return "Nghỉ không lương";
        default: return "Khác";
    }
}

function getStatusText(status?: number): string {
    switch (status) {
        case ApprovalStatus.ChuaDuyet: return "Chờ duyệt";
        case ApprovalStatus.DaDuyet: return "Đã duyệt";
        case ApprovalStatus.TuChoi: return "Từ chối";
        default: return "Chờ duyệt";
    }
}

function getStatusClass(status?: number): string {
    switch (status) {
        case ApprovalStatus.ChuaDuyet: return "status-pending";
        case ApprovalStatus.DaDuyet: return "status-approved";
        case ApprovalStatus.TuChoi: return "status-rejected";
        default: return "status-pending";
    }
}

function formatDate(dateStr: string): string {
    if (!dateStr) return '';
    return new Date(dateStr).toLocaleDateString('vi-VN');
}
