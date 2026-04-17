// These codes are for SEO & SMTP mails - start

import { useEffect, useState } from 'react';
import axios from 'axios';
import {
  Mail,
  Globe,
  CheckCircle,
  AlertCircle,
  Loader2,
  ArrowRight,
  Power,
  Trash2,
  RefreshCcw,
  Search,
} from 'lucide-react';

const API = import.meta.env.VITE_BACKEND_URL;
const GLOBAL_SEO_ROUTE = '/';
const GLOBAL_SEO_PAGE_NAME = 'SBOM Full Global Settings';

const defaultEmailConfig = {
  provider: 'gmail',
  host: 'smtp.gmail.com',
  port: 587,
  secure: false,
  username: '',
  password: '',
  fromName: 'RNT Infosec LLP Security Team',
  fromEmail: '',
  isActive: true,
};

const defaultSeoTags = {
  siteTitle: 'SBOM Full - Security Dashboard & Global SEO',
  metaDescription:
    'Admin controls for SMTP delivery and global SEO metadata across the SBOM Full security platform.',
  keywords:
    'sbom, sbom full, security dashboard, vulnerability scanning, software bill of materials, rnt infosec',
  canonicalUrl: 'https://sbom-full.local',
  ogImage: '/RNTlogo.jpg',
};

const mapEmailConfigResponseToForm = (data = {}) => ({
  provider: data.provider || defaultEmailConfig.provider,
  host: data.host || defaultEmailConfig.host,
  port: data.port || defaultEmailConfig.port,
  secure: data.secure ?? defaultEmailConfig.secure,
  username: data.username || '',
  password: '',
  fromName: data.fromName || defaultEmailConfig.fromName,
  fromEmail: data.fromEmail || '',
  isActive: data.isActive ?? false,
});

const mapSeoResponseToForm = (data = {}) => ({
  siteTitle: data.metaTitle || data.openGraph?.title || defaultSeoTags.siteTitle,
  metaDescription: data.metaDescription || data.openGraph?.description || defaultSeoTags.metaDescription,
  keywords: Array.isArray(data.keywords) ? data.keywords.join(', ') : defaultSeoTags.keywords,
  canonicalUrl:
    data.canonicalUrl ||
    (data.route === GLOBAL_SEO_ROUTE
      ? defaultSeoTags.canonicalUrl
      : `${defaultSeoTags.canonicalUrl.replace(/\/$/, '')}${data.route || ''}` || defaultSeoTags.canonicalUrl),
  ogImage: data.openGraph?.image || data.twitter?.image || defaultSeoTags.ogImage,
});

const buildSeoPayload = (seoTags) => ({
  route: GLOBAL_SEO_ROUTE,
  pageName: GLOBAL_SEO_PAGE_NAME,
  metaTitle: seoTags.siteTitle.trim(),
  metaDescription: seoTags.metaDescription.trim(),
  canonicalUrl: seoTags.canonicalUrl.trim(),
  keywords: seoTags.keywords
    .split(',')
    .map((keyword) => keyword.trim())
    .filter(Boolean),
  openGraph: {
    title: seoTags.siteTitle.trim(),
    description: seoTags.metaDescription.trim(),
    image: seoTags.ogImage.trim(),
    type: 'website',
  },
  twitter: {
    title: seoTags.siteTitle.trim(),
    description: seoTags.metaDescription.trim(),
    image: seoTags.ogImage.trim(),
    card: 'summary_large_image',
  },
  isActive: true,
});

