import { Request, Response } from 'express';
import Stripe from 'stripe';
import expressRaw from 'body-parser';

// 初始化Stripe
const stripe = new Stripe(
  process.env.STRIPE_SECRET_KEY || 'sk_test_your_secret_key',
  {
    apiVersion: '2022-11-15',
  }
);

// 创建支付意向
export const createPaymentIntent = async (req: Request, res: Response): Promise<void> => {
  try {
    const { amount, currency = 'usd', description } = req.body;
    
    // 验证参数
    if (!amount || typeof amount !== 'number') {
      res.status(400).json({ error: '无效的金额' });
      return;
    }
    
    // 创建支付意向
    const paymentIntent = await stripe.paymentIntents.create({
      amount: Math.round(amount * 100), // Stripe使用分作为单位
      currency,
      description,
      metadata: {
        userId: (req as any).user?.id || 'anonymous',
      },
    });
    
    res.status(200).json({
      success: true,
      clientSecret: paymentIntent.client_secret,
      paymentIntentId: paymentIntent.id,
    });
  } catch (error) {
    console.error('创建支付意向失败:', error);
    res.status(500).json({ 
      error: '创建支付意向失败', 
      message: error instanceof Error ? error.message : String(error) 
    });
  }
};

// 处理Stripe Webhook
export const webhook = async (req: Request, res: Response): Promise<void> => {
  try {
    // 获取签名
    const signature = req.headers['stripe-signature'];
    const webhookSecret = process.env.STRIPE_WEBHOOK_SECRET || '';
    
    if (!signature || !webhookSecret) {
      res.status(400).send('缺少必要的签名信息');
      return;
    }
    
    // 验证签名并解析事件
    let event;
    try {
      // 注意：在实际使用中，需要使用raw body进行验证
      // 这里使用req.body作为示例，实际项目中需要配置中间件获取原始body
      event = stripe.webhooks.constructEvent(
        JSON.stringify(req.body),
        signature,
        webhookSecret
      );
    } catch (err) {
      console.error('Webhook签名验证失败:', err);
      res.status(400).send('Webhook Error: ' + (err instanceof Error ? err.message : String(err)));
      return;
    }
    
    // 根据事件类型处理
    switch (event.type) {
      case 'payment_intent.succeeded':
        // 处理支付成功事件
        const paymentIntent = event.data.object as Stripe.PaymentIntent;
        console.log(`支付成功: ${paymentIntent.id}`);
        // 更新订单状态等操作
        break;
        
      case 'payment_intent.payment_failed':
        // 处理支付失败事件
        const failedIntent = event.data.object as Stripe.PaymentIntent;
        console.log(`支付失败: ${failedIntent.id}`);
        break;
        
      case 'customer.subscription.created':
      case 'customer.subscription.updated':
      case 'customer.subscription.deleted':
        // 处理订阅相关事件
        const subscription = event.data.object as Stripe.Subscription;
        console.log(`订阅事件: ${subscription.id}, 类型: ${event.type}`);
        break;
        
      default:
        console.log(`未处理的事件类型: ${event.type}`);
    }
    
    // 返回成功响应
    res.status(200).send('Webhook received');
  } catch (error) {
    console.error('处理Webhook失败:', error);
    res.status(500).send('Webhook processing error');
  }
};

// 创建客户
export const createCustomer = async (req: Request, res: Response): Promise<void> => {
  try {
    const { email, name, description } = req.body;
    
    if (!email) {
      res.status(400).json({ error: '邮箱不能为空' });
      return;
    }
    
    // 创建Stripe客户
    const customer = await stripe.customers.create({
      email,
      name,
      description,
      metadata: {
        userId: (req as any).user?.id || 'anonymous',
      },
    });
    
    res.status(200).json({
      success: true,
      customerId: customer.id,
      customer: {
        id: customer.id,
        email: customer.email,
        name: customer.name,
      },
    });
  } catch (error) {
    console.error('创建客户失败:', error);
    res.status(500).json({ 
      error: '创建客户失败', 
      message: error instanceof Error ? error.message : String(error) 
    });
  }
};

// 更新订阅
export const updateSubscription = async (req: Request, res: Response): Promise<void> => {
  try {
    const { customerId, subscriptionId, planId, cancelAtPeriodEnd } = req.body;
    
    if (!customerId) {
      res.status(400).json({ error: '客户ID不能为空' });
      return;
    }
    
    let result;
    
    if (subscriptionId) {
      // 更新现有订阅
      result = await stripe.subscriptions.update(subscriptionId, {
        items: planId ? [{ plan: planId }] : undefined,
        cancel_at_period_end: cancelAtPeriodEnd || false,
      });
    } else if (planId) {
      // 创建新订阅
      result = await stripe.subscriptions.create({
        customer: customerId,
        items: [{ plan: planId }],
        expand: ['latest_invoice.payment_intent'],
      });
    } else {
      res.status(400).json({ error: '缺少必要参数' });
      return;
    }
    
    res.status(200).json({
      success: true,
      subscription: result,
    });
  } catch (error) {
    console.error('更新订阅失败:', error);
    res.status(500).json({ 
      error: '更新订阅失败', 
      message: error instanceof Error ? error.message : String(error) 
    });
  }
};