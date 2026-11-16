///////////////////////////////////////////////////////////
//                                                       //
//                     SETTINGS PAGE                     //
//                                                       //
///////////////////////////////////////////////////////////

import React, { Suspense } from 'react';
import { getAllPolicies } from '@/lib/policies';
import { SettingsClient } from './SettingsClient';

export default function SettingsPage() {
  const policies = getAllPolicies();

  return (
    <Suspense
      fallback={
        <div className="min-h-screen bg-[#FAF7F2] dark:bg-stone-950 flex items-center justify-center">
          <div className="w-10 h-10 rounded-full border-4 border-[#EADBCE] border-t-[#E89650] animate-spin" />
        </div>
      }
    >
      <SettingsClient policies={policies} />
    </Suspense>
  );
}
