// be/src/config/payments.config.ts
import { registerAs } from '@nestjs/config';

export default registerAs('payments', () => ({
  kcToVndRatio: parseInt(process.env.KC_TO_VND_RATIO, 10) || 100,
  minDepositAmount: 10000, // 10.000 VND
  maxDepositAmount: 10000000, // 10.000.000 VND
  
  vnpay: {
    tmnCode: process.env.VNPAY_TMN_CODE || 'YOUR_VNPAY_TMN_CODE',
    hashSecret: process.env.VNPAY_HASH_SECRET || 'YOUR_VNPAY_HASH_SECRET',
    paymentUrl: 'https://sandbox.vnpayment.vn/paymentv2/vpcpay.html',
    returnUrl: process.env.VNPAY_RETURN_URL || 'http://localhost:3000/payment/vnpay-return',
    apiUrl: 'https://sandbox.vnpayment.vn/merchant_webapi/api/transaction',
    version: '2.1.0',
  },
  
  momo: {
    partnerCode: process.env.MOMO_PARTNER_CODE || 'YOUR_MOMO_PARTNER_CODE',
    accessKey: process.env.MOMO_ACCESS_KEY || 'YOUR_MOMO_ACCESS_KEY',
    secretKey: process.env.MOMO_SECRET_KEY || 'YOUR_MOMO_SECRET_KEY',
    paymentUrl: 'https://test-payment.momo.vn/v2/gateway/api/create',
    returnUrl: process.env.MOMO_RETURN_URL || 'http://localhost:3000/payment/momo-return',
    ipnUrl: process.env.MOMO_IPN_URL || 'http://localhost:5000/api/payments/momo-ipn',
    requestType: 'captureWallet',
    language: 'vi',
  },
  
  webhooks: {
    ipWhitelist: process.env.PAYMENT_WEBHOOK_IP_WHITELIST ? 
      process.env.PAYMENT_WEBHOOK_IP_WHITELIST.split(',') : 
      ['127.0.0.1'],
  },
}));