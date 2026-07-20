import React from 'react';
import { useForm } from 'react-hook-form';
import { yupResolver } from '@hookform/resolvers/yup';
import * as yup from 'yup';
import { useNavigate, Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import { toast } from 'react-hot-toast';
import { UserPlus } from 'lucide-react';

import { useAuth } from '../context/AuthContext';
import Input from '../components/common/Input';
import Button from '../components/common/Button';

/* =======================
   Validation Schema
======================= */
const schema = yup.object({
  name: yup.string().required('Full name is required'),
  email: yup
    .string()
    .email('Invalid email address')
    .required('Email is required'),
  password: yup
    .string()
    .min(6, 'Password must be at least 6 characters')
    .required('Password is required'),
}).required();

const Register = () => {
  const { register: registerAction } = useAuth();
  const navigate = useNavigate();

  const roles = ['admin', 'manajemen','finance','staff']; // ✅ Define roles here if needed, or remove if auto-assigned
  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm({
    resolver: yupResolver(schema),
  });

  const onSubmit = async (data) => {
    try {
      await registerAction(
        data.name,
        data.email,
        data.password,
        data.role,
        // 'admin' // ✅ auto-assigned role
      );

      toast.success('Account created successfully!');
      navigate('/dashboard');
    } catch (error) {
      console.error(error);
      const message =
        error.response?.data?.message ||
        'Registration failed. Please try again.';
      toast.error(message);
    }
  };

  return (
    <div className="min-h-screen w-full flex bg-gray-50">
      {/* Left Side */}
      <div className="hidden lg:flex lg:w-1/2 bg-brand-900 relative overflow-hidden items-center justify-center">
        <div className="absolute inset-0 bg-gradient-to-br from-brand-600 to-brand-900 opacity-90" />

        <div className="relative z-10 text-white p-12 text-center">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8 }}
          >
            <UserPlus size={80} className="mx-auto mb-6 text-brand-200" />
            <h1 className="text-4xl font-bold mb-4">Join Our System</h1>
            <p className="text-xl text-brand-100 max-w-md mx-auto">
              Create an account to start managing your inventory and tracking
              stock movements.
            </p>
          </motion.div>
        </div>

        <div className="absolute -top-20 -left-20 w-64 h-64 bg-brand-500 rounded-full blur-xl opacity-30 animate-blob" />
        <div className="absolute -bottom-20 -right-20 w-64 h-64 bg-brand-400 rounded-full blur-xl opacity-30 animate-blob animation-delay-2000" />
      </div>

      {/* Right Side */}
      <div className="flex-1 flex items-center justify-center p-8 overflow-y-auto">
        <motion.div
          initial={{ opacity: 0, x: 20 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ duration: 0.5 }}
          className="w-full max-w-md py-8"
        >
          <div className="bg-white p-8 rounded-2xl shadow-xl border border-gray-100">
            <div className="text-center mb-8">
              <h2 className="text-2xl font-bold text-gray-900">
                Create new account
              </h2>
              <p className="text-gray-500 mt-2">
                Fill in the details to register
              </p>
            </div>

            <form
              onSubmit={handleSubmit(onSubmit)}
              className="space-y-5"
            >
              <Input
                label="Full Name"
                type="text"
                placeholder="John Doe"
                error={errors.name}
                {...register('name')}
              />

              <Input
                label="Email Address"
                type="email"
                placeholder="john@example.com"
                error={errors.email}
                {...register('email')}
              />

              <Input
                label="Password"
                type="password"
                placeholder="••••••••"
                error={errors.password}
                {...register('password')}
              />

              <select
                label="Role"
                error={errors.role}
                className='w-full rounded-md border border-gray-300 shadow-md p-3'
                {...register('role')}
              >
                <option value="">Select a role</option>
                <option value="admin">Admin</option>
                <option value="management">Manajemen</option> {/* ✅ Ubah value jadi "management" */}
                <option value="finance">Finance</option>
                <option value="staff">Staff</option>
              </select>   

              <Button
                type="submit"
                className="w-full mt-4"
                size="lg"
                isLoading={isSubmitting}
              >
                Register
              </Button>

              <p className="text-center text-sm text-gray-600 mt-4">
                Already have an account?{' '}
                <Link
                  to="/login"
                  className="font-semibold text-brand-600 hover:underline"
                >
                  Sign in
                </Link>
              </p>
            </form>
          </div>
        </motion.div>
      </div>
    </div>
  );
};

export default Register;
