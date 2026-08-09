import { useEffect, useState } from 'react';
import CrudModule from '../components/CrudModule';
import api from '../services/api';
import { PageHeader, StatusBadge } from '../components/ui';

export default function OrganizationPage() {
  const [tab, setTab] = useState('departments');
  const [chart, setChart] = useState(null);

  useEffect(() => {
    api.get('/organization/chart').then((res) => setChart(res.data.data));
  }, []);

  return (
    <div>
      <PageHeader title="Organization" subtitle="Companies, branches, departments, teams, and hierarchy." />
      <div className="tabs">
        {['departments', 'designations', 'teams', 'branches', 'chart'].map((t) => (
          <button key={t} className={`tab${tab === t ? ' active' : ''}`} onClick={() => setTab(t)}>{t}</button>
        ))}
      </div>

      {tab === 'departments' && (
        <CrudModule
          hideHeader
          title="Departments"
          endpoint="/organization/departments"
          columns={['Name', 'Code', 'Status']}
          fields={[
            { name: 'name', label: 'Name', required: true },
            { name: 'code', label: 'Code' },
          ]}
          mapRow={(i) => [i.name, i.code, <StatusBadge key="s" value={i.isActive ? 'active' : 'inactive'} />]}
        />
      )}
      {tab === 'designations' && (
        <CrudModule
          hideHeader
          title="Designations"
          endpoint="/organization/designations"
          columns={['Title', 'Level']}
          fields={[
            { name: 'title', label: 'Title', required: true },
            { name: 'level', label: 'Level', type: 'number', defaultValue: 1 },
          ]}
          mapRow={(i) => [i.title, i.level]}
        />
      )}
      {tab === 'teams' && (
        <CrudModule
          hideHeader
          title="Teams"
          endpoint="/organization/teams"
          columns={['Name', 'Members']}
          fields={[{ name: 'name', label: 'Name', required: true }]}
          mapRow={(i) => [i.name, i.members?.length || 0]}
        />
      )}
      {tab === 'branches' && (
        <CrudModule
          hideHeader
          title="Branches"
          endpoint="/organization/branches"
          columns={['Name', 'Code']}
          fields={[
            { name: 'name', label: 'Name', required: true },
            { name: 'code', label: 'Code' },
          ]}
          mapRow={(i) => [i.name, i.code]}
        />
      )}
      {tab === 'chart' && (
        <div className="card">
          <h3>Employee hierarchy</h3>
          <table>
            <thead><tr><th>Employee</th><th>Code</th><th>Department</th><th>Designation</th><th>Manager</th></tr></thead>
            <tbody>
              {(chart?.hierarchy || []).map((e) => (
                <tr key={e._id}>
                  <td>{e.firstName} {e.lastName}</td>
                  <td>{e.employeeCode}</td>
                  <td>{e.department?.name || '-'}</td>
                  <td>{e.designation?.title || '-'}</td>
                  <td>{e.manager ? `${e.manager.firstName} ${e.manager.lastName}` : '-'}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
