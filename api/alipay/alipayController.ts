import { Request, Response } from 'express';
const { AlipaySdk } = require('alipay-sdk');
import fs from 'fs';
import path from 'path';

// 配置支付宝SDK
const alipaySdk = new AlipaySdk({
  appId: process.env.ALIPAY_APP_ID || '2021000000000000', // 从环境变量读取AppID
  privateKey: fs.readFileSync(
    path.join(process.cwd(), 'keys/app_private_key.pem'),
    'utf8'
  ),
  alipayPublicKey: process.env.ALIPAY_PUBLIC_KEY || '', // 从环境变量读取公钥
  gateway: 'https://openapi.alipay.com/gateway.do', // 正式环境
  signType: 'RSA2',
});

// 生成随机订单号
const generateOrderNo = (): string => {
  const timestamp = Date.now().toString();
  const random = Math.floor(Math.random() * 10000).toString().padStart(4, '0');
  return `ORDER${timestamp}${random}`;
};

// 创建支付
export const createPayment = async (req: Request, res: Response): Promise<void> => {
  try {
    const { amount, subject, body, returnUrl } = req.body;
    
    // 验证参数
    if (!amount || !subject) {
      res.status(400).json({ error: '缺少必要参数' });
      return;
    }
    
    const orderNo = generateOrderNo();
    
    // 调用支付宝交易创建接口
    const result = await alipaySdk.exec('alipay.trade.page.pay', {
      method: 'POST',
      bizContent: {
        out_trade_no: orderNo,
        product_code: 'FAST_INSTANT_TRADE_PAY',
        total_amount: amount.toString(),
        subject,
        body: body || subject,
      },
      returnUrl: returnUrl || process.env.ALIPAY_RETURN_URL,
      notifyUrl: process.env.ALIPAY_NOTIFY_URL,
    });
    
    res.status(200).json({
      success: true,
      orderNo,
      paymentUrl: result,
    });
  } catch (error) {
    console.error('创建支付失败:', error);
    res.status(500).json({ error: '创建支付失败', message: (error as Error).message });
  }
};

// 处理异步通知
export const notify = async (req: Request, res: Response): Promise<void> => {
  try {
    // 验证支付宝签名
    const params = req.body;
    const verifyResult = alipaySdk.checkNotifySign(params);
    
    if (!verifyResult) {
      console.error('签名验证失败');
      // 即使签名验证失败，也返回success给支付宝避免重复通知
      res.status(200).send('success');
      return;
    }
    
    // 处理支付结果
    const { out_trade_no, trade_status } = params;
    
    // 根据trade_status处理订单
    if (trade_status === 'TRADE_SUCCESS' || trade_status === 'TRADE_FINISHED') {
      // 更新订单状态为已支付
      // 在实际项目中，这里应该调用数据库更新订单状态
      console.log(`订单 ${out_trade_no} 支付成功`);
    }
    
    // 必须返回success给支付宝服务器
    res.status(200).send('success');
  } catch (error) {
    console.error('处理通知失败:', error);
    // 即使发生错误，也返回success给支付宝避免重复通知
    res.status(200).send('success');
  }
};

// 查询订单
export const queryOrder = async (req: Request, res: Response): Promise<void> => {
  try {
    const { orderNo } = req.query;
    
    if (!orderNo) {
      res.status(400).json({ error: '缺少订单号' });
      return;
    }
    
    // 调用支付宝交易查询接口
    const result = await alipaySdk.exec('alipay.trade.query', {
      bizContent: {
        out_trade_no: orderNo,
      },
    });
    
    res.status(200).json({
      success: true,
      data: result,
    });
  } catch (error) {
    console.error('查询订单失败:', error);
    res.status(500).json({ error: '查询订单失败', message: (error as Error).message });
  }
};

// 退款
export const refund = async (req: Request, res: Response): Promise<void> => {
  try {
    const { orderNo, refundAmount, refundReason } = req.body;
    
    if (!orderNo || !refundAmount) {
      res.status(400).json({ error: '缺少必要参数' });
      return;
    }
    
    const refundNo = `REFUND${generateOrderNo()}`;
    
    // 调用支付宝退款接口
    const result = await alipaySdk.exec('alipay.trade.refund', {
      bizContent: {
        out_trade_no: orderNo,
        refund_amount: refundAmount.toString(),
        refund_reason: refundReason || '用户退款',
        out_request_no: refundNo,
      },
    });
    
    res.status(200).json({
      success: true,
      refundNo,
      data: result,
    });
  } catch (error) {
    console.error('退款失败:', error);
    res.status(500).json({ error: '退款失败', message: (error as Error).message });
  }
};

// 关闭订单
export const closeOrder = async (req: Request, res: Response): Promise<void> => {
  try {
    const { orderNo } = req.body;
    
    if (!orderNo) {
      res.status(400).json({ error: '缺少订单号' });
      return;
    }
    
    // 调用支付宝关闭交易接口
    const result = await alipaySdk.exec('alipay.trade.close', {
      bizContent: {
        out_trade_no: orderNo,
      },
    });
    
    res.status(200).json({
      success: true,
      data: result,
    });
  } catch (error) {
    console.error('关闭订单失败:', error);
    res.status(500).json({ error: '关闭订单失败', message: (error as Error).message });
  }
};