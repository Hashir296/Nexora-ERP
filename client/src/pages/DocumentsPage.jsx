import { useState } from 'react';
import CrudModule from '../components/CrudModule';
import { PageHeader, StatusBadge } from '../components/ui';
import api from '../services/api';
import toast from 'react-hot-toast';

export default function DocumentsPage() {
  const [file, setFile] = useState(null);
  const [title, setTitle] = useState('');

  const upload = async (e) => {
    e.preventDefault();
    if (!file) return toast.error('Choose a file');
    const form = new FormData();
    form.append('file', file);
    form.append('title', title || file.name);
    form.append('ocrText', title);
    try {
      await api.post('/platform/documents/upload', form, {
        headers: { 'Content-Type': 'multipart/form-data' },
      });
      toast.success('Uploaded');
      setFile(null);
      setTitle('');
    } catch (err) {
      toast.error(err.response?.data?.message || 'Upload failed');
    }
  };

  return (
    <div>
      <PageHeader title="Documents" subtitle="Upload, folders, versions, OCR text search, approvals, signatures." />
      <div className="card" style={{ marginBottom: '1rem' }}>
        <h3>Upload</h3>
        <form className="form" onSubmit={upload}>
          <div className="form-row">
            <label>Title<input value={title} onChange={(e) => setTitle(e.target.value)} /></label>
            <label>File<input type="file" onChange={(e) => setFile(e.target.files?.[0] || null)} /></label>
          </div>
          <button className="btn" type="submit">Upload document</button>
        </form>
      </div>
      <CrudModule
        title="Documents"
        endpoint="/platform/documents"
        columns={['Title', 'Size', 'Approval']}
        fields={[
          { name: 'title', label: 'Title', required: true },
          { name: 'ocrText', label: 'OCR / searchable text', type: 'textarea' },
        ]}
        mapRow={(i) => [i.title, i.size || '-', <StatusBadge value={i.approval?.status || 'none'} />]}
      />
    </div>
  );
}
