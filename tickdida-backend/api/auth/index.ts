import express from 'express';
import { login, register, logout, refreshToken, getUserInfo } from './authController';
import authMiddleware from '../../middleware/authMiddleware';

const router = express.Router();

// 公开路由
router.post('/login', login);
router.post('/register', register);
router.post('/refresh-token', refreshToken);

// 需要认证的路由
router.use(authMiddleware);
router.post('/logout', logout);
router.get('/me', getUserInfo);

// 可选的密码重置路由
router.post('/forgot-password', (req, res) => {
  res.status(200).json({ message: '密码重置邮件已发送' });
});

router.post('/reset-password', (req, res) => {
  res.status(200).json({ message: '密码重置成功' });
});

export default router;