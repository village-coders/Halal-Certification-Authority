import React, { useState, useEffect } from 'react';
import  {Joyride, STATUS } from 'react-joyride';

const TourBot = ({ run, setRun, userId }) => {
  const [tourKey, setTourKey] = useState(0);

  useEffect(() => {
    if (run) {
      setTourKey(prev => prev + 1);
    }
  }, [run]);
  const [steps] = useState([
    {
      target: '#tour-dashboard-notification',
      content: 'Welcome to your Client Dashboard! Your latest alerts and notifications will be here.',
      placement: 'bottom',
      disableBeacon: true,
    },
    {
      target: '#tour-sidebar-profile',
      content: 'Make sure your company details are up to date here before applying.',
      placement: 'right',
    },
    {
      target: '#tour-sidebar-applications',
      content: 'Start your application here. When the application is accepted, you can proceed to register your products.',
      placement: 'right',
    },
    {
      target: '#tour-sidebar-products',
      content: 'Once the application is accepted, register your products here for certification.',
      placement: 'right',
    },
    {
      target: '#tour-sidebar-submit-documents',
      content: 'After products are registered, submit all relevant supporting documents here.',
      placement: 'right',
    },
    {
      target: '#tour-sidebar-invoices',
      content: 'Once products and documents are approved, you can check and pay your certification invoice here.',
      placement: 'right',
    },
    {
      target: '#tour-sidebar-audits',
      content: 'After payment, an audit will be scheduled. Track your audit reports here.',
      placement: 'right',
    },
    {
      target: '#tour-sidebar-certificates',
      content: 'Once the audit is passed, your official Halal Certificates will be available here!',
      placement: 'right',
    }
  ]);

  const handleJoyrideCallback = (data) => {
    const { status } = data;
    const finishedStatuses = [STATUS.FINISHED, STATUS.SKIPPED];
    
    if (finishedStatuses.includes(status)) {
      setRun(false);
      localStorage.setItem(`hcaTourCompleted_${userId || 'default'}`, 'true');
    }
  };

  return (
    <Joyride
      key={tourKey}
      callback={handleJoyrideCallback}
      continuous={true}
      run={run}
      scrollToFirstStep={true}
      showProgress={true}
      showSkipButton={true}
      steps={steps}
      styles={{
        tooltip: {
          zIndex: 99999,
        },
        options: {
          zIndex: 99999,
          primaryColor: '#00853b',
        },
        
      }}
    />
  );
};

export default TourBot;
