import React, { useEffect, useState } from 'react';
import { useForm, useFieldArray } from 'react-hook-form';
import { yupResolver } from '@hookform/resolvers/yup';
import * as yup from 'yup';
import { X, ArrowUpCircle, ArrowDownCircle, Plus, Trash2, Calculator } from 'lucide-react';
import { AnimatePresence } from 'framer-motion';
import { motion } from 'framer-motion';
import { toast } from 'react-hot-toast';

import Input from '../common/Input';
import Button from '../common/Button';
import stockService from '../../services/stockService';
import productService from '../../services/productService';
import { useAuth } from '../../context/AuthContext';

const MotionDiv = motion.div;

const itemSchema = yup.object({
  category: yup.string().required('Category is required'),
  productId: yup.string().required('Product is required'),
  quantity: yup.number().typeError('Must be a number').positive().integer().required('Qty required'),
  unitPrice: yup.number().transform((value) => (isNaN(value) ? undefined : value)).nullable(), 
});

const schemaIn = yup.object({
  items: yup.array().of(itemSchema).min(1, 'At least one item is required'),
  reason: yup.string().required('Reason is required'),
}).required();

const schemaOut = yup.object({
  items: yup.array().of(itemSchema).min(1, 'At least one item is required'),
  reason: yup.string().required('Reason is required'),
  salesOrderNumber: yup.string().optional(),
}).required();

const SelectField = ({ label, name, error, children, registerFn, disabled }) => (
  <div className="w-full">
    <label className="block text-xs font-medium text-gray-700 mb-1">{label}</label>
    <select
      disabled={disabled}
      {...registerFn(name)}
      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-brand-200 focus:border-brand-500 focus:outline-none bg-white text-sm disabled:bg-gray-100 disabled:text-gray-400"
    >
      {children}
    </select>
    {error && <p className="mt-1 text-xs text-red-600">{error.message}</p>}
  </div>
);

