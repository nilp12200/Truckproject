




import React, { useEffect, useState } from 'react';
import { FiEdit2, FiTrash2, FiX, FiSave, FiUser, FiLock, FiCheck, FiSearch } from 'react-icons/fi';
import { useNavigate } from 'react-router-dom';


const API_URL = import.meta.env.VITE_API_URL;
const ALL_ROLES = ['Admin', 'GateKeeper', 'Report', 'Dispatch', 'Loader', 'UserMaster', 'UserRegister'];

export default function UserRegister() {
  
  const navigate = useNavigate();

  const [users, setUsers] = useState([]);
  const [filteredUsers, setFilteredUsers] = useState([]);
  const [plants, setPlants] = useState([]);
  const [editIdx, setEditIdx] = useState(null);
  const [editUser, setEditUser] = useState({});
  const [isLoading, setIsLoading] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');


  useEffect(() => {
    fetchAll();
  }, []);

  useEffect(() => {
    const filtered = users.filter(user =>
      user.username.toLowerCase().includes(searchTerm.toLowerCase()) ||
      user.role?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      getNames(user.allowedplants, plants, 'plantid', 'plantname').toLowerCase().includes(searchTerm.toLowerCase())
    );
    setFilteredUsers(filtered);
  }, [searchTerm, users, plants]);

  async function fetchAll() {
    setIsLoading(true);
    try {
      const [uRes, pRes] = await Promise.all([
        fetch(`${API_URL}/api/users`),
        fetch(`${API_URL}/api/plantmaster`)
      ]);
      const usersData = await uRes.json();
      const plantsData = await pRes.json();
      setUsers(usersData);
      setFilteredUsers(usersData);
      setPlants(plantsData);
    } catch (error) {
      console.error('Error fetching data:', error);
    } finally {
      setIsLoading(false);
    }
  }

  const handleEdit = (u, i) => {
    setEditIdx(i);
    setEditUser({
      ...u,
      allowedplants: u.allowedplants || '',
      role: u.role || ''
    });
  };

  const handleCancel = () => {
    setEditIdx(null);
    setEditUser({});
  };

  const handleChange = e => {
    setEditUser(prev => ({ ...prev, [e.target.name]: e.target.value }));
  };

  const toggleListValue = (field, value) => {
    setEditUser(prev => {
      const cur = prev[field] || '';
      const arr = cur.split(',').filter(Boolean);
      const nextArr = arr.includes(value)
        ? arr.filter(x => x !== value)
        : [...arr, value];
      return { ...prev, [field]: nextArr.join(',') };
    });
  };

  const handleSave = async () => {
    setIsLoading(true);
    try {
      await fetch(`${API_URL}/api/users/${editUser.username}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(editUser)
      });
      await fetchAll();
      setEditIdx(null);
      setEditUser({});
    } catch (error) {
      console.error('Error saving user:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleDelete = async username => {
    if (!window.confirm(`Are you sure you want to delete ${username}?`)) return;
    setIsLoading(true);
    try {
      await fetch(`${API_URL}/api/users/${username}`, { method: 'DELETE' });
      await fetchAll();
    } catch (error) {
      console.error('Error deleting user:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const getNames = (str, list, idKey, nameKey) => {
    if (!str) return 'None';
    return str
      .split(',')
      .map(id => {
        const m = list.find(x => String(x[idKey]) === id);
        return m ? m[nameKey] : id;
      })
      .join(', ');
  };

  return (
    <div className="min-h-screen bg-gray-50 p-4 sm:p-6">
      <div className="max-w-7xl mx-auto">
        
          <div className="flex justify-end -mt-2 -mr-2 mb-2">
        
           <button 
                onClick={() => navigate('/home')}
                className="text-gray-500 hover:text-gray-700 p-1 rounded-full hover:bg-gray-100 transition-colors duration-200 mr-12 md:mr-16"
                title="Close"
                >
                 <FiX className="h-5 w-5" />
                  </button>
                 </div>

        {/* Header with Search */}
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-8 gap-4">

          <h1 className="text-2xl sm:text-3xl font-bold text-gray-800">
            <span className="bg-gradient-to-r from-blue-600 to-indigo-600 bg-clip-text text-transparent">
              User Register
            </span>
          </h1>
         
           
    

          {/* Modern Search Bar */}
          <div className="relative w-full md:w-64 lg:w-80">
            <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
              <FiSearch className="h-5 w-5 text-gray-400" />
            </div>
            <input
              type="text"
              placeholder="Search users..."
              className="block w-full pl-10 pr-3 py-2 border border-gray-300 rounded-lg bg-white shadow-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 text-sm"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
            {searchTerm && (
              <button
                onClick={() => setSearchTerm('')}
                className="absolute inset-y-0 right-0 pr-3 flex items-center"
              >
                <FiX className="h-4 w-4 text-gray-400 hover:text-gray-600" />
              </button>
            )}
          </div>
        </div>

        

        {/* Loading State */}
        {isLoading && (
          <div className="flex justify-center items-center py-12">
            <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-indigo-500"></div>
          </div>
        )}

        {/* Desktop Table */}
        <div className="hidden lg:block bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Username
                  </th>
                  <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Password
                  </th>
                  <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Role
                  </th>
                  <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Allowed Plants
                  </th>
                  <th scope="col" className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Actions
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {filteredUsers.map((u, i) => (
                  <tr key={u.username} className={i % 2 === 0 ? 'bg-white' : 'bg-gray-50 hover:bg-gray-100'}>
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                      <div className="flex items-center">
                        <div className="flex-shrink-0 h-8 w-8 rounded-full bg-indigo-100 flex items-center justify-center mr-3">
                          <FiUser className="h-4 w-4 text-indigo-600" />
                        </div>
                        {u.username}
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                      {'•'.repeat(8)}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                      <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-blue-100 text-blue-800">
                        {u.role || '-'}
                      </span>
                    </td>
                    <td className="px-6 py-4 text-sm text-gray-500 max-w-xs truncate">
                      {getNames(u.allowedplants, plants, 'plantid', 'plantname')}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                      <div className="flex justify-end space-x-2">
                        <button
                          onClick={() => handleEdit(u, i)}
                          className="text-indigo-600 hover:text-indigo-900 p-1.5 rounded-md hover:bg-indigo-50 transition-colors duration-200"
                          title="Edit"
                        >
                          <FiEdit2 className="h-4 w-4" />
                        </button>
                        <button
                          onClick={() => handleDelete(u.username)}
                          className="text-red-600 hover:text-red-900 p-1.5 rounded-md hover:bg-red-50 transition-colors duration-200"
                          title="Delete"
                        >
                          <FiTrash2 className="h-4 w-4" />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
                {filteredUsers.length === 0 && !isLoading && (
                  <tr>
                    <td colSpan="5" className="px-6 py-8 text-center text-sm text-gray-500">
                      {searchTerm ? 'No matching users found' : 'No users found. Create your first user to get started.'}
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>
     


        {/* Mobile Cards */}
        <div className="lg:hidden space-y-4">
          {filteredUsers.map((u, i) => (
            <div key={u.username} className="bg-white rounded-lg shadow-sm border border-gray-200 overflow-hidden transition-all duration-200 hover:shadow-md">
              <div className="p-4">
                <div className="flex items-start">
                  <div className="flex-shrink-0 h-10 w-10 rounded-full bg-indigo-100 flex items-center justify-center mr-3">
                    <FiUser className="h-5 w-5 text-indigo-600" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <h3 className="text-lg font-medium text-gray-900 truncate">{u.username}</h3>
                    <p className="text-sm text-gray-500 mt-1">
                      <span className="font-medium">Role:</span> 
                      <span className="ml-1 inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium bg-blue-100 text-blue-800">
                        {u.role || '-'}
                      </span>
                    </p>
                  </div>
                  <div className="flex space-x-2">
                    <button
                      onClick={() => handleEdit(u, i)}
                      className="text-indigo-600 hover:text-indigo-900 p-1.5 rounded-md hover:bg-indigo-50 transition-colors duration-200"
                      title="Edit"
                    >
                      <FiEdit2 className="h-5 w-5" />
                    </button>
                    <button
                      onClick={() => handleDelete(u.username)}
                      className="text-red-600 hover:text-red-900 p-1.5 rounded-md hover:bg-red-50 transition-colors duration-200"
                      title="Delete"
                    >
                      <FiTrash2 className="h-5 w-5" />
                    </button>
                  </div>
                </div>
                <div className="mt-4 space-y-2">
                  <div className="flex items-center text-sm text-gray-500">
                    <FiLock className="flex-shrink-0 mr-2 h-4 w-4" />
                    {'•'.repeat(8)}
                  </div>
                  <div className="text-sm">
                    <span className="font-medium text-gray-500">Allowed Plants:</span>{' '}
                    <span className="text-gray-700">{getNames(u.allowedplants, plants, 'plantid', 'plantname')}</span>
                  </div>
                </div>
              </div>
            </div>
          ))}
          {filteredUsers.length === 0 && !isLoading && (
            <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-8 text-center">
              <div className="text-gray-400 mb-2">
                <FiUser className="mx-auto h-12 w-12" />
              </div>
              <h3 className="text-lg font-medium text-gray-900 mb-1">
                {searchTerm ? 'No matching users' : 'No users found'}
              </h3>
              <p className="text-gray-500">
                {searchTerm ? 'Try a different search term' : 'Create your first user to get started'}
              </p>
            </div>
          )}
        </div>

        {/* Edit Modal */}
        {editIdx !== null && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
            <div className="bg-white rounded-xl shadow-xl w-full max-w-md max-h-[90vh] overflow-y-auto transform transition-all duration-300 ease-in-out">
              <div className="p-6">
                <div className="flex justify-between items-center mb-4">
                  <h2 className="text-xl font-semibold text-gray-800">Edit User</h2>
                  <button
                    onClick={handleCancel}
                    className="text-gray-400 hover:text-gray-500 p-1 rounded-full hover:bg-gray-100 transition-colors duration-200"
                  >
                    <FiX className="h-5 w-5" />
                  </button>
                </div>

                <div className="space-y-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Username</label>
                    <div className="mt-1 flex rounded-md shadow-sm">
                      <span className="inline-flex items-center px-3 rounded-l-md border border-r-0 border-gray-300 bg-gray-50 text-gray-500 text-sm">
                        <FiUser className="h-4 w-4" />
                      </span>
                      <input
                        type="text"
                        value={editUser.username}
                        readOnly
                        className="focus:ring-indigo-500 focus:border-indigo-500 flex-1 block w-full rounded-none rounded-r-md sm:text-sm border-gray-300 bg-gray-100"
                      />
                    </div>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Password</label>
                    <div className="mt-1 flex rounded-md shadow-sm">
                      <span className="inline-flex items-center px-3 rounded-l-md border border-r-0 border-gray-300 bg-gray-50 text-gray-500 text-sm">
                        <FiLock className="h-4 w-4" />
                      </span>
                      <input
                        name="password"
                        type="password"
                        value={editUser.password}
                        onChange={handleChange}
                        className="focus:ring-indigo-500 focus:border-indigo-500 flex-1 block w-full rounded-none rounded-r-md sm:text-sm border-gray-300"
                        placeholder="Enter new password"
                      />
                    </div>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Roles</label>
                    <div className="mt-1 space-y-2">
                      {ALL_ROLES.map(r => (
                        <label key={r} className="flex items-center space-x-3 bg-gray-50 hover:bg-gray-100 rounded-lg p-3 cursor-pointer transition-colors duration-200">
                          <input
                            type="checkbox"
                            checked={(editUser.role || '').split(',').includes(r)}
                            onChange={() => toggleListValue('role', r)}
                            className="h-4 w-4 text-indigo-600 focus:ring-indigo-500 border-gray-300 rounded"
                          />
                          <span className="text-sm text-gray-700">{r}</span>
                        </label>
                      ))}
                    </div>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Allowed Plants</label>
                    <div className="mt-1 max-h-60 overflow-y-auto border border-gray-200 rounded-lg divide-y divide-gray-200">
                      {plants.map(p => (
                        <label key={p.plantid} className="flex items-center space-x-3 px-4 py-3 hover:bg-gray-50 cursor-pointer transition-colors duration-200">
                          <input
                            type="checkbox"
                            checked={(editUser.allowedplants || '').split(',').includes(String(p.plantid))}
                            onChange={() => toggleListValue('allowedplants', String(p.plantid))}
                            className="h-4 w-4 text-indigo-600 focus:ring-indigo-500 border-gray-300 rounded"
                          />
                          <span className="text-sm text-gray-700">{p.plantname}</span>
                        </label>
                      ))}
                    </div>
                  </div>

                  <div className="flex justify-end space-x-3 pt-4">
                    <button
                      onClick={handleCancel}
                      className="inline-flex items-center px-4 py-2 border border-gray-300 shadow-sm text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 transition-colors duration-200"
                    >
                      Cancel
                    </button>
                    <button
                      onClick={handleSave}
                      disabled={isLoading}
                      className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 disabled:opacity-70 disabled:cursor-not-allowed transition-colors duration-200"
                    >
                      {isLoading ? (
                        <>
                          <svg className="animate-spin -ml-1 mr-2 h-4 w-4 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                          </svg>
                          Saving...
                        </>
                      ) : (
                        <>
                          Save Changes
                          <FiSave className="ml-2 h-4 w-4" />
                        </>
                      )}
                    </button>
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}