import React, { useState, useEffect } from 'react';
// import { Plus, Edit2, Trash2, Phone, MessageCircle, Bell } from 'lucide-react';
import { Plus, Edit2, Trash2, Phone, Mail, Bell } from 'lucide-react';
import { emergencyContacts } from '../App';
import { getBrowserFcmToken } from '../utils/firebaseMessaging';
import '../styles/pages/emergencyContacts.css';

const emptyContact = {
  name: '',
  phone: '',
  email: '',
  role: 'Secondary',
  fcmToken: '',
};


const EmergencyContacts = () => {
  

  console.log("NEW CONTACT PAGE LOADED")
 const [contacts, setContacts] = useState([]);
  const [showAddForm, setShowAddForm] = useState(false);
  const [newContact, setNewContact] = useState(emptyContact);
  const [editingId, setEditingId] = useState(null);
  const [tokenStatus, setTokenStatus] = useState('');

  const [showEmailForm, setShowEmailForm] = useState(false);
  const [selectedContactId, setSelectedContactId] = useState(null);
  const [emailForm, setEmailForm] = useState({
    name: '',
    email: ''
  });

  useEffect(() => {
    const savedContacts = localStorage.getItem('emergencyContacts');
    if (savedContacts) {
      setContacts(JSON.parse(savedContacts));
    } else {
      setContacts(emergencyContacts);
      localStorage.setItem('emergencyContacts', JSON.stringify(emergencyContacts));
    }
  }, []);

  const saveContacts = (updatedContacts) => {
    setContacts(updatedContacts);
    localStorage.setItem('emergencyContacts', JSON.stringify(updatedContacts));
    window.dispatchEvent(new Event('emergency-contacts-change'));
  };

  const resetForm = () => {
    setNewContact(emptyContact);
    setEditingId(null);
    setShowAddForm(false);
    setTokenStatus('');
  };

  const handleSaveContact = (e) => {
    e.preventDefault();
    if (!newContact.name.trim() || !newContact.phone.trim()) return;

    if (editingId) {
      const updatedContacts = contacts.map((contact) =>
        contact.id === editingId
          ? {
  ...contact,
  name: newContact.name.trim(),
  phone: newContact.phone.trim(),
  email: newContact.email.trim(),
  role: newContact.role,
  fcmToken: newContact.fcmToken.trim(),
}
          : contact
      );
      saveContacts(updatedContacts);
      resetForm();
      return;
    }

    const contact = {
  id: Date.now(),
  name: newContact.name.trim(),
  phone: newContact.phone.trim(),
  email: newContact.email.trim(),
  role: newContact.role,
  fcmToken: newContact.fcmToken.trim(),
  avatar: '👤',
};

    saveContacts([...contacts, contact]);
    resetForm();
  };

  const handleDeleteContact = (id) => {
    if (!window.confirm('Delete this emergency contact?')) return;
    saveContacts(contacts.filter((contact) => contact.id !== id));
  };

  const handleEditContact = (contact) => {
    setEditingId(contact.id);
    setNewContact({
  name: contact.name,
 phone: contact.phone,
  email: contact.email || '',
  role: contact.role || 'Secondary',
  fcmToken: contact.fcmToken || contact.pushToken || '',
});

    setShowAddForm(true);
  };

  const handleCallContact = (phone) => {
    window.location.href = `tel:${phone}`;
  };


  const openEmailForm = (contact) => {
  setSelectedContactId(contact.id);
  setEmailForm({
    name: contact.name || '',
    email: contact.email || ''
  });
  setShowEmailForm(true);
};


  const handleUseThisDeviceToken = async () => {
    setTokenStatus('Requesting notification permission...');

    try {
      const token = await getBrowserFcmToken();
      setNewContact((contact) => ({ ...contact, fcmToken: token }));
      setTokenStatus('Push token added for this device.');
    } catch (error) {
      console.error('FCM token setup failed:', error);
      setTokenStatus(error.message || 'Unable to create push token.');
    }
  };

  const handleSaveEmail = () => {
  if (!emailForm.name || !emailForm.email) {
    alert("Please fill all fields");
    return;
  }

  const updatedContacts = contacts.map((contact) =>
    contact.id === selectedContactId
      ? {
          ...contact,
          name: emailForm.name,
          email: emailForm.email
        }
      : contact
  );

  saveContacts(updatedContacts);
  setShowEmailForm(false);
  alert("Email saved successfully");
};



  const getRoleColor = (role) => {
    switch (role) {
      case 'Primary':
        return 'primary';
      case 'Secondary':
        return 'secondary';
      case 'Emergency':
        return 'emergency';
      default:
        return 'secondary';
    }
  };


  

  return (
    <div className="emergency-contacts-container">

      {showEmailForm && (
  <div className="email-modal">
    <div className="email-form-box">
      <h3>Add Email Details</h3>

      <input
        type="text"
        placeholder="Enter name"
        value={emailForm.name}
        onChange={(e) =>
          setEmailForm({ ...emailForm, name: e.target.value })
        }
      />

      <input
        type="email"
        placeholder="Enter email"
        value={emailForm.email}
        onChange={(e) =>
          setEmailForm({ ...emailForm, email: e.target.value })
        }
      />

      <button onClick={handleSaveEmail}>Save</button>
      <button onClick={() => setShowEmailForm(false)}>Cancel</button>
    </div>
  </div>
)}

      <div className="contacts-header">
        <h1>Emergency Contacts</h1>
        <button
          className="add-contact-btn"
          onClick={() => {
            if (showAddForm) {
              resetForm();
            } else {
              setShowAddForm(true);
            }
          }}
        >
          <Plus size={20} />
          <span>{showAddForm ? 'Close Form' : 'Add Contact'}</span>
        </button>
      </div>

      {showAddForm && (
        <form className="add-contact-form" onSubmit={handleSaveContact}>
          <h2>{editingId ? 'Edit Contact' : 'Add Contact'}</h2>
          <div className="form-group">
            <label>Contact Name</label>
            <input
              type="text"
              placeholder="Enter contact name"
              value={newContact.name}
              onChange={(e) => setNewContact({ ...newContact, name: e.target.value })}
              required
            />
          </div>
          <div className="form-group">
            <label>Phone Number</label>
            <input
              type="tel"
              placeholder="Enter phone number"
              value={newContact.phone}
              onChange={(e) => setNewContact({ ...newContact, phone: e.target.value })}
              required
            />
          </div>

          <div className="form-group">
  <label>Email</label>
  <input
    type="email"
    placeholder="Enter email"
    value={newContact.email}
    onChange={(e) => setNewContact({ ...newContact, email: e.target.value })}
  />
</div>


          <div className="form-group">
            <label>Role</label>
            <select
              value={newContact.role}
              onChange={(e) => setNewContact({ ...newContact, role: e.target.value })}
            >
              <option>Primary</option>
              <option>Secondary</option>
              <option>Emergency</option>
            </select>
          </div>
          <div className="form-group">
            <label>FCM Token (optional)</label>
            <div className="token-row">
              <input
                type="text"
                placeholder="Paste Firebase device token for push alerts"
                value={newContact.fcmToken}
                onChange={(e) => setNewContact({ ...newContact, fcmToken: e.target.value })}
              />
              <button type="button" className="token-btn" onClick={handleUseThisDeviceToken}>
                <Bell size={16} />
                <span>Use This Device</span>
              </button>
            </div>
            {tokenStatus && <p className="token-status">{tokenStatus}</p>}
          </div>
          <div className="form-actions">
            <button type="submit" className="btn-save">
              {editingId ? 'Update Contact' : 'Save Contact'}
            </button>
            <button type="button" className="btn-cancel" onClick={resetForm}>
              Cancel
            </button>
          </div>
        </form>
      )}

      <div className="contacts-list">
        {contacts.length === 0 ? (
          <div className="empty-state">
            <p>No emergency contacts added yet</p>
            <p className="empty-description">Add your first contact to get started</p>
          </div>
        ) : (
          contacts.map((contact) => (
            <div key={contact.id} className={`contact-card ${getRoleColor(contact.role)}`}>
              <div className="contact-avatar">{contact.avatar}</div>
              <div className="contact-details">
                <h3>{contact.name}</h3>
                <p className="phone">{contact.phone}</p>
                <span className={`role-badge ${getRoleColor(contact.role)}`}>
                  {contact.role}
                </span>
                {(contact.fcmToken || contact.pushToken) && (
                  <span className="push-badge">Push enabled</span>
                )}
              </div>
              <div className="contact-actions">
                <button
                  className="action-btn call"
                  title="Call"
                  onClick={() => handleCallContact(contact.phone)}
                >
                  <Phone size={18} />
                </button>
               <button
  className="action-btn email"
  title="Email"
  onClick={() => openEmailForm(contact)}
>
  <Mail size={18} />
</button>

               
                
                <button
                  className="action-btn edit"
                  title="Edit"
                  onClick={() => handleEditContact(contact)}
                >
                  <Edit2 size={18} />
                </button>
                <button
                  className="action-btn delete"
                  title="Delete"
                  onClick={() => handleDeleteContact(contact.id)}
                >
                  <Trash2 size={18} />
                </button>
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
};

export default EmergencyContacts;