export default function AdminSettingsPage() {
  const [sectionLoading, setSectionLoading] = useState({
    page: true,
    emailConfig: false,
    seo: false,
    test: false,
    actionId: '',
  });
  const [successMessage, setSuccessMessage] = useState('');
  const [errors, setErrors] = useState({});
  const [seoSettingId, setSeoSettingId] = useState('');
  const [selectedEmailConfigId, setSelectedEmailConfigId] = useState('');
  const [emailConfigs, setEmailConfigs] = useState([]);
  const [testRecipient, setTestRecipient] = useState('');
  const [search, setSearch] = useState('');
  const [emailConfig, setEmailConfig] = useState(defaultEmailConfig);
  const [seoTags, setSeoTags] = useState(defaultSeoTags);

  const showSuccess = (msg) => {
    setSuccessMessage(msg);
    window.clearTimeout(showSuccess._timer);
    showSuccess._timer = window.setTimeout(() => setSuccessMessage(''), 3000);
  };

  const setApiError = (err, fallbackMessage) => {
    setErrors((prev) => ({
      ...prev,
      api: err.response?.data?.message || fallbackMessage,
    }));
  };

  const clearFieldError = (name) => {
    if (errors[name] || errors.api) {
      setErrors((prev) => {
        const nextErrors = { ...prev };
        delete nextErrors[name];
        delete nextErrors.api;
        return nextErrors;
      });
    }
  };

  const handleEmailConfigChange = (e) => {
    const { name, value, type, checked } = e.target;
    const nextValue = type === 'checkbox' ? checked : value;
    setEmailConfig((prev) => ({
      ...prev,
      [name]: name === 'port' ? value : nextValue,
    }));
    clearFieldError(name);
  };

  const handleSeoChange = (e) => {
    const { name, value } = e.target;
    setSeoTags((prev) => ({ ...prev, [name]: value }));
    clearFieldError(name);
  };

  const resetEmailConfigForm = () => {
    setSelectedEmailConfigId('');
    setEmailConfig(defaultEmailConfig);
    setTestRecipient('');
    setErrors((prev) => {
      const nextErrors = { ...prev };
      delete nextErrors.provider;
      delete nextErrors.host;
      delete nextErrors.port;
      delete nextErrors.username;
      delete nextErrors.password;
      delete nextErrors.fromName;
      delete nextErrors.fromEmail;
      delete nextErrors.recipient;
      return nextErrors;
    });
  };

  const fetchEmailConfigDetail = async (id, fallbackItem = null) => {
    try {
      const response = await axios.get(`${API}/api/admin/email-configs/${id}`, { withCredentials: true });
      const detail = response.data?.data || fallbackItem || {};
      setSelectedEmailConfigId(id);
      setEmailConfig(mapEmailConfigResponseToForm(detail));
      setTestRecipient(detail.fromEmail || '');
    } catch {
      if (fallbackItem) {
        setSelectedEmailConfigId(id);
        setEmailConfig(mapEmailConfigResponseToForm(fallbackItem));
        setTestRecipient(fallbackItem.fromEmail || '');
      }
    }
  };

  const fetchSettings = async () => {
    try {
      setSectionLoading((prev) => ({ ...prev, page: true }));
      setErrors({});

      const [emailConfigResponse, seoResponse] = await Promise.all([
        axios.get(`${API}/api/admin/email-configs`, { withCredentials: true }),
        axios.get(`${API}/api/admin/seo`, { withCredentials: true }),
      ]);

      const emailConfigItems = Array.isArray(emailConfigResponse.data?.data?.items)
        ? emailConfigResponse.data.data.items
        : [];
      setEmailConfigs(emailConfigItems);

      const preferredEmailConfig =
        emailConfigItems.find((item) => item.isActive) || emailConfigItems[0] || null;

      if (preferredEmailConfig?._id) {
        await fetchEmailConfigDetail(preferredEmailConfig._id, preferredEmailConfig);
      } else {
        resetEmailConfigForm();
      }

      const seoSettings = Array.isArray(seoResponse.data?.data) ? seoResponse.data.data : [];
      const globalSeo = seoSettings.find((item) => item.route === GLOBAL_SEO_ROUTE) || seoSettings[0];

      if (globalSeo?._id) {
        setSeoSettingId(globalSeo._id);

        try {
          const detailResponse = await axios.get(`${API}/api/admin/seo/${globalSeo._id}`, {
            withCredentials: true,
          });
          setSeoTags(mapSeoResponseToForm(detailResponse.data?.data || globalSeo));
        } catch {
          setSeoTags(mapSeoResponseToForm(globalSeo));
        }
      } else {
        setSeoSettingId('');
        setSeoTags(defaultSeoTags);
      }
    } catch (err) {
      setApiError(err, 'Failed to load admin settings.');
    } finally {
      setSectionLoading((prev) => ({ ...prev, page: false }));
    }
  };

  useEffect(() => {
    fetchSettings();
  }, []);

  const validateEmailConfig = () => {
    const nextErrors = {};

    if (!emailConfig.provider) nextErrors.provider = 'Provider required';
    if (!emailConfig.host.trim()) nextErrors.host = 'Host required';
    if (!emailConfig.port || Number(emailConfig.port) <= 0) nextErrors.port = 'Valid port required';
    if (!emailConfig.username.trim()) nextErrors.username = 'Username required';
    if (!emailConfig.fromName.trim()) nextErrors.fromName = 'From name required';
    if (!emailConfig.fromEmail.trim()) nextErrors.fromEmail = 'Email required';
    if (!selectedEmailConfigId && !emailConfig.password.trim()) nextErrors.password = 'Password required';

    if (Object.keys(nextErrors).length > 0) {
      setErrors((prev) => ({ ...prev, ...nextErrors }));
      return false;
    }

    return true;
  };

  const buildEmailConfigPayload = () => {
    const payload = {
      provider: emailConfig.provider,
      host: emailConfig.host.trim(),
      port: Number(emailConfig.port),
      secure: Boolean(emailConfig.secure),
      username: emailConfig.username.trim(),
      fromName: emailConfig.fromName.trim(),
      fromEmail: emailConfig.fromEmail.trim(),
      isActive: Boolean(emailConfig.isActive),
    };

    if (emailConfig.password.trim()) {
      payload.password = emailConfig.password;
    }

    return payload;
  };

  const refreshEmailConfigs = async (preferredId = selectedEmailConfigId) => {
    const response = await axios.get(`${API}/api/admin/email-configs`, { withCredentials: true });
    const items = Array.isArray(response.data?.data?.items) ? response.data.data.items : [];
    setEmailConfigs(items);

    const preferredItem =
      items.find((item) => item._id === preferredId) ||
      items.find((item) => item.isActive) ||
      items[0];

    if (preferredItem?._id) {
      await fetchEmailConfigDetail(preferredItem._id, preferredItem);
    } else {
      resetEmailConfigForm();
    }
  };

  const handleSubmitEmailConfig = async (e) => {
    e.preventDefault();

    if (!validateEmailConfig()) return;

    setSectionLoading((prev) => ({ ...prev, emailConfig: true }));

    try {
      const payload = buildEmailConfigPayload();
      const response = selectedEmailConfigId
        ? await axios.put(`${API}/api/admin/email-configs/${selectedEmailConfigId}`, payload, { withCredentials: true })
        : await axios.post(`${API}/api/admin/email-configs`, payload, { withCredentials: true });

      const savedId = response.data?.data?._id || selectedEmailConfigId;
      await refreshEmailConfigs(savedId);
      setEmailConfig((prev) => ({ ...prev, password: '' }));
      showSuccess(selectedEmailConfigId ? 'Email configuration updated!' : 'Email configuration created!');
    } catch (err) {
      setApiError(err, 'Failed to save email configuration.');
    } finally {
      setSectionLoading((prev) => ({ ...prev, emailConfig: false }));
    }
  };

  const handleSubmitSeo = async (e) => {
    e.preventDefault();

    if (!seoTags.siteTitle || !seoTags.metaDescription) {
      setErrors((prev) => ({
        ...prev,
        siteTitle: !seoTags.siteTitle ? 'Title required' : '',
        metaDescription: !seoTags.metaDescription ? 'Description required' : '',
      }));
      return;
    }

    setSectionLoading((prev) => ({ ...prev, seo: true }));

    try {
      const seoPayload = buildSeoPayload(seoTags);
      const response = seoSettingId
        ? await axios.patch(`${API}/api/admin/seo/${seoSettingId}`, seoPayload, { withCredentials: true })
        : await axios.post(`${API}/api/admin/seo`, seoPayload, { withCredentials: true });

      const savedId = response.data?.data?._id || seoSettingId;

      if (savedId) {
        setSeoSettingId(savedId);
        const detailResponse = await axios.get(`${API}/api/admin/seo/${savedId}`, {
          withCredentials: true,
        });
        setSeoTags(mapSeoResponseToForm(detailResponse.data?.data || response.data?.data || {}));
      }

      showSuccess('Global SEO settings updated!');
    } catch (err) {
      setApiError(err, 'Failed to save SEO settings.');
    } finally {
      setSectionLoading((prev) => ({ ...prev, seo: false }));
    }
  };

  const handleTestEmailConfig = async () => {
    if (!selectedEmailConfigId) {
      setErrors((prev) => ({ ...prev, recipient: 'Save a config before testing' }));
      return;
    }

    if (!testRecipient.trim()) {
      setErrors((prev) => ({ ...prev, recipient: 'Recipient email required' }));
      return;
    }

    setSectionLoading((prev) => ({ ...prev, test: true }));

    try {
      await axios.post(
        `${API}/api/admin/email-configs/${selectedEmailConfigId}/test`,
        { recipient: testRecipient.trim() },
        { withCredentials: true }
      );
      await refreshEmailConfigs(selectedEmailConfigId);
      showSuccess('Test email sent successfully!');
      setErrors((prev) => ({ ...prev, recipient: '' }));
    } catch (err) {
      setApiError(err, 'Failed to send test email.');
    } finally {
      setSectionLoading((prev) => ({ ...prev, test: false }));
    }
  };

  const handleActivateToggle = async (configItem) => {
    setSectionLoading((prev) => ({ ...prev, actionId: configItem._id }));

    try {
      const endpoint = configItem.isActive ? 'deactivate' : 'activate';
      await axios.patch(`${API}/api/admin/email-configs/${configItem._id}/${endpoint}`, {}, { withCredentials: true });
      await refreshEmailConfigs(configItem._id);
      showSuccess(configItem.isActive ? 'Email config deactivated!' : 'Email config activated!');
    } catch (err) {
      setApiError(err, 'Failed to update email config state.');
    } finally {
      setSectionLoading((prev) => ({ ...prev, actionId: '' }));
    }
  };

  const handleDeleteEmailConfig = async (configItem) => {
    setSectionLoading((prev) => ({ ...prev, actionId: configItem._id }));

    try {
      await axios.delete(`${API}/api/admin/email-configs/${configItem._id}`, { withCredentials: true });
      const nextSelectedId = selectedEmailConfigId === configItem._id ? '' : selectedEmailConfigId;
      await refreshEmailConfigs(nextSelectedId);
      showSuccess('Email config deleted!');
    } catch (err) {
      setApiError(err, 'Failed to delete email config.');
    } finally {
      setSectionLoading((prev) => ({ ...prev, actionId: '' }));
    }
  };

  const isActionLoading = (id) => sectionLoading.actionId === id;

  const filteredConfigs = emailConfigs.filter((item) => {
    const query = search.trim().toLowerCase();
    if (!query) return true;
    return [item.provider, item.host, item.username, item.fromName, item.fromEmail]
      .filter(Boolean)
      .some((value) => String(value).toLowerCase().includes(query));
  });

  return (
    <div className={shellClass}>
      <div className="absolute top-0 left-1/4 h-80 w-80 rounded-full bg-indigo-600/10 blur-3xl pointer-events-none" />
      <div className="absolute bottom-0 right-1/4 h-80 w-80 rounded-full bg-purple-600/10 blur-3xl pointer-events-none" />

      <div className="relative z-10 max-w-7xl mx-auto pb-8">
        <div className="flex flex-col xl:flex-row xl:items-end xl:justify-between gap-4 mb-8">
          <div className="space-y-2">
            
            <h1 className="text-2xl sm:text-3xl md:text-4xl font-bold text-white leading-tight flex items-center gap-3">
              SEO & SMTP Settings
            </h1>
            <p className="max-w-2xl text-slate-400 text-sm sm:text-base">
              Admin-only controls for email transport and global metadata used across the SBOM Full security platform.
            </p>
          </div>
          {successMessage && (
            <div className="flex items-center gap-2 text-emerald-300 font-medium text-sm bg-emerald-500/10 px-4 py-2 rounded-xl border border-emerald-500/15 self-start xl:self-auto">
              <CheckCircle size={14} /> {successMessage}
            </div>
          )}
        </div>

        {errors.api && (
          <div className="mb-6 flex items-center gap-2 text-rose-300 font-medium text-sm bg-rose-500/10 px-4 py-3 rounded-xl border border-rose-500/15">
            <AlertCircle size={16} /> {errors.api}
          </div>
        )}

        {sectionLoading.page ? (
          <div className="min-h-80 flex items-center justify-center">
            <Loader2 className="w-7 h-7 animate-spin text-slate-400" />
          </div>
        ) : (
          <>
            <div className="grid grid-cols-1 xl:grid-cols-2 gap-6">
              <div className={panelClass}>
                <div className="relative p-6 sm:p-8">
                  <form onSubmit={handleSubmitEmailConfig} className="h-full flex flex-col gap-6">
                    <div className="flex items-center justify-between gap-4">
                      <div className="flex items-center gap-4">
                        <div className="w-12 h-12 bg-indigo-600/15 rounded-2xl flex items-center justify-center text-indigo-300 border border-indigo-500/20">
                          <Mail size={24} />
                        </div>
                        <div>
                          <h2 className="text-xl font-black text-white">SMTP Config</h2>
                          <p className="text-[10px] font-black uppercase tracking-[0.2em] text-slate-500 mt-1">
                            {selectedEmailConfigId ? 'Update stored config' : 'Create new config'}
                          </p>
                        </div>
                      </div>
                      <button
                        type="submit"
                        disabled={sectionLoading.emailConfig}
                        className={`${sectionButtonBase} bg-indigo-600 hover:bg-indigo-500 text-white`}
                      >
                        {sectionLoading.emailConfig ? <Loader2 className="w-5 h-5 animate-spin" /> : <ArrowRight size={20} />}
                      </button>
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                      <Field label="Provider" error={errors.provider}>
                        <select name="provider" value={emailConfig.provider} onChange={handleEmailConfigChange} className={fieldInputClass}>
                          <option value="gmail">Gmail</option>
                          <option value="outlook">Outlook</option>
                          <option value="custom">Custom</option>
                        </select>
                      </Field>
                      <Field label="Port" error={errors.port}>
                        <input type="number" name="port" value={emailConfig.port} onChange={handleEmailConfigChange} className={fieldInputClass} />
                      </Field>
                    </div>

                    <Field label="SMTP Host" error={errors.host}>
                      <input type="text" name="host" value={emailConfig.host} onChange={handleEmailConfigChange} className={fieldInputClass} />
                    </Field>

                    <Field label="Username" error={errors.username}>
                      <input type="text" name="username" value={emailConfig.username} onChange={handleEmailConfigChange} className={fieldInputClass} />
                    </Field>

                    <Field label="Password / Key" error={errors.password}>
                      <input
                        type="password"
                        name="password"
                        value={emailConfig.password}
                        onChange={handleEmailConfigChange}
                        placeholder={selectedEmailConfigId ? 'Leave blank to keep current password' : ''}
                        className={fieldInputClass}
                      />
                    </Field>

                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                      <Field label="From Name" error={errors.fromName}>
                        <input type="text" name="fromName" value={emailConfig.fromName} onChange={handleEmailConfigChange} className={fieldInputClass} />
                      </Field>
                      <Field label="From Email" error={errors.fromEmail}>
                        <input type="email" name="fromEmail" value={emailConfig.fromEmail} onChange={handleEmailConfigChange} className={fieldInputClass} />
                      </Field>
                    </div>

                    <ToggleRow
                      label="Secure Connection"
                      description="Toggle if your provider requires SSL/TLS."
                      checked={emailConfig.secure}
                      name="secure"
                      onChange={handleEmailConfigChange}
                    />

                    <ToggleRow
                      label="Activate after save"
                      description="Only one config can stay active at a time."
                      checked={emailConfig.isActive}
                      name="isActive"
                      onChange={handleEmailConfigChange}
                    />

                    <div className="grid grid-cols-1 md:grid-cols-[1fr_auto_auto] gap-3 pt-2">
                      <div>
                        <input
                          type="email"
                          value={testRecipient}
                          onChange={(e) => {
                            setTestRecipient(e.target.value);
                            clearFieldError('recipient');
                          }}
                          placeholder="Recipient email for test"
                          className={fieldInputClass}
                        />
                        {errors.recipient && <p className="text-rose-300 text-[10px] font-black uppercase px-2 mt-2">{errors.recipient}</p>}
                      </div>
                      <button
                        type="button"
                        onClick={handleTestEmailConfig}
                        disabled={sectionLoading.test || !selectedEmailConfigId}
                        className="bg-slate-900 hover:bg-black text-white px-5 h-12 rounded-2xl font-black uppercase tracking-widest text-[10px] transition-all disabled:opacity-50 disabled:cursor-not-allowed"
                      >
                        {sectionLoading.test ? 'Testing...' : 'Test'}
                      </button>
                      <button
                        type="button"
                        onClick={resetEmailConfigForm}
                        className="bg-white/5 hover:bg-white/10 border border-white/10 text-slate-200 px-5 h-12 rounded-2xl font-black uppercase tracking-widest text-[10px] transition-all"
                      >
                        New
                      </button>
                    </div>
                  </form>
                </div>
              </div>

              <div className={panelClass}>
                <div className="relative p-6 sm:p-8">
                  <form onSubmit={handleSubmitSeo} className="h-full flex flex-col gap-6">
                    <div className="flex items-center justify-between gap-4">
                      <div className="flex items-center gap-4">
                        <div className="w-12 h-12 bg-emerald-500/15 rounded-2xl flex items-center justify-center text-emerald-300 border border-emerald-500/20">
                          <Globe size={24} />
                        </div>
                        <div>
                          <h2 className="text-xl font-black text-white">Global SEO Tags</h2>
                          <p className="text-[10px] font-black uppercase tracking-[0.2em] text-slate-500 mt-1">Project metadata</p>
                        </div>
                      </div>
                      <button
                        type="submit"
                        disabled={sectionLoading.seo}
                        className={`${sectionButtonBase} bg-emerald-600 hover:bg-emerald-500 text-white`}
                      >
                        {sectionLoading.seo ? <Loader2 className="w-5 h-5 animate-spin" /> : <ArrowRight size={20} />}
                      </button>
                    </div>

                    <Field label="Site Title" helper={`${seoTags.siteTitle.length}/60`} error={errors.siteTitle}>
                      <input type="text" name="siteTitle" value={seoTags.siteTitle} onChange={handleSeoChange} className={fieldInputClass} />
                    </Field>

                    <Field label="Meta Description" helper={`${seoTags.metaDescription.length}/160`} error={errors.metaDescription}>
                      <textarea
                        name="metaDescription"
                        value={seoTags.metaDescription}
                        onChange={handleSeoChange}
                        rows={4}
                        className={`${fieldInputClass} resize-none`}
                      />
                    </Field>

                    <Field label="Global Keywords">
                      <input type="text" name="keywords" value={seoTags.keywords} onChange={handleSeoChange} className={fieldInputClass} />
                    </Field>

                    <Field label="Canonical URL">
                      <input type="text" name="canonicalUrl" value={seoTags.canonicalUrl} readOnly className={`${fieldInputClass} opacity-75`} />
                    </Field>

                    <Field label="Open Graph Image">
                      <input type="text" name="ogImage" value={seoTags.ogImage} onChange={handleSeoChange} className={fieldInputClass} />
                    </Field>
                  </form>
                </div>
              </div>
            </div>

            {/* <div className={`${panelClass} mt-6`}>
              <div className="p-6 sm:p-8">
                <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4 mb-5">
                  <div>
                    <h2 className="text-xl font-black text-white">SMTP Registry</h2>
                    <p className="text-sm text-slate-400 mt-1">Stored SMTP configurations for sending test messages</p>
                  </div>
                  <div className="flex items-center gap-3">
                    <div className="relative">
                      <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-500" />
                      <input
                        type="text"
                        value={search}
                        onChange={(e) => setSearch(e.target.value)}
                        placeholder="Search configs"
                        className="pl-9 pr-4 py-2.5 rounded-xl bg-white/5 border border-white/10 text-sm text-white placeholder-slate-500 outline-none focus:border-indigo-500"
                      />
                    </div>
                    <button
                      type="button"
                      onClick={() => refreshEmailConfigs(selectedEmailConfigId)}
                      className="w-11 h-11 rounded-xl bg-white/5 hover:bg-white/10 border border-white/10 flex items-center justify-center text-slate-200 transition-colors"
                    >
                      <RefreshCcw size={18} />
                    </button>
                  </div>
                </div>

                <div className="space-y-3">
                  {filteredConfigs.length === 0 ? (
                    <div className="rounded-2xl border border-dashed border-white/10 bg-white/5 p-8 text-center text-sm font-medium text-slate-400">
                      No SMTP configurations saved yet.
                    </div>
                  ) : (
                    filteredConfigs.map((configItem) => (
                      <div
                        key={configItem._id}
                        className={`p-4 rounded-2xl border transition-colors ${selectedEmailConfigId === configItem._id ? 'border-indigo-500/30 bg-indigo-500/10' : 'border-white/8 bg-white/5'}`}
                      >
                        <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4">
                          <button type="button" onClick={() => fetchEmailConfigDetail(configItem._id, configItem)} className="text-left flex-1">
                            <div className="flex items-center gap-3 flex-wrap">
                              <h3 className="font-black text-white text-sm tracking-tight">
                                {configItem.provider} · {configItem.host}
                              </h3>
                              {configItem.isActive && (
                                <span className={`${pillClass} bg-emerald-500/15 text-emerald-300 border border-emerald-500/20`}>
                                  Active
                                </span>
                              )}
                              <span className={`${pillClass} bg-white/10 text-slate-300 border border-white/10`}>
                                {configItem.passwordStatus || 'configured'}
                              </span>
                            </div>
                            <p className="text-xs text-slate-400 font-medium mt-2">
                              {configItem.fromName || 'No from name'} · {configItem.fromEmail || 'No from email'} · Port {configItem.port}
                            </p>
                          </button>

                          <div className="flex items-center gap-3 flex-wrap">
                            <button
                              type="button"
                              onClick={() => handleActivateToggle(configItem)}
                              disabled={isActionLoading(configItem._id)}
                              className={`h-10 px-4 rounded-xl font-black uppercase tracking-widest text-[10px] transition-colors flex items-center gap-2 ${configItem.isActive ? 'bg-amber-500/15 text-amber-300 hover:bg-amber-500/20 border border-amber-500/20' : 'bg-emerald-500/15 text-emerald-300 hover:bg-emerald-500/20 border border-emerald-500/20'}`}
                            >
                              {isActionLoading(configItem._id) ? <Loader2 className="w-4 h-4 animate-spin" /> : <Power size={14} />}
                              <span>{configItem.isActive ? 'Disable' : 'Enable'}</span>
                            </button>
                            <button
                              type="button"
                              onClick={() => handleDeleteEmailConfig(configItem)}
                              disabled={isActionLoading(configItem._id)}
                              className="h-10 px-4 rounded-xl bg-rose-500/15 text-rose-300 hover:bg-rose-500/20 border border-rose-500/20 font-black uppercase tracking-widest text-[10px] transition-colors flex items-center gap-2"
                            >
                              {isActionLoading(configItem._id) ? <Loader2 className="w-4 h-4 animate-spin" /> : <Trash2 size={14} />}
                              <span>Delete</span>
                            </button>
                          </div>
                        </div>
                      </div>
                    ))
                  )}
                </div>
              </div>
            </div> */}
          </>
        )}
      </div>
    </div>
  );
}

