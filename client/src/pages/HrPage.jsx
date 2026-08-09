import { useState } from 'react';
import CrudModule from '../components/CrudModule';
import { PageHeader, StatusBadge } from '../components/ui';
import api from '../services/api';
import toast from 'react-hot-toast';
import { useSelector } from 'react-redux';

export default function HrPage() {
  const [tab, setTab] = useState('employees');
  const { user } = useSelector((s) => s.auth);

  const checkIn = async () => {
    try {
      await api.post('/hr/attendance/check-in', { employeeId: user.employee, method: 'manual' });
      toast.success('Checked in');
    } catch (err) {
      toast.error(err.response?.data?.message || 'Check-in failed');
    }
  };
  const checkOut = async () => {
    try {
      await api.post('/hr/attendance/check-out', { employeeId: user.employee });
      toast.success('Checked out');
    } catch (err) {
      toast.error(err.response?.data?.message || 'Check-out failed');
    }
  };

  return (
    <div>
      <PageHeader
        title="Human Resources"
        subtitle="Employees, attendance, leave, shifts, and payroll."
        actions={
          <>
            <button className="btn btn-ghost" onClick={checkIn}>Face/Manual Check-in</button>
            <button className="btn" onClick={checkOut}>Check-out</button>
          </>
        }
      />
      <div className="tabs">
        {['employees', 'attendance', 'leaves', 'shifts', 'payroll'].map((t) => (
          <button key={t} className={`tab${tab === t ? ' active' : ''}`} onClick={() => setTab(t)}>{t}</button>
        ))}
      </div>

      {tab === 'employees' && (
        <CrudModule
          hideHeader
          title="Employees"
          endpoint="/hr/employees"
          columns={['Code', 'Name', 'Email', 'Status', 'Basic']}
          fields={[
            { name: 'employeeCode', label: 'Code', required: true },
            { name: 'firstName', label: 'First name', required: true },
            { name: 'lastName', label: 'Last name', required: true },
            { name: 'email', label: 'Email', required: true },
            { name: 'status', label: 'Status', type: 'select', options: [
              { value: 'active', label: 'Active' },
              { value: 'probation', label: 'Probation' },
              { value: 'on-leave', label: 'On leave' },
              { value: 'terminated', label: 'Terminated' },
            ], defaultValue: 'active' },
          ]}
          mapRow={(i) => [i.employeeCode, `${i.firstName} ${i.lastName}`, i.email, <StatusBadge value={i.status} />, i.salary?.basic || 0]}
        />
      )}
      {tab === 'attendance' && (
        <CrudModule
          hideHeader
          title="Attendance"
          endpoint="/hr/attendance"
          columns={['Employee', 'Date', 'Method', 'Status']}
          fields={[
            { name: 'employee', label: 'Employee ID', required: true },
            { name: 'date', label: 'Date', type: 'date', required: true },
            { name: 'method', label: 'Method', type: 'select', defaultValue: 'manual', options: [
              { value: 'manual', label: 'Manual' },
              { value: 'face', label: 'Face' },
              { value: 'qr', label: 'QR' },
              { value: 'gps', label: 'GPS' },
              { value: 'wifi', label: 'WiFi' },
            ]},
            { name: 'status', label: 'Status', type: 'select', defaultValue: 'present', options: [
              { value: 'present', label: 'Present' },
              { value: 'late', label: 'Late' },
              { value: 'absent', label: 'Absent' },
              { value: 'half-day', label: 'Half day' },
            ]},
          ]}
          mapRow={(i) => [
            i.employee?.firstName ? `${i.employee.firstName} ${i.employee.lastName}` : i.employee,
            i.date ? new Date(i.date).toLocaleDateString() : '-',
            i.method,
            <StatusBadge value={i.status} />,
          ]}
        />
      )}
      {tab === 'leaves' && (
        <CrudModule
          hideHeader
          title="Leave"
          endpoint="/hr/leaves"
          columns={['Employee', 'Type', 'Days', 'Status']}
          fields={[
            { name: 'employee', label: 'Employee ID', required: true },
            { name: 'type', label: 'Type', type: 'select', defaultValue: 'annual', options: [
              { value: 'annual', label: 'Annual' },
              { value: 'sick', label: 'Sick' },
              { value: 'casual', label: 'Casual' },
              { value: 'unpaid', label: 'Unpaid' },
            ]},
            { name: 'from', label: 'From', type: 'date', required: true },
            { name: 'to', label: 'To', type: 'date', required: true },
            { name: 'days', label: 'Days', type: 'number', required: true },
            { name: 'reason', label: 'Reason', type: 'textarea' },
          ]}
          mapRow={(i) => [
            i.employee?.firstName ? `${i.employee.firstName} ${i.employee.lastName}` : i.employee,
            i.type,
            i.days,
            <StatusBadge value={i.status} />,
          ]}
        />
      )}
      {tab === 'shifts' && (
        <CrudModule
          hideHeader
          title="Shifts"
          endpoint="/hr/shifts"
          columns={['Name', 'Start', 'End']}
          fields={[
            { name: 'name', label: 'Name', required: true },
            { name: 'startTime', label: 'Start', required: true, defaultValue: '09:00' },
            { name: 'endTime', label: 'End', required: true, defaultValue: '18:00' },
          ]}
          mapRow={(i) => [i.name, i.startTime, i.endTime]}
        />
      )}
      {tab === 'payroll' && (
        <CrudModule
          hideHeader
          title="Payroll"
          endpoint="/hr/payroll"
          columns={['Employee', 'Period', 'Net', 'Status']}
          fields={[
            { name: 'employee', label: 'Employee ID', required: true },
            { name: 'month', label: 'Month', type: 'number', required: true },
            { name: 'year', label: 'Year', type: 'number', required: true },
            { name: 'basic', label: 'Basic', type: 'number' },
            { name: 'netPay', label: 'Net pay', type: 'number' },
            { name: 'status', label: 'Status', type: 'select', defaultValue: 'draft', options: [
              { value: 'draft', label: 'Draft' },
              { value: 'processed', label: 'Processed' },
              { value: 'paid', label: 'Paid' },
            ]},
          ]}
          mapRow={(i) => [
            i.employee?.firstName ? `${i.employee.firstName} ${i.employee.lastName}` : i.employee,
            `${i.month}/${i.year}`,
            i.netPay,
            <StatusBadge value={i.status} />,
          ]}
        />
      )}
    </div>
  );
}
