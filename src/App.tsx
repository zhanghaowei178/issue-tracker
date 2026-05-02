import { useState, useRef, useEffect } from 'react';
import { Issue, ViewType } from './types';
import { useDataClassifier } from './hooks/useDataClassifier';
import { ExcelImporter } from './components/Import';
import { ExportPanel } from './components/Export';
import { ExcludeConfigPanel } from './components/ExcludeConfigPanel';
import { Button } from './components/common';
import { TeamOverview, RankingBoard, ComparisonView, PersonalDetail } from './components/Dashboard';
import { IssueOverview, PersonalBoard } from './components/Dashboard';
import { setExcludeList, getExcludeList, cfg } from './utils/dataProcessor';

const STORAGE_KEY = 'issue-tracker-exclude-list';

function App() {
  const [currentView, setCurrentView] = useState<ViewType>('team-overview');
  const [previousIssues, setPreviousIssues] = useState<Issue[]>([]);
  const [currentIssues, setCurrentIssues] = useState<Issue[]>([]);
  const [isImportOpen, setIsImportOpen] = useState(false);
  const [isExportOpen, setIsExportOpen] = useState(false);
  const [isConfigOpen, setIsConfigOpen] = useState(false);
  const [selectedAssignee, setSelectedAssignee] = useState<string | null>(null);
  const [importType, setImportType] = useState<'previous' | 'current'>('current');
  const [excludeList, setExcludeListState] = useState<string[]>(cfg.excludeAssignees?.values || []);
  const exportRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    setExcludeList(cfg.excludeAssignees?.values || []);
  }, []);

  useEffect(() => {
    const saved = localStorage.getItem(STORAGE_KEY);
    if (saved) {
      try {
        const parsed = JSON.parse(saved);
        if (Array.isArray(parsed) && parsed.every(item => typeof item === 'string')) {
          setExcludeListState(parsed);
          setExcludeList(parsed);
        }
      } catch (e) {
        console.error('Failed to load exclude list from storage:', e);
      }
    }
  }, []);

  const { processedIssues } = useDataClassifier(currentIssues);

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

  const handleSaveConfig = (newList: string[]) => {
    setExcludeListState(newList);
    setExcludeList(newList);
    localStorage.setItem(STORAGE_KEY, JSON.stringify(newList));
  };

  const handleBackToOverview = () => {
    setCurrentView('team-overview');
  };

  const views = [
    { key: 'team-overview', label: '团队总览' },
    { key: 'ranking', label: '解单排行榜' },
    { key: 'comparison', label: '数据对比' }
  ];

  return (
    <div className="min-h-screen bg-gray-100">
      <div className="mx-auto px-6 py-8">
        <div className="flex justify-between items-center mb-4">
          <h1 className="text-2xl font-bold text-gray-900">问题单管理看板</h1>
          <div className="flex gap-3">
            <Button 
              variant="secondary" 
              onClick={() => setIsConfigOpen(true)}
            >
              ⚙️ 屏蔽人员配置
            </Button>
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

        <div className="mb-6 p-3 bg-blue-50 border border-blue-200 rounded-md">
          <p className="text-sm text-blue-700">
            <span className="font-medium">当前屏蔽人员名单：</span>
            {excludeList.length > 0 ? (
              excludeList.map((item, index) => (
                <span key={index} className="mx-1 px-2 py-1 bg-blue-100 rounded text-xs">
                  {item}
                </span>
              ))
            ) : (
              <span>无</span>
            )}
          </p>
        </div>

        <div className="flex gap-2 mb-6 bg-gray-200 p-1 rounded-lg">
          {views.map(item => (
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
              previousIssues={previousIssues}
              onViewIssueOverview={() => setCurrentView('issue-overview')}
              onViewPersonalBoard={() => setCurrentView('personal-board')}
            />
          )}
          {currentView === 'ranking' && (
            <RankingBoard 
              issues={processedIssues} 
              previousIssues={previousIssues}
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
              previousIssues={previousIssues.filter(i => i.assignee === selectedAssignee)}
              onBack={() => setCurrentView('team-overview')} 
            />
          )}
          {currentView === 'issue-overview' && (
            <IssueOverview 
              issues={processedIssues} 
              previousIssues={previousIssues}
              onBack={handleBackToOverview}
            />
          )}
          {currentView === 'personal-board' && (
            <PersonalBoard 
              issues={processedIssues} 
              previousIssues={previousIssues}
              onViewDetail={handleViewDetail}
              onBack={handleBackToOverview}
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
      <ExcludeConfigPanel 
        isOpen={isConfigOpen} 
        onClose={() => setIsConfigOpen(false)} 
        onSave={handleSaveConfig} 
        defaultExcludeList={cfg.excludeAssignees?.values || []}
      />
    </div>
  );
}

export default App;
