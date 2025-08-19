import React, { createContext, useContext, useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { API_ENDPOINTS } from '@/config/api';

export interface User {
  id: string;
  name: string;
  phone_number: string;
  role: 'customer' | 'admin' | 'superadmin';
  employee_id?: string;
}

interface AuthContextType {
  user: User | null;
  login: (phone_number: string, otp: string, role: 'customer' | 'admin') => Promise<boolean>;
  logout: () => void;
  signup: (userData: any) => Promise<boolean>;
  superAdminLogin: (phone_number: string, otp: string) => Promise<boolean>;
  generateOtp: (phone_number: string, role: 'customer' | 'admin' | 'superadmin', isSignup?: boolean) => Promise<boolean>;
  verifyOtp: (phone_number: string, otp: string) => Promise<boolean>;
  isLoading: boolean;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    // Check for stored auth data on mount
    const storedUser = localStorage.getItem('auth_user');
    if (storedUser) {
      try {
        setUser(JSON.parse(storedUser));
      } catch (error) {
        console.error('Error parsing stored user data:', error);
        localStorage.removeItem('auth_user');
      }
    }
    setIsLoading(false);
  }, []);

  const login = async (phone_number: string, otp: string, role: 'customer' | 'admin'): Promise<boolean> => {
    setIsLoading(true);

    try {
      if (role === 'customer') {
        // Check customer credentials in signup_users table
        const { data: customerData, error } = await supabase
          .from('signup_users')
          .select('*')
          .eq('phone_number', phone_number)
          .single();

        if (error || !customerData) {
          setIsLoading(false);
          return false;
        }

        // Verify OTP using the verifyOtp function
        const isOtpValid = await verifyOtp(phone_number, otp);
        if (!isOtpValid) {
          setIsLoading(false);
          return false;
        }

        const userData = {
          id: customerData.id.toString(),
          name: customerData.full_name,
          phone_number: customerData.phone_number,
          role: 'customer' as const,
        };

        setUser(userData);
        localStorage.setItem('auth_user', JSON.stringify(userData));
        setIsLoading(false);
        return true;
      } else {
        // Check admin credentials in employee_data table
        const { data: adminData, error } = await supabase
          .from('employee_data')
          .select('*')
          .eq('phone_number', phone_number)
          .single();

        if (error || !adminData) {
          setIsLoading(false);
          return false;
        }

        // Verify OTP using the verifyOtp function
        const isOtpValid = await verifyOtp(phone_number, otp);
        if (!isOtpValid) {
          setIsLoading(false);
          return false;
        }

        // Store login_time in Indian Standard Time (IST)
        const now = new Date();
        const istOffset = 5.5 * 60 * 60 * 1000; // 5 hours 30 minutes in milliseconds
        const istNow = new Date(now.getTime() + istOffset);
        const { error: loginLogError } = await supabase
          .from('employee_login_logs')
          .insert({
            employee_id: adminData.employee_id,
            login_time: istNow.toISOString()
          });

        if (loginLogError) {
          console.error('Failed to log admin login:', loginLogError);
          // Continue with login even if logging fails
        }

        const userData = {
          id: adminData.id.toString(),
          name: adminData.full_name,
          phone_number: adminData.phone_number,
          role: 'admin' as const,
          employee_id: adminData.employee_id,
        };

        setUser(userData);
        localStorage.setItem('auth_user', JSON.stringify(userData));
        setIsLoading(false);
        return true;
      }
    } catch (error) {
      console.error('Login error:', error);
      setIsLoading(false);
      return false;
    }
  };

  const superAdminLogin = async (phone_number: string, otp: string): Promise<boolean> => {
    setIsLoading(true);

    try {
      // Check super_admins table
      const { data: superAdminData, error: superAdminError } = await supabase
        .from('super_admins')
        .select('*')
        .eq('phone_number', phone_number)
        .single();

      if (superAdminError || !superAdminData) {
        setIsLoading(false);
        return false;
      }

      // Verify OTP using the verifyOtp function
      const isOtpValid = await verifyOtp(phone_number, otp);
      if (!isOtpValid) {
        setIsLoading(false);
        return false;
      }

      const userData = {
        id: superAdminData.id.toString(),
        name: superAdminData.full_name,
        phone_number: superAdminData.phone_number,
        role: 'superadmin' as const,
      };

      setUser(userData);
      localStorage.setItem('auth_user', JSON.stringify(userData));
      setIsLoading(false);
      return true;
    } catch (error) {
      console.error('Super admin login error:', error);
      setIsLoading(false);
      return false;
    }
  };

  const signup = async (userData: any): Promise<boolean> => {
    setIsLoading(true);

    try {
      // Check if user already exists
      const { data: existingUser } = await supabase
        .from('signup_users')
        .select('phone_number')
        .eq('phone_number', userData.phone_number)
        .single();

      if (existingUser) {
        setIsLoading(false);
        return false;
      }

      // Insert into signup_users directly (no login_users table)
      const { data: signupUser, error: signupError } = await supabase
        .from('signup_users')
        .insert({
          full_name: userData.name,
          phone_number: userData.phone_number,
          email: userData.email
        })
        .select()
        .single();

      if (signupError || !signupUser) {
        setIsLoading(false);
        return false;
      }

      const authData = {
        id: signupUser.user_id.toString(),
        name: signupUser.full_name,
        phone_number: signupUser.phone_number,
        role: 'customer' as const,
      };

      setUser(authData);
      localStorage.setItem('auth_user', JSON.stringify(authData));
      setIsLoading(false);
      return true;
    } catch (error) {
      console.error('Signup error:', error);
      setIsLoading(false);
      return false;
    }
  };

  // Debug function to check all phone numbers in database
  const debugPhoneNumbers = async () => {
    try {
      console.log('🔍 Debugging: Fetching all phone numbers from database...');
      
      const { data: customers, error: customerError } = await supabase
        .from('signup_users')
        .select('phone_number, full_name');
      console.log('📱 Customers in database:', customers, customerError);
      
      const { data: admins, error: adminError } = await supabase
        .from('employee_data')
        .select('phone_number, full_name');
      console.log('👨‍💼 Admins in database:', admins, adminError);
      
      const { data: superAdmins, error: superAdminError } = await supabase
        .from('super_admins')
        .select('phone_number, full_name');
      console.log('👑 Super admins in database:', superAdmins, superAdminError);
    } catch (error) {
      console.error('❌ Error fetching phone numbers:', error);
    }
  };

  const generateOtp = async (phone_number: string, role: 'customer' | 'admin' | 'superadmin', isSignup: boolean = false): Promise<boolean> => {
    try {
      console.log(`🔍 Generating OTP for phone: ${phone_number}, role: ${role}, isSignup: ${isSignup}`);
      
      // Use the backend API for OTP generation
      const response = await fetch(API_ENDPOINTS.AUTH.SEND_OTP, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          phoneNumber: phone_number,
          name: null // Optional name parameter
        })
      });

      const result = await response.json();
      
      console.log('📱 Backend OTP response:', result);

      if (!result.success) {
        console.error(`❌ Backend OTP generation failed: ${result.message || result.error}`);
        return false;
      }

      console.log(`✅ OTP generated successfully for ${phone_number}`);
      return true;
    } catch (error) {
      console.error('Generate OTP error:', error);
      return false;
    }
  };

  const verifyOtp = async (phone_number: string, otp: string): Promise<boolean> => {
    try {
      console.log(`🔐 Verifying OTP for phone: ${phone_number}`);
      
      // Use the backend API for OTP verification
      const response = await fetch(API_ENDPOINTS.AUTH.VERIFY_OTP, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          phoneNumber: phone_number,
          otp: otp
        })
      });

      const result = await response.json();
      
      console.log('🔐 Backend OTP verification response:', result);

      if (!result.success) {
        console.error(`❌ Backend OTP verification failed: ${result.message || result.error}`);
        return false;
      }

      console.log(`✅ OTP verified successfully for ${phone_number}`);
      return true;
    } catch (error) {
      console.error('Verify OTP error:', error);
      return false;
    }
  };

  const logout = () => {
    setUser(null);
    localStorage.removeItem('auth_user');
  };

  const value = {
    user,
    login,
    logout,
    signup,
    superAdminLogin,
    generateOtp,
    verifyOtp,
    isLoading,
    debugPhoneNumbers,
  };

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
};
