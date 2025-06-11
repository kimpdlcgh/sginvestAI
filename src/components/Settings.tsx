import React, { useState, useEffect } from 'react';
import { 
  Settings as SettingsIcon, 
  User, 
  Bell, 
  Shield, 
  Palette, 
  Globe, 
  DollarSign,
  Moon,
  Sun,
  Monitor,
  Smartphone,
  Mail,
  Lock,
  Eye,
  EyeOff,
  Download,
  Upload,
  Trash2,
  Save,
  RefreshCw,
  MapPin,
  Phone,
  Building,
  CreditCard,
  Calendar,
  Flag,
  CheckCircle,
  AlertCircle,
  Loader2
} from 'lucide-react';
import { useAuth } from '../hooks/useAuth';
import { supabase } from '../lib/supabase';

export const Settings: React.FC = () => {
  const { user, updatePassword } = useAuth();
  const [activeSection, setActiveSection] = useState('profile');
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState('');
  const [error, setError] = useState('');
  
  // Profile data state
  const [profileData, setProfileData] = useState({
    first_name: '',
    last_name: '',
    middle_name: '',
    date_of_birth: '',
    gender: '',
    nationality: '',
    primary_phone: '',
    secondary_phone: '',
    whatsapp_number: '',
    emergency_contact: '',
    language: 'English (US)',
    timezone: 'America/New_York (EST)',
    currency: 'USD',
    date_format: 'MM/DD/YYYY',
    number_format: 'US',
    week_start: 'Sunday',
    risk_tolerance: '',
    investment_experience: '',
    investment_horizon: '',
    annual_income: '',
    net_worth: '',
    employment_status: '',
  });

  // Password change state
  const [passwordData, setPasswordData] = useState({
    currentPassword: '',
    newPassword: '',
    confirmPassword: '',
    showPasswords: false
  });

  const [darkMode, setDarkMode] = useState(true);
  const [notifications, setNotifications] = useState({
    email: true,
    push: true,
    sms: false,
    priceAlerts: true,
    newsUpdates: true,
    portfolioSummary: true
  });

  // Load profile data on component mount
  useEffect(() => {
    if (user) {
      loadProfileData();
    }
  }, [user]);

  const loadProfileData = async () => {
    if (!user) return;
    
    setLoading(true);
    try {
      const { data, error } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', user.id)
        .single();

      if (error && error.code !== 'PGRST116') {
        console.error('Error loading profile:', error);
        setError('Failed to load profile data');
        return;
      }

      if (data) {
        setProfileData({
          first_name: data.first_name || '',
          last_name: data.last_name || '',
          middle_name: data.middle_name || '',
          date_of_birth: data.date_of_birth || '',
          gender: data.gender || '',
          nationality: data.nationality || '',
          primary_phone: data.primary_phone || '',
          secondary_phone: data.secondary_phone || '',
          whatsapp_number: data.whatsapp_number || '',
          emergency_contact: data.emergency_contact || '',
          language: data.language || 'English (US)',
          timezone: data.timezone || 'America/New_York (EST)',
          currency: data.currency || 'USD',
          date_format: data.date_format || 'MM/DD/YYYY',
          number_format: data.number_format || 'US',
          week_start: data.week_start || 'Sunday',
          risk_tolerance: data.risk_tolerance || '',
          investment_experience: data.investment_experience || '',
          investment_horizon: data.investment_horizon || '',
          annual_income: data.annual_income || '',
          net_worth: data.net_worth || '',
          employment_status: data.employment_status || '',
        });
      }
    } catch (err) {
      console.error('Error loading profile:', err);
      setError('Failed to load profile data');
    } finally {
      setLoading(false);
    }
  };

  const handleProfileSave = async () => {
    if (!user) return;

    setSaving(true);
    setError('');
    setMessage('');

    try {
      const { error } = await supabase
        .from('profiles')
        .upsert({
          id: user.id,
          email: user.email,
          ...profileData,
          updated_at: new Date().toISOString()
        });

      if (error) {
        throw error;
      }

      setMessage('Profile saved successfully!');
      setTimeout(() => setMessage(''), 3000);
    } catch (err: any) {
      console.error('Error saving profile:', err);
      setError(err.message || 'Failed to save profile');
    } finally {
      setSaving(false);
    }
  };

  const handlePasswordChange = async () => {
    if (!passwordData.newPassword || !passwordData.confirmPassword) {
      setError('Please fill in all password fields');
      return;
    }

    if (passwordData.newPassword !== passwordData.confirmPassword) {
      setError('New passwords do not match');
      return;
    }

    if (passwordData.newPassword.length < 6) {
      setError('Password must be at least 6 characters');
      return;
    }

    setSaving(true);
    setError('');
    setMessage('');

    try {
      const { error } = await updatePassword(passwordData.newPassword);
      
      if (error) {
        throw error;
      }

      setMessage('Password updated successfully!');
      setPasswordData({
        currentPassword: '',
        newPassword: '',
        confirmPassword: '',
        showPasswords: false
      });
      setTimeout(() => setMessage(''), 3000);
    } catch (err: any) {
      console.error('Error updating password:', err);
      setError(err.message || 'Failed to update password');
    } finally {
      setSaving(false);
    }
  };

  const settingSections = [
    { id: 'profile', label: 'Profile', icon: User },
    { id: 'security', label: 'Security', icon: Shield },
    { id: 'notifications', label: 'Notifications', icon: Bell },
    { id: 'appearance', label: 'Appearance', icon: Palette },
    { id: 'preferences', label: 'Preferences', icon: SettingsIcon },
    { id: 'data', label: 'Data & Export', icon: Download }
  ];

  const countries = [
    'United States', 'Canada', 'United Kingdom', 'Germany', 'France', 'Japan', 
    'Australia', 'Singapore', 'Switzerland', 'Netherlands', 'Sweden', 'Norway',
    'Denmark', 'Finland', 'Austria', 'Belgium', 'Ireland', 'New Zealand',
    'South Korea', 'Hong Kong', 'Luxembourg', 'Italy', 'Spain', 'Portugal'
  ];

  const currencies = [
    { code: 'USD', name: 'US Dollar', symbol: '$' },
    { code: 'EUR', name: 'Euro', symbol: '€' },
    { code: 'GBP', name: 'British Pound', symbol: '£' },
    { code: 'JPY', name: 'Japanese Yen', symbol: '¥' },
    { code: 'CAD', name: 'Canadian Dollar', symbol: 'C$' },
    { code: 'AUD', name: 'Australian Dollar', symbol: 'A$' },
    { code: 'CHF', name: 'Swiss Franc', symbol: 'CHF' },
    { code: 'SGD', name: 'Singapore Dollar', symbol: 'S$' },
    { code: 'SEK', name: 'Swedish Krona', symbol: 'kr' },
    { code: 'NOK', name: 'Norwegian Krone', symbol: 'kr' }
  ];

  const languages = [
    'English (US)', 'English (UK)', 'French', 'German', 'Spanish', 'Italian',
    'Portuguese', 'Dutch', 'Swedish', 'Norwegian', 'Danish', 'Finnish',
    'Japanese', 'Korean', 'Chinese (Simplified)', 'Chinese (Traditional)'
  ];

  const timezones = [
    'Pacific/Honolulu (HST)', 'America/Anchorage (AKST)', 'America/Los_Angeles (PST)',
    'America/Denver (MST)', 'America/Chicago (CST)', 'America/New_York (EST)',
    'America/Toronto (EST)', 'Europe/London (GMT)', 'Europe/Paris (CET)',
    'Europe/Berlin (CET)', 'Europe/Zurich (CET)', 'Europe/Stockholm (CET)',
    'Asia/Tokyo (JST)', 'Asia/Seoul (KST)', 'Asia/Singapore (SGT)',
    'Asia/Hong_Kong (HKT)', 'Australia/Sydney (AEDT)', 'Pacific/Auckland (NZDT)'
  ];

  const renderProfile = () => (
    <div className="space-y-8">
      {/* Personal Information */}
      <div>
        <h3 className="text-lg font-semibold text-white mb-6 flex items-center space-x-2">
          <User className="w-5 h-5 text-blue-400" />
          <span>Personal Information</span>
        </h3>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div>
            <label className="block text-sm font-medium text-slate-300 mb-2">First Name *</label>
            <input
              type="text"
              value={profileData.first_name}
              onChange={(e) => setProfileData(prev => ({ ...prev, first_name: e.target.value }))}
              className="w-full px-4 py-3 bg-slate-700/50 border border-slate-600 rounded-lg text-white placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              placeholder="Enter your first name"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-slate-300 mb-2">Last Name *</label>
            <input
              type="text"
              value={profileData.last_name}
              onChange={(e) => setProfileData(prev => ({ ...prev, last_name: e.target.value }))}
              className="w-full px-4 py-3 bg-slate-700/50 border border-slate-600 rounded-lg text-white placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              placeholder="Enter your last name"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-slate-300 mb-2">Middle Name</label>
            <input
              type="text"
              value={profileData.middle_name}
              onChange={(e) => setProfileData(prev => ({ ...prev, middle_name: e.target.value }))}
              className="w-full px-4 py-3 bg-slate-700/50 border border-slate-600 rounded-lg text-white placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              placeholder="Optional"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-slate-300 mb-2">Date of Birth</label>
            <input
              type="date"
              value={profileData.date_of_birth}
              onChange={(e) => setProfileData(prev => ({ ...prev, date_of_birth: e.target.value }))}
              className="w-full px-4 py-3 bg-slate-700/50 border border-slate-600 rounded-lg text-white placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-slate-300 mb-2">Gender</label>
            <select 
              value={profileData.gender}
              onChange={(e) => setProfileData(prev => ({ ...prev, gender: e.target.value }))}
              className="w-full px-4 py-3 bg-slate-700/50 border border-slate-600 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            >
              <option value="">Prefer not to say</option>
              <option value="male">Male</option>
              <option value="female">Female</option>
              <option value="other">Other</option>
            </select>
          </div>
          <div>
            <label className="block text-sm font-medium text-slate-300 mb-2">Nationality</label>
            <select 
              value={profileData.nationality}
              onChange={(e) => setProfileData(prev => ({ ...prev, nationality: e.target.value }))}
              className="w-full px-4 py-3 bg-slate-700/50 border border-slate-600 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            >
              <option value="">Select nationality</option>
              {countries.map(country => (
                <option key={country} value={country}>{country}</option>
              ))}
            </select>
          </div>
        </div>
      </div>

      {/* Contact Information */}
      <div>
        <h3 className="text-lg font-semibold text-white mb-6 flex items-center space-x-2">
          <Phone className="w-5 h-5 text-green-400" />
          <span>Contact Information</span>
        </h3>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div>
            <label className="block text-sm font-medium text-slate-300 mb-2">Primary Phone</label>
            <input
              type="tel"
              value={profileData.primary_phone}
              onChange={(e) => setProfileData(prev => ({ ...prev, primary_phone: e.target.value }))}
              className="w-full px-4 py-3 bg-slate-700/50 border border-slate-600 rounded-lg text-white placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              placeholder="(555) 123-4567"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-slate-300 mb-2">Secondary Phone</label>
            <input
              type="tel"
              value={profileData.secondary_phone}
              onChange={(e) => setProfileData(prev => ({ ...prev, secondary_phone: e.target.value }))}
              className="w-full px-4 py-3 bg-slate-700/50 border border-slate-600 rounded-lg text-white placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              placeholder="Optional"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-slate-300 mb-2">WhatsApp Number</label>
            <input
              type="tel"
              value={profileData.whatsapp_number}
              onChange={(e) => setProfileData(prev => ({ ...prev, whatsapp_number: e.target.value }))}
              className="w-full px-4 py-3 bg-slate-700/50 border border-slate-600 rounded-lg text-white placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              placeholder="For WhatsApp notifications"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-slate-300 mb-2">Emergency Contact</label>
            <input
              type="tel"
              value={profileData.emergency_contact}
              onChange={(e) => setProfileData(prev => ({ ...prev, emergency_contact: e.target.value }))}
              className="w-full px-4 py-3 bg-slate-700/50 border border-slate-600 rounded-lg text-white placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              placeholder="Emergency contact number"
            />
          </div>
        </div>
      </div>

      {/* International Settings */}
      <div>
        <h3 className="text-lg font-semibold text-white mb-6 flex items-center space-x-2">
          <Globe className="w-5 h-5 text-orange-400" />
          <span>International Settings</span>
        </h3>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div>
            <label className="block text-sm font-medium text-slate-300 mb-2">Primary Language</label>
            <select 
              value={profileData.language}
              onChange={(e) => setProfileData(prev => ({ ...prev, language: e.target.value }))}
              className="w-full px-4 py-3 bg-slate-700/50 border border-slate-600 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            >
              {languages.map(lang => (
                <option key={lang} value={lang}>{lang}</option>
              ))}
            </select>
          </div>
          <div>
            <label className="block text-sm font-medium text-slate-300 mb-2">Time Zone</label>
            <select 
              value={profileData.timezone}
              onChange={(e) => setProfileData(prev => ({ ...prev, timezone: e.target.value }))}
              className="w-full px-4 py-3 bg-slate-700/50 border border-slate-600 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            >
              {timezones.map(tz => (
                <option key={tz} value={tz}>{tz}</option>
              ))}
            </select>
          </div>
          <div>
            <label className="block text-sm font-medium text-slate-300 mb-2">Primary Currency</label>
            <select 
              value={profileData.currency}
              onChange={(e) => setProfileData(prev => ({ ...prev, currency: e.target.value }))}
              className="w-full px-4 py-3 bg-slate-700/50 border border-slate-600 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            >
              {currencies.map(currency => (
                <option key={currency.code} value={currency.code}>
                  {currency.code} - {currency.name} ({currency.symbol})
                </option>
              ))}
            </select>
          </div>
          <div>
            <label className="block text-sm font-medium text-slate-300 mb-2">Date Format</label>
            <select 
              value={profileData.date_format}
              onChange={(e) => setProfileData(prev => ({ ...prev, date_format: e.target.value }))}
              className="w-full px-4 py-3 bg-slate-700/50 border border-slate-600 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            >
              <option value="MM/DD/YYYY">MM/DD/YYYY (US)</option>
              <option value="DD/MM/YYYY">DD/MM/YYYY (EU)</option>
              <option value="YYYY-MM-DD">YYYY-MM-DD (ISO)</option>
              <option value="DD.MM.YYYY">DD.MM.YYYY (German)</option>
              <option value="DD/MM/YY">DD/MM/YY (Short)</option>
            </select>
          </div>
        </div>
      </div>
      
      {/* Investment Profile */}
      <div>
        <h3 className="text-lg font-semibold text-white mb-6 flex items-center space-x-2">
          <CreditCard className="w-5 h-5 text-yellow-400" />
          <span>Investment Profile</span>
        </h3>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div>
            <label className="block text-sm font-medium text-slate-300 mb-2">Risk Tolerance</label>
            <select 
              value={profileData.risk_tolerance}
              onChange={(e) => setProfileData(prev => ({ ...prev, risk_tolerance: e.target.value }))}
              className="w-full px-4 py-3 bg-slate-700/50 border border-slate-600 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            >
              <option value="">Select risk tolerance</option>
              <option value="conservative">Conservative</option>
              <option value="moderate">Moderate</option>
              <option value="aggressive">Aggressive</option>
              <option value="very-aggressive">Very Aggressive</option>
            </select>
          </div>
          <div>
            <label className="block text-sm font-medium text-slate-300 mb-2">Investment Experience</label>
            <select 
              value={profileData.investment_experience}
              onChange={(e) => setProfileData(prev => ({ ...prev, investment_experience: e.target.value }))}
              className="w-full px-4 py-3 bg-slate-700/50 border border-slate-600 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            >
              <option value="">Select experience level</option>
              <option value="beginner">Beginner (&lt; 1 year)</option>
              <option value="intermediate">Intermediate (1-5 years)</option>
              <option value="advanced">Advanced (5-10 years)</option>
              <option value="professional">Professional (10+ years)</option>
            </select>
          </div>
          <div>
            <label className="block text-sm font-medium text-slate-300 mb-2">Investment Horizon</label>
            <select 
              value={profileData.investment_horizon}
              onChange={(e) => setProfileData(prev => ({ ...prev, investment_horizon: e.target.value }))}
              className="w-full px-4 py-3 bg-slate-700/50 border border-slate-600 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            >
              <option value="">Select investment horizon</option>
              <option value="short">Short-term (&lt; 2 years)</option>
              <option value="medium">Medium-term (2-5 years)</option>
              <option value="long">Long-term (5-10 years)</option>
              <option value="retirement">Retirement (10+ years)</option>
            </select>
          </div>
          <div>
            <label className="block text-sm font-medium text-slate-300 mb-2">Annual Income Range</label>
            <select 
              value={profileData.annual_income}
              onChange={(e) => setProfileData(prev => ({ ...prev, annual_income: e.target.value }))}
              className="w-full px-4 py-3 bg-slate-700/50 border border-slate-600 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            >
              <option value="">Prefer not to say</option>
              <option value="under-50k">Under $50,000</option>
              <option value="50k-100k">$50,000 - $100,000</option>
              <option value="100k-250k">$100,000 - $250,000</option>
              <option value="250k-500k">$250,000 - $500,000</option>
              <option value="500k-1m">$500,000 - $1,000,000</option>
              <option value="over-1m">Over $1,000,000</option>
            </select>
          </div>
          <div>
            <label className="block text-sm font-medium text-slate-300 mb-2">Net Worth Range</label>
            <select 
              value={profileData.net_worth}
              onChange={(e) => setProfileData(prev => ({ ...prev, net_worth: e.target.value }))}
              className="w-full px-4 py-3 bg-slate-700/50 border border-slate-600 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            >
              <option value="">Prefer not to say</option>
              <option value="under-100k">Under $100,000</option>
              <option value="100k-500k">$100,000 - $500,000</option>
              <option value="500k-1m">$500,000 - $1,000,000</option>
              <option value="1m-5m">$1,000,000 - $5,000,000</option>
              <option value="over-5m">Over $5,000,000</option>
            </select>
          </div>
          <div>
            <label className="block text-sm font-medium text-slate-300 mb-2">Employment Status</label>
            <select 
              value={profileData.employment_status}
              onChange={(e) => setProfileData(prev => ({ ...prev, employment_status: e.target.value }))}
              className="w-full px-4 py-3 bg-slate-700/50 border border-slate-600 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            >
              <option value="">Select employment status</option>
              <option value="employed">Employed</option>
              <option value="self-employed">Self-employed</option>
              <option value="unemployed">Unemployed</option>
              <option value="retired">Retired</option>
              <option value="student">Student</option>
              <option value="other">Other</option>
            </select>
          </div>
        </div>
      </div>
    </div>
  );

  const renderSecurity = () => (
    <div className="space-y-8">
      {/* Password Change */}
      <div>
        <h3 className="text-lg font-semibold text-white mb-6 flex items-center space-x-2">
          <Lock className="w-5 h-5 text-red-400" />
          <span>Change Password</span>
        </h3>
        
        <div className="bg-slate-700/30 rounded-lg p-6 border border-slate-600/50">
          <div className="space-y-6">
            <div>
              <label className="block text-sm font-medium text-slate-300 mb-2">New Password</label>
              <div className="relative">
                <Lock className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-slate-400" />
                <input
                  type={passwordData.showPasswords ? 'text' : 'password'}
                  value={passwordData.newPassword}
                  onChange={(e) => setPasswordData(prev => ({ ...prev, newPassword: e.target.value }))}
                  className="w-full pl-10 pr-12 py-3 bg-slate-700/50 border border-slate-600 rounded-lg text-white placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  placeholder="Enter new password"
                />
                <button
                  type="button"
                  onClick={() => setPasswordData(prev => ({ ...prev, showPasswords: !prev.showPasswords }))}
                  className="absolute right-3 top-1/2 transform -translate-y-1/2 text-slate-400 hover:text-white transition-colors"
                >
                  {passwordData.showPasswords ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
                </button>
              </div>
              <p className="text-xs text-slate-400 mt-1">Must be at least 6 characters</p>
            </div>

            <div>
              <label className="block text-sm font-medium text-slate-300 mb-2">Confirm New Password</label>
              <div className="relative">
                <Lock className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-slate-400" />
                <input
                  type={passwordData.showPasswords ? 'text' : 'password'}
                  value={passwordData.confirmPassword}
                  onChange={(e) => setPasswordData(prev => ({ ...prev, confirmPassword: e.target.value }))}
                  className="w-full pl-10 pr-4 py-3 bg-slate-700/50 border border-slate-600 rounded-lg text-white placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  placeholder="Confirm new password"
                />
              </div>
            </div>

            {/* Password Strength Indicator */}
            {passwordData.newPassword && (
              <div className="space-y-2">
                <p className="text-sm text-slate-400">Password strength:</p>
                <div className="flex space-x-1">
                  <div className={`h-2 flex-1 rounded ${passwordData.newPassword.length >= 6 ? 'bg-green-500' : 'bg-slate-600'}`}></div>
                  <div className={`h-2 flex-1 rounded ${passwordData.newPassword.length >= 8 ? 'bg-green-500' : 'bg-slate-600'}`}></div>
                  <div className={`h-2 flex-1 rounded ${/[A-Z]/.test(passwordData.newPassword) ? 'bg-green-500' : 'bg-slate-600'}`}></div>
                  <div className={`h-2 flex-1 rounded ${/[0-9]/.test(passwordData.newPassword) ? 'bg-green-500' : 'bg-slate-600'}`}></div>
                </div>
                <div className="text-xs text-slate-400 space-y-1">
                  <p className={passwordData.newPassword.length >= 6 ? 'text-green-400' : ''}>✓ At least 6 characters</p>
                  <p className={passwordData.newPassword.length >= 8 ? 'text-green-400' : ''}>✓ 8+ characters (recommended)</p>
                  <p className={/[A-Z]/.test(passwordData.newPassword) ? 'text-green-400' : ''}>✓ Uppercase letter</p>
                  <p className={/[0-9]/.test(passwordData.newPassword) ? 'text-green-400' : ''}>✓ Number</p>
                </div>
              </div>
            )}

            <button
              onClick={handlePasswordChange}
              disabled={saving || !passwordData.newPassword || !passwordData.confirmPassword}
              className="flex items-center space-x-2 px-6 py-3 bg-red-500 hover:bg-red-600 text-white rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {saving && <Loader2 className="w-4 h-4 animate-spin" />}
              <span>{saving ? 'Updating Password...' : 'Update Password'}</span>
            </button>
          </div>
        </div>
      </div>

      {/* Account Security Info */}
      <div>
        <h3 className="text-lg font-semibold text-white mb-4">Account Security</h3>
        <div className="space-y-4">
          <div className="flex items-center justify-between p-4 bg-slate-700/30 rounded-lg">
            <div className="flex items-center space-x-3">
              <Shield className="w-5 h-5 text-green-400" />
              <div>
                <span className="text-white font-medium">Account Status</span>
                <p className="text-sm text-slate-400">Your account is secure and verified</p>
              </div>
            </div>
            <span className="px-2 py-1 bg-green-500/20 text-green-400 text-sm rounded-full">
              Active
            </span>
          </div>
          
          <div className="flex items-center justify-between p-4 bg-slate-700/30 rounded-lg">
            <div className="flex items-center space-x-3">
              <Mail className="w-5 h-5 text-blue-400" />
              <div>
                <span className="text-white font-medium">Email Verification</span>
                <p className="text-sm text-slate-400">Your email address is verified</p>
              </div>
            </div>
            <span className="px-2 py-1 bg-green-500/20 text-green-400 text-sm rounded-full">
              Verified
            </span>
          </div>
        </div>
      </div>
    </div>
  );

  const renderNotifications = () => (
    <div className="space-y-6">
      <div>
        <h3 className="text-lg font-semibold text-white mb-4">Notification Channels</h3>
        <div className="space-y-4">
          {Object.entries({
            email: { label: 'Email Notifications', icon: Mail },
            push: { label: 'Push Notifications', icon: Smartphone },
            sms: { label: 'SMS Notifications', icon: Smartphone }
          }).map(([key, { label, icon: Icon }]) => (
            <div key={key} className="flex items-center justify-between p-4 bg-slate-700/30 rounded-lg">
              <div className="flex items-center space-x-3">
                <Icon className="w-5 h-5 text-slate-400" />
                <span className="text-white font-medium">{label}</span>
              </div>
              <button
                onClick={() => setNotifications(prev => ({ ...prev, [key]: !prev[key as keyof typeof prev] }))}
                className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${
                  notifications[key as keyof typeof notifications] ? 'bg-blue-500' : 'bg-slate-600'
                }`}
              >
                <span className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
                  notifications[key as keyof typeof notifications] ? 'translate-x-6' : 'translate-x-1'
                }`} />
              </button>
            </div>
          ))}
        </div>
      </div>

      <div>
        <h3 className="text-lg font-semibold text-white mb-4">Alert Types</h3>
        <div className="space-y-4">
          {Object.entries({
            priceAlerts: 'Price Alerts',
            newsUpdates: 'Market News Updates',
            portfolioSummary: 'Daily Portfolio Summary'
          }).map(([key, label]) => (
            <div key={key} className="flex items-center justify-between p-4 bg-slate-700/30 rounded-lg">
              <span className="text-white font-medium">{label}</span>
              <button
                onClick={() => setNotifications(prev => ({ ...prev, [key]: !prev[key as keyof typeof prev] }))}
                className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${
                  notifications[key as keyof typeof notifications] ? 'bg-blue-500' : 'bg-slate-600'
                }`}
              >
                <span className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
                  notifications[key as keyof typeof notifications] ? 'translate-x-6' : 'translate-x-1'
                }`} />
              </button>
            </div>
          ))}
        </div>
      </div>
    </div>
  );

  const renderAppearance = () => (
    <div className="space-y-6">
      <div>
        <h3 className="text-lg font-semibold text-white mb-4">Theme</h3>
        <div className="grid grid-cols-3 gap-4">
          {[
            { id: 'dark', label: 'Dark', icon: Moon },
            { id: 'light', label: 'Light', icon: Sun },
            { id: 'system', label: 'System', icon: Monitor }
          ].map(({ id, label, icon: Icon }) => (
            <button
              key={id}
              className={`p-4 rounded-lg border-2 transition-all ${
                (id === 'dark' && darkMode) ? 'border-blue-500 bg-blue-500/10' : 'border-slate-600 bg-slate-700/30 hover:border-slate-500'
              }`}
            >
              <Icon className="w-6 h-6 text-slate-400 mx-auto mb-2" />
              <span className="text-white text-sm">{label}</span>
            </button>
          ))}
        </div>
      </div>

      <div>
        <h3 className="text-lg font-semibold text-white mb-4">Display Options</h3>
        <div className="space-y-4">
          <div className="flex items-center justify-between p-4 bg-slate-700/30 rounded-lg">
            <span className="text-white font-medium">Compact Mode</span>
            <button className="relative inline-flex h-6 w-11 items-center rounded-full bg-slate-600">
              <span className="inline-block h-4 w-4 transform rounded-full bg-white transition-transform translate-x-1" />
            </button>
          </div>
          
          <div className="flex items-center justify-between p-4 bg-slate-700/30 rounded-lg">
            <span className="text-white font-medium">Show Animations</span>
            <button className="relative inline-flex h-6 w-11 items-center rounded-full bg-blue-500">
              <span className="inline-block h-4 w-4 transform rounded-full bg-white transition-transform translate-x-6" />
            </button>
          </div>
        </div>
      </div>
    </div>
  );

  const renderPreferences = () => (
    <div className="space-y-6">
      <div>
        <h3 className="text-lg font-semibold text-white mb-4">Currency & Region</h3>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div>
            <label className="block text-sm font-medium text-slate-300 mb-2">Default Currency</label>
            <select 
              value={profileData.currency}
              onChange={(e) => setProfileData(prev => ({ ...prev, currency: e.target.value }))}
              className="w-full px-4 py-3 bg-slate-700/50 border border-slate-600 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            >
              {currencies.map(currency => (
                <option key={currency.code} value={currency.code}>
                  {currency.code} - {currency.name}
                </option>
              ))}
            </select>
          </div>
          <div>
            <label className="block text-sm font-medium text-slate-300 mb-2">Date Format</label>
            <select 
              value={profileData.date_format}
              onChange={(e) => setProfileData(prev => ({ ...prev, date_format: e.target.value }))}
              className="w-full px-4 py-3 bg-slate-700/50 border border-slate-600 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            >
              <option value="MM/DD/YYYY">MM/DD/YYYY</option>
              <option value="DD/MM/YYYY">DD/MM/YYYY</option>
              <option value="YYYY-MM-DD">YYYY-MM-DD</option>
            </select>
          </div>
        </div>
      </div>
    </div>
  );

  const renderDataExport = () => (
    <div className="space-y-6">
      <div>
        <h3 className="text-lg font-semibold text-white mb-4">Export Data</h3>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <button className="p-4 bg-slate-700/30 rounded-lg hover:bg-slate-700/50 transition-colors text-left">
            <div className="flex items-center space-x-3 mb-2">
              <Download className="w-5 h-5 text-blue-400" />
              <span className="text-white font-medium">Portfolio Data</span>
            </div>
            <p className="text-sm text-slate-400">Export your complete portfolio history and transactions</p>
          </button>
          
          <button className="p-4 bg-slate-700/30 rounded-lg hover:bg-slate-700/50 transition-colors text-left">
            <div className="flex items-center space-x-3 mb-2">
              <Download className="w-5 h-5 text-green-400" />
              <span className="text-white font-medium">Performance Reports</span>
            </div>
            <p className="text-sm text-slate-400">Download detailed performance analytics and reports</p>
          </button>
        </div>
      </div>
    </div>
  );

  const renderContent = () => {
    switch (activeSection) {
      case 'profile': return renderProfile();
      case 'security': return renderSecurity();
      case 'notifications': return renderNotifications();
      case 'appearance': return renderAppearance();
      case 'preferences': return renderPreferences();
      case 'data': return renderDataExport();
      default: return renderProfile();
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="text-center">
          <Loader2 className="w-8 h-8 text-blue-400 mx-auto mb-4 animate-spin" />
          <p className="text-slate-400">Loading profile...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="grid grid-cols-1 lg:grid-cols-4 gap-8">
      {/* Settings Navigation */}
      <div className="lg:col-span-1">
        <div className="bg-slate-800/50 backdrop-blur-sm border border-slate-700/50 rounded-xl p-4 sticky top-8">
          <h2 className="text-lg font-semibold text-white mb-4">Settings</h2>
          <nav className="space-y-1">
            {settingSections.map((section) => {
              const Icon = section.icon;
              const isActive = activeSection === section.id;
              
              return (
                <button
                  key={section.id}
                  onClick={() => setActiveSection(section.id)}
                  className={`w-full flex items-center space-x-3 px-3 py-2.5 rounded-lg transition-all duration-200 text-left ${
                    isActive
                      ? 'bg-blue-500/20 border border-blue-500/30 text-white'
                      : 'text-slate-400 hover:text-white hover:bg-slate-700/50'
                  }`}
                >
                  <Icon className={`w-4 h-4 ${isActive ? 'text-blue-400' : ''}`} />
                  <span className="font-medium">{section.label}</span>
                </button>
              );
            })}
          </nav>
        </div>
      </div>

      {/* Settings Content */}
      <div className="lg:col-span-3">
        <div className="bg-slate-800/50 backdrop-blur-sm border border-slate-700/50 rounded-xl p-6">
          {/* Status Messages */}
          {message && (
            <div className="mb-6 p-4 bg-green-500/10 border border-green-500/20 rounded-lg flex items-center space-x-3">
              <CheckCircle className="w-5 h-5 text-green-400" />
              <span className="text-green-400">{message}</span>
            </div>
          )}

          {error && (
            <div className="mb-6 p-4 bg-red-500/10 border border-red-500/20 rounded-lg flex items-center space-x-3">
              <AlertCircle className="w-5 h-5 text-red-400" />
              <span className="text-red-400">{error}</span>
            </div>
          )}

          {renderContent()}
          
          {/* Save Button - Only show for profile and preferences */}
          {(activeSection === 'profile' || activeSection === 'preferences') && (
            <div className="flex justify-end mt-8 pt-6 border-t border-slate-700/50">
              <button 
                onClick={handleProfileSave}
                disabled={saving}
                className="flex items-center space-x-2 px-6 py-3 bg-blue-500 hover:bg-blue-600 text-white rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {saving && <Loader2 className="w-4 h-4 animate-spin" />}
                <Save className="w-4 h-4" />
                <span>{saving ? 'Saving...' : 'Save Changes'}</span>
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};