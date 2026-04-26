import { useState, useRef, useMemo } from 'react';
import { Issue, ViewType } from './types';
import { useDataClassifier } from './hooks/useDataClassifier';
import { ExcelImporter } from './components/Import';
import { ExportPanel } from './components/Export';
import { Button } from './components/common';
import { TeamOverview, RankingBoard, ComparisonView, PersonalDetail } from './components/Dashboard';

function App() {
  const [currentView, setCurrentView] = useState<ViewType>('team-overview');
  const [previousIssues, setPreviousIssues] = useState<Issue[]>([]);
  const [currentIssues, setCurrentIssues] = useState<Issue[]>([]);
  const [isImportOpen, setIsImportOpen] = useState(false);
  const [isExportOpen, setIsExportOpen] = useState(false);
  const [selectedAssignee, setSelectedAssignee] = useState<string | null>(null);
  const [importType, setImportType] = useState<'previous' | 'current'>('current');
  const exportRef = useRef<HTMLDivElement>(null);

  const { stats, processedIssues } = useDataClassifier(currentIssues);

  const handleImport = (issues: Issue[], _date: string) => {
    if (importType === 'previous') {
      setPreviousIssues(issues);
    } else {
      setCurrentIssues(issues);
    }
  };

  const handleViewDetail = (assignee: string) => {
    setSelectedAssignee(assignee);
    setCurrentView('personal-detail');
  };

  const previousResolvedCount = useMemo(() => {
    return previousIssues.filter(i => i.status === 'resolved').length;
  }, [previousIssues]);

  return (
    <div className="min-h-screen bg-gray-100">
      <div className="max-w-7xl mx-auto px-6 py-8">
        <div className="flex justify-between items-center mb-6">
          <h1 className="text-2xl font-bold text-gray-900">问题单管理看板</h1>
          <div className="flex gap-3">
            <Button 
              variant="success" 
              onClick={() => { 
                setImportType('current'); 
                setIsImportOpen(true); 
              }}
            >
              📥 导入今日数据
            </Button>
            <Button 
              variant="secondary" 
              onClick={() => { 
                setImportType('previous'); 
                setIsImportOpen(true); 
              }}
            >
              📥 导入昨日数据
            </Button>
            <Button 
              variant="secondary" 
              onClick={() => setIsExportOpen(true)}
            >
              📤 导出
            </Button>
          </div>
        </div>

        <div className="flex gap-2 mb-6 bg-gray-200 p-1 rounded-lg">
          {[
            { key: 'team-overview', label: '团队总览' },
            { key: 'ranking', label: '解单排行榜' },
            { key: 'comparison', label: '数据对比' }
          ].map(item => (
            <button
              key={item.key}
              onClick={() => setCurrentView(item.key as ViewType)}
              className={`px-4 py-2 rounded-md text-sm font-medium ${
                currentView === item.key 
                  ? 'bg-white shadow-sm text-blue-600' 
                  : 'text-gray-700 hover:bg-gray-300'
              }`}
            >
              {item.label}
            </button>
          ))}
        </div>

        <div ref={exportRef}>
          {currentView === 'team-overview' && (
            <TeamOverview 
              issues={processedIssues} 
              previousResolvedCount={previousResolvedCount} 
            />
          )}
          {currentView === 'ranking' && (
            <RankingBoard 
              issues={processedIssues} 
              stats={stats}
              onViewDetail={handleViewDetail} 
            />
          )}
          {currentView === 'comparison' && (
            <ComparisonView 
              previousIssues={previousIssues} 
              currentIssues={processedIssues} 
            />
          )}
          {currentView === 'personal-detail' && selectedAssignee && (
            <PersonalDetail 
              assignee={selectedAssignee} 
              issues={processedIssues.filter(i => i.assignee === selectedAssignee)} 
              onBack={() => setCurrentView('team-overview')} 
            />
          )}
        </div>
      </div>

      <ExcelImporter 
        isOpen={isImportOpen} 
        onClose={() => setIsImportOpen(false)} 
        onImport={handleImport} 
      />
      <ExportPanel 
        isOpen={isExportOpen} 
        onClose={() => setIsExportOpen(false)} 
        exportRef={exportRef} 
      />
    </div>
  );
}

export default App;