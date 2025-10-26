import { Request, Response, NextFunction } from 'express';

// 认证中间件
const authMiddleware = (req: Request, res: Response, next: NextFunction): void => {
  // 获取Authorization头
  const authHeader = req.headers.authorization;
  
  // 检查是否存在Authorization头
  if (!authHeader) {
    res.status(401).json({ error: '缺少认证令牌' });
    return;
  }
  
  // 检查Bearer格式
  const parts = authHeader.split(' ');
  if (parts.length !== 2 || parts[0] !== 'Bearer') {
    res.status(401).json({ error: '认证令牌格式错误' });
    return;
  }
  
  const token = parts[1];
  
  try {
    // 模拟令牌验证
    // 在实际项目中，这里应该使用jsonwebtoken库验证JWT令牌
    // const decoded = jwt.verify(token, process.env.JWT_SECRET);
    
    // 模拟验证成功，从token中提取用户ID
    // 实际项目中，这里应该从decoded对象中获取用户信息
    const userId = token.split('_')[2];
    
    if (!userId) {
      throw new Error('无效的令牌');
    }
    
    // 将用户信息附加到请求对象
    (req as any).user = { id: userId };
    req.headers['user-id'] = userId;
    
    // 继续处理请求
    next();
  } catch (error) {
    // 令牌验证失败
    if (error instanceof Error) {
      res.status(401).json({ error: '无效的认证令牌', message: error.message });
    } else {
      res.status(401).json({ error: '无效的认证令牌' });
    }
  }
};

export default authMiddleware;