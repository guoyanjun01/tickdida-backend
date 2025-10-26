import { NextApiRequest, NextApiResponse } from 'next';
import fs from 'fs'; 
import path from 'path'; 
const { AlipaySdk } = require('alipay-sdk');

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse
) {
  try {
    if (req.method !== 'POST') {
      res.status(405).json({ success: false, message: 'Method not allowed' });
      return;
    }

    // 获取请求参数
    const { orderId, amount } = req.body;
    
    if (!orderId || !amount) {
      res.status(400).json({ success: false, message: '缺少必要参数' });
      return;
    }

    // 读取证书内容（字符串） 
    const myCert = fs.readFileSync(
      path.join(process.cwd(), 'keys/appCertPublicKey_2021006101650795.crt'), 
      'utf8'
    );
    const alipayCert = fs.readFileSync(
      path.join(process.cwd(), 'keys/alipayCertPublicKey_RSA2.crt'), 
      'utf8'
    );
    const privateKey = fs.readFileSync(
      path.join(process.cwd(), 'keys/app_private_key.pem'), 
      'utf8'
    );

    // 初始化支付宝SDK
    const alipaySdk = new AlipaySdk({
      appId: process.env.ALIPAY_APP_ID!,
      privateKey,
      gateway: 'https://openapi.alipay.com/gateway.do', // 正式环境
      signType: 'RSA2',
    });

    // 传给支付宝 SDK 的参数
    const params = { 
      app_id: process.env.ALIPAY_APP_ID!,
      method: 'alipay.trade.wap.pay', 
      return_url: 'https://www.tickdida.com/pay/success', 
      notify_url: process.env.ALIPAY_NOTIFY_URL!,
      sign_type: 'RSA2',
      timestamp: new Date().toISOString(),
      version: '1.0',
      biz_content: JSON.stringify({
        out_trade_no: orderId,
        total_amount: amount,
        subject: 'TickDida 月付订阅',
        product_code: 'QUICK_WAP_WAY',
      }),
      app_cert_sn: myCert,          // 你的证书内容 
      alipay_root_cert_sn: alipayCert, // 支付宝证书内容
    };

    // 使用支付宝SDK执行支付
    const result = await alipaySdk.exec('alipay.trade.wap.pay', {
      method: 'GET',
      bizContent: params.biz_content,
      returnUrl: params.return_url,
      notifyUrl: params.notify_url,
    });

    res.status(200).json({
      success: true,
      paymentUrl: result,
      orderId: orderId,
      amount: amount
    });
  } catch (error) {
    console.error('支付宝支付错误:', error);
    res.status(500).json({ 
      success: false, 
      message: '服务器内部错误',
      error: error instanceof Error ? error.message : String(error)
    });
  }
}