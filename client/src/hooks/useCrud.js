import { useEffect, useState } from 'react';
import api from '../services/api';
import toast from 'react-hot-toast';

export function useCrud(endpoint, params = {}) {
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(true);
  const [total, setTotal] = useState(0);

  const load = async () => {
    setLoading(true);
    try {
      const { data } = await api.get(endpoint, { params });
      setItems(data.data.items || []);
      setTotal(data.data.total || 0);
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to load');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [endpoint, JSON.stringify(params)]);

  const create = async (payload) => {
    const { data } = await api.post(endpoint, payload);
    toast.success('Created');
    await load();
    return data.data.item;
  };

  const update = async (id, payload) => {
    const { data } = await api.put(`${endpoint}/${id}`, payload);
    toast.success('Updated');
    await load();
    return data.data.item;
  };

  const remove = async (id) => {
    await api.delete(`${endpoint}/${id}`);
    toast.success('Deleted');
    await load();
  };

  return { items, loading, total, reload: load, create, update, remove };
}
