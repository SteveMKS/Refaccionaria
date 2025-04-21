import React from 'react';

interface ProductInfoRowProps {
  label: string;
  value?: string | null;
}

export const ProductInfoRow: React.FC<ProductInfoRowProps> = ({ label, value }) => (
  value ? <p className="text-gray-600"><span className="font-semibold">{label}:</span> {value}</p> : null
);