const Field = ({ label, helper, error, children }) => (
  <div className="space-y-2">
    <div className="flex items-center justify-between gap-3 ml-1">
      <label className="text-[11px] font-black text-slate-300 uppercase tracking-widest">{label}</label>
      {helper && <span className="text-[9px] font-black text-slate-500 tracking-tighter">{helper}</span>}
    </div>
    {children}
    {error && <p className="text-rose-300 text-[10px] font-black uppercase px-2">{error}</p>}
  </div>
);

const ToggleRow = ({ label, description, checked, name, onChange }) => (
  <div className="flex items-center justify-between rounded-2xl bg-white/5 border border-white/10 px-4 py-3 gap-4">
    <div>
      <p className="text-[11px] font-black uppercase tracking-widest text-slate-300">{label}</p>
      <p className="text-[10px] font-medium text-slate-500 mt-1">{description}</p>
    </div>
    <label className="relative inline-flex items-center cursor-pointer shrink-0">
      <input type="checkbox" className="sr-only peer" name={name} checked={checked} onChange={onChange} />
      <div className="w-11 h-6 bg-slate-700 rounded-full peer peer-checked:bg-indigo-600 peer-checked:after:translate-x-full after:content-[''] after:absolute after:top-0.5 after:left-0.5 after:bg-white after:border-slate-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all" />
    </label>
  </div>
);

const SettingsIconPlaceholder = () => <Mail className="w-4 h-4 text-indigo-300" />;

const shellClass = 'min-h-[calc(100vh-64px)] bg-[#0f0f1a] p-4 sm:p-6 md:p-8 lg:p-10';
const panelClass = 'bg-[#13131f]/80 backdrop-blur-xl border border-white/8 rounded-2xl sm:rounded-[28px] shadow-2xl shadow-black/20 overflow-hidden';
const fieldInputClass =
  'w-full bg-white/5 border border-white/10 focus:border-indigo-500 px-4 py-3 rounded-xl text-white placeholder-slate-500 font-medium transition-all outline-none text-sm';
const sectionButtonBase = 'w-11 h-11 rounded-2xl flex items-center justify-center transition-colors disabled:opacity-50 disabled:cursor-not-allowed';
const pillClass = 'px-3 py-1 rounded-full text-[10px] font-black uppercase tracking-widest';

// These codes are for SEO & SMTP mails - end