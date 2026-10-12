import React from 'react';
import { useSearchParams } from 'react-router-dom';
import { useStore } from '../../store/useStore';
import Training from './Training';
import GrandmasterStudy from '../GrandmasterStudy/GrandmasterStudy';
import Review from '../Review/Review';

// One Training area with three tabs. Each tab renders the existing page unchanged.
const TABS = [
  { id: 'practice', label: 'Practice' },
  { id: 'study', label: 'Grandmaster study' },
  { id: 'review', label: 'Review queue' },
];

export default function TrainingHub() {
  const [params, setParams] = useSearchParams();
  const reviewQueue = useStore(s => s.reviewQueue);
  const dueCount = reviewQueue.filter(q => q.dueAt <= Date.now()).length;
  const tab = TABS.some(t => t.id === params.get('tab')) ? params.get('tab') : 'practice';

  const select = id => {
    const next = new URLSearchParams();
    if (id !== 'practice') next.set('tab', id);
    setParams(next);
  };

  return (
    <div className="training-hub">
      <div className="tabs" role="tablist" aria-label="Training sections">
        {TABS.map(t => (
          <button
            key={t.id}
            role="tab"
            id={`tab-${t.id}`}
            aria-selected={tab === t.id}
            aria-controls="training-panel"
            className={`tab ${tab === t.id ? 'active' : ''}`}
            onClick={() => select(t.id)}
          >
            {t.label}{t.id === 'review' && dueCount > 0 ? ` (${dueCount})` : ''}
          </button>
        ))}
      </div>
      <div id="training-panel" role="tabpanel" aria-labelledby={`tab-${tab}`}>
        {tab === 'practice' && <Training />}
        {tab === 'study' && <GrandmasterStudy />}
        {tab === 'review' && <Review />}
      </div>
    </div>
  );
}
