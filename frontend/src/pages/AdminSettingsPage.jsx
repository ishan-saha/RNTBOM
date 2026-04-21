

import { useEffect, useRef, useState } from 'react';
import API from '../api/auth';
import toast from 'react-hot-toast';
import {
  Mail,
  Globe,
  CheckCircle,
  AlertCircle,
  Loader2,
  ArrowRight,
  ChevronDown,
  Power,
  Trash2,
  RefreshCcw,
  Search,
} from 'lucide-react';

const GLOBAL_SEO_ROUTE = '/';
const GLOBAL_SEO_PAGE_NAME = 'SBOM Full Global Settings';

const SMTP_PRESETS = {
  mailtrap: {
    host: 'sandbox.smtp.mailtrap.io',
    port: 2525,
    secure: false,
  },
  gmail: {
    host: 'smtp.gmail.com',
    port: 587,
    secure: false,
  },
};

const defaultEmailConfig = {
  provider: 'mailtrap',
  host: SMTP_PRESETS.mailtrap.host,
  port: SMTP_PRESETS.mailtrap.port,
  secure: false,
  username: '',
  password: '',
  fromName: '',
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
  host: data.host || SMTP_PRESETS[data.provider || defaultEmailConfig.provider]?.host || defaultEmailConfig.host,
  port: data.port || SMTP_PRESETS[data.provider || defaultEmailConfig.provider]?.port || defaultEmailConfig.port,
  secure: data.secure ?? defaultEmailConfig.secure,
  username: '',
  password: '',
  fromName: '',
  fromEmail: '',
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
  const smtpFormRef = useRef(null);
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
  const [testBody, setTestBody] = useState('');
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

  const readSmtpFormValues = () => {
    const formData = smtpFormRef.current ? new FormData(smtpFormRef.current) : new FormData();

    return {
      provider: String(formData.get('provider') || emailConfig.provider || defaultEmailConfig.provider),
      host: String(formData.get('host') || emailConfig.host || defaultEmailConfig.host),
      port: Number(formData.get('port') || emailConfig.port || defaultEmailConfig.port),
      secure: Boolean(emailConfig.secure),
      username: String(formData.get('username') || emailConfig.username || ''),
      password: String(formData.get('password') || emailConfig.password || ''),
      fromName: String(formData.get('fromName') || emailConfig.fromName || ''),
      fromEmail: String(formData.get('fromEmail') || emailConfig.fromEmail || ''),
      recipient: String(formData.get('recipient') || testRecipient || ''),
      body: String(formData.get('body') || testBody || ''),
    };
  };

  const handleEmailConfigChange = (e) => {
    const { name, value, type, checked } = e.target;
    const nextValue = type === 'checkbox' ? checked : value;
    setEmailConfig((prev) => {
      const nextConfig = {
        ...prev,
        [name]: name === 'port' ? value : nextValue,
      };

      if (name === 'provider' && SMTP_PRESETS[nextValue]) {
        nextConfig.host = SMTP_PRESETS[nextValue].host;
        nextConfig.port = SMTP_PRESETS[nextValue].port;
        nextConfig.secure = SMTP_PRESETS[nextValue].secure;
      }

      return nextConfig;
    });
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
    setTestBody('');
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
      const response = await API.get(`/admin/email-configs/${id}`);
      const detail = response.data?.data || fallbackItem || {};
      setSelectedEmailConfigId(id);
      setEmailConfig(mapEmailConfigResponseToForm(detail));
      setTestBody('');
    } catch {
      if (fallbackItem) {
        setSelectedEmailConfigId(id);
        setEmailConfig(mapEmailConfigResponseToForm(fallbackItem));
        setTestBody('');
      }
    }
  };

  const fetchSettings = async () => {
    try {
      setSectionLoading((prev) => ({ ...prev, page: true }));
      setErrors({});

      const [emailConfigResponse, seoResponse] = await Promise.all([
        API.get('/admin/email-configs'),
        API.get('/admin/seo'),
      ]);

      const emailConfigItems = Array.isArray(emailConfigResponse.data?.data?.items)
        ? emailConfigResponse.data.data.items
        : [];
      setEmailConfigs(emailConfigItems);

      resetEmailConfigForm();

      const seoSettings = Array.isArray(seoResponse.data?.data) ? seoResponse.data.data : [];
      const globalSeo = seoSettings.find((item) => item.route === GLOBAL_SEO_ROUTE) || seoSettings[0];

      if (globalSeo?._id) {
        setSeoSettingId(globalSeo._id);

        try {
          const detailResponse = await API.get(`/admin/seo/${globalSeo._id}`);
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
    const formValues = readSmtpFormValues();

    const payload = {
      provider: formValues.provider,
      host: formValues.host.trim(),
      port: Number(formValues.port),
      secure: Boolean(formValues.secure),
      username: formValues.username.trim(),
      fromName: formValues.fromName.trim(),
      fromEmail: formValues.fromEmail.trim(),
      isActive: Boolean(emailConfig.isActive),
    };

    if (formValues.password.trim()) {
      payload.password = formValues.password;
    }

    return payload;
  };

  const refreshEmailConfigs = async (preferredId = selectedEmailConfigId) => {
    const response = await API.get('/admin/email-configs');
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
        ? await API.put(`/admin/email-configs/${selectedEmailConfigId}`, payload)
        : await API.post('/admin/email-configs', payload);

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
        ? await API.patch(`/admin/seo/${seoSettingId}`, seoPayload)
        : await API.post('/admin/seo', seoPayload);

      const savedId = response.data?.data?._id || seoSettingId;

      if (savedId) {
        setSeoSettingId(savedId);
        const detailResponse = await API.get(`/admin/seo/${savedId}`);
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
    const formValues = readSmtpFormValues();

    if (!formValues.recipient.trim()) {
      setErrors((prev) => ({ ...prev, recipient: 'Recipient email required' }));
      return;
    }

    if (!formValues.username.trim()) {
      setErrors((prev) => ({ ...prev, username: 'Username required' }));
      return;
    }

    if (!formValues.password.trim()) {
      setErrors((prev) => ({ ...prev, password: 'Password / key required' }));
      return;
    }

    if (!formValues.fromName.trim()) {
      setErrors((prev) => ({ ...prev, fromName: 'From name required' }));
      return;
    }

    if (!formValues.fromEmail.trim()) {
      setErrors((prev) => ({ ...prev, fromEmail: 'From email required' }));
      return;
    }

    setSectionLoading((prev) => ({ ...prev, test: true }));

    try {
      await API.post(
        '/admin/email-configs/test',
        {
          recipient: formValues.recipient.trim(),
          subject: 'SMTP Test Email',
          body: formValues.body.trim(),
          provider: formValues.provider,
          host: formValues.host.trim(),
          port: Number(formValues.port),
          secure: Boolean(formValues.secure),
          username: formValues.username.trim(),
          password: formValues.password,
          fromName: formValues.fromName.trim(),
          fromEmail: formValues.fromEmail.trim(),
        },
      );
      if (selectedEmailConfigId) {
        await refreshEmailConfigs(selectedEmailConfigId);
      }
      toast.success('Mail sent successfully.');
      resetEmailConfigForm();
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
      await API.patch(`/admin/email-configs/${configItem._id}/${endpoint}`, {});
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
      await API.delete(`/admin/email-configs/${configItem._id}`);
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
              Admin-only controls for email transport and global metadata used
              across the SBOM Full security platform.
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
                  <form
                    ref={smtpFormRef}
                    onSubmit={handleSubmitEmailConfig}
                    className="flex flex-col gap-6"
                    autoComplete="off"
                  >
                    <div className="flex items-start justify-between gap-4">
                      <div className="flex items-center gap-4">
                        <div className="w-12 h-12 bg-indigo-600/15 rounded-2xl flex items-center justify-center text-indigo-300 border border-indigo-500/20 shadow-[0_0_40px_rgba(99,102,241,0.18)]">
                          <Mail size={24} />
                        </div>
                        <div>
                          <h2 className="text-xl font-black text-white">
                            SMTP{" "}
                          </h2>
                          <p className="text-[10px] font-black uppercase tracking-[0.2em] text-slate-500 mt-1">
                            {selectedEmailConfigId
                              ? "Create new Mail"
                              : "Create new Mail"}
                          </p>
                        </div>
                      </div>
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                      <Field label="Provider" error={errors.provider}>
                        <div className="relative">
                          <select
                            name="provider"
                            value={emailConfig.provider}
                            onChange={handleEmailConfigChange}
                            className={`${fieldInputClass} appearance-none pr-11 bg-[#11131d] border-slate-700 text-slate-100 focus:border-sky-400 focus:ring-2 focus:ring-sky-400/15`}
                            style={{
                              backgroundColor: "#11131d",
                              color: "#e2e8f0",
                            }}
                            autoComplete="off"
                          >
                            <option
                              value="mailtrap"
                              style={{
                                backgroundColor: "#11131d",
                                color: "#e2e8f0",
                              }}
                            >
                              Mailtrap
                            </option>
                            <option
                              value="gmail"
                              style={{
                                backgroundColor: "#11131d",
                                color: "#e2e8f0",
                              }}
                            >
                              Gmail
                            </option>
                          </select>
                          <ChevronDown className="pointer-events-none absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                        </div>
                      </Field>
                      <Field label="Port" error={errors.port}>
                        <input
                          type="number"
                          name="port"
                          value={emailConfig.port}
                          onChange={handleEmailConfigChange}
                          className={fieldInputClass}
                          autoComplete="off"
                        />
                      </Field>
                    </div>

                    <Field label="SMTP Host" error={errors.host}>
                      <input
                        type="text"
                        name="host"
                        value={emailConfig.host}
                        onChange={handleEmailConfigChange}
                        className={fieldInputClass}
                        autoComplete="off"
                      />
                    </Field>

                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                      <Field label="Username" error={errors.username}>
                        <input
                          type="text"
                          name="username"
                          value={emailConfig.username}
                          onChange={handleEmailConfigChange}
                          className={fieldInputClass}
                          autoComplete="new-password"
                        />
                      </Field>
                      <Field label="Password / Key" error={errors.password}>
                        <input
                          type="password"
                          name="password"
                          value={emailConfig.password}
                          onChange={handleEmailConfigChange}
                          placeholder={
                            selectedEmailConfigId
                              ? "Leave blank to keep current password"
                              : ""
                          }
                          className={fieldInputClass}
                          autoComplete="new-password"
                        />
                      </Field>
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                      <Field label="From Name" error={errors.fromName}>
                        <input
                          type="text"
                          name="fromName"
                          value={emailConfig.fromName}
                          onChange={handleEmailConfigChange}
                          className={fieldInputClass}
                          autoComplete="off"
                        />
                      </Field>
                      <Field label="From Email" error={errors.fromEmail}>
                        <input
                          type="email"
                          name="fromEmail"
                          value={emailConfig.fromEmail}
                          onChange={handleEmailConfigChange}
                          className={fieldInputClass}
                          autoComplete="off"
                        />
                      </Field>
                    </div>

                    <Field label="Recipient Email" error={errors.recipient}>
                      <input
                        type="email"
                        name="recipient"
                        value={testRecipient}
                        onChange={(e) => {
                          setTestRecipient(e.target.value);
                          clearFieldError("recipient");
                        }}
                        placeholder="RECIPIENT EMAIL"
                        className={fieldInputClass}
                        autoComplete="off"
                      />
                    </Field>

                    <Field label="Email Body">
                      <textarea
                        name="body"
                        value={testBody}
                        onChange={(e) => setTestBody(e.target.value)}
                        rows={8}
                        placeholder="Enter the test email body content..."
                        className={`${fieldInputClass} resize-none min-h-[240px]`}
                        autoComplete="off"
                      />
                    </Field>

                    <button
                      type="button"
                      onClick={handleTestEmailConfig}
                      disabled={sectionLoading.test}
                      className="cursor-pointer mt-1 h-14 w-full rounded-2xl bg-sky-400 hover:bg-sky-300 text-slate-950 font-black uppercase tracking-[0.18em] text-sm transition-all disabled:opacity-50 disabled:cursor-not-allowed shadow-[0_0_30px_rgba(56,189,248,0.22)]"
                    >
                      {sectionLoading.test ? "Sending..." : "Send Mail"}
                    </button>
                  </form>
                </div>
              </div>

              <div className={panelClass}>
                <div className="relative p-6 sm:p-8">
                  <form
                    onSubmit={handleSubmitSeo}
                    className="h-full flex flex-col gap-6"
                  >
                    <div className="flex items-center justify-between gap-4">
                      <div className="flex items-center gap-4">
                        <div className="w-12 h-12 bg-emerald-500/15 rounded-2xl flex items-center justify-center text-emerald-300 border border-emerald-500/20">
                          <Globe size={24} />
                        </div>
                        <div>
                          <h2 className="text-xl font-black text-white">
                            Global SEO Tags
                          </h2>
                          <p className="text-[10px] font-black uppercase tracking-[0.2em] text-slate-500 mt-1">
                            Project metadata
                          </p>
                        </div>
                      </div>
                      <button
                        type="submit"
                        disabled={sectionLoading.seo}
                        className={`${sectionButtonBase} bg-emerald-600 hover:bg-emerald-500 text-white`}
                      >
                        {sectionLoading.seo ? (
                          <Loader2 className="w-5 h-5 animate-spin" />
                        ) : (
                          <ArrowRight size={20} />
                        )}
                      </button>
                    </div>

                    <Field
                      label="Site Title"
                      helper={`${seoTags.siteTitle.length}/60`}
                      error={errors.siteTitle}
                    >
                      <input
                        type="text"
                        name="siteTitle"
                        value={seoTags.siteTitle}
                        onChange={handleSeoChange}
                        className={fieldInputClass}
                      />
                    </Field>

                    <Field
                      label="Meta Description"
                      helper={`${seoTags.metaDescription.length}/160`}
                      error={errors.metaDescription}
                    >
                      <textarea
                        name="metaDescription"
                        value={seoTags.metaDescription}
                        onChange={handleSeoChange}
                        rows={4}
                        className={`${fieldInputClass} resize-none`}
                      />
                    </Field>

                    <Field label="Global Keywords">
                      <input
                        type="text"
                        name="keywords"
                        value={seoTags.keywords}
                        onChange={handleSeoChange}
                        className={fieldInputClass}
                      />
                    </Field>

                    <Field label="Canonical URL">
                      <input
                        type="text"
                        name="canonicalUrl"
                        value={seoTags.canonicalUrl}
                        readOnly
                        className={`${fieldInputClass} opacity-75`}
                      />
                    </Field>

                    <Field label="Open Graph Image">
                      <input
                        type="text"
                        name="ogImage"
                        value={seoTags.ogImage}
                        onChange={handleSeoChange}
                        className={fieldInputClass}
                      />
                    </Field>
                  </form>
                </div>
              </div>
            </div>
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