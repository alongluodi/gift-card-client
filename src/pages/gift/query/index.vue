<template>
  <view class="query-page">
    <view class="header">
      <text class="title">发货查询</text>
      <text class="subtitle">查询订单物流信息</text>
    </view>
    
    <view class="form-box">
      <view class="input-group">
        <text class="label">卡号</text>
        <view class="input-wrapper">
          <input class="input" v-model="formData.card_no" placeholder="请输入卡号" />
          <view class="input-clear" v-if="formData.card_no" @click="formData.card_no = ''">✕</view>
        </view>
      </view>
      
      <view class="input-group">
        <text class="label">密码</text>
        <view class="input-wrapper">
          <input class="input" v-model="formData.card_pwd" placeholder="请输入密码" password />
          <view class="input-clear" v-if="formData.card_pwd" @click="formData.card_pwd = ''">✕</view>
        </view>
      </view>
      
      <button class="btn-primary" @click="handleQuery" :loading="loading">
        {{ loading ? '查询中...' : '查询订单' }}
      </button>
    </view>
    
    <!-- 订单信息 -->
    <view class="order-box" v-if="order">
      <view class="order-header">
        <text class="order-title">订单信息</text>
        <text class="order-status" :class="'status-' + order.status">
          {{ getStatusText(order.status) }}
        </text>
      </view>
      
      <view class="order-info">
        <view class="info-item">
          <text class="info-label">订单号</text>
          <text class="info-value">{{ order.order_no }}</text>
        </view>
        <view class="info-item">
          <text class="info-label">活动名称</text>
          <text class="info-value">{{ order.activity_title }}</text>
        </view>
        <view class="info-item">
          <text class="info-label">下单时间</text>
          <text class="info-value">{{ order.create_time }}</text>
        </view>
        <!-- 所选商品 -->
        <view class="info-item goods-item" v-if="order.goods && order.goods.length > 0">
          <text class="info-label">所选商品</text>
          <view class="goods-list">
            <view class="goods-row" v-for="(g, idx) in order.goods" :key="idx">
              <text class="goods-name">{{ g.goods_name }}</text>
              <text class="goods-quantity">x{{ g.quantity }}</text>
            </view>
          </view>
        </view>
      </view>
      
      <!-- 物流信息 -->
      <view class="express-box" v-if="order.status >= 1">
        <view class="express-title">物流信息</view>
        <view class="express-info">
          <view class="express-item">
            <text class="express-label">快递公司</text>
            <text class="express-value">{{ order.express_company }}</text>
          </view>
          <view class="express-item">
            <text class="express-label">快递单号</text>
            <text class="express-value express-no-link" @click="goExpressDetail">
              {{ order.express_no }}
              <text class="express-hint">(点击单号查看物流)</text>
            </text>
          </view>
        </view>
      </view>
      
      <!-- 收货地址 -->
      <view class="address-box">
        <view class="address-title">收货信息</view>
        <view class="address-info">
          <view class="contact">{{ order.contact }} {{ order.mobile }}</view>
          <view class="address">{{ order.province }}{{ order.city }}{{ order.district }}{{ order.address }}</view>
        </view>
      </view>
    </view>
  </view>
</template>

<script setup>
import { ref, reactive } from 'vue'
import { onLoad, onShow } from '@dcloudio/uni-app'
import { queryOrder } from '@/api/gift'

const loading = ref(false)
const order = ref(null)
const formData = reactive({
  card_no: '',
  card_pwd: ''
})

const getStatusText = (status) => {
  const texts = { 0: '待发货', 1: '已发货', 2: '已收货', 3: '已完成' }
  return texts[status] || '未知'
}

const handleQuery = async (silent = false) => {
  if (!formData.card_no || !formData.card_pwd) {
    if (!silent) uni.showToast({ title: '请输入卡号和密码', icon: 'none' })
    return
  }
  
  loading.value = true
  order.value = null
  
  try {
    const res = await queryOrder(formData.card_no, formData.card_pwd)
    if (res.code === 200 && res.data) {
      order.value = res.data
    } else {
      if (!silent) uni.showToast({ title: res.msg || '未查询到订单', icon: 'none' })
    }
  } catch (error) {
    if (!silent) uni.showToast({ title: '网络错误，请稍后重试', icon: 'none' })
  } finally {
    loading.value = false
  }
}

const goExpressDetail = () => {
  if (!order.value || !order.value.express_no) return
  uni.navigateTo({
    url: `/pages/gift/express-detail/index?express_code=${order.value.express_company_code || ''}&express_no=${order.value.express_no}&express_name=${encodeURIComponent(order.value.express_company || '')}&mobile=${order.value.mobile || ''}&card_no=${formData.card_no || ''}`
  })
}

