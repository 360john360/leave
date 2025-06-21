
import React, { useState, useEffect, useCallback } from 'react';
import { User, UserRole, ShiftTeam } from '../../types';
import { getMockUsers, addMockUser, updateMockUser } from '../../services/api';
import { ROLES_CONFIG, SHIFT_TEAMS_CONFIG } from '../../constants';
import Button from '../common/Button';
import Modal from '../common/Modal';
import Input from '../common/Input';
import Select from '../common/Select';
import Table, { Column } from '../common/Table';
import { PlusCircleIcon, PencilSquareIcon, UserCircleIcon } from '@heroicons/react/24/outline';

const AdminUserManagement: React.FC = () => {
  const [users, setUsers] = useState<User[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingUser, setEditingUser] = useState<User | null>(null);
  const [formData, setFormData] = useState<Partial<User>>({
    name: '',
    email: '',
    role: UserRole.VAR_BAU, // Default role
    team: ShiftTeam.BAU,   // Default team based on default role
  });
  const [formError, setFormError] = useState('');

  const fetchUsers = useCallback(async () => {
    setIsLoading(true);
    try {
      const userData = await getMockUsers();
      setUsers(userData.sort((a,b) => a.name.localeCompare(b.name)));
    } catch (error) {
      console.error("Failed to fetch users:", error);
      setFormError("Could not load user data.");
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchUsers();
  }, [fetchUsers]);

  const handleOpenModal = (user?: User) => {
    if (user) {
      setEditingUser(user);
      setFormData({ name: user.name, email: user.email, role: user.role, team: user.team });
    } else {
      setEditingUser(null);
      // Sensible defaults for new user
      setFormData({ name: '', email: '', role: UserRole.VAR_BAU, team: ShiftTeam.BAU });
    }
    setFormError('');
    setIsModalOpen(true);
  };

  const handleCloseModal = () => {
    setIsModalOpen(false);
    setEditingUser(null);
    setFormError('');
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    setFormData(prev => {
        const newState = { ...prev, [name]: value };
        // If role changes, adjust available teams and default team if necessary
        if (name === 'role') {
            const newRole = value as UserRole;
            if (newRole === UserRole.VAR_SHIFT) {
                newState.team = ShiftTeam.A; // Default to Team A for shift
            } else if (newRole === UserRole.VAR_BAU) {
                newState.team = ShiftTeam.BAU;
            } else { // For ADMIN, MANAGER, PAS
                newState.team = ShiftTeam.NONE;
            }
        }
        return newState;
    });
  };

  const handleSubmit = async () => {
    if (!formData.name?.trim() || !formData.email?.trim() || !formData.role || !formData.team) {
      setFormError('Name, email, role, and team are required.');
      return;
    }
    // Basic email validation
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.email)) {
        setFormError('Please enter a valid email address.');
        return;
    }

    setFormError('');
    setIsLoading(true); // Consider a separate loading state for form submission
    try {
      if (editingUser) {
        await updateMockUser(editingUser.id, formData);
      } else {
        // Password would be handled here in a real app (e.g., auto-generated, set by user later)
        await addMockUser(formData as Omit<User, 'id'>); 
      }
      fetchUsers();
      handleCloseModal();
    } catch (error) {
      console.error("Failed to save user:", error);
      setFormError('An error occurred while saving the user. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  const roleOptions = Object.values(UserRole).map(role => ({ value: role, label: ROLES_CONFIG[role].name }));
  
  const getTeamOptions = (role?: UserRole) => {
    if (role === UserRole.VAR_SHIFT) {
        return [ShiftTeam.A, ShiftTeam.B, ShiftTeam.C, ShiftTeam.D].map(team => ({value: team, label: SHIFT_TEAMS_CONFIG[team].name}));
    }
    if (role === UserRole.VAR_BAU) {
        return [{value: ShiftTeam.BAU, label: SHIFT_TEAMS_CONFIG[ShiftTeam.BAU].name}];
    }
    // For ADMIN, MANAGER, PAS, team is NONE
    return [{value: ShiftTeam.NONE, label: SHIFT_TEAMS_CONFIG[ShiftTeam.NONE].name}];
  };


  const userColumns: Column<User>[] = [
    { 
        header: 'Name', 
        accessor: 'name',
        cellClassName: 'font-medium text-brand-text' 
    },
    { header: 'Email', accessor: 'email', cellClassName: 'text-sm text-brand-text-secondary' },
    { 
        header: 'Role', 
        accessor: (item) => ROLES_CONFIG[item.role]?.name || item.role,
        cellClassName: 'text-sm'
    },
    { 
        header: 'Team', 
        accessor: (item) => SHIFT_TEAMS_CONFIG[item.team]?.name || item.team,
        cellClassName: 'text-sm'
    },
    { 
        header: 'Actions', 
        headerClassName: 'text-right',
        cellClassName: 'text-right',
        accessor: (item) => (
        <Button onClick={() => handleOpenModal(item)} variant="ghost" size="sm" leftIcon={<PencilSquareIcon className="h-4 w-4"/>}>
            Edit
        </Button>
      )
    },
  ];

  return (
    <div className="space-y-5">
      <div className="flex flex-col sm:flex-row justify-between sm:items-center gap-3">
        <div>
            <h2 className="text-xl font-semibold text-brand-text">Manage Users</h2>
            <p className="text-sm text-brand-text-secondary mt-0.5">Add, edit, and manage user accounts and their roles.</p>
        </div>
        <Button 
            onClick={() => handleOpenModal()} 
            variant="primary"
            leftIcon={<PlusCircleIcon className="h-5 w-5" />}
            className="w-full sm:w-auto"
        >
            Add New User
        </Button>
      </div>
      <Table 
        columns={userColumns} 
        data={users} 
        isLoading={isLoading && users.length === 0} 
        rowKeyAccessor="id"
        emptyMessage={
            <div className="text-center py-10">
                <UserCircleIcon className="h-12 w-12 text-gray-300 mx-auto mb-2" />
                <h3 className="font-medium text-brand-text">No Users Found</h3>
                <p className="text-sm text-brand-text-secondary">Click "Add New User" to create the first user account.</p>
                {formError && !isLoading && <p className="text-xs text-brand-error mt-2">{formError}</p>}
            </div>
        }
      />

      <Modal 
        isOpen={isModalOpen} 
        onClose={handleCloseModal} 
        title={editingUser ? `Edit User: ${editingUser.name}` : 'Add New User'}
        size="lg"
        footer={
            <div className="flex w-full justify-between items-center">
                {formError && <p className="text-xs text-brand-error flex-grow mr-3">{formError}</p>}
                 <div className="flex space-x-3 ml-auto">
                    <Button variant="ghost" onClick={handleCloseModal} disabled={isLoading}>Cancel</Button>
                    <Button variant="primary" onClick={handleSubmit} isLoading={isLoading} disabled={isLoading}>
                        {editingUser ? 'Save Changes' : 'Create User'}
                    </Button>
                </div>
            </div>
        }
      >
        <form className="space-y-4 sm:space-y-5" onSubmit={(e) => {e.preventDefault(); handleSubmit();}}>
          <Input label="Full Name" name="name" value={formData.name || ''} onChange={handleChange} required placeholder="e.g., John Doe"/>
          <Input label="Email Address" name="email" type="email" value={formData.email || ''} onChange={handleChange} required placeholder="e.g., user@example.com"/>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 sm:gap-5">
            <Select label="Role" name="role" options={roleOptions} value={formData.role || ''} onChange={handleChange} required />
            <Select label="Team" name="team" options={getTeamOptions(formData.role)} value={formData.team || ''} onChange={handleChange} required />
          </div>
          {/* Note: In a real application, password management for new/existing users would be more complex. */}
          {/* For new users, a temporary password might be generated and emailed, or user sets it via link. */}
          {/* For editing, a "Reset Password" option would be typical rather than directly changing it here. */}
          {!editingUser && <p className="text-xs text-brand-text-secondary">A temporary password will be set/emailed to the user (mock behavior).</p>}
        </form>
      </Modal>
    </div>
  );
};

export default AdminUserManagement;
