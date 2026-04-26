import React, { useState } from 'react';
import { Button } from '../common';

interface ExportPanelProps {
  isOpen: boolean;
  onClose: () => void;
  exportRef: React.RefObject<HTMLDivElement>;
}

export const ExportPanel: React.FC<ExportPanelProps> = ({ isOpen, onClose, exportRef }) => {
  const [exportType, setExportType] = useState<'pdf' | 'png'>('png');
  const [isExporting, setIsExporting] = useState(false);

  const handleExport = async () => {
    if (!exportRef.current) return;
    
    setIsExporting(true);
    try {
      const html2canvas = (await import('html2canvas')).default;
      const jsPDF = (await import('jspdf')).default;
      
      const element = exportRef.current;
      const canvas = await html2canvas(element, {
        scale: 2,
        useCORS: true,
        logging: false
      });

      if (exportType === 'png') {
        const link = document.createElement('a');
        link.download = `issue-tracker-${Date.now()}.png`;
        link.href = canvas.toDataURL('image/png');
        link.click();
      } else {
        const imgData = canvas.toDataURL('image/png');
        const pdf = new jsPDF({
          orientation: canvas.width > canvas.height ? 'landscape' : 'portrait',
          unit: 'px',
          format: [canvas.width, canvas.height]
        });
        pdf.addImage(imgData, 'PNG', 0, 0, canvas.width, canvas.height);
        pdf.save(`issue-tracker-${Date.now()}.pdf`);
      }
      
      onClose();
    } catch (error) {
      console.error('Export failed:', error);
    } finally {
      setIsExporting(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg shadow-xl w-full max-w-md p-6">
        <h2 className="text-xl font-bold text-gray-900 mb-4">导出数据</h2>
        
        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">导出格式</label>
            <div className="flex gap-4">
              <label className="flex items-center cursor-pointer">
                <input
                  type="radio"
                  name="exportType"
                  value="png"
                  checked={exportType === 'png'}
                  onChange={() => setExportType('png')}
                  className="mr-2"
                />
                <span>PNG 图片</span>
              </label>
              <label className="flex items-center cursor-pointer">
                <input
                  type="radio"
                  name="exportType"
                  value="pdf"
                  checked={exportType === 'pdf'}
                  onChange={() => setExportType('pdf')}
                  className="mr-2"
                />
                <span>PDF 文档</span>
              </label>
            </div>
          </div>
        </div>

        <div className="flex justify-end gap-3 mt-6">
          <Button variant="secondary" onClick={onClose}>取消</Button>
          <Button variant="primary" onClick={handleExport} disabled={isExporting}>
            {isExporting ? '导出中...' : '确认导出'}
          </Button>
        </div>
      </div>
    </div>
  );
};