import express from 'express';
import path from 'path';
import fs from 'fs';

// 创建Express应用实例
const app = express();
const PORT = process.env.PORT || 3000;

// 中间件配置
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// 路由配置

// 动态加载所有API路由
const apiDir = path.join(__dirname, 'api');

// 递归加载API路由的函数
function loadRoutes(dir: string, basePath: string = '/api') {
  if (fs.existsSync(dir)) {
    const files = fs.readdirSync(dir);
    
    files.forEach(file => {
      const filePath = path.join(dir, file);
      const stats = fs.statSync(filePath);
      
      if (stats.isDirectory()) {
        // 递归加载子目录
        loadRoutes(filePath, `${basePath}/${file}`);
      } else if (file.endsWith('.ts') && file !== 'index.ts') {
        // 加载路由文件
        const routeName = file.replace('.ts', '');
        try {
          const route = require(filePath);
          app.use(`${basePath}/${routeName}`, route.default || route);
          console.log(`Loaded route: ${basePath}/${routeName}`);
        } catch (error) {
          console.error(`Error loading route ${filePath}:`, error);
        }
      } else if (file === 'index.ts') {
        // 加载索引文件作为目录路由
        try {
          const route = require(filePath);
          app.use(basePath, route.default || route);
          console.log(`Loaded index route: ${basePath}`);
        } catch (error) {
          console.error(`Error loading index route ${filePath}:`, error);
        }
      }
    });
  }
}

// 加载API路由
loadRoutes(apiDir);

// 健康检查端点
app.get('/health', (req, res) => {
  res.status(200).json({
    status: 'ok',
    message: '滴答滴答后端服务运行正常',
    timestamp: new Date().toISOString()
  });
});

// 全局错误处理中间件
app.use((err: Error, req: express.Request, res: express.Response, next: express.NextFunction) => {
  console.error('Server error:', err);
  res.status(500).json({
    error: 'Internal Server Error',
    message: err.message
  });
});

// 启动服务器
app.listen(PORT, () => {
  console.log(`服务器运行在 http://localhost:${PORT}`);
  console.log(`健康检查地址: http://localhost:${PORT}/health`);
});

// 导出app用于测试
export default app;