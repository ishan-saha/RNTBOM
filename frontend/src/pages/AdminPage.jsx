import { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import { getAllUsers } from '../api/auth';
import { Users, Shield, Globe, Building2, Calendar, RefreshCw, Search, UserCheck, UserX } from 'lucide-react';
import toast from 'react-hot-toast';

const RoleBadge = ({ role }) => (
  <span className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-medium ${
    role === 'admin'
      ? 'bg-amber-500/15 text-amber-400 border border-amber-500/25'
      : 'bg-indigo-500/15 text-indigo-400 border border-indigo-500/25'
  }`}>
    <span className={`w-1.5 h-1.5 rounded-full ${role === 'admin' ? 'bg-amber-400' : 'bg-indigo-400'}`} />
    {role?.charAt(0).toUpperCase() + role?.slice(1)}
  </span>
);

const AdminPage = () => {
  const { user } = useAuth();
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');

  const fetchUsers = async () => {
    setLoading(true);
    try {
      const res = await getAllUsers();
      setUsers(res.data.users);
    } catch (err) {
      toast.error('Failed to load users.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchUsers();
  }, []);

  const filteredUsers = users.filter(
    (u) =>
      u.name?.toLowerCase().includes(search.toLowerCase()) ||
      u.email?.toLowerCase().includes(search.toLowerCase()) ||
      u.organization?.toLowerCase().includes(search.toLowerCase()) ||
      u.country?.toLowerCase().includes(search.toLowerCase())
  );

  const formatDate = (d) =>
    d ? new Date(d).toLocaleDateString('en-US', { year: 'numeric', month: 'short', day: 'numeric' }) : 'N/A';

  const adminCount = users.filter((u) => u.role === 'admin').length;
  const userCount = users.filter((u) => u.role === 'user').length;

  return (
    <div className="min-h-[calc(100vh-64px)] bg-[#0f0f1a] p-6 md:p-10">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4 mb-8">
          <div>
            <h1 className="text-2xl md:text-3xl font-bold text-white flex items-center gap-3">
              <Shield className="w-7 h-7 text-amber-400" />
              Admin Panel
            </h1>
            <p className="text-slate-400 text-sm mt-1">Manage all registered users</p>
          </div>
          <button
            onClick={fetchUsers}
            disabled={loading}
            className="inline-flex items-center gap-2 px-4 py-2 bg-white/5 hover:bg-white/10 border border-white/10 text-slate-300 rounded-xl text-sm font-medium transition-all"
          >
            <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
            Refresh
          </button>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-8">
          <div className="bg-white/4 border border-white/8 rounded-xl p-5 flex items-center gap-4">
            <div className="p-3 bg-indigo-600/20 text-indigo-400 rounded-xl">
              <Users className="w-5 h-5" />
            </div>
            <div>
              <p className="text-xs text-slate-400">Total Users</p>
              <p className="text-2xl font-bold text-white">{users.length}</p>
            </div>
          </div>
          <div className="bg-white/4 border border-white/8 rounded-xl p-5 flex items-center gap-4">
            <div className="p-3 bg-amber-600/20 text-amber-400 rounded-xl">
              <Shield className="w-5 h-5" />
            </div>
            <div>
              <p className="text-xs text-slate-400">Admins</p>
              <p className="text-2xl font-bold text-white">{adminCount}</p>
            </div>
          </div>
          <div className="bg-white/4 border border-white/8 rounded-xl p-5 flex items-center gap-4">
            <div className="p-3 bg-emerald-600/20 text-emerald-400 rounded-xl">
              <UserCheck className="w-5 h-5" />
            </div>
            <div>
              <p className="text-xs text-slate-400">Regular Users</p>
              <p className="text-2xl font-bold text-white">{userCount}</p>
            </div>
          </div>
        </div>

        {/* Search */}
        <div className="relative mb-5">
          <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-500" />
          <input
            type="text"
            placeholder="Search by name, email, organization, or country..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full pl-10 pr-4 py-3 bg-white/5 border border-white/10 rounded-xl text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-indigo-500/50 focus:border-indigo-500 transition-all text-sm"
          />
        </div>

        {/* Table */}
        <div className="bg-[#13131f]/80 backdrop-blur-xl border border-white/8 rounded-2xl overflow-hidden">
          {loading ? (
            <div className="flex items-center justify-center py-20">
              <div className="flex flex-col items-center gap-3">
                <div className="w-10 h-10 border-4 border-indigo-500 border-t-transparent rounded-full animate-spin" />
                <p className="text-slate-400 text-sm">Loading users...</p>
              </div>
            </div>
          ) : filteredUsers.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-20 text-slate-500">
              <UserX className="w-10 h-10 mb-3 opacity-50" />
              <p className="font-medium">No users found</p>
              <p className="text-xs mt-1">Try adjusting your search</p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="border-b border-white/8">
                    <th className="text-left text-xs font-semibold text-slate-400 uppercase tracking-wider px-6 py-4">#</th>
                    <th className="text-left text-xs font-semibold text-slate-400 uppercase tracking-wider px-6 py-4">User</th>
                    <th className="text-left text-xs font-semibold text-slate-400 uppercase tracking-wider px-4 py-4">Role</th>
                    <th className="text-left text-xs font-semibold text-slate-400 uppercase tracking-wider px-4 py-4">
                      <span className="flex items-center gap-1"><Building2 className="w-3.5 h-3.5" /> Organization</span>
                    </th>
                    <th className="text-left text-xs font-semibold text-slate-400 uppercase tracking-wider px-4 py-4">
                      <span className="flex items-center gap-1"><Globe className="w-3.5 h-3.5" /> Country</span>
                    </th>
                    <th className="text-left text-xs font-semibold text-slate-400 uppercase tracking-wider px-4 py-4">
                      <span className="flex items-center gap-1"><Calendar className="w-3.5 h-3.5" /> Joined</span>
                    </th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-white/5">
                  {filteredUsers.map((u, idx) => (
                    <tr
                      key={u._id}
                      className={`transition-colors hover:bg-white/3 ${u._id === user?._id ? 'bg-indigo-600/5' : ''}`}
                    >
                      <td className="px-6 py-4 text-xs text-slate-500">{idx + 1}</td>
                      <td className="px-6 py-4">
                        <div className="flex items-center gap-3">
                          <div className="w-8 h-8 rounded-full bg-gradient-to-br from-indigo-500 to-purple-600 flex items-center justify-center text-xs font-semibold text-white flex-shrink-0">
                            {u.name?.charAt(0).toUpperCase()}
                          </div>
                          <div>
                            <p className="text-sm font-medium text-white flex items-center gap-1.5">
                              {u.name}
                              {u._id === user?._id && (
                                <span className="text-[10px] bg-indigo-600/30 text-indigo-300 px-1.5 py-0.5 rounded-full border border-indigo-500/30">You</span>
                              )}
                            </p>
                            <p className="text-xs text-slate-500">{u.email}</p>
                          </div>
                        </div>
                      </td>
                      <td className="px-4 py-4"><RoleBadge role={u.role} /></td>
                      <td className="px-4 py-4 text-sm text-slate-300">{u.organization || '—'}</td>
                      <td className="px-4 py-4 text-sm text-slate-300">{u.country || '—'}</td>
                      <td className="px-4 py-4 text-xs text-slate-400">{formatDate(u.createdAt)}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
        <p className="text-center text-xs text-slate-600 mt-4">
          Showing {filteredUsers.length} of {users.length} total users
        </p>
      </div>
    </div>
  );
};

export default AdminPage;
