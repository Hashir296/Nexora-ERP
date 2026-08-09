import { useState } from 'react';
import CrudModule from '../components/CrudModule';
import { PageHeader, StatusBadge } from '../components/ui';
import api from '../services/api';
import toast from 'react-hot-toast';

export default function RecruitmentPage() {
  const [tab, setTab] = useState('jobs');

  const screen = async (id) => {
    try {
      await api.post(`/recruitment/candidates/${id}/screen`);
      toast.success('AI screening done');
    } catch (err) {
      toast.error(err.response?.data?.message || 'Screening failed');
    }
  };

  return (
    <div>
      <PageHeader title="Recruitment" subtitle="Careers jobs, resume screening, interviews, and offers." />
      <div className="tabs">
        {['jobs', 'candidates'].map((t) => (
          <button key={t} className={`tab${tab === t ? ' active' : ''}`} onClick={() => setTab(t)}>{t}</button>
        ))}
      </div>
      {tab === 'jobs' && (
        <CrudModule
          hideHeader
          title="Job postings"
          endpoint="/recruitment/jobs"
          columns={['Title', 'Location', 'Status']}
          fields={[
            { name: 'title', label: 'Title', required: true },
            { name: 'location', label: 'Location' },
            { name: 'description', label: 'Description', type: 'textarea' },
            { name: 'status', label: 'Status', type: 'select', defaultValue: 'open', options: [
              { value: 'draft', label: 'Draft' },
              { value: 'open', label: 'Open' },
              { value: 'closed', label: 'Closed' },
            ]},
          ]}
          mapRow={(i) => [i.title, i.location, <StatusBadge value={i.status} />]}
        />
      )}
      {tab === 'candidates' && (
        <CrudModule
          hideHeader
          title="Candidates"
          endpoint="/recruitment/candidates"
          columns={['Name', 'Email', 'Stage', 'AI Score', 'Screen']}
          fields={[
            { name: 'job', label: 'Job ID', required: true },
            { name: 'name', label: 'Name', required: true },
            { name: 'email', label: 'Email', required: true },
            { name: 'resumeText', label: 'Resume text', type: 'textarea' },
          ]}
          mapRow={(i) => [
            i.name,
            i.email,
            <StatusBadge value={i.stage} />,
            i.aiScore,
            <button key="s" className="btn btn-ghost btn-sm" onClick={() => screen(i._id)}>AI Screen</button>,
          ]}
        />
      )}
    </div>
  );
}
