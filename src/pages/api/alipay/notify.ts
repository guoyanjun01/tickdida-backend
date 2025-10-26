import type { NextApiRequest, NextApiResponse } from 'next';
import fs from 'fs';
import path from 'path';
const { AlipaySdk } = require('alipay-sdk');

// 初始化支付宝SDK
const alipaySdk = new AlipaySdk({
  appId: process.env.ALIPAY_APP_ID || '2021006101650795',
  privateKey: fs.readFileSync(
    path.join(process.cwd(), 'keys/app_private_key.pem'),
    'utf8'
  ),
  gateway: 'https://openapi.alipay.com/gateway.do', // 正式环境
  signType: 'RSA2',
});

// 定义通知响应接口
interface NotifyResponse {
  success: boolean;
  message?: string;
}

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse
) {
  try {
    // 只允许POST请求
    if (req.method !== 'POST') {
      return res.status(405).json({
        success: false,
        message: 'Method not allowed'
      });
    }

    // 获取支付宝通知参数
    const notifyParams = req.body;
    console.log('Alipay notification received:', notifyParams);

    // 验证签名
    // 实际项目中，这里应该使用支付宝SDK验证签名
    const isValid = verifySignature(notifyParams);
    
    if (!isValid) {
      console.error('Invalid signature for alipay notification');
      return res.status(400).json({
        success: false,
        message: 'Invalid signature'
      });
    }

    // 验证通知状态
    const tradeStatus = notifyParams.trade_status;
    if (!tradeStatus || (tradeStatus !== 'TRADE_SUCCESS' && tradeStatus !== 'TRADE_FINISHED')) {
      console.error('Invalid trade status:', tradeStatus);
      // 即使状态不是成功，也应该返回success=true给支付宝，避免重复通知
      return res.status(200).send('success');
    }

    // 处理支付成功的业务逻辑
    const orderId = notifyParams.out_trade_no;
    const alipayTradeNo = notifyParams.trade_no;
    const totalAmount = notifyParams.total_amount;
    
    console.log(`Processing successful payment for order ${orderId}`);
    console.log(`Alipay trade no: ${alipayTradeNo}, Amount: ${totalAmount}`);

    // TODO: 实现实际的业务逻辑，比如更新订单状态、记录交易信息等
    // await updateOrderStatus(orderId, 'paid', alipayTradeNo, totalAmount);

    // 返回success给支付宝，防止重复通知
    return res.status(200).send('success');
  } catch (error) {
    console.error('Alipay notification error:', error);
    // 即使发生错误，也应该返回success给支付宝，避免重复通知
    return res.status(200).send('success');
  }
}

// 验证签名（使用支付宝SDK）
function verifySignature(params: any): boolean {
  try {
    // 使用支付宝SDK验证签名
    console.log('验证支付宝通知签名...');
    console.log('通知参数:', JSON.stringify(params, null, 2));
    
    // 使用alipaySdk实例的checkNotifySign方法进行签名验证
    const verifyResult = alipaySdk.checkNotifySign(params);
    
    if (verifyResult) {
      console.log('签名验证成功');
      return true;
    } else {
      console.log('签名验证失败');
      return false;
    }
  } catch (error) {
    console.error('Signature verification error:', error);
    return false;
  }
}