const StockModal = ({ isOpen, onClose, type = 'IN', onSuccess }) => {
  const isStockIn = type === 'IN';
  const { user } = useAuth();
  const [products, setProducts] = useState([]);
  
  const [stockInType, setStockInType] = useState('NEW_PURCHASE'); 

  const { register, control, handleSubmit, reset, watch, setValue, formState: { errors, isSubmitting } } = useForm({
    resolver: yupResolver(isStockIn ? schemaIn : schemaOut),
    defaultValues: {
      items: [{ category: '', productId: '', quantity: '', unitPrice: '' }],
    }
  });

  const { fields, append, remove } = useFieldArray({
    control,
    name: "items"
  });

  // Memantau setiap perubahan angka yang diketik user
  const watchedItems = watch("items");

  // Menghitung Grand Total secara otomatis
  const grandTotal = watchedItems?.reduce((total, item) => {
    const q = Number(item?.quantity) || 0;
    const p = Number(item?.unitPrice) || 0;
    return total + (q * p);
  }, 0);

  useEffect(() => {
    if (isOpen) {
      reset({
        items: [{ category: '', productId: '', quantity: '', unitPrice: '' }],
        reason: '',
        salesOrderNumber: ''
      });
      setStockInType('NEW_PURCHASE'); 
      
      const load = async () => {
        try {
          const prodData = await productService.getAll();
          setProducts(prodData.products);
        } catch {
          toast.error('Failed to load data');
        }
      };
      load();
    }
  }, [isOpen, reset]);

  const handleTypeChange = (type) => {
    setStockInType(type);
    if (type === 'INTERNAL_RETURN') {
      setValue('reason', 'Return of leftover event/training materials');
    } else {
      setValue('reason', '');
    }
  };

  const onSubmit = async (data) => {
    try {
      if (isStockIn && stockInType === 'NEW_PURCHASE') {
        const hasEmptyPrice = data.items.some(item => !item.unitPrice || item.unitPrice <= 0);
        if (hasEmptyPrice) {
          toast.error("Unit Price is required for New Purchases!");
          return;
        }
      }

      const basePayload = {
        reason: data.reason,
        inputBy: user?._id || user?.id, 
        ...(isStockIn ? {} : { salesOrderNumber: data.salesOrderNumber })
      };

      const promises = data.items.map(item => {
        const payload = { 
          ...basePayload, 
          productId: item.productId, 
          quantity: item.quantity,
          ...(isStockIn && stockInType === 'NEW_PURCHASE' ? { unitPrice: Number(item.unitPrice) } : {}) 
        };
        return isStockIn ? stockService.stockIn(payload) : stockService.stockOut(payload);
      });

      await Promise.all(promises);
      
      toast.success(`Successfully submitted ${data.items.length} item(s)!`);
      
      if (isStockIn) {
        toast.success('📧 Notification email sent to Finance Team!', { 
          duration: 4000, 
          style: { background: '#10b981', color: '#fff', fontWeight: '500' } 
        });
      } else {
        toast.success('📧 Notification email sent to Management Team!', { 
          duration: 4000, 
          style: { background: '#ef4444', color: '#fff', fontWeight: '500' } 
        });
      }

      onClose();

      setTimeout(() => {
        onSuccess();
      }, 4000);

    } catch (error) {
      toast.error(error.response?.data?.message || 'Operation failed');
    }
  };

  const uniqueCategories = [...new Set(products.map(p => p.category))].filter(Boolean);

  return (
    <AnimatePresence>
      {isOpen && (
        <>
          <MotionDiv
            initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
            onClick={onClose}
            className="fixed inset-0 bg-gray-900/50 backdrop-blur-sm z-40"
          />
          <MotionDiv
            initial={{ opacity: 0, scale: 0.95, y: 20 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.95, y: 20 }}
            className="fixed inset-0 z-50 flex items-center justify-center p-4 pointer-events-none"
          >
            <div className="bg-white rounded-2xl shadow-xl w-full max-w-4xl pointer-events-auto max-h-[90vh] overflow-hidden flex flex-col">
              
              {/* Header */}
              <div className="flex items-center justify-between p-6 border-b border-gray-100 bg-white">
                <div className="flex items-center gap-3">
                  <div className={`p-2 rounded-lg ${isStockIn ? 'bg-green-100 text-green-600' : 'bg-red-100 text-red-600'}`}>
                    {isStockIn ? <ArrowUpCircle size={24} /> : <ArrowDownCircle size={24} />}
                  </div>
                  <h3 className="text-xl font-bold text-gray-900">
                    {isStockIn ? 'Request Stock In' : 'Request Stock Out'}
                  </h3>
                </div>
                <button onClick={onClose} className="text-gray-400 hover:bg-gray-100 p-2 rounded-lg transition-colors">
                  <X size={20} />
                </button>
              </div>

              {/* Form Body (Scrollable) */}
              <div className="overflow-y-auto flex-1 p-6 bg-gray-50/50">
                <form id="stock-form" onSubmit={handleSubmit(onSubmit)} className="space-y-6">
                  
                  {/* --- DATA UMUM & TOGGLE TIPE (Khusus Stock In) --- */}
                  <div className="bg-white p-5 rounded-xl border border-gray-200 shadow-sm space-y-4">
                    <div className="flex justify-between items-center border-b pb-2">
                      <h4 className="font-semibold text-gray-900">Request Details</h4>
                      
                      {isStockIn && (
                        <div className="flex bg-gray-100 p-1 rounded-lg gap-1">
                          <button
                            type="button"
                            onClick={() => handleTypeChange('NEW_PURCHASE')}
                            className={`px-3 py-1.5 text-xs font-bold rounded-md transition-all ${stockInType === 'NEW_PURCHASE' ? 'bg-white text-green-600 shadow-sm' : 'text-gray-500 hover:text-gray-700'}`}
                          >
                            New Purchase
                          </button>
                          <button
                            type="button"
                            onClick={() => handleTypeChange('INTERNAL_RETURN')}
                            className={`px-3 py-1.5 text-xs font-bold rounded-md transition-all ${stockInType === 'INTERNAL_RETURN' ? 'bg-white text-blue-600 shadow-sm' : 'text-gray-500 hover:text-gray-700'}`}
                          >
                            Internal Return
                          </button>
                        </div>
                      )}
                    </div>
                    
                    <Input
                      label="General Reason"
                      placeholder={isStockIn ? 'e.g. Restock from Supplier A' : 'e.g. Issued to Marketing Team'}
                      error={errors.reason}
                      {...register('reason')}
                    />

                    {!isStockIn && (
                      <Input
                        label="Sales Order Number (optional)"
                        placeholder="e.g. SO-2024-001"
                        error={errors.salesOrderNumber}
                        {...register('salesOrderNumber')}
                      />
                    )}

                    <div className="w-full">
                      <label className="block text-xs font-medium text-gray-700 mb-1">
                        Input By (Auto-detected)
                      </label>
                      <input
                        type="text"
                        value={user ? `${user.name} — ${user.role?.toUpperCase()}` : 'Detecting user...'}
                        readOnly
                        className="w-full px-4 py-2 border border-gray-200 rounded-lg bg-gray-100 text-gray-500 text-sm cursor-not-allowed focus:outline-none"
                      />
                    </div>
                  </div>

                  {/* --- BAGIAN MULTIPLE PRODUCTS --- */}
                  <div className="space-y-4">
                    <h4 className="font-semibold text-gray-900">Product List</h4>

                    {fields.map((field, index) => {
                      const selectedCat = watchedItems?.[index]?.category;
                      const filteredProducts = selectedCat ? products.filter(p => p.category === selectedCat) : [];

                      const showUnitPrice = isStockIn && stockInType === 'NEW_PURCHASE';

                      // Menghitung Subtotal per item
                      const currentQty = Number(watchedItems?.[index]?.quantity) || 0;
                      const currentPrice = Number(watchedItems?.[index]?.unitPrice) || 0;
                      const itemSubtotal = currentQty * currentPrice;

                      return (
                        <div key={field.id} className="relative bg-white p-4 rounded-xl border border-gray-200 shadow-sm flex flex-col gap-3">
                          
                          {fields.length > 1 && (
                            <button 
                              type="button" 
                              onClick={() => remove(index)}
                              className="absolute -top-3 -right-3 bg-red-100 text-red-600 p-1.5 rounded-full hover:bg-red-200 shadow-sm"
                              title="Remove item"
                            >
                              <Trash2 size={16} />
                            </button>
                          )}

                          <div className="grid grid-cols-1 md:grid-cols-12 gap-4">
                            <div className={showUnitPrice ? "md:col-span-3" : "md:col-span-4"}>
                              <SelectField 
                                label="Category" 
                                name={`items.${index}.category`} 
                                error={errors?.items?.[index]?.category} 
                                registerFn={register}
                              >
                                <option value="">-- Category --</option>
                                {uniqueCategories.map(cat => <option key={cat} value={cat}>{cat}</option>)}
                              </SelectField>
                            </div>

                            <div className={showUnitPrice ? "md:col-span-4" : "md:col-span-6"}>
                              <SelectField 
                                label="Product" 
                                name={`items.${index}.productId`} 
                                error={errors?.items?.[index]?.productId} 
                                registerFn={register}
                                disabled={!selectedCat}
                              >
                                <option value="">{!selectedCat ? "Select Category First" : "-- Choose Product --"}</option>
                                {filteredProducts.map(p => (
                                  <option key={p._id} value={p._id}>{p.name} (Stock: {p.quantity})</option>
                                ))}
                              </SelectField>
                            </div>

                            {showUnitPrice && (
                              <div className="md:col-span-3">
                                <Input
                                  label="Unit Price (Rp)"
                                  type="number"
                                  step="0.01"
                                  placeholder="0"
                                  error={errors?.items?.[index]?.unitPrice}
                                  {...register(`items.${index}.unitPrice`)}
                                />
                              </div>
                            )}

                            <div className="md:col-span-2">
                              <Input
                                label="Qty"
                                type="number"
                                placeholder="0"
                                error={errors?.items?.[index]?.quantity}
                                {...register(`items.${index}.quantity`)}
                              />
                            </div>
                          </div>

                          {/* Tampilan Subtotal Otomatis */}
                          {showUnitPrice && itemSubtotal > 0 && (
                            <div className="flex justify-end pt-2 border-t border-gray-100 mt-1">
                              <span className="text-xs text-gray-500 mr-2">Subtotal:</span>
                              <span className="text-sm font-bold text-gray-900">
                                Rp {itemSubtotal.toLocaleString('id-ID')}
                              </span>
                            </div>
                          )}

                        </div>
                      );
                    })}

                    <button
                      type="button"
                      onClick={() => append({ category: '', productId: '', quantity: '', unitPrice: '' })}
                      className="w-full py-3 border-2 border-dashed border-gray-300 rounded-xl text-gray-500 font-medium text-sm hover:border-brand-500 hover:text-brand-600 hover:bg-brand-50 transition-all flex items-center justify-center gap-2"
                    >
                      <Plus size={18} /> Add Another Product
                    </button>
                    
                    {/* Grand Total & Info Message */}
                    <div className={`rounded-xl px-4 py-3 flex flex-col sm:flex-row sm:items-center justify-between gap-3 ${isStockIn ? 'bg-green-50' : 'bg-red-50'}`}>
                      <div className={`text-xs ${isStockIn ? 'text-green-700' : 'text-red-700'}`}>
                        {isStockIn
                          ? 'This entire batch will be sent to Finance for approval.'
                          : 'This entire batch will be sent to Management for approval.'}
                      </div>
                      
                      {isStockIn && stockInType === 'NEW_PURCHASE' && grandTotal > 0 && (
                        <div className="flex items-center gap-2 bg-white px-3 py-1.5 rounded-lg shadow-sm border border-green-100">
                          <Calculator size={16} className="text-green-600" />
                          <span className="text-xs font-medium text-gray-600">Grand Total:</span>
                          <span className="text-sm font-black text-green-700">
                            Rp {grandTotal.toLocaleString('id-ID')}
                          </span>
                        </div>
                      )}
                    </div>

                  </div>

                </form>
              </div>

              {/* Footer */}
              <div className="p-6 border-t border-gray-100 bg-white flex items-center justify-end gap-3 rounded-b-2xl">
                <Button type="button" variant="secondary" onClick={onClose}>Cancel</Button>
                <Button
                  form="stock-form"
                  type="submit"
                  isLoading={isSubmitting}
                  className={isStockIn ? 'bg-green-600 hover:bg-green-700' : 'bg-red-600 hover:bg-red-700'}
                >
                  Submit {fields.length} Item(s)
                </Button>
              </div>

            </div>
          </MotionDiv>
        </>
      )}
    </AnimatePresence>
  );
};

export default StockModal;