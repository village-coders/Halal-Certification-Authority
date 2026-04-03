import React from 'react';
import './css/UserGuide.css';
import { useNavigate } from 'react-router-dom';

const PublicGuide = () => {
  const navigate = useNavigate();
  return (
    <div style={{ background: 'linear-gradient(135deg, #e6f7ff 0%, #f0f9eb 100%)', minHeight: '100vh', padding: '40px 20px', display: 'flex', justifyContent: 'center' }}>
      <div className="guide-content white-card" style={{ maxWidth: '900px', width: '100%', position: 'relative', marginTop: 0 }}>
        <button 
          onClick={() => navigate('/')} 
          style={{ position: 'absolute', top: '20px', right: '30px', background: '#f0f9eb', padding: '10px 15px', borderRadius: '8px', border: '1px solid #c2e5cf', cursor: 'pointer', fontSize: '14px', color: '#1a5f7a', fontWeight: 'bold' }}>
          <i className="fas fa-arrow-left"></i> Back
        </button>

        <h1>Halal Certification Authority (HCA) - Public User's Guide</h1>
        <p className="intro">Welcome to the <strong>HCA Client Portal</strong>. This guide is designed to help you navigate and fully utilize the portal.</p>
        
        <hr />
        
        <section>
          <h2>1. Introduction</h2>
          <p>The HCA Client Dashboard is your central hub for managing your Halal Certification process. From submitting new applications and required documents to communicating with HCA representatives and downloading your official certificates, everything you need is organized in one secure location.</p>
        </section>

        <section>
          <h2>2. Navigating the Dashboard</h2>
          <p>Upon logging in, you are greeted with the <strong>Dashboard</strong> overview. Use the left-hand <strong>Sidebar Navigation</strong> to move between different modules. On mobile devices, tap the hamburger menu icon (three lines) at the top left to expand the sidebar.</p>
        </section>

        <section>
          <h2>3. Applications</h2>
          <p>The <strong>Applications</strong> module allows you to manage all aspects of your Halal Certification applications.</p>
          <ul>
            <li><strong>Start a New Application:</strong> Initiate the certification process for your facility or business.</li>
            <li><strong>Track Application Status:</strong> Monitor whether your application is under review, pending more information, or approved.</li>
            <li><strong>Renewals:</strong> Submit renewal applications for expiring certificates.</li>
          </ul>
        </section>

        <section>
          <h2>4. Submit Relevant Documents</h2>
          <p>During the certification process, HCA may require specific supporting documents (e.g., standard operating procedures, ingredient lists, or compliance records).</p>
        </section>

        <section>
          <h2>5. Invoices & Certificates</h2>
          <p>The <strong>Invoices</strong> section handles all billing and payments. The <strong>Certificates</strong> module gives you access to your official approved documents to download or print.</p>
        </section>

        <section>
          <h2>6. Products</h2>
          <p>If your certification applies specifically to manufactured goods, the <strong>Products</strong> section allows you to manage the inventory of items covered by your Halal certificate.</p>
        </section>

        <section>
          <h2>7. Messages & Audits</h2>
          <p>Communication with the HCA team is streamlined via the built-in <strong>Messages</strong> system. The <strong>Audits</strong> module is your calendar and record-keeper for onsite and virtual inspections.</p>
        </section>

        <div className="tip-alert">
          <strong><i className="fas fa-lightbulb"></i> Need Assistance?</strong> If you experience any technical issues or need clarification on a step in the certification process, please use the <strong>Messages</strong> module to reach out to our support team directly once you login.
        </div>
      </div>
    </div>
  );
};

export default PublicGuide;
