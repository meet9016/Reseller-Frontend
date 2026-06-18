import { useEffect, useMemo, useState } from 'react';
import { useFormik } from 'formik';
import * as Yup from 'yup';
import axios from 'axios';
import { toast } from 'react-toastify';
import Dialog from '@/components/Dialog';
import { baseUrl, getAuthToken } from '@/config';
import { ApiLead } from './types';
import FormInput from '../ui/Input';
import {
  FaRegClock,
  FaCheckCircle,
  FaBan,
  FaTimesCircle,
} from 'react-icons/fa';

type StatusValue = 'pending' | 'approve' | 'cancel' | 'reject';

interface Props {
  isOpen: boolean;
  onClose: () => void;
  mode: 'add' | 'edit';
  initialData?: ApiLead | null;
  onLeadCreated?: (lead: any) => void;
  onLeadUpdated?: (lead: any) => void;
}

const STATUS_OPTIONS: {
  value: StatusValue;
  label: string;
  icon: React.ComponentType<{ className?: string }>;
  activeClass: string;
  inactiveClass: string;
}[] = [
    {
      value: 'pending',
      label: 'Pending',
      icon: FaRegClock,
      activeClass:
        'flex items-center gap-2 px-4 py-2 rounded-lg border text-sm font-medium bg-yellow-500 text-white border-yellow-500 shadow-sm',
      inactiveClass:
        'flex items-center gap-2 px-4 py-2 rounded-lg border text-sm font-medium bg-white text-yellow-600 border-yellow-300 hover:bg-yellow-50',
    },
    {
      value: 'approve',
      label: 'Approve',
      icon: FaCheckCircle,
      activeClass:
        'flex items-center gap-2 px-4 py-2 rounded-lg border text-sm font-medium bg-green-600 text-white border-green-600 shadow-sm',
      inactiveClass:
        'flex items-center gap-2 px-4 py-2 rounded-lg border text-sm font-medium bg-white text-green-600 border-green-300 hover:bg-green-50',
    },
    {
      value: 'cancel',
      label: 'Cancel',
      icon: FaBan,
      activeClass:
        'flex items-center gap-2 px-4 py-2 rounded-lg border text-sm font-medium bg-gray-600 text-white border-gray-600 shadow-sm',
      inactiveClass:
        'flex items-center gap-2 px-4 py-2 rounded-lg border text-sm font-medium bg-white text-gray-700 border-gray-300 hover:bg-gray-50',
    },
    {
      value: 'reject',
      label: 'Reject',
      icon: FaTimesCircle,
      activeClass:
        'flex items-center gap-2 px-4 py-2 rounded-lg border text-sm font-medium bg-red-600 text-white border-red-600 shadow-sm',
      inactiveClass:
        'flex items-center gap-2 px-4 py-2 rounded-lg border text-sm font-medium bg-white text-red-600 border-red-300 hover:bg-red-50',
    },
  ];

const validationSchema = Yup.object().shape({
  fullName: Yup.string()
    .trim()
    .min(2, 'Full Name must be at least 2 characters')
    .max(100, 'Full Name must not exceed 100 characters')
    .required('Full Name is required'),
  email: Yup.string()
    .trim()
    .email('Invalid email format')
    .max(100, 'Email must not exceed 100 characters')
    .required('Email is required'),
  amount: Yup.string()
    .matches(/^\d+(\.\d+)?$/, 'Amount must be a valid number')
    .required('Amount is required'),
  product: Yup.string().trim().required('Product is required'),
  status: Yup.string()
    .oneOf(['pending', 'approve', 'cancel', 'reject'], 'Please select a valid status')
    .required('Please select a status'),
  isActive: Yup.boolean(),
});

