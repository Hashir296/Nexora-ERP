import { useEffect, useState } from 'react';
import CrudModule from '../components/CrudModule';
import { PageHeader, StatusBadge } from '../components/ui';
import api from '../services/api';
import toast from 'react-hot-toast';

export default function ProjectsPage() {
  const [tab, setTab] = useState('projects');
  const [projects, setProjects] = useState([]);
  const [board, setBoard] = useState([]);
  const [projectId, setProjectId] = useState('');

  useEffect(() => {
    api.get('/projects/projects').then((res) => {
      const items = res.data.data.items || [];
      setProjects(items);
      if (items[0]) setProjectId(items[0]._id);
    });
  }, []);

  useEffect(() => {
    if (!projectId) return;
    api.get(`/projects/board/${projectId}`).then((res) => setBoard(res.data.data.columns || []));
  }, [projectId]);

  const breakdown = async (taskId) => {
    await api.post(`/projects/tasks/${taskId}/ai-breakdown`);
    toast.success('AI breakdown added');
    const res = await api.get(`/projects/board/${projectId}`);
    setBoard(res.data.data.columns || []);
  };

  return (
    <div>
      <PageHeader title="Projects" subtitle="Kanban, scrum sprints, tasks, comments, and time tracking." />
      <div className="tabs">
        {['board', 'projects', 'tasks', 'sprints'].map((t) => (
          <button key={t} className={`tab${tab === t ? ' active' : ''}`} onClick={() => setTab(t)}>{t}</button>
        ))}
      </div>
      {tab === 'board' && (
        <div>
          <label style={{ maxWidth: 280, marginBottom: '0.75rem' }}>
            Project
            <select value={projectId} onChange={(e) => setProjectId(e.target.value)}>
              {projects.map((p) => <option key={p._id} value={p._id}>{p.name}</option>)}
            </select>
          </label>
          <div className="kanban">
            {board.map((col) => (
              <div className="kanban-col" key={col.status}>
                <h4>{col.status}</h4>
                {col.tasks.map((t) => (
                  <div className="task-card" key={t._id}>
                    <strong>{t.title}</strong>
                    <div style={{ marginTop: 6 }}><StatusBadge value={t.priority} /></div>
                    {t.aiBreakdown?.length ? <small>{t.aiBreakdown[0]}…</small> : (
                      <button className="btn btn-ghost btn-sm" style={{ marginTop: 8 }} onClick={() => breakdown(t._id)}>AI breakdown</button>
                    )}
                  </div>
                ))}
              </div>
            ))}
          </div>
        </div>
      )}
      {tab === 'projects' && (
        <CrudModule
          hideHeader
          title="Projects"
          endpoint="/projects/projects"
          columns={['Name', 'Method', 'Status']}
          fields={[
            { name: 'name', label: 'Name', required: true },
            { name: 'method', label: 'Method', type: 'select', defaultValue: 'kanban', options: [
              { value: 'kanban', label: 'Kanban' },
              { value: 'scrum', label: 'Scrum' },
            ]},
            { name: 'description', label: 'Description', type: 'textarea' },
          ]}
          mapRow={(i) => [i.name, i.method, <StatusBadge value={i.status} />]}
        />
      )}
      {tab === 'tasks' && (
        <CrudModule
          hideHeader
          title="Tasks"
          endpoint="/projects/tasks"
          columns={['Title', 'Status', 'Priority']}
          fields={[
            { name: 'project', label: 'Project ID', required: true },
            { name: 'title', label: 'Title', required: true },
            { name: 'status', label: 'Status', type: 'select', defaultValue: 'todo', options: [
              { value: 'backlog', label: 'Backlog' },
              { value: 'todo', label: 'Todo' },
              { value: 'in-progress', label: 'In progress' },
              { value: 'review', label: 'Review' },
              { value: 'done', label: 'Done' },
            ]},
            { name: 'priority', label: 'Priority', type: 'select', defaultValue: 'medium', options: [
              { value: 'low', label: 'Low' },
              { value: 'medium', label: 'Medium' },
              { value: 'high', label: 'High' },
              { value: 'urgent', label: 'Urgent' },
            ]},
          ]}
          mapRow={(i) => [i.title, <StatusBadge value={i.status} />, i.priority]}
        />
      )}
      {tab === 'sprints' && (
        <CrudModule
          hideHeader
          title="Sprints"
          endpoint="/projects/sprints"
          columns={['Name', 'Status']}
          fields={[
            { name: 'project', label: 'Project ID', required: true },
            { name: 'name', label: 'Name', required: true },
            { name: 'goal', label: 'Goal' },
          ]}
          mapRow={(i) => [i.name, <StatusBadge value={i.status} />]}
        />
      )}
    </div>
  );
}
