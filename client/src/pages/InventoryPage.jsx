import { useEffect, useState } from 'react';
import CrudModule from '../components/CrudModule';
import { PageHeader } from '../components/ui';
import api from '../services/api';

export default function InventoryPage() {
  const [tab, setTab] = useState('products');
  const [alerts, setAlerts] = useState([]);
  const [predictions, setPredictions] = useState([]);

  useEffect(() => {
    api.get('/inventory/alerts/low-stock').then((res) => setAlerts(res.data.data.alerts || []));
    api.get('/inventory/demand-prediction').then((res) => setPredictions(res.data.data.predictions || []));
  }, []);

  return (
    <div>
      <PageHeader title="Inventory" subtitle="Warehouses, stock, barcodes, alerts, and AI demand prediction." />
      <div className="grid grid-2" style={{ marginBottom: '1rem' }}>
        <div className="card">
          <h3>Low stock alerts</h3>
          {alerts.length === 0 ? <div className="empty">All good</div> : (
            <ul>{alerts.map((a) => <li key={a.product._id}>{a.product.name}: {a.quantity} / threshold {a.threshold}</li>)}</ul>
          )}
        </div>
        <div className="card">
          <h3>AI demand prediction</h3>
          <ul>{predictions.slice(0, 6).map((p) => <li key={p.productId}>{p.name}: reorder {p.suggestedReorder}</li>)}</ul>
        </div>
      </div>
      <div className="tabs">
        {['products', 'warehouses', 'stocks'].map((t) => (
          <button key={t} className={`tab${tab === t ? ' active' : ''}`} onClick={() => setTab(t)}>{t}</button>
        ))}
      </div>
      {tab === 'products' && (
        <CrudModule
          hideHeader
          title="Products"
          endpoint="/inventory/products"
          columns={['Name', 'SKU', 'Price', 'Barcode']}
          fields={[
            { name: 'name', label: 'Name', required: true },
            { name: 'sku', label: 'SKU', required: true },
            { name: 'price', label: 'Price', type: 'number' },
            { name: 'barcode', label: 'Barcode' },
            { name: 'lowStockThreshold', label: 'Low stock', type: 'number', defaultValue: 10 },
          ]}
          mapRow={(i) => [i.name, i.sku, i.price, i.barcode]}
        />
      )}
      {tab === 'warehouses' && (
        <CrudModule
          hideHeader
          title="Warehouses"
          endpoint="/inventory/warehouses"
          columns={['Name', 'Code']}
          fields={[
            { name: 'name', label: 'Name', required: true },
            { name: 'code', label: 'Code' },
            { name: 'address', label: 'Address' },
          ]}
          mapRow={(i) => [i.name, i.code]}
        />
      )}
      {tab === 'stocks' && (
        <CrudModule
          hideHeader
          title="Stock"
          endpoint="/inventory/stocks"
          columns={['Product', 'Warehouse', 'Qty']}
          fields={[
            { name: 'product', label: 'Product ID', required: true },
            { name: 'warehouse', label: 'Warehouse ID', required: true },
            { name: 'quantity', label: 'Quantity', type: 'number', required: true },
          ]}
          mapRow={(i) => [i.product?.name || i.product, i.warehouse?.name || i.warehouse, i.quantity]}
        />
      )}
    </div>
  );
}
