import type { NextApiRequest, NextApiResponse } from 'next';
import fs from 'fs';
import path from 'path';

// 定义查询请求接口
interface QueryRequest {
  orderId: string;
}

// 定义查询响应接口
interface QueryResponse {
  success: boolean;
  message?: string;
  orderStatus?: string;
  alipayTradeNo?: string;
  totalAmount?: string;
  paymentTime?: string;
}

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse<QueryResponse>
) {
  try {
    // 支持GET和POST请求
    if (req.method !== 'GET' && req.method !== 'POST') {
      return res.status(405).json({
        success: false,
        message: 'Method not allowed'
      });
    }

    // 获取订单ID
    const orderId = req.method === 'GET' ? req.query.orderId as string : (req.body as QueryRequest).orderId;
    
    if (!orderId) {
      return res.status(400).json({
        success: false,
        message: 'Order ID is required'
      });
    }

    // 读取私钥
    const privateKeyPath = path.join(process.cwd(), 'keys', 'app_private_key.pem');
    const privateKey = fs.readFileSync(privateKeyPath, 'utf8');

    // 模拟查询支付宝订单状态
    // 实际项目中，这里应该使用支付宝SDK查询订单
    const orderInfo = await queryAlipayOrder(orderId);

    return res.status(200).json({
      success: true,
      ...orderInfo
    });
  } catch (error) {
    console.error('Order query error:', error);
    return res.status(500).json({
      success: false,
      message: 'Order query failed'
    });
  }
}

// 模拟查询支付宝订单
async function queryAlipayOrder(orderId: string): Promise<Partial<QueryResponse>> {
  // 实际项目中，这里应该使用支付宝SDK查询订单
  console.log(`Querying order from Alipay: ${orderId}`);
  
  // 模拟订单信息
  // 在实际应用中，这里应该是从支付宝API获取的真实订单信息
  return {
    orderStatus: 'TRADE_SUCCESS',
    alipayTradeNo: `ALIPAY${Date.now()}`,
    totalAmount: '99.99',
    paymentTime: new Date().toISOString()
  };
}