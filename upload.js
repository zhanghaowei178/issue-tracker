#!/usr/bin/env node

const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');

const configPath = path.join(__dirname, 'github-config.json');

if (!fs.existsSync(configPath)) {
  console.error('错误：找不到github-config.json配置文件');
  console.error('请确保已经创建github-config.json文件');
  process.exit(1);
}

const config = JSON.parse(fs.readFileSync(configPath, 'utf8'));

if (!config.github || !config.github.token) {
  console.error('错误：配置文件缺少GitHub token信息');
  process.exit(1);
}

const { username, repository, token } = config.github;
const remoteUrl = `https://${username}:${token}@github.com/${username}/${repository}.git`;

console.log('正在配置远程仓库...');
try {
  execSync(`git remote set-url origin ${remoteUrl}`, { stdio: 'inherit' });
  console.log('正在推送代码到GitHub...');
  execSync('git push origin main', { stdio: 'inherit' });
  console.log('✓ 代码上传成功！');
} catch (error) {
  console.error('上传失败:', error.message);
  process.exit(1);
}
