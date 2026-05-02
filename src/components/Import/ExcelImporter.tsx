import React, { useState, useCallback } from 'react';
import { Issue } from '../../types';
import { parseSeverity, parseExcelDate, parseStatus, filterExcludedIssues, cfg } from '../../utils/dataProcessor';
import { Button } from '../common';
import * as XLSX from 'xlsx';

interface ExcelImporterProps {
  isOpen: boolean;
  onClose: () => void;
  onImport: (issues: Issue[], date: string) => void;
}

// 改进的字段匹配函数
function findField(headers: string[], fieldName: keyof typeof cfg.fieldMapping): string | undefined {
  const fieldConfig = cfg.fieldMapping[fieldName];
  if (!fieldConfig) return undefined;
  
  // 按别名长度排序，优先匹配更长的别名
  const sortedAliases = [...fieldConfig.aliases].sort((a, b) => b.length - a.length);
  
  for (const alias of sortedAliases) {
    const normalizedAlias = alias.toLowerCase();
    const matchedHeader = headers.find(header => 
      header.toLowerCase().includes(normalizedAlias)
    );
    if (matchedHeader) {
      return matchedHeader;
    }
  }
  return undefined;
}

export const ExcelImporter: React.FC<ExcelImporterProps> = ({ isOpen, onClose, onImport }) => {
  const [fileName, setFileName] = useState<string>('');
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [date, setDate] = useState<string>(new Date().toISOString().split('T')[0]);
  const [error, setError] = useState<string>('');

  const handleFileChange = useCallback((event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      setSelectedFile(file);
      setFileName(file.name);
      setError('');
    }
  }, []);

  const handleDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    const file = e.dataTransfer.files?.[0];
    if (file && (file.name.endsWith('.xlsx') || file.name.endsWith('.xls'))) {
      setSelectedFile(file);
      setFileName(file.name);
      setError('');
    } else {
      setError('请选择.xlsx或.xls格式的文件');
    }
  }, []);

  const handleDragOver = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
  }, []);

  const handleImport = useCallback(() => {
    const file = selectedFile;
    
    if (!file) {
      setError('请选择文件');
      return;
    }

    const reader = new FileReader();
    reader.onload = (e) => {
      try {
        const data = e.target?.result;
        const workbook = XLSX.read(data, { type: 'binary' });
        const sheetName = workbook.SheetNames[0];
        const worksheet = workbook.Sheets[sheetName];
        
        // 使用默认方式读取为对象数组，更可靠
        const jsonData = XLSX.utils.sheet_to_json(worksheet) as Record<string, any>[];

        if (jsonData.length < 1) {
          setError('文件数据格式不正确');
          return;
        }

        // 获取表头
        const headers = Object.keys(jsonData[0]);
        console.log('实际表头:', headers);
        
        // 测试字段匹配
        const issueIdField = findField(headers, 'issueId');
        const descField = findField(headers, 'description');
        const assigneeField = findField(headers, 'assignee');
        
        console.log('字段匹配结果:');
        console.log('issueIdField:', issueIdField);
        console.log('descField:', descField);
        console.log('assigneeField:', assigneeField);
        
        // 测试第一行数据
        console.log('第一行数据:', jsonData[0]);

        if (!assigneeField) {
          setError('未找到负责人字段');
          return;
        }

        const createdTimeField = findField(headers, 'createdTime');
        const severityField = findField(headers, 'severity');
        const remarkField = findField(headers, 'remark');
        const statusField = findField(headers, 'status');

        const issues: Issue[] = [];
        
        for (let i = 0; i < jsonData.length; i++) {
          const row = jsonData[i];
          if (!row[assigneeField]) continue;

          const issue: Issue = {
            id: issueIdField ? String(row[issueIdField] || `ISSUE-${i}`) : `ISSUE-${i}`,
            description: descField ? String(row[descField] || '') : '',
            assignee: String(row[assigneeField] || ''),
            createdTime: createdTimeField ? parseExcelDate(row[createdTimeField]) : new Date(),
            severity: severityField ? parseSeverity(row[severityField]) : 'medium',
            remark: remarkField ? String(row[remarkField] || '') : '',
            status: statusField ? parseStatus(row[statusField]) : 'open'
          };

          console.log(`第${i}行解析结果:`, issue);
          issues.push(issue);
        }

        const filteredIssues = filterExcludedIssues(issues);
        onImport(filteredIssues, date);
        setFileName('');
        setError('');
        onClose();
      } catch (err) {
        console.error('解析错误:', err);
        setError('文件解析失败');
      }
    };
    reader.readAsBinaryString(file);
  }, [date, onImport, onClose]);

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg shadow-xl w-full max-w-md p-6">
        <h2 className="text-xl font-bold text-gray-900 mb-4">导入Excel数据</h2>
        
        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">数据日期</label>
            <input
              type="date"
              value={date}
              onChange={(e) => setDate(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">选择Excel文件</label>
            <div 
              className="border-2 border-dashed border-gray-300 rounded-lg p-6 text-center hover:border-gray-400 transition-colors"
              onDrop={handleDrop}
              onDragOver={handleDragOver}
            >
              <input
                type="file"
                accept=".xlsx,.xls"
                onChange={handleFileChange}
                className="hidden"
                id="file-input"
              />
              <label htmlFor="file-input" className="cursor-pointer">
                <div className="text-gray-600">
                  {fileName ? (
                    <span className="text-blue-600">{fileName}</span>
                  ) : (
                    <>
                      <span className="text-blue-600">点击选择文件</span>
                      <span className="text-gray-500"> 或拖拽文件到此处</span>
                    </>
                  )}
                </div>
              </label>
            </div>
          </div>

          {error && (
            <div className="text-red-600 text-sm">{error}</div>
          )}
        </div>

        <div className="flex justify-end gap-3 mt-6">
          <Button variant="secondary" onClick={onClose}>取消</Button>
          <Button variant="success" onClick={handleImport}>确认导入</Button>
        </div>
      </div>
    </div>
  );
};