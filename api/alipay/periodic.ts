// periodic.ts - 支付宝定期支付协议创建模块
import { AlipaySdk } from 'alipay-sdk';
import { Request } from 'express';

const alipay = new AlipaySdk({
  appId: '2021006101650795',
  privateKey: process.env.ALIPAY_PRIVATE_KEY!,
  alipayPublicKey: `-----BEGIN CERTIFICATE-----
MIIDljCCAn6gAwIBAgIQICUQISB2glovqIicZ6oONjANBgkqhkiG9w0BAQsFADCBgjELMAkGA1UE
BhMCQ04xFjAUBgNVBAoMDUFudCBGaW5hbmNpYWwxIDAeBgNVBAsMF0NlcnRpZmljYXRpb24gQXV0
aG9yaXR5MTkwNwYDVQQDDDBBbnQgRmluYW5jaWFsIENlcnRpZmljYXRpb24gQXV0aG9yaXR5IENs
YXNzIDIgUjEwHhcNMjUxMDIxMTQwNTI0WhcNMzAxMDIwMTQwNTI0WjB3MQswCQYDVQQGEwJDTjES
MBAGA1UECgwJ6YOt5b2m5ZCbMQ8wDQYDVQQLDAZBbGlwYXkxQzBBBgNVBAMMOuaUr+S7mOWunSjk
uK3lm70p572R57uc5oqA5pyv5pyJ6ZmQ5YWs5Y+4LTIwODg3MzIwNzIxNjU1MDYwggEiMA0GCSqG
SIb3DQEBAQUAA4IBDwAwggEKAoIBAQCBwuczZe7A2SgUI0sL1C4BlSqmAgIS80WUEpFDfYSEpskA
7KhCQrZNSvKaf9/KRLTugcS0gYCJURMnEYEePQK/FsPTTgjpiBPy/2krnDlSxJRcVjfkmb770f/g
qWBUsKLbyPGQ+SXhjCi9nU57+4BA0J8tg7yPfmQHwJU9txXTHPYIBJQxnyLu8vEZRPJQapX/WWDU
hY3tQm8gCqt9PV5XkETZRcylzWYSm9rxEdwzL/87VpqEZFSzA/12iX2k1WWcG6QnP8CX1ZV5FGc7
xrm9TQE2Tdd+MrhWH5tw72NBEHWZPkWL6BCjQINN3s6lble6NhXpCVW14SzfChrXCEhxAgMBAAGj
EjAQMA4GA1UdDwEB/wQEAwID+DANBgkqhkiG9w0BAQsFAAOCAQEAFoEAvoAI/m8REKQysFOa/+dO
2lnW/mlk/7qSfgJTiWs8wkeedKEIsBtpi2S3+0Ixn56h/AU8iVszYHqwDVTHvSwcbA/CYaX3Kvlc
hTQQAbIfgG3mtOiCQp2nXsbX9VL3wupFKHEYSwXXyEO8HQOCnLPzOO8ncR80is6fywgQSfXp6e7H
2eYoerFLg1ADMOqaKw1K1iR2xsfyAOgBL18iN8b8MtnPfS0nei3qENjiX5x8usLc7otYiH4dmtna
caEBZ6PCyqxFDdfa1YXVUZpFOQPTuMgmIqf1c2EOs42w7TCy0pc5UEeQ4jhITsZ7rCdSOkV9gNMh
JQI14dUu9MwuaQ==
-----END CERTIFICATE-----`,
  gateway: 'https://openapi.alipay.com/gateway.do',
  signType: 'RSA2',
});

export default async function handler(req: Request) {
  if (req.method !== 'POST') {
    return new Response('Method Not Allowed', { status: 405 });
  }

  try {
    const outAgreementNo = Date.now().toString();
    const returnUrl = 'https://didadida-web.vercel.app/success';
    const notifyUrl = 'https://tickdida-backend.pages.dev/api/alipay/notify';

    const result = await alipay.exec('alipay.user.agreement.page.sign', {
      bizContent: {
        personalProductCode: 'CYCLE_GENERAL_AUTH',
        outAgreementNo,
        signValidityPeriod: '2y',
        returnUrl,
        notifyUrl,
      },
    });

    return new Response(JSON.stringify({ url: result.body }), {
      headers: { 'Content-Type': 'application/json' }
    });
  } catch (error) {
    console.error('创建定期支付协议失败:', error);
    return new Response(JSON.stringify({ error: '创建定期支付协议失败' }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' }
    });
  }
}