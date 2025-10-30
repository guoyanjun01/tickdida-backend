import express from 'express';
import { createPayment, notify, queryOrder, refund, closeOrder } from './alipayController';
import periodic from '../../periodic';
import authMiddleware from '../../middleware/authMiddleware';

const router = express.Router();

// 支付相关路由
router.post('/create', authMiddleware, createPayment); // 创建支付
router.post('/notify', notify); // 异步通知（不需要认证，支付宝服务器调用）
router.get('/query', authMiddleware, queryOrder); // 查询订单
router.post('/refund', authMiddleware, refund); // 退款
router.post('/close', authMiddleware, closeOrder); // 关闭订单
router.post('/periodic', authMiddleware, periodic); // 创建定期支付协议

export default router;