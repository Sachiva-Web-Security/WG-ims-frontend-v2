"use client";
import React from 'react';
import { Truck, Calendar, MapPin, Package, StickyNote, FileText, Printer } from 'lucide-react';

export function SupplyBill({ dispatch, isOpen, onClose }) {
  if (!isOpen || !dispatch) return null;

  const handlePrint = () => {
    window.print();
  };

  const formattedDate = new Date(dispatch.dispatched_at).toLocaleString('en-US', {
    dateStyle: 'long',
    timeStyle: 'short'
  });

  const items = dispatch.items || [
    {
      name: dispatch.ingredient_name,
      quantity: dispatch.quantity_dispatched || dispatch.quantity,
      unit: dispatch.unit
    }
  ];

  const referenceId = dispatch.batch_id || (dispatch.id ? `DIS-${dispatch.id.toString().padStart(5, '0')}` : 'NEW');

  return (
    <>
      {/* Modal - Hidden during print */}
      <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm print:hidden">
        <div className="relative bg-white rounded-3xl shadow-2xl w-full max-w-2xl overflow-hidden animate-in fade-in zoom-in duration-300">
          {/* Modal Header */}
          <div className="flex items-center justify-between p-6 border-b border-slate-100 bg-slate-50/50 text-slate-900">
            <div className="flex items-center gap-2">
              <div className="w-10 h-10 rounded-xl bg-blue-600 flex items-center justify-center text-white shadow-lg shadow-blue-200">
                <FileText size={20} />
              </div>
              <div>
                <h3 className="font-bold text-lg text-slate-800 font-heading">Supply Dispatch Bill</h3>
                <p className="text-xs text-slate-500 font-medium uppercase tracking-wider">Ref: {referenceId}</p>
              </div>
            </div>
            <div className="flex gap-2 text-slate-900">
              <button
                onClick={handlePrint}
                className="flex items-center gap-2 px-4 py-2 bg-slate-800 text-white rounded-xl text-sm font-bold hover:bg-slate-700 transition-all shadow-md active:scale-95"
              >
                <Printer size={16} /> Print Bill
              </button>
              <button
                onClick={onClose}
                className="w-10 h-10 rounded-xl hover:bg-slate-200 flex items-center justify-center text-slate-500 transition-colors bg-slate-100 font-bold"
              >
                ✕
              </button>
            </div>
          </div>

          {/* Bill Content for Preview */}
          <div className="p-8 max-h-[70vh] overflow-y-auto bg-slate-50/30">
            <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-8 max-w-lg mx-auto">
              <div className="text-center mb-8">
                <img src="/logo.png" alt="WavaGrill" className="h-16 mx-auto mb-4 object-contain" />
                <h1 className="text-2xl font-black text-slate-900 tracking-tight uppercase">Central Kitchen</h1>
                <div className="h-1 w-12 bg-amber-500 mx-auto mt-2 rounded-full" />
                <p className="text-[10px] text-slate-400 mt-2 uppercase tracking-[0.2em] font-bold">Supply Dispatch Bill</p>
              </div>

              <div className="space-y-6">
                <div className="flex justify-between items-start border-b border-slate-100 pb-4">
                  <div className="flex items-center gap-3 text-slate-800">
                    <div className="text-slate-400 bg-slate-50 p-2 rounded-lg"><Calendar size={18} /></div>
                    <div>
                      <p className="text-[10px] text-slate-400 font-bold uppercase tracking-wider">Date & Time</p>
                      <p className="text-sm font-semibold">{formattedDate}</p>
                    </div>
                  </div>
                </div>

                <div className="flex justify-between items-start border-b border-slate-100 pb-4">
                  <div className="flex items-center gap-3 text-slate-800">
                    <div className="text-slate-400 bg-slate-50 p-2 rounded-lg"><MapPin size={18} /></div>
                    <div>
                      <p className="text-[10px] text-slate-400 font-bold uppercase tracking-wider">Destination</p>
                      <p className="text-sm font-semibold">{dispatch.location_name}</p>
                    </div>
                  </div>
                </div>

                <div className="bg-slate-50 rounded-2xl p-4 border border-slate-100">
                  <div className="flex items-center gap-3 mb-4">
                    <div className="text-blue-600 bg-blue-100/50 p-2 rounded-lg"><Package size={20} /></div>
                    <p className="text-xs text-slate-500 font-bold uppercase tracking-widest">
                      {items.length === 1 ? 'Item Dispatched' : 'Batch Dispatched'}
                    </p>
                  </div>
                  <div className="divide-y divide-slate-200">
                    {items.map((item, idx) => (
                      <div key={idx} className="flex justify-between items-center py-2 first:pt-0 last:pb-0">
                        <div>
                          <p className="font-bold text-slate-900">{item.name}</p>
                        </div>
                        <div className="text-right">
                          <span className="font-black text-blue-700">{item.quantity}</span>
                          <span className="text-[10px] font-bold text-blue-500 ml-1 uppercase">{item.unit}</span>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>

                {dispatch.notes && (
                  <div className="flex items-start gap-3 bg-amber-50/50 p-4 rounded-xl border border-amber-100/50">
                    <div className="text-amber-500 mt-0.5"><StickyNote size={16} /></div>
                    <div>
                      <p className="text-[10px] text-amber-600 font-bold uppercase tracking-tight">Notes</p>
                      <p className="text-xs text-slate-600 italic">"{dispatch.notes}"</p>
                    </div>
                  </div>
                )}
              </div>

              <div className="mt-12 text-center text-slate-900">
                <div className="border-t-2 border-dashed border-slate-200 pt-6">
                  <p className="text-[10px] text-slate-400 font-bold uppercase tracking-[0.3em] mb-4">Verification Required</p>
                  <div className="flex justify-around items-end gap-4 h-16">
                    <div className="flex-1 border-b border-slate-300">
                      <p className="text-[8px] text-slate-400 mb-1 uppercase font-bold">Kitchen Supervisor</p>
                    </div>
                    <div className="flex-1 border-b border-slate-300">
                      <p className="text-[8px] text-slate-400 mb-1 uppercase font-bold">Location Manager</p>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      <style jsx global>{`
        @media print {
          html, body {
            visibility: hidden !important;
            height: 100% !important;
            overflow: visible !important;
            background: white !important;
          }
          * {
            -webkit-print-color-adjust: exact !important;
            print-color-adjust: exact !important;
            color-adjust: exact !important;
          }
          .print-bill-root {
            visibility: visible !important;
            position: absolute !important;
            left: 0 !important;
            top: 0 !important;
            width: 100% !important;
            margin: 0 !important;
            padding: 0 !important;
          }
          @page {
            margin: 0;
            size: auto;
          }
        }
      `}</style>

      <div className="hidden print:block print-bill-root w-full bg-white text-black font-sans">
        <div className="p-8 max-w-4xl mx-auto">
          <div className="flex justify-between items-start border-b-[3px] border-black pb-4 mb-6">
            <div className="flex gap-4 items-center">
              <img src="/logo.png" className="h-16 w-auto block grayscale brightness-50" alt="WavaGrill Logo" />
              <div>
                <h1 className="text-2xl font-black uppercase leading-none tracking-tight">WavaGrill</h1>
                <p className="text-sm font-bold text-black uppercase tracking-widest mt-1">Central Kitchen Dispatch</p>
              </div>
            </div>
            <div className="text-right">
              <h2 className="text-xl font-black uppercase text-black">Delivery Note</h2>
              <p className="text-[10px] font-bold text-black uppercase tracking-widest">Ref: {referenceId}</p>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4 mb-6 bg-white p-4 rounded-xl border-2 border-black">
            <div>
              <p className="text-[9px] font-black text-black uppercase tracking-[0.2em] mb-1">Dispatch Details</p>
              <table className="w-full text-sm">
                <tbody>
                  <tr>
                    <td className="py-1 font-bold text-black w-24">Date:</td>
                    <td className="py-1 font-bold text-black">{formattedDate}</td>
                  </tr>
                  <tr>
                    <td className="py-1 font-bold text-black">Destination:</td>
                    <td className="py-1 font-black text-black uppercase">{dispatch.location_name}</td>
                  </tr>
                </tbody>
              </table>
            </div>
          </div>

          <table className="w-full border-collapse border-2 border-black mb-8">
            <thead>
              <tr className="bg-black text-white text-[10px] font-black uppercase tracking-widest">
                <th className="p-3 text-left border border-black">#</th>
                <th className="p-3 text-left border border-black">Description / Material Name</th>
                <th className="p-3 text-right border border-black">Quantity</th>
                <th className="p-3 text-center border border-black">Unit</th>
              </tr>
            </thead>
            <tbody className="text-sm">
              {items.map((item, idx) => (
                <tr key={idx} className="border-b border-black">
                  <td className="p-4 border-r border-black font-bold text-black/50">{(idx + 1).toString().padStart(2, '0')}</td>
                  <td className="p-4 border-r border-black font-black text-lg text-black uppercase">{item.name}</td>
                  <td className="p-4 border-r border-black text-right text-2xl font-black tabular-nums">{item.quantity}</td>
                  <td className="p-4 text-center font-black text-black uppercase">{item.unit}</td>
                </tr>
              ))}
            </tbody>
          </table>

          {dispatch.notes && (
            <div className="mb-8 p-4 border-2 border-black rounded-xl">
              <p className="text-[9px] font-black text-black uppercase tracking-widest mb-1">Operational Remarks</p>
              <p className="text-sm text-black font-bold leading-normal italic">"{dispatch.notes}"</p>
            </div>
          )}

          <div className="mt-12">
            <table className="w-full">
              <tbody>
                <tr>
                  <td className="w-[45%]">
                    <div className="h-12 border-b-2 border-black" />
                    <p className="text-[10px] font-black text-black text-center mt-2 uppercase tracking-widest">CK Supervisor Authorization</p>
                  </td>
                  <td className="w-[10%]"></td>
                  <td className="w-[45%]">
                    <div className="h-12 border-b-2 border-black" />
                    <p className="text-[10px] font-black text-black text-center mt-2 uppercase tracking-widest">Receiver Verification Signature</p>
                  </td>
                </tr>
              </tbody>
            </table>
          </div>
          
          <div className="mt-16 pt-4 border-t-2 border-black flex justify-between items-center text-[8px] font-black uppercase tracking-[0.2em] text-black/60">
            <p>WavaGrill Central Kitchen - IMS System</p>
            <p>Printed: {new Date().toLocaleString()}</p>
          </div>
        </div>
      </div>
    </>
  );
}