onShow(() => {
  // 预约成功后切换 tab 过来，自动填充卡号密码并查询
  const autoQuery = uni.getStorageSync('auto_query')
  if (autoQuery) {
    const cardNo = uni.getStorageSync('query_card_no')
    const cardPwd = uni.getStorageSync('query_card_pwd')
    if (cardNo && cardPwd) {
      formData.card_no = cardNo
      formData.card_pwd = cardPwd
      uni.removeStorageSync('auto_query')
      uni.removeStorageSync('query_card_no')
      uni.removeStorageSync('query_card_pwd')
      // 自动查询：静默处理错误
      handleQuery(true)
    }
  }
})
</script>

<style scoped>
.query-page {
  min-height: 100vh;
  background: #f5f5f5;
  padding-bottom: 40rpx;
}

.header {
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  padding: 60rpx 30rpx 40rpx;
  text-align: center;
}

.title {
  display: block;
  font-size: 48rpx;
  font-weight: bold;
  color: #fff;
  margin-bottom: 15rpx;
}

.subtitle {
  font-size: 28rpx;
  color: rgba(255,255,255,0.8);
}

.form-box {
  background: #fff;
  margin: -30rpx 30rpx 30rpx;
  border-radius: 20rpx;
  padding: 40rpx;
  box-shadow: 0 10rpx 40rpx rgba(0,0,0,0.1);
  position: relative;
  z-index: 1;
}

.input-group {
  margin-bottom: 30rpx;
}

.label {
  display: block;
  font-size: 28rpx;
  color: #333;
  margin-bottom: 15rpx;
  font-weight: 500;
}

.input {
  width: 100%;
  height: 80rpx;
  background: #f5f5f5;
  border-radius: 10rpx;
  padding: 0 60rpx 0 20rpx;
  font-size: 28rpx;
  box-sizing: border-box;
}

.input-wrapper {
  position: relative;
  width: 100%;
}

.input-clear {
  position: absolute;
  right: 0;
  top: 0;
  width: 60rpx;
  height: 80rpx;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 28rpx;
  color: #999;
  z-index: 2;
}

.btn-primary {
  height: 88rpx;
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  color: #fff;
  border-radius: 44rpx;
  border: none;
  font-size: 32rpx;
  font-weight: 500;
  margin-top: 20rpx;
}

.order-box {
  background: #fff;
  margin: 0 30rpx;
  border-radius: 20rpx;
  overflow: hidden;
}

.order-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 30rpx;
  border-bottom: 1rpx solid #f0f0f0;
}

.order-title {
  font-size: 32rpx;
  font-weight: bold;
}

.order-status {
  font-size: 24rpx;
  padding: 8rpx 20rpx;
  border-radius: 20rpx;
}

.status-0 { background: #fff7e6; color: #ff7d00; }
.status-1 { background: #e6f7ff; color: #1890ff; }
.status-2 { background: #e6ffed; color: #52c41a; }
.status-3 { background: #f6ffed; color: #07c160; }

.order-info, .express-info, .address-info {
  padding: 20rpx 30rpx;
}

.info-item {
  display: flex;
  padding: 12rpx 0;
  font-size: 28rpx;
}

.info-label { color: #666; width: 160rpx; }
.info-value { color: #333; flex: 1; }

.express-box, .address-box { border-top: 1rpx solid #f0f0f0; }

.express-title, .address-title {
  font-size: 28rpx;
  font-weight: bold;
  padding: 25rpx 30rpx;
  background: #fafafa;
}

.express-item {
  display: flex;
  padding: 12rpx 0;
  font-size: 28rpx;
}

.express-label { color: #666; width: 140rpx; }
.express-value { color: #333; flex: 1; }

.express-no-link {
  color: #667eea;
}

.express-hint {
  font-size: 24rpx;
  color: #999;
  margin-left: 10rpx;
}

.contact { font-size: 28rpx; margin-bottom: 10rpx; }
.address { font-size: 26rpx; color: #666; line-height: 1.6; }

/* 商品列表样式 */
.goods-item { align-items: flex-start; }
.goods-list { flex: 1; }
.goods-row {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 8rpx 0;
  font-size: 28rpx;
}
.goods-row:not(:last-child) {
  border-bottom: 1rpx solid #f5f5f5;
}
.goods-name { color: #333; flex: 1; }
.goods-quantity { color: #666; margin-left: 20rpx; }
</style>
