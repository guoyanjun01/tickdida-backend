import express from 'express';
import { createPaymentIntent, webhook, createCustomer, updateSubscription } from './stripeController';
import authMiddleware from '../../middleware/authMiddleware';

const router = express.Router();

// Stripe支付相关路由
router.post('/payment-intent', authMiddleware, createPaymentIntent); // 创建支付意向
router.post('/webhook', webhook); // Webhook处理（不需要认证，Stripe服务器调用）
router.post('/customer', authMiddleware, createCustomer); // 创建客户
router.post('/subscription', authMiddleware, updateSubscription); // 更新订阅

export default router;