import React, { useState, useRef } from 'react';
import { X, Calendar, CreditCard, Image as ImageIcon } from 'lucide-react';
import { toast } from 'react-toastify';
import axios from 'axios';
import { baseUrl, getAuthToken } from '@/config';

interface PaymentModalProps {
  isOpen: boolean;
  onClose: () => void;
  lead: any;
  onSuccess: () => void;
}

export default function PaymentModal({ isOpen, onClose, lead, onSuccess }: PaymentModalProps) {
  const isPaid = lead?.paymentStatus === 'Paid';
  const [amount, setAmount] = useState(lead?.paidAmount?.toString() || lead?.paymentAmount?.toString() || '');
  const [paymentDate, setPaymentDate] = useState(() => {
    if (lead?.paymentDate?.startDate) {
      return new Date(lead.paymentDate.startDate).toISOString().split('T')[0];
    }
    return new Date().toISOString().split('T')[0];
  });
  const [paymentMode, setPaymentMode] = useState(lead?.paymentMode || 'Cash');
  const [paymentProof, setPaymentProof] = useState<File | null>(null);
  const [loading, setLoading] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  if (!isOpen) return null;

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      const file = e.target.files[0];
      if (file.size > 2 * 1024 * 1024) {
        toast.error('File size must be less than 2MB');
        if (fileInputRef.current) fileInputRef.current.value = '';
        return;
      }
      setPaymentProof(file);
    }
  };

  const handleSubmit = async () => {
    if (!amount || isNaN(Number(amount)) || Number(amount) <= 0) {
      toast.error('Please enter a valid amount');
      return;
    }
    if (!paymentDate) {
      toast.error('Please select a payment date');
      return;
    }
    if (!paymentMode) {
      toast.error('Please select a payment mode');
      return;
    }

    try {
      setLoading(true);
      const formData = new FormData();
      formData.append('paidAmount', amount);
      formData.append('paymentAmount', amount); // also update old field
      formData.append('paymentDate', paymentDate);
      formData.append('paymentMode', paymentMode);
      formData.append('paymentStatus', 'Paid');
      if (paymentProof) {
        formData.append('attachments', paymentProof);
      }

      await axios.put(`${baseUrl.updateLead}/${lead._id || lead.id}`, formData, {
        headers: {
          Authorization: `Bearer ${getAuthToken()}`,
          'Content-Type': 'multipart/form-data',
        },
      });

      toast.success('Payment added successfully');
      onSuccess();
      onClose();
    } catch (error: any) {
      toast.error(error?.response?.data?.message || 'Failed to add payment');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50">
      <div className="bg-white rounded-lg shadow-xl w-full max-w-md overflow-hidden">
        {/* Header */}
        <div className="bg-[#3B82F6] text-white px-6 py-4 flex items-center justify-between">
          <h2 className="text-xl font-bold">{isPaid ? 'Payment Details' : 'Add Payment'}</h2>
          <button onClick={onClose} className="text-white hover:text-gray-200 cursor-pointer">
            <X className="h-5 w-5" />
          </button>
        </div>

        {/* Body */}
        <div className="p-6 space-y-6">
          {/* Amount */}
          <div>
            <label className="block text-sm font-semibold text-gray-700 mb-1 flex items-center gap-1">
              <span className="text-[#3B82F6] font-bold">₹</span> Amount <span className="text-red-500">*</span>
            </label>
            <input
              type="number"
              value={amount}
              onChange={(e) => setAmount(e.target.value)}
              placeholder="Enter amount"
              className="w-full border border-gray-300 rounded-md px-3 py-2 text-sm focus:outline-none focus:border-[#3B82F6] focus:ring-1 focus:ring-[#3B82F6]"
            />
          </div>

          {/* Payment Date */}
          <div>
            <label className="block text-sm font-semibold text-gray-700 mb-1 flex items-center gap-1">
              <Calendar className="h-4 w-4 text-[#3B82F6]" /> Payment Date <span className="text-red-500">*</span>
            </label>
            <input
              type="date"
              value={paymentDate}
              onChange={(e) => setPaymentDate(e.target.value)}
              className="w-full border border-gray-300 rounded-md px-3 py-2 text-sm focus:outline-none focus:border-[#3B82F6] focus:ring-1 focus:ring-[#3B82F6]"
            />
          </div>

          {/* Payment Mode */}
          <div>
            <label className="block text-sm font-semibold text-gray-700 mb-2 flex items-center gap-1">
              <CreditCard className="h-4 w-4 text-[#3B82F6]" /> Payment Mode <span className="text-red-500">*</span>
            </label>
            <div className="grid grid-cols-3 gap-3">
              {['Cash', 'GPay', 'Bank Transfer'].map((mode) => (
                <button
                  key={mode}
                  onClick={() => setPaymentMode(mode)}
                  className={`py-2 text-sm font-medium rounded-md border cursor-pointer transition-colors ${
                    paymentMode === mode
                      ? 'border-[#3B82F6] text-[#3B82F6] bg-blue-50'
                      : 'border-gray-200 text-gray-700 hover:bg-gray-50'
                  }`}
                >
                  {mode}
                </button>
              ))}
            </div>
          </div>

          {/* Payment Proof */}
          <div>
            <label className="block text-sm font-semibold text-gray-700 mb-1 flex items-center gap-1">
              <ImageIcon className="h-4 w-4 text-[#3B82F6]" /> Payment Proof {isPaid ? '(Upload new to replace)' : '(Optional)'}
            </label>
            {isPaid && lead?.paymentProof && (
                <div className="mb-2">
                  <span className="text-sm text-gray-600">Current: </span>
                  <a 
                    href={`${baseUrl.getImageUrl}/images/LeadAttachment/${lead.paymentProof}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-blue-500 hover:underline text-sm font-medium"
                  >
                    View Attachment
                  </a>
                </div>
            )}
            <div className="relative">
              <input
                type="file"
                ref={fileInputRef}
                onChange={handleFileChange}
                accept=".jpg,.jpeg,.png,.webp"
                className="w-full border border-gray-300 rounded-md px-3 py-2 text-sm text-gray-600 focus:outline-none focus:border-[#3B82F6] focus:ring-1 focus:ring-[#3B82F6] file:mr-4 file:py-1 file:px-3 file:rounded-md file:border-0 file:text-sm file:font-semibold file:bg-blue-50 file:text-[#3B82F6] hover:file:bg-blue-100"
              />
            </div>
            <p className="text-xs text-gray-500 mt-1">JPG, PNG, WEBP — Max 2MB</p>
          </div>
        </div>

        {/* Footer */}
        <div className="px-6 py-4 border-t flex justify-between gap-3 bg-gray-50">
          <button
            onClick={onClose}
            className="flex-1 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-md hover:bg-gray-50 transition-colors cursor-pointer"
          >
            Cancel
          </button>
          <button
            onClick={handleSubmit}
            disabled={loading}
            className="flex-1 py-2 text-sm font-medium text-white bg-[#3B82F6] rounded-md hover:bg-[#2563EB] transition-colors disabled:opacity-70 disabled:cursor-not-allowed cursor-pointer"
          >
            {loading ? 'Saving...' : (isPaid ? 'Update Payment' : 'Save Payment')}
          </button>
        </div>
      </div>
    </div>
  );
}
