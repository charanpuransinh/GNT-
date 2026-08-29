import React from 'react';
import { EInvoiceDTO } from '../services/gst.types';

interface Props {
  data: EInvoiceDTO;
}

export const EInvoiceGenerator: React.FC<Props> = ({ data }) => {
  return (
    <div className="p-4 bg-[#F8FAFC] rounded-lg border border-[#E2E8F0]">
      <div className="flex justify-between items-start mb-3">
        <div>
          <p className="text-xs text-[#64748B]">IRN</p>
          <p className="text-sm font-mono font-medium text-[#0F172A] break-all">{data.irn}</p>
        </div>
        <span className={`px-2 py-1 rounded text-xs ${data.status === 'generated' ? 'bg-green-100 text-[#16A34A]' : data.status === 'cancelled' ? 'bg-red-100 text-[#DC2626]' : 'bg-yellow-100 text-[#F59E0B]'}`}>{data.status.toUpperCase()}</span>
      </div>
      <div className="grid grid-cols-2 gap-3 text-sm mb-3">
        <div><p className="text-xs text-[#64748B]">Ack No</p><p className="font-medium">{data.ack_no}</p></div>
        <div><p className="text-xs text-[#64748B]">Ack Date</p><p className="font-medium">{data.ack_date ? new Date(data.ack_date).toLocaleString() : '-'}</p></div>
      </div>
      {data.qr_code && (
        <div className="flex justify-center p-3 bg-white rounded border border-[#E2E8F0]">
          <img src={data.qr_code} alt="E-Invoice QR" className="w-32 h-32" />
        </div>
      )}
    </div>
  );
};
