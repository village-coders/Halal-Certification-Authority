import React from 'react';
import Sidebar from '../components/Sidebar';
import DashboardHeader from '../components/DashboardHeader';
import './css/UserGuide.css';

function UserGuide() {
  return (
    <div className="dash">
      <Sidebar activeGuide="active" />
      <main className="content">
        <div className="dashboard-container">
          <DashboardHeader title="User Guide" />
          
          <div className="guide-content white-card">
            <h1>Halal Certification Authority (HCA) Client Dashboard - User's Guide</h1>
            <p className="intro">Welcome to the <strong>HCA Client Portal</strong>. This guide is designed to help you navigate and fully utilize the features available in your dashboard securely and efficiently.</p>
            
            <hr />
            
            <section>
              <h2>1. Introduction</h2>
              <p>The HCA Client Dashboard is your central hub for managing your Halal Certification process. From submitting new applications and required documents to communicating with HCA representatives and downloading your official certificates, everything you need is organized in one secure location.</p>
            </section>

            <section>
              <h2>2. Navigating the Dashboard</h2>
              <p>Upon logging in, you are greeted with the <strong>Dashboard</strong> overview. Use the left-hand <strong>Sidebar Navigation</strong> to move between different modules. On mobile devices, tap the hamburger menu icon (three lines) at the top left to expand the sidebar.</p>
              <p>The <strong>Dashboard Overview</strong> provides a snapshot of your account's current status, giving you quick insights into your active applications, pending actions, and recent communications.</p>
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
              <ul>
                <li>Use the <strong>Submit Relevant Document</strong> portal to securely upload any requested files.</li>
                <li>Ensure your documents are clearly labeled for faster processing.</li>
              </ul>
            </section>

            <section>
              <h2>5. Invoices</h2>
              <p>The <strong>Invoices</strong> section handles all billing and payments related to your certification.</p>
              <ul>
                <li><strong>View Invoices:</strong> Check the details of your certification fees, audit charges, or renewal costs.</li>
                <li><strong>Status Tracking:</strong> See which invoices are paid, pending, or overdue.</li>
                <li><strong>Download Invoices:</strong> Obtain PDF copies of your invoices for your financial records.</li>
              </ul>
            </section>

            <section>
              <h2>6. Certificates</h2>
              <p>Once your certification is approved, the <strong>Certificates</strong> module gives you access to your official documents.</p>
              <ul>
                <li><strong>View Certificates:</strong> View the details and valid dates of your current Halal Certificates.</li>
                <li><strong>Download / Print:</strong> Easily download your certificate for display in your facility or inclusion in your product packaging.</li>
              </ul>
            </section>

            <section>
              <h2>7. Products</h2>
              <p>If your certification applies specifically to manufactured goods, the <strong>Products</strong> section allows you to manage the inventory of items covered by your Halal certificate.</p>
              <ul>
                <li>Keep your product list up to date.</li>
                <li>Add new products for review when introducing line extensions.</li>
              </ul>
            </section>

            <section>
              <h2>8. Messages</h2>
              <p>Communication with the HCA team is streamlined via the built-in <strong>Messages</strong> system.</p>
              <ul>
                <li><strong>Secure Messaging:</strong> Discuss audit findings, application statuses, or general inquiries directly with HCA staff.</li>
                <li><strong>Notifications:</strong> Look for the numbered badge on the Messages icon indicating unread replies or alerts.</li>
              </ul>
            </section>

            <section>
              <h2>9. Audits</h2>
              <p>The <strong>Audits</strong> module is your calendar and record-keeper for onsite and virtual inspections.</p>
              <ul>
                <li><strong>Upcoming Audits:</strong> View scheduled dates and the assigned lead auditor for your facility.</li>
                <li><strong>Audit Reports:</strong> Once completed, review the auditor's findings.</li>
                <li><strong>Corrective Actions:</strong> If any compliance issues are found, this is where you can track and respond with your corrective actions.</li>
              </ul>
            </section>

            <section>
              <h2>10. Profile</h2>
              <p>Keep your business and account information current in the <strong>Profile</strong> section.</p>
              <ul>
                <li><strong>Manage Company Details:</strong> Update your contact information, registered addresses, and primary representatives.</li>
                <li><strong>Security:</strong> Manage your login credentials and password.</li>
              </ul>
            </section>

            <div className="tip-alert">
              <strong><i className="fas fa-lightbulb"></i> Need Assistance?</strong> If you experience any technical issues or need clarification on a step in the certification process, please use the <strong>Messages</strong> module to reach out to our support team directly.
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}

export default UserGuide;