export default function LeadAddDialog({
  isOpen,
  onClose,
  mode,
  initialData,
  onLeadCreated,
  onLeadUpdated,
}: Props) {
  const [loading, setLoading] = useState(false);
  const token = getAuthToken;

  const initialStatus = useMemo<StatusValue>(() => {
    const raw = (initialData as any)?.status;
    const val = typeof raw === 'string' ? raw.toLowerCase() : '';
    return (['pending', 'approve', 'cancel', 'reject'].includes(val)
      ? val
      : 'pending') as StatusValue;
  }, [initialData]);

  const formik = useFormik({
    initialValues: {
      fullName: '',
      email: '',
      amount: '',
      product: '',
      status: 'pending' as StatusValue,
      isActive: true,
    },
    validationSchema,
    validateOnChange: true,
    validateOnBlur: true,
    enableReinitialize: false,
    onSubmit: async (values, { setSubmitting, setStatus }) => {
      setStatus(null);
      try {
        const payload = {
          fullName: values.fullName.trim(),
          email: values.email.trim().toLowerCase(),
          amount: values.amount,
          product: values.product.trim(),
          status: values.status,
          isActive: values.isActive,
        };

        const headers = {
          Authorization: `Bearer ${token()}`,
          'Content-Type': 'application/json',
        };

        if (mode === 'add') {
          const res = await axios.post(baseUrl.addLead, payload, { headers });
          toast.success('Lead created successfully!');
          onLeadCreated?.(res.data?.data ?? res.data);
        } else {
          if (!initialData?._id) throw new Error('Missing lead ID');
          const res = await axios.put(
            `${baseUrl.updateLead}/${initialData._id}`,
            payload,
            { headers }
          );
          toast.success('Lead updated successfully!');
          onLeadUpdated?.(res.data?.data ?? res.data);
        }
        onClose();
      } catch (error: any) {
        const msg = error?.response?.data?.message || `Failed to ${mode} lead`;
        setStatus(msg);
        toast.error(msg);
      } finally {
        setSubmitting(false);
      }
    },
  });

  useEffect(() => {
    if (!isOpen) return;
    setLoading(true);
    try {
      if (mode === 'edit' && initialData) {
        formik.setValues({
          fullName: initialData.fullName || '',
          email: initialData.email || '',
          amount:
            (initialData as any).amount != null
              ? String((initialData as any).amount)
              : '',
          product: (initialData as any).product || '',
          status: initialStatus,
          isActive: initialData.isActive ?? true,
        });
      } else {
        formik.resetForm();
      }
      formik.setStatus(null);
    } finally {
      setLoading(false);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isOpen, mode, initialData]);

  const getFieldError = (field: keyof typeof formik.values) => {
    const touched = formik.touched[field];
    const error = formik.errors[field];
    return touched && error ? (error as string) : undefined;
  };

  return (
    <Dialog
      isOpen={isOpen}
      onClose={onClose}
      title={mode === 'edit' ? 'Edit Lead' : 'Add New Lead'}
      footer={
        <div className="flex justify-end gap-3">
          <button
            type="button"
            onClick={onClose}
            className="rounded-lg cursor-pointer border border-gray-300 bg-white px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50"
          >
            Cancel
          </button>
          <button
            type="button"
            onClick={() => formik.handleSubmit()}
            disabled={formik.isSubmitting}
            className="rounded-lg cursor-pointer bg-[#0b2a55] px-4 py-2 text-sm font-medium text-white hover:bg-[#0a2447] disabled:opacity-60"
          >
            {formik.isSubmitting
              ? 'Saving...'
              : mode === 'edit'
                ? 'Update Lead'
                : 'Save Lead'}
          </button>
        </div>
      }
    >
      {loading ? (
        <div className="p-6 text-center text-gray-500">Loading...</div>
      ) : (
        <form
          onSubmit={formik.handleSubmit}
          className="space-y-5 p-2"
          noValidate
        >
          {formik.status && (
            <div className="rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
              {formik.status}
            </div>
          )}

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <FormInput
              label="Full Name"
              name="fullName"
              value={formik.values.fullName}
              onChange={formik.handleChange}
              onBlur={formik.handleBlur}
              error={getFieldError('fullName')}
              required
            />
            <FormInput
              label="Email"
              name="email"
              type="email"
              value={formik.values.email}
              onChange={formik.handleChange}
              onBlur={formik.handleBlur}
              error={getFieldError('email')}
              required
            />
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <FormInput
              label="Amount"
              name="amount"
              value={formik.values.amount}
              onChange={formik.handleChange}
              onBlur={formik.handleBlur}
              error={getFieldError('amount')}
            />
            <FormInput
              label="Product"
              name="product"
              value={formik.values.product}
              onChange={formik.handleChange}
              onBlur={formik.handleBlur}
              error={getFieldError('product')}
            />
          </div>

          <div>
            <label className="block text-sm font-semibold text-gray-800 mb-2">
              Status <span className="text-red-500">*</span>
            </label>
            <div className="flex flex-wrap gap-2">
              {STATUS_OPTIONS.map((opt) => {
                const isActive = formik.values.status === opt.value;
                const Icon = opt.icon;
                return (
                  <button
                    key={opt.value}
                    type="button"
                    onClick={() => {
                      formik.setFieldValue('status', opt.value);
                      formik.setFieldTouched('status', true, false);
                    }}
                    className={`cursor-pointer transition-colors ${isActive ? opt.activeClass : opt.inactiveClass
                      }`}
                  >
                    <Icon className="h-4 w-4" />
                    {opt.label}
                  </button>
                );
              })}
            </div>
            {getFieldError('status') && (
              <p className="mt-1 text-sm text-red-600">
                {getFieldError('status')}
              </p>
            )}
          </div>

          <label className="flex items-center gap-2 cursor-pointer select-none">
            <input
              type="checkbox"
              name="isActive"
              checked={formik.values.isActive}
              onChange={formik.handleChange}
              className="h-4 w-4 rounded border-gray-300 text-blue-600 focus:ring-blue-500"
            />
            <span className="text-sm font-medium text-gray-800">Active Lead</span>
          </label>
        </form>
      )}
    </Dialog>
  );
}
