import { Request, Response } from 'express';

// 模拟用户数据
const mockUsers = [
  {
    id: '1',
    username: 'testuser',
    email: 'test@example.com',
    // 实际项目中应该使用bcrypt等库加密密码
    password: 'hashedpassword',
  },
];

// 模拟JWT令牌生成函数
const generateToken = (userId: string): string => {
  // 实际项目中应该使用jsonwebtoken库生成真实的JWT令牌
  return `mock_jwt_token_${userId}_${Date.now()}`;
};

// 登录控制器
export const login = (req: Request, res: Response): void => {
  const { username, password } = req.body;
  
  // 验证输入
  if (!username || !password) {
    res.status(400).json({ error: '用户名和密码不能为空' });
    return;
  }
  
  // 模拟用户验证
  const user = mockUsers.find(u => u.username === username);
  
  if (!user || user.password !== password) {
    res.status(401).json({ error: '用户名或密码错误' });
    return;
  }
  
  // 生成令牌
  const token = generateToken(user.id);
  const refreshToken = generateToken(`${user.id}_refresh`);
  
  res.status(200).json({
    success: true,
    token,
    refreshToken,
    user: {
      id: user.id,
      username: user.username,
      email: user.email,
    },
  });
};

// 注册控制器
export const register = (req: Request, res: Response): void => {
  const { username, email, password } = req.body;
  
  // 验证输入
  if (!username || !email || !password) {
    res.status(400).json({ error: '所有字段都不能为空' });
    return;
  }
  
  // 检查用户是否已存在
  if (mockUsers.find(u => u.username === username || u.email === email)) {
    res.status(400).json({ error: '用户名或邮箱已存在' });
    return;
  }
  
  // 创建新用户
  const newUser = {
    id: String(mockUsers.length + 1),
    username,
    email,
    password, // 实际项目中应该加密
  };
  
  mockUsers.push(newUser);
  
  // 生成令牌
  const token = generateToken(newUser.id);
  const refreshToken = generateToken(`${newUser.id}_refresh`);
  
  res.status(201).json({
    success: true,
    message: '注册成功',
    token,
    refreshToken,
    user: {
      id: newUser.id,
      username: newUser.username,
      email: newUser.email,
    },
  });
};

// 登出控制器
export const logout = (req: Request, res: Response): void => {
  // 在实际项目中，这里应该将令牌加入黑名单或清除token存储
  res.status(200).json({ success: true, message: '登出成功' });
};

// 刷新令牌控制器
export const refreshToken = (req: Request, res: Response): void => {
  const { refreshToken } = req.body;
  
  if (!refreshToken) {
    res.status(400).json({ error: '刷新令牌不能为空' });
    return;
  }
  
  // 模拟令牌验证
  // 实际项目中应该验证refreshToken的有效性
  const userId = refreshToken.split('_')[2];
  
  if (!userId) {
    res.status(401).json({ error: '无效的刷新令牌' });
    return;
  }
  
  // 生成新令牌
  const newToken = generateToken(userId);
  const newRefreshToken = generateToken(`${userId}_refresh`);
  
  res.status(200).json({
    success: true,
    token: newToken,
    refreshToken: newRefreshToken,
  });
};

// 获取用户信息控制器
export const getUserInfo = (req: Request, res: Response): void => {
  // 在实际项目中，req.user应该由authMiddleware设置
  const userId = req.headers['user-id'] || '1'; // 模拟
  
  const user = mockUsers.find(u => u.id === userId);
  
  if (!user) {
    res.status(404).json({ error: '用户不存在' });
    return;
  }
  
  res.status(200).json({
    success: true,
    user: {
      id: user.id,
      username: user.username,
      email: user.email,
    },
  });
};