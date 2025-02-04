// app/page.tsx

import React, { ErrorInfo } from 'react';

interface Data {
  id: number
  invoice: number
  unit: string
  description: string
  name: string
  quantity: number
  unit_price: number
  total_price: number
}

const fetchData = async (): Promise<Data[]> => {
  const res = await fetch('http://localhost:8000/api/invoice-items'); // Replace with your API endpoint
  if (!res.ok) {
    throw new Error('Failed to fetch data');
  }
  return res.json();
};

const HomePage = async () => {
    const data = await fetchData();

    return (
      <div>
        <h1>Invoices</h1>
        <ul>
          {data.map((item) => (
            <li key={item.id}>
              {item.id}: {item.name}: {item.quantity}{item.unit} x {item.unit_price} = {item.total_price}
              <br/>
              Desc: {item.description} 
              Inv: {item.invoice}
            </li>
          ))}
        </ul>
      </div>
    );
};

export default HomePage;
