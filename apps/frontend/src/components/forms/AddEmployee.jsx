import React, { useState } from 'react';

const AddEmployee = ({ onAdd }) => {
  const [form, setForm] = useState({
    name: '',
    phone: '',
    email: '',
    username: '',
    password: '',
    confirmPassword: '',
  });

  const handleChange = e => {
    const { name, value } = e.target;
    setForm(prev => ({ ...prev, [name]: value }));
  };

  const handleSubmit = e => {
    e.preventDefault();

    if (form.password !== form.confirmPassword) {
      alert('Passwords do not match');
      return;
    }

    const newEmployee = {
      id: Date.now(),
      name: form.name,
      phone: form.phone,
      email: form.email,
      username: form.username,
    };

    onAdd(newEmployee);

    setForm({
      name: '',
      phone: '',
      email: '',
      username: '',
      password: '',
      confirmPassword: '',
    });
  };

  return (
    <div className="bg-white p-6 rounded shadow">
      <h2 className="text-lg font-semibold mb-4 border-b pb-2">Add New Employee</h2>
      <form onSubmit={handleSubmit} className="space-y-4">
        {[
          { label: 'Employee Name', name: 'name' },
          { label: 'Mobile Number', name: 'phone' },
          { label: 'Email Id', name: 'email' },
          { label: 'Create Username', name: 'username' },
          { label: 'Create Password', name: 'password', type: 'password' },
          { label: 'Confirm Password', name: 'confirmPassword', type: 'password' },
        ].map(({ label, name, type = 'text' }) => (
          <div key={name}>
            <label className="block mb-1 text-gray-700">{label}</label>
            <input
              type={type}
              name={name}
              value={form[name]}
              onChange={handleChange}
              className="w-full border p-2 rounded"
              placeholder={label}
              required
            />
          </div>
        ))}

        <button
          type="submit"
          className="border border-blue-600 text-blue-600 hover:bg-blue-50 px-4 py-2 rounded"
        >
          Next Step
        </button>
      </form>
    </div>
  );
};

export default AddEmployee;
