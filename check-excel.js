import * as XLSX from 'xlsx';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// 读取Excel文件
const yesterdayPath = path.join(__dirname, 'yesterday_issues.xlsx');
const todayPath = path.join(__dirname, 'today_issues.xlsx');

function checkExcelFile(filePath) {
  console.log(`\n检查文件: ${filePath}`);
  const workbook = XLSX.read(fs.readFileSync(filePath));
  const sheetName = workbook.SheetNames[0];
  const worksheet = workbook.Sheets[sheetName];
  
  // 使用 header: 1 获取原始数组格式
  const jsonData = XLSX.utils.sheet_to_json(worksheet, { header: 1 });
  
  console.log('表头:', jsonData[0]);
  console.log('第一行数据:', jsonData[1]);
  console.log('第二行数据:', jsonData[2]);
  
  // 也用默认方式读取，看对象格式
  const objectData = XLSX.utils.sheet_to_json(worksheet);
  console.log('\n对象格式第一行:');
  console.log(objectData[0]);
}

checkExcelFile(yesterdayPath);
checkExcelFile(todayPath);