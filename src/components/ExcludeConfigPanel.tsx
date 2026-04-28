import { useState } from 'react';
import { Button, Card } from './common';

interface ExcludeConfigPanelProps {
  isOpen: boolean;
  onClose: () => void;
  onSave: (excludeList: string[]) => void;
  defaultExcludeList: string[];
}

const DEFAULT_BACKEND_LIST = ["测试组", "自动化", "测试人员", "tester", "admin", "管理员"];

export function ExcludeConfigPanel({ 
  isOpen, 
  onClose, 
  onSave, 
  defaultExcludeList 
}: ExcludeConfigPanelProps) {
  const [jsonInput, setJsonInput] = useState<string>(JSON.stringify(defaultExcludeList, null, 2));
  const [error, setError] = useState<string | null>(null);

  if (!isOpen) return null;

  const handleImportBackend = () => {
    setJsonInput(JSON.stringify(DEFAULT_BACKEND_LIST, null, 2));
    setError(null);
  };

  const handleSave = () => {
    try {
      const parsed = JSON.parse(jsonInput);
      if (!Array.isArray(parsed)) {
        setError('JSON格式错误：必须是数组格式');
        return;
      }
      if (!parsed.every(item => typeof item === 'string')) {
        setError('JSON格式错误：数组元素必须是字符串');
        return;
      }
      onSave(parsed);
      onClose();
    } catch (e) {
      setError('JSON解析错误：请检查JSON格式');
    }
  };

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto">
      <div className="flex min-h-screen items-center justify-center p-4">
        <div className="fixed inset-0 bg-black bg-opacity-50" onClick={onClose}></div>
        <Card className="relative z-10 w-full max-w-2xl">
          <div className="flex justify-between items-center mb-4">
            <h2 className="text-xl font-bold text-gray-900">屏蔽人员配置</h2>
            <button
              onClick={onClose}
              className="text-gray-400 hover:text-gray-600 text-2xl"
            >
              ×
            </button>
          </div>

          <div className="space-y-4">
            <div>
              <p className="text-sm text-gray-600 mb-2">
                请输入屏蔽人员名单（JSON数组格式），系统会自动过滤包含这些关键词的人员问题单。
              </p>
              <Button 
                variant="secondary" 
                onClick={handleImportBackend}
                className="mb-2"
              >
                📋 导入后端人员名单
              </Button>
              <textarea
                value={jsonInput}
                onChange={(e) => setJsonInput(e.target.value)}
                className="w-full h-48 p-3 border border-gray-300 rounded-md font-mono text-sm resize-none"
                placeholder='["测试组", "自动化", "测试人员"]'
              />
            </div>

            {error && (
              <div className="p-3 bg-red-50 border border-red-200 rounded-md text-red-700 text-sm">
                ⚠️ {error}
              </div>
            )}

            <div className="flex justify-end gap-3 pt-4 border-t border-gray-200">
              <Button variant="secondary" onClick={onClose}>
                取消
              </Button>
              <Button variant="primary" onClick={handleSave}>
                ✓ 确认保存
              </Button>
            </div>
          </div>
        </Card>
      </div>
    </div>
  );
}
