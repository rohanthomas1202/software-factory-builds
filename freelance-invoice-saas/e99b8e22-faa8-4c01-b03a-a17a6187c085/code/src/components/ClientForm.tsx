'use client';

import { useState, FormEvent } from 'react';
import { Client, ClientRequest } from '@/lib/types';

interface ClientFormProps {
  initialData?: Partial<Client>;
  onSubmit: (data: ClientRequest) => Promise<void>;
  isLoading?: boolean;
  submitLabel?: string;
}

export default function ClientForm({
  initialData,
  onSubmit,
  isLoading = false,
  submitLabel = 'Save Client'
}: ClientFormProps) {
  const [formData, setFormData] = useState<ClientRequest>({
    name: initialData?.name || '',
    email: initialData?.email || '',
    companyName: initialData?.companyName || null,
    billingAddress: {
      street: initialData?.billingAddress?.street || '',
      city: initialData?.billingAddress?.city || '',
      state: initialData?.billingAddress?.state || '',
      postalCode: initialData?.billingAddress?.postalCode || '',
      country: initialData?.billingAddress?.country || 'US'
    }
  });
  
  const [errors, setErrors] = useState<Record<string, string>>({});

  const validateEmail = (email: string): boolean => {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return emailRegex.test(email);
  };

  const validateForm = (): boolean => {
    const newErrors: Record<string, string> = {};
    
    if (!formData.name.trim()) {
      newErrors.name = 'Name is required';
    }
    
    if (!formData.email.trim()) {
      newErrors.email = 'Email is required';
    } else if (!validateEmail(formData.email)) {
      newErrors.email = 'Invalid email format';
    }
    
    if (!formData.billingAddress.street.trim()) {
      newErrors['billingAddress.street'] = 'Street address is required';
    }
    
    if (!formData.billingAddress.city.trim()) {
      newErrors['billingAddress.city'] = 'City is required';
    }
    
    if (!formData.billingAddress.state.trim()) {
      newErrors['billingAddress.state'] = 'State is required';
    }
    
    if (!formData.billingAddress.postalCode.trim()) {
      newErrors['billingAddress.postalCode'] = 'Postal code is required';
    }
    
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    
    if (!validateForm()) {
      return;
    }
    
    await onSubmit(formData);
  };

  const handleChange = (field: string, value: string) => {
    setFormData(prev => {
      if (field.startsWith('billingAddress.')) {
        const addressField = field.split('.')[1];
        return {
          ...prev,
          billingAddress: {
            ...prev.billingAddress,
            [addressField]: value
          }
        };
      }
      return {
        ...prev,
        [field]: field === 'companyName' && value === '' ? null : value
      };
    });
    
    // Clear error when user starts typing
    if (errors[field]) {
      setErrors(prev => ({ ...prev, [field]: '' }));
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div>
          <label htmlFor="name" className="block text-sm font-medium text-gray-700 mb-1">
            Name *
          </label>
          <input
            type="text"
            id="name"
            value={formData.name}
            onChange={(e) => handleChange('name', e.target.value)}
            className={`w-full px-3 py-2 border rounded-md ${errors.name ? 'border-red-500' : 'border-gray-300'} focus:outline-none focus:ring-2 focus:ring-blue-500`}
            placeholder="John Doe"
            disabled={isLoading}
          />
          {errors.name && <p className="mt-1 text-sm text-red-600">{errors.name}</p>}
        </div>

        <div>
          <label htmlFor="email" className="block text-sm font-medium text-gray-700 mb-1">
            Email *
          </label>
          <input
            type="email"
            id="email"
            value={formData.email}
            onChange={(e) => handleChange('email', e.target.value)}
            className={`w-full px-3 py-2 border rounded-md ${errors.email ? 'border-red-500' : 'border-gray-300'} focus:outline-none focus:ring-2 focus:ring-blue-500`}
            placeholder="john@example.com"
            disabled={isLoading}
          />
          {errors.email && <p className="mt-1 text-sm text-red-600">{errors.email}</p>}
        </div>

        <div>
          <label htmlFor="companyName" className="block text-sm font-medium text-gray-700 mb-1">
            Company Name
          </label>
          <input
            type="text"
            id="companyName"
            value={formData.companyName || ''}
            onChange={(e) => handleChange('companyName', e.target.value)}
            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            placeholder="ACME Corp"
            disabled={isLoading}
          />
        </div>

        <div>
          <label htmlFor="country" className="block text-sm font-medium text-gray-700 mb-1">
            Country *
          </label>
          <select
            id="country"
            value={formData.billingAddress.country}
            onChange={(e) => handleChange('billingAddress.country', e.target.value)}
            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            disabled={isLoading}
          >
            <option value="US">United States</option>
            <option value="CA">Canada</option>
            <option value="GB">United Kingdom</option>
            <option value="AU">Australia</option>
            <option value="DE">Germany</option>
            <option value="FR">France</option>
            <option value="JP">Japan</option>
            <option value="IN">India</option>
          </select>
        </div>
      </div>

      <div>
        <label htmlFor="street" className="block text-sm font-medium text-gray-700 mb-1">
          Street Address *
        </label>
        <input
          type="text"
          id="street"
          value={formData.billingAddress.street}
          onChange={(e) => handleChange('billingAddress.street', e.target.value)}
          className={`w-full px-3 py-2 border rounded-md ${errors['billingAddress.street'] ? 'border-red-500' : 'border-gray-300'} focus:outline-none focus:ring-2 focus:ring-blue-500`}
          placeholder="123 Main St"
          disabled={isLoading}
        />
        {errors['billingAddress.street'] && (
          <p className="mt-1 text-sm text-red-600">{errors['billingAddress.street']}</p>
        )}
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div>
          <label htmlFor="city" className="block text-sm font-medium text-gray-700 mb-1">
            City *
          </label>
          <input
            type="text"
            id="city"
            value={formData.billingAddress.city}
            onChange={(e) => handleChange('billingAddress.city', e.target.value)}
            className={`w-full px-3 py-2 border rounded-md ${errors['billingAddress.city'] ? 'border-red-500' : 'border-gray-300'} focus:outline-none focus:ring-2 focus:ring-blue-500`}
            placeholder="New York"
            disabled={isLoading}
          />
          {errors['billingAddress.city'] && (
            <p className="mt-1 text-sm text-red-600">{errors['billingAddress.city']}</p>
          )}
        </div>

        <div>
          <label htmlFor="state" className="block text-sm font-medium text-gray-700 mb-1">
            State/Province *
          </label>
          <input
            type="text"
            id="state"
            value={formData.billingAddress.state}
            onChange={(e) => handleChange('billingAddress.state', e.target.value)}
            className={`w-full px-3 py-2 border rounded-md ${errors['billingAddress.state'] ? 'border-red-500' : 'border-gray-300'} focus:outline-none focus:ring-2 focus:ring-blue-500`}
            placeholder="NY"
            disabled={isLoading}
          />
          {errors['billingAddress.state'] && (
            <p className="mt-1 text-sm text-red-600">{errors['billingAddress.state']}</p>
          )}
        </div>

        <div>
          <label htmlFor="postalCode" className="block text-sm font-medium text-gray-700 mb-1">
            Postal Code *
          </label>
          <input
            type="text"
            id="postalCode"
            value={formData.billingAddress.postalCode}
            onChange={(e) => handleChange('billingAddress.postalCode', e.target.value)}
            className={`w-full px-3 py-2 border rounded-md ${errors['billingAddress.postalCode'] ? 'border-red-500' : 'border-gray-300'} focus:outline-none focus:ring-2 focus:ring-blue-500`}
            placeholder="10001"
            disabled={isLoading}
          />
          {errors['billingAddress.postalCode'] && (
            <p className="mt-1 text-sm text-red-600">{errors['billingAddress.postalCode']}</p>
          )}
        </div>
      </div>

      <div className="pt-4">
        <button
          type="submit"
          disabled={isLoading}
          className="w-full md:w-auto px-6 py-3 bg-blue-600 text-white font-medium rounded-md hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
        >
          {isLoading ? 'Saving...' : submitLabel}
        </button>
      </div>
    </form>
  );
}