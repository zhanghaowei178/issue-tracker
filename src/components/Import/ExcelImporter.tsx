import React, { useState, useCallback } from 'react';
import { Issue } from '../../types';
import { findFieldIndex, parseSeverity, parseExcelDate, parseStatus, filterExcludedIssues } from '../../utils/dataProcessor';
import { Button } from '../common';
import * as XLSX from 'xlsx';

interface ExcelImporterProps {
  isOpen: boolean;
  onClose: () => void;
  onImport: (issues: Issue[], date: string) => void;
}

export const ExcelImporter: React.FC<ExcelImporterProps> = ({ isOpen, onClose, onImport }) => {
  const [fileName, setFileName] = useState<string>('');
  const [date, setDate] = useState<string>(new Date().toISOString().split('T')[0]);
  const [error, setError] = useState<string>('');

  const handleFileChange = useCallback((event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      setFileName(file.name);
      setError('');
    }
  }, []);

  const handleImport = useCallback(() => {
    const fileInput = document.querySelector('input[type="file"]') as HTMLInputElement;
    const file = fileInput?.files?.[0];
    
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
        const jsonData = XLSX.utils.sheet_to_json(worksheet, { header: 1 }) as any[][];

        if (jsonData.length < 2) {
          setError('文件数据格式不正确');
          return;
        }

        const headers = jsonData[0].map(h => String(h || ''));
        
        const issueIdIdx = findFieldIndex(headers, 'issueId');
        const descIdx = findFieldIndex(headers, 'description');
        const assigneeIdx = findFieldIndex(headers, 'assignee');
        const createdTimeIdx = findFieldIndex(headers, 'createdTime');
        const severityIdx = findFieldIndex(headers, 'severity');
        const remarkIdx = findFieldIndex(headers, 'remark');
        const statusIdx = findFieldIndex(headers, 'status');

        if (assigneeIdx === -1) {
          setError('未找到负责人字段');
          return;
        }

        const issues: Issue[] = [];
        
        for (let i = 1; i < jsonData.length; i++) {
          const row = jsonData[i];
          if (!row[assigneeIdx]) continue;

          const issue: Issue = {
            id: issueIdIdx !== -1 ? String(row[issueIdIdx] || `ISSUE-${i}`) : `ISSUE-${i}`,
            description: descIdx !== -1 ? String(row[descIdx] || '') : '',
            assignee: String(row[assigneeIdx] || ''),
            createdTime: createdTimeIdx !== -1 ? parseExcelDate(row[createdTimeIdx]) : new Date(),
            severity: severityIdx !== -1 ? parseSeverity(row[severityIdx]) : 'medium',
            remark: remarkIdx !== -1 ? String(row[remarkIdx] || '') : '',
            status: statusIdx !== -1 ? parseStatus(row[statusIdx]) : 'open'
          };

          issues.push(issue);
        }

        const filteredIssues = filterExcludedIssues(issues);
        onImport(filteredIssues, date);
        setFileName('');
        setError('');
        onClose();
      } catch (err) {
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
            <div className="border-2 border-dashed border-gray-300 rounded-lg p-6 text-center hover:border-gray-400 transition-colors">
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