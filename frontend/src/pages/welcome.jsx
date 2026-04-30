import React from 'react';
import { useOutletContext } from 'react-router-dom';
import EjaanView from '../components/user/EjaanView';
import PlagiarismeView from '../components/user/PlagiarismeView';

export default function UserDashboard() {
  const { activeTab } = useOutletContext();

  return (
    <>
      {activeTab === 'ejaan' ? <EjaanView /> : <PlagiarismeView />}
    </>
  );